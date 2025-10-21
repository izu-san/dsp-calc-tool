import React from 'react';
import { getDataPath } from '../../../utils/paths';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ProductionTree } from '../index';

// i18n モック（キーをそのまま返す）
vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key: string) => key }),
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

    it('ボトルネックが検出された場合、警告アイコンが表示される', () => {
        const bottleneckNode = {
            ...mockRecipeNode,
            conveyorBelts: { 
                ...mockRecipeNode.conveyorBelts, 
                saturation: 85, 
                bottleneckType: 'input' as const 
            },
        };
        
        render(<ProductionTree node={bottleneckNode} />);
        
        // 警告アイコンが表示される
        expect(screen.getByText('⚠️')).toBeInTheDocument();
        expect(screen.getByText('85.0%')).toBeInTheDocument();
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

    it('Explicitレシピの場合、レシピ固有のアイコンが表示される', () => {
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
        
        render(<ProductionTree node={explicitRecipeNode} />);
        
    // Explicit=trueの場合、recipes固有のアイコンが使用される
    const img = screen.getByAltText('Plasma Refining') as HTMLImageElement;
    expect(img.src).toContain(getDataPath('data/Recipes/Icons/120.png'));
    });

    it('非Explicitレシピの場合、結果アイテムのアイコンが表示される', () => {
        render(<ProductionTree node={mockRecipeNode} />);
        
    // Explicit=falseの場合、結果アイテムのアイコンが使用される
    const img = screen.getByAltText('Iron Ingot') as HTMLImageElement;
    expect(img.src).toContain(getDataPath('data/Items/Icons/1002.png'));
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