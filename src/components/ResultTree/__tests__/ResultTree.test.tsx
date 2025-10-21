import React from 'react';
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
        conveyorBelts: { outputs: 1 },
        miningFrom: 'Iron Vein',
        children: [],
    };

    const mockRecipeNode = {
        nodeId: 'recipe-2001-0',
        isRawMaterial: false,
        recipe: {
            SID: 2001,
            name: 'Iron Ingot',
            Type: 'Smelt',
            Results: [{ id: 1002 }],
            productive: true,
        },
        machine: {
            name: 'Arc Smelter',
            assemblerSpeed: 10000,
            workEnergyPerTick: 120,
        },
        machineCount: 1,
        targetOutputRate: 60,
        power: { total: 120, machines: 120, sorters: 0 },
        conveyorBelts: { inputs: 1, outputs: 1, total: 2, saturation: 85, bottleneckType: 'input' },
        proliferator: { type: 'none', mode: 'speed' },
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
                bottleneckType: 'input' 
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
            proliferator: { type: 'mk2', mode: 'production' },
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
});