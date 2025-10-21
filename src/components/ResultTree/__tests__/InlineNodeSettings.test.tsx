import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { InlineNodeSettings } from '../InlineNodeSettings';

// i18n モック（キーをそのまま返す）
vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key: string) => key }),
}));

// ItemIcon を簡素化
vi.mock('../../ItemIcon', () => ({
    ItemIcon: (props: any) => <span data-testid={`icon-${props.itemId}`} />,
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

describe('InlineNodeSettings', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        nodeOverridesMock = new Map();
    });

    afterEach(() => {
        cleanup();
        vi.restoreAllMocks();
    });

    const mockNode = {
        nodeId: 'test-node-1',
        recipe: {
            Type: 'Assemble',
            productive: true,
        },
    };

    const mockSmeltNode = {
        nodeId: 'test-node-2',
        recipe: {
            Type: 'Smelt',
            productive: false,
        },
    };

    const mockToggle = vi.fn();

    it('isExpanded=false の場合、何も表示されない', () => {
        render(
            <InlineNodeSettings 
                node={mockNode} 
                isExpanded={false} 
                onToggle={mockToggle} 
            />
        );
        
        expect(screen.queryByText('useCustomSettings')).not.toBeInTheDocument();
    });

    it('isExpanded=true の場合、設定パネルが表示される', () => {
        render(
            <InlineNodeSettings 
                node={mockNode} 
                isExpanded={true} 
                onToggle={mockToggle} 
            />
        );
        
        expect(screen.getByText('useCustomSettings')).toBeInTheDocument();
        expect(screen.getByText('overrideGlobalSettingsForNode')).toBeInTheDocument();
        expect(screen.getByText('usingGlobalSettings')).toBeInTheDocument();
    });

    it('オーバーライドトグルをクリックすると設定パネルが表示される', () => {
        render(
            <InlineNodeSettings 
                node={mockNode} 
                isExpanded={true} 
                onToggle={mockToggle} 
            />
        );
        
        const toggle = screen.getByRole('switch');
        fireEvent.click(toggle);
        
        expect(screen.getAllByText((content, element) => {
            return element?.textContent?.includes('proliferator') || false;
        })[0]).toBeInTheDocument();
        expect(screen.getAllByText((content, element) => {
            return element?.textContent?.includes('machineRank') || false;
        })[0]).toBeInTheDocument();
    });

    it('プロリフェレータタイプを選択できる', () => {
        render(
            <InlineNodeSettings 
                node={mockNode} 
                isExpanded={true} 
                onToggle={mockToggle} 
            />
        );
        
        // オーバーライドを有効化
        const toggle = screen.getByRole('switch');
        fireEvent.click(toggle);
        
        // プロリフェレータタイプを選択
        const mk2Button = screen.getByRole('button', { name: 'proliferator mk2' });
        fireEvent.click(mk2Button);
        
        expect(mk2Button).toHaveAttribute('aria-pressed', 'true');
    });

    it('プロリフェレータモードを選択できる', () => {
        render(
            <InlineNodeSettings 
                node={mockNode} 
                isExpanded={true} 
                onToggle={mockToggle} 
            />
        );
        
        // オーバーライドを有効化
        const toggle = screen.getByRole('switch');
        fireEvent.click(toggle);
        
        // プロリフェレータタイプを選択
        const mk2Button = screen.getByRole('button', { name: 'proliferator mk2' });
        fireEvent.click(mk2Button);
        
        // モードボタンが表示される
        expect(screen.getByText('🏭 production')).toBeInTheDocument();
        expect(screen.getByText('⚡ speed')).toBeInTheDocument();
        
        // モードを選択
        const productionButton = screen.getByRole('button', { name: 'mode: production' });
        fireEvent.click(productionButton);
        
        expect(productionButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('productive=false の場合、production モードが無効化される', () => {
        render(
            <InlineNodeSettings 
                node={mockSmeltNode} 
                isExpanded={true} 
                onToggle={mockToggle} 
            />
        );
        
        // オーバーライドを有効化
        const toggle = screen.getByRole('switch');
        fireEvent.click(toggle);
        
        // プロリフェレータタイプを選択
        const mk2Button = screen.getByRole('button', { name: 'proliferator mk2' });
        fireEvent.click(mk2Button);
        
        // production モードが無効化されている
        const productionButton = screen.getByRole('button', { name: 'mode: production' });
        expect(productionButton).toHaveAttribute('disabled');
    });

    it('機械ランクを選択できる（Assemble タイプ）', () => {
        render(
            <InlineNodeSettings 
                node={mockNode} 
                isExpanded={true} 
                onToggle={mockToggle} 
            />
        );
        
        // オーバーライドを有効化
        const toggle = screen.getByRole('switch');
        fireEvent.click(toggle);
        
        // 機械ランクボタンをクリック（アイコンとテキストが分かれているため、テキスト部分を特定）
        const mk2Button = screen.getByText('assemblingMachineMk2');
        fireEvent.click(mk2Button.closest('button')!);
        
        expect(mk2Button.closest('button')).toHaveClass('bg-blue-100');
    });

    it('Smelt タイプの場合、適切な機械ランクオプションが表示される', () => {
        render(
            <InlineNodeSettings 
                node={mockSmeltNode} 
                isExpanded={true} 
                onToggle={mockToggle} 
            />
        );
        
        // オーバーライドを有効化
        const toggle = screen.getByRole('switch');
        fireEvent.click(toggle);
        
        // Smelt タイプのオプションが表示される
        expect(screen.getByText('arcSmelter')).toBeInTheDocument();
        expect(screen.getByText('planeSmelter')).toBeInTheDocument();
    });

    it('適用ボタンクリックで setNodeOverride が呼ばれる', () => {
        render(
            <InlineNodeSettings 
                node={mockNode} 
                isExpanded={true} 
                onToggle={mockToggle} 
            />
        );
        
        // オーバーライドを有効化
        const toggle = screen.getByRole('switch');
        fireEvent.click(toggle);
        
        // 設定を変更
        const mk2Button = screen.getByRole('button', { name: 'proliferator mk2' });
        fireEvent.click(mk2Button);
        
        // 適用ボタンをクリック
        fireEvent.click(screen.getByText('apply'));
        
        expect(setNodeOverride).toHaveBeenCalledWith(
            mockNode.nodeId,
            expect.objectContaining({
                proliferator: expect.objectContaining({
                    type: 'mk2',
                    mode: 'speed',
                }),
            })
        );
        expect(mockToggle).toHaveBeenCalled();
    });

    it('リセットボタンクリックで clearNodeOverride が呼ばれる', () => {
        render(
            <InlineNodeSettings 
                node={mockNode} 
                isExpanded={true} 
                onToggle={mockToggle} 
            />
        );
        
        // リセットボタンをクリック
        fireEvent.click(screen.getByText('resetToGlobal'));
        
        expect(clearNodeOverride).toHaveBeenCalledWith(mockNode.nodeId);
        expect(mockToggle).toHaveBeenCalled();
    });

    it('キャンセルボタンクリックで onToggle が呼ばれる', () => {
        render(
            <InlineNodeSettings 
                node={mockNode} 
                isExpanded={true} 
                onToggle={mockToggle} 
            />
        );
        
        // キャンセルボタンをクリック
        fireEvent.click(screen.getByText('cancel'));
        
        expect(mockToggle).toHaveBeenCalled();
    });

    it('既存のオーバーライドがある場合、初期値が設定される', () => {
        nodeOverridesMock.set(mockNode.nodeId, {
            proliferator: { type: 'mk2', mode: 'production' },
            machineRank: 'mk2',
        });
        
        render(
            <InlineNodeSettings 
                node={mockNode} 
                isExpanded={true} 
                onToggle={mockToggle} 
            />
        );
        
        // オーバーライドが有効になっている
        const toggle = screen.getByRole('switch');
        expect(toggle).toHaveAttribute('aria-checked', 'true');
        
        // 初期値が設定されている
        const mk2Button = screen.getByRole('button', { name: 'proliferator mk2' });
        expect(mk2Button).toHaveAttribute('aria-pressed', 'true');
    });

    it('オーバーライドが無効の場合、適用ボタンで clearNodeOverride が呼ばれる', () => {
        render(
            <InlineNodeSettings 
                node={mockNode} 
                isExpanded={true} 
                onToggle={mockToggle} 
            />
        );
        
        // オーバーライドは無効のまま適用ボタンをクリック
        fireEvent.click(screen.getByText('apply'));
        
        expect(clearNodeOverride).toHaveBeenCalledWith(mockNode.nodeId);
        expect(mockToggle).toHaveBeenCalled();
    });
});
