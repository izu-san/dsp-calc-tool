import React from 'react';
import { getDataPath } from '../../../utils/paths';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ProductionTree } from '../index';

// i18n モック（キーをそのまま返す）
vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key: string) => key }),
}));

// ItemIcon モック（スプライトシート対応）
vi.mock('../../ItemIcon', () => ({
    ItemIcon: ({ itemId, alt, size, preferRecipes }: any) => (
        <div 
            data-testid={`item-icon-${itemId}`} 
            data-alt={alt} 
            data-size={size}
            data-prefer-recipes={preferRecipes}
        >
            {`Icon ${itemId}`}
        </div>
    ),
}));

// CompactNodeSettings を簡素化
vi.mock('../CompactNodeSettings', () => ({
    CompactNodeSettings: (props: any) => (
        <div data-testid="compact-node-settings">
            <button onClick={() => props.node && console.log('compact-settings-clicked')}>
                Compact Settings
            </button>
        </div>
    ),
}));

// NodeSettingsModal を簡素化
vi.mock('../../NodeSettingsModal', () => ({
    NodeSettingsModal: (props: any) => (
        <div data-testid="node-settings-modal">
            <button onClick={props.onClose}>Close Modal</button>
        </div>
    ),
}));

// stores モック
const setNodeOverride = vi.fn();
const clearNodeOverride = vi.fn();
let nodeOverridesMock: Map<number, any> = new Map();

vi.mock('../../../stores/nodeOverrideStore', () => ({
    useNodeOverrideStore: () => ({
        nodeOverrides: nodeOverridesMock,
        setNodeOverride,
        clearNodeOverride,
    }),
}));

const settingsMock = {
    proliferator: { type: 'none', mode: 'speed' },
    machineRank: { Smelt: 'arc', Assemble: 'mk1' },
};

vi.mock('../../../stores/settingsStore', () => ({
    useSettingsStore: () => ({
        settings: settingsMock,
    }),
}));

describe('ProductionTree', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        nodeOverridesMock = new Map();
    });

    afterEach(() => {
        cleanup();
        vi.restoreAllMocks();
    });

    const mockRawMaterialNode = {
        nodeId: 'raw-1001-0',
        isRawMaterial: true,
        itemId: 1001,
        itemName: 'Iron Ore',
        targetOutputRate: 60,
        machineCount: 0,
        proliferator: { type: 'none' as const, mode: 'speed' as const, productionBonus: 0, speedBonus: 0, powerIncrease: 0 },
        power: { total: 0, machines: 0, sorters: 0 },
        conveyorBelts: { inputs: 0, outputs: 1, total: 1 },
        inputs: [],
        miningFrom: 'Iron Vein',
        children: [],
    };

    const mockRecipeNode = {
        nodeId: 'recipe-2001-0',
        isRawMaterial: false,
        recipe: {
            SID: 2001,
            name: 'Iron Ingot',
            Type: 'Smelt' as const,
            Explicit: false,
            TimeSpend: 60,
            Items: [{ id: 1001, name: 'Iron Ore', count: 1, Type: 'Material', isRaw: true }],
            Results: [{ id: 1002, name: 'Iron Ingot', count: 1, Type: 'Material', isRaw: false }],
            GridIndex: '1101',
            productive: true,
        },
        machine: {
            id: 2301,
            name: 'Arc Smelter',
            count: 1,
            Type: 'Smelt',
            isRaw: false,
            assemblerSpeed: 10000,
            workEnergyPerTick: 120,
            idleEnergyPerTick: 0,
            exchangeEnergyPerTick: 0,
            isPowerConsumer: true,
            isPowerExchanger: false,
        },
        machineCount: 1,
        targetOutputRate: 60,
        power: { total: 120, machines: 120, sorters: 0 },
    conveyorBelts: { inputs: 1, outputs: 1, total: 2, saturation: 85, bottleneckType: 'input' as const },
        proliferator: { type: 'none' as const, mode: 'speed' as const, productionBonus: 0, speedBonus: 0, powerIncrease: 0 },
        inputs: [
            { itemId: 1001, itemName: 'Iron Ore', requiredRate: 60 },
        ],
        children: [mockRawMaterialNode],
    };

    it('原料ノードの場合、採掘情報とベルト情報が表示される', () => {
        render(<ProductionTree node={mockRawMaterialNode} />);
        
        expect(screen.getByText('Iron Ore')).toBeInTheDocument();
        expect(screen.getByText('⛏️ Iron Vein')).toBeInTheDocument();
        expect(screen.getByText('60.0/s')).toBeInTheDocument();
        expect(screen.getByText('🛤️ 1 belt')).toBeInTheDocument();
    });

    it('レシピノードの場合、レシピ情報と機械情報が表示される', () => {
        render(<ProductionTree node={mockRecipeNode} />);
        
        expect(screen.getByText('Iron Ingot')).toBeInTheDocument();
        expect(screen.getByText('Arc Smelter × 1.0')).toBeInTheDocument();
        expect(screen.getAllByText('60.0/s')[0]).toBeInTheDocument();
        expect(screen.getAllByText('120.0 kW')[0]).toBeInTheDocument();
    });

    it('子ノードがある場合、展開・折りたたみができる', () => {
        const onToggleCollapse = vi.fn();
        render(
            <ProductionTree 
                node={mockRecipeNode} 
                collapsedNodes={new Set()}
                onToggleCollapse={onToggleCollapse}
            />
        );
        
        // 展開アイコンが表示される
        expect(screen.getByText('▼')).toBeInTheDocument();
        
        // クリックで展開・折りたたみ
        const expandButton = screen.getByRole('button', { name: 'collapse' });
        fireEvent.click(expandButton);
        expect(onToggleCollapse).toHaveBeenCalledWith('root');
    });

    it('ノードが折りたたまれている場合でも、入力表示と見出しは残る', () => {
        render(
            <ProductionTree 
                node={mockRecipeNode} 
                collapsedNodes={new Set(['recipe-2001-0'])}
                onToggleCollapse={() => {}}
            />
        );
        
        // 折りたみ状態のアイコンが表示される
        expect(screen.getByText('▼')).toBeInTheDocument();
        
        // 入力としての Iron Ore と見出しの Iron Ore の2箇所が表示される想定
        const ironOreElements = screen.getAllByText('Iron Ore');
        expect(ironOreElements.length).toBeGreaterThanOrEqual(2);
    });

    it('飽和度が表示される', () => {
        const bottleneckNode = {
            ...mockRecipeNode,
            conveyorBelts: { 
                ...mockRecipeNode.conveyorBelts, 
                saturation: 85, 
                bottleneckType: 'input' as const 
            },
        };
        
        render(<ProductionTree node={bottleneckNode} />);
        
        // 飽和度のパーセンテージが表示される
        expect(screen.getByText('85.0%')).toBeInTheDocument();
    });

    it('bottleneckTypeがinputの場合、入力ベルトがオレンジ色になる', () => {
        const inputBottleneckNode = {
            ...mockRecipeNode,
            conveyorBelts: { 
                inputs: 3,
                outputs: 1,
                total: 4,
                saturation: 95, 
                bottleneckType: 'input' as const 
            },
        };
        
        const { container } = render(<ProductionTree node={inputBottleneckNode} />);
        
        // "inputs:" ラベルの次の兄弟要素を探す（ベルトセクション内）
        const inputsLabel = Array.from(container.querySelectorAll('.text-space-200')).find(
            el => el.textContent === 'inputs:'
        );
        const inputValue = inputsLabel?.nextElementSibling;
        expect(inputValue).toHaveClass('text-neon-orange');
        expect(inputValue?.textContent).toBe('3');
    });

    it('bottleneckTypeがoutputの場合、出力ベルトがオレンジ色になる', () => {
        const outputBottleneckNode = {
            ...mockRecipeNode,
            conveyorBelts: { 
                inputs: 1,
                outputs: 5,
                total: 6,
                saturation: 98, 
                bottleneckType: 'output' as const 
            },
        };
        
        const { container } = render(<ProductionTree node={outputBottleneckNode} />);
        
        // "outputs:" ラベルの次の兄弟要素を探す
        const outputsLabel = Array.from(container.querySelectorAll('.text-space-200')).find(
            el => el.textContent === 'outputs:'
        );
        const outputValue = outputsLabel?.nextElementSibling;
        expect(outputValue).toHaveClass('text-neon-orange');
        expect(outputValue?.textContent).toBe('5');
    });

    it('bottleneckTypeがinputではない場合、入力ベルトが黄色になる', () => {
        const outputBottleneckNode = {
            ...mockRecipeNode,
            conveyorBelts: { 
                inputs: 2,
                outputs: 4,
                total: 6,
                saturation: 90, 
                bottleneckType: 'output' as const 
            },
        };
        
        const { container } = render(<ProductionTree node={outputBottleneckNode} />);
        
        // "inputs:" ラベルの次の兄弟要素を探す
        const inputsLabel = Array.from(container.querySelectorAll('.text-space-200')).find(
            el => el.textContent === 'inputs:'
        );
        const inputValue = inputsLabel?.nextElementSibling;
        expect(inputValue).toHaveClass('text-neon-yellow');
        expect(inputValue?.textContent).toBe('2');
    });

    it('bottleneckTypeがoutputではない場合、出力ベルトが青色になる', () => {
        const inputBottleneckNode = {
            ...mockRecipeNode,
            conveyorBelts: { 
                inputs: 4,
                outputs: 2,
                total: 6,
                saturation: 85, 
                bottleneckType: 'input' as const 
            },
        };
        
        const { container } = render(<ProductionTree node={inputBottleneckNode} />);
        
        // "outputs:" ラベルの次の兄弟要素を探す
        const outputsLabel = Array.from(container.querySelectorAll('.text-space-200')).find(
            el => el.textContent === 'outputs:'
        );
        const outputValue = outputsLabel?.nextElementSibling;
        expect(outputValue).toHaveClass('text-neon-blue');
        expect(outputValue?.textContent).toBe('2');
    });

    it('プロリフェレータが設定されている場合、バッジが表示される', () => {
        const proliferatorNode = {
            ...mockRecipeNode,
            proliferator: { type: 'mk2' as const, mode: 'production' as const, productionBonus: 0.12, speedBonus: 0, powerIncrease: 0.7 },
        };
        
        render(<ProductionTree node={proliferatorNode} />);
        
        expect(screen.getByText('🧪 MK2 · production')).toBeInTheDocument();
    });

    it('入力・出力・電力の詳細情報が表示される', () => {
        render(<ProductionTree node={mockRecipeNode} />);
        
        // 入力情報
        expect(screen.getAllByText('Iron Ore')[0]).toBeInTheDocument(); // Use getAllByText to avoid ambiguity
        expect(screen.getAllByText('60.0/s')[0]).toBeInTheDocument();
        
        // 電力情報
        expect(screen.getByText('machines:')).toBeInTheDocument();
        expect(screen.getAllByText('120.0 kW')[0]).toBeInTheDocument(); // Use getAllByText to avoid ambiguity
        
        // ベルト情報
        expect(screen.getByText('inputs:')).toBeInTheDocument();
        expect(screen.getByText('outputs:')).toBeInTheDocument();
        expect(screen.getByText('total:')).toBeInTheDocument();
    });

    it('CompactNodeSettings が表示される', () => {
        render(<ProductionTree node={mockRecipeNode} />);
        
        expect(screen.getByTestId('compact-node-settings')).toBeInTheDocument();
        expect(screen.getByText('Compact Settings')).toBeInTheDocument();
    });

    it('キーボードで展開・折りたたみができる', () => {
        const onToggleCollapse = vi.fn();
        render(
            <ProductionTree 
                node={mockRecipeNode} 
                collapsedNodes={new Set()}
                onToggleCollapse={onToggleCollapse}
            />
        );
        
        const expandButton = screen.getByRole('button', { name: 'collapse' });
        
        // Enter キーで展開・折りたたみ
        fireEvent.keyDown(expandButton, { key: 'Enter' });
        expect(onToggleCollapse).toHaveBeenCalledWith('root');
        
        // Space キーで展開・折りたたみ
        fireEvent.keyDown(expandButton, { key: ' ' });
        expect(onToggleCollapse).toHaveBeenCalledWith('root');
    });

    it('ルートノードの場合、特別なスタイルが適用される', () => {
        render(<ProductionTree node={mockRecipeNode} depth={0} />);
        
        // ルートノードの特別なスタイル（ボーダーが太い）
        const rootNode = screen.getByText('Iron Ingot').closest('.border-2');
        expect(rootNode).toBeInTheDocument();
    });

    it('子ノードが複数ある場合、すべて表示される', () => {
        const multiChildNode = {
            ...mockRecipeNode,
            children: [
                mockRawMaterialNode,
                { ...mockRawMaterialNode, nodeId: 'raw-1002-1', itemName: 'Copper Ore' },
            ],
        };
        
        render(
            <ProductionTree 
                node={multiChildNode} 
                collapsedNodes={new Set()}
                onToggleCollapse={() => {}}
            />
        );
        
        // 両方の子ノードが表示される
        expect(screen.getAllByText('Iron Ore')[0]).toBeInTheDocument(); // Use getAllByText to avoid ambiguity
        expect(screen.getByText('Copper Ore')).toBeInTheDocument();
    });

    it('Explicitレシピの場合、レシピ固有のアイコンが表示される（スプライトシート対応）', () => {
        const explicitRecipeNode = {
            ...mockRecipeNode,
            recipe: {
                SID: 120,
                name: 'Plasma Refining',
                Type: 'Refine' as const,
                Explicit: true,
                TimeSpend: 120,
                Items: [{ id: 1120, name: 'Crude Oil', count: 2, Type: 'Fluid', isRaw: false }],
                Results: [{ id: 1114, name: 'Refined Oil', count: 2, Type: 'Fluid', isRaw: false }],
                GridIndex: '1201',
                productive: true,
            },
        };
        
        const { container } = render(<ProductionTree node={explicitRecipeNode} />);
        
        // Explicit=trueの場合、レシピSIDのアイコンが使用され、preferRecipes=trueが渡される
        const icon = container.querySelector('[data-testid="item-icon-120"]');
        expect(icon).toBeInTheDocument();
        expect(icon).toHaveAttribute('data-prefer-recipes', 'true');
        expect(icon).toHaveAttribute('data-alt', 'Plasma Refining');
    });

    it('非Explicitレシピの場合、結果アイテムのアイコンが表示される（スプライトシート対応）', () => {
        const { container } = render(<ProductionTree node={mockRecipeNode} />);
        
        // Explicit=falseの場合、結果アイテムIDのアイコンが使用され、preferRecipes=falseが渡される
        const icon = container.querySelector('[data-testid="item-icon-1002"]');
        expect(icon).toBeInTheDocument();
        expect(icon).toHaveAttribute('data-prefer-recipes', 'false');
        expect(icon).toHaveAttribute('data-alt', 'Iron Ingot');
    });

    it('循環依存ノードの場合、特別なスタイルとアイコンが表示される', () => {
        const circularDependencyNode = {
            nodeId: 'raw-1114-1',
            isRawMaterial: true,
            isCircularDependency: true,
            itemId: 1114,
            itemName: 'Refined Oil',
            miningFrom: 'externalSupplyCircular',
            targetOutputRate: 2,
            machineCount: 0,
            proliferator: { type: 'none' as const, mode: 'speed' as const, productionBonus: 0, speedBonus: 0, powerIncrease: 0 },
            power: { total: 0, machines: 0, sorters: 0 },
            conveyorBelts: { inputs: 0, outputs: 1, total: 1 },
            inputs: [],
            sourceRecipe: {
                SID: 120,
                name: 'Reforming Refine',
                Type: 'Refine' as const,
                Explicit: true,
                TimeSpend: 180,
                Items: [{ id: 1114, name: 'Refined Oil', count: 1, Type: 'Fluid', isRaw: false }],
                Results: [{ id: 1114, name: 'Refined Oil', count: 3, Type: 'Fluid', isRaw: false }],
                GridIndex: '1202',
                productive: true,
            },
            children: [],
        };
        
        render(<ProductionTree node={circularDependencyNode} />);
        
        // アイテム名が表示される
        expect(screen.getByText('Refined Oil')).toBeInTheDocument();
        
        // 循環依存の説明が表示される
        expect(screen.getByText('🔄 externalSupplyCircular')).toBeInTheDocument();
        
        // 生産速度が表示される
        expect(screen.getByText('2.0/s')).toBeInTheDocument();
    });
});