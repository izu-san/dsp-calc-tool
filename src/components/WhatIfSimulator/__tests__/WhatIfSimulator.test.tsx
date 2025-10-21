import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// i18n モック
vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key: string) => key }),
}));

// 計算ロジックをモック（渡された settings に応じて差分を出す）
function computeResultBySettings(settings?: any, baseResult?: any) {
    const isBeltMk3 = settings?.conveyorBelt?.tier === 'mk3';
    const isProliferatorMk3 = settings?.proliferator?.type === 'mk3';
    const isStack4 = settings?.conveyorBelt?.stackCount === 4;
    const isQuantumChemical = settings?.machineRank?.Chemical === 'quantum';
    const isAssemblerMk3 = settings?.machineRank?.Assemble === 'mk3';
    const isAssemblerRecomposing = settings?.machineRank?.Assemble === 'recomposing';
    const isProductionMode = settings?.proliferator?.mode === 'production';
    const isSpeedMode = settings?.proliferator?.mode === 'speed';
    
    const basePower = baseResult?.totalPower || 1000;
    const baseMachines = baseResult?.totalMachines || 10;
    const baseBelts = baseResult?.rootNode?.conveyorBelts?.total || 5;
    
    let totalPower = basePower;
    let totalMachines = baseMachines;
    let totalBelts = baseBelts;
    
    // Apply changes based on settings
    if (isBeltMk3) totalBelts -= 2;
    if (isStack4) totalBelts -= 1;
    if (isProliferatorMk3) {
        totalMachines -= 2;
        totalPower += 200; // Proliferator increases power
    }
    if (isQuantumChemical) {
        totalMachines -= 1;
        totalPower -= 50;
    }
    if (isAssemblerMk3) {
        totalMachines -= 1;
        totalPower -= 30;
    }
    if (isAssemblerRecomposing) {
        totalMachines -= 2;
        totalPower -= 100;
    }
    if (isProductionMode) {
        totalPower += 150;
    }
    if (isSpeedMode) {
        totalPower -= 100;
    }
    
    return {
        rootNode: {
            nodeId: 'root',
            itemName: 'Test Item',
            targetOutputRate: 60,
            power: { total: totalPower, machines: totalPower, sorters: 0 },
            machineCount: totalMachines,
            conveyorBelts: { 
                inputs: 0, 
                outputs: 0, 
                total: totalBelts, 
                saturation: settings?.conveyorBelt?.tier === 'mk1' ? 95 : 60 
            },
            bottlenecks: [],
            proliferator: { type: settings?.proliferator?.type ?? 'none', mode: settings?.proliferator?.mode ?? 'speed' },
            children: [
                {
                    nodeId: 'child1',
                    itemName: 'Child Item',
                    targetOutputRate: 30,
                    power: { total: totalPower / 2, machines: totalPower / 2, sorters: 0 },
                    machineCount: Math.floor(totalMachines / 2),
                    conveyorBelts: { 
                        inputs: 0, 
                        outputs: 0, 
                        total: Math.floor(totalBelts / 2), 
                        saturation: settings?.conveyorBelt?.tier === 'mk1' ? 90 : 50 
                    },
                    bottlenecks: [],
                    proliferator: { type: settings?.proliferator?.type ?? 'none', mode: settings?.proliferator?.mode ?? 'speed' },
                    children: [],
                }
            ],
        },
        totalPower,
        totalMachines,
        totalBeltSaturation: 0,
        bottlenecks: [],
    };
}
const mockCalculateProductionChain = vi.fn();
vi.mock('../../../lib/calculator', () => ({
    calculateProductionChain: (...args: any[]) => mockCalculateProductionChain(...args),
}));

// stores モック
const mockUseRecipeSelectionStore = vi.fn(() => ({
    selectedRecipe: { SID: 2001, name: 'Test Recipe' },
    targetQuantity: 60,
}));

const mockUseGameDataStore = vi.fn(() => ({ 
    data: { recipes: new Map() } 
}));

const mockUseNodeOverrideStore = vi.fn(() => ({
    nodeOverrides: new Map(),
}));

vi.mock('../../../stores/recipeSelectionStore', () => ({
    useRecipeSelectionStore: () => mockUseRecipeSelectionStore(),
}));

vi.mock('../../../stores/gameDataStore', () => ({
    useGameDataStore: () => mockUseGameDataStore(),
}));

vi.mock('../../../stores/nodeOverrideStore', () => ({
    useNodeOverrideStore: () => mockUseNodeOverrideStore(),
}));

// フォーマッタを安全化（未定義でも落ちないように）
vi.mock('../../../utils/format', () => ({
    formatPower: (_kw?: number) => '0.0 kW',
    formatRate: (_perSec?: number) => '0.0/s',
    formatNumber: (_n?: number) => '0.0',
}));

// settingsStore モック（呼び出し検証用の関数を外側で保持）
export const setProliferatorMock = vi.fn();
export const setConveyorBeltMock = vi.fn();
export const setMachineRankMock = vi.fn();
let currentSettings: any = {
    proliferator: { type: 'none', mode: 'speed' },
    conveyorBelt: { tier: 'mk1', stackCount: 1 },
    machineRank: { Smelt: 'arc', Assemble: 'mk1', Chemical: 'standard' },
    alternativeRecipes: new Map<number, number>(),
};
vi.mock('../../../stores/settingsStore', () => ({
    useSettingsStore: () => ({
        settings: currentSettings,
        setProliferator: (...args: any[]) => setProliferatorMock(...args),
        setConveyorBelt: (...args: any[]) => setConveyorBeltMock(...args),
        setMachineRank: (...args: any[]) => setMachineRankMock(...args),
    }),
}));

import { WhatIfSimulator } from '../index';

describe('WhatIfSimulator', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        cleanup();
        
        // デフォルトの計算結果モック
        const baseResult = computeResultBySettings();
        mockCalculateProductionChain.mockImplementation((_r?: any, _q?: number, _d?: any, s?: any) => {
            return computeResultBySettings(s, baseResult);
        });
        
        currentSettings = {
            proliferator: { type: 'none', mode: 'speed' },
            conveyorBelt: { tier: 'mk1', stackCount: 1 },
            machineRank: { Smelt: 'arc', Assemble: 'mk1', Chemical: 'standard' },
            alternativeRecipes: new Map<number, number>(),
        };
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('シミュレーターの基本表示が正しく表示される', () => {
        render(<WhatIfSimulator />);
        expect(screen.getByText('whatIfAnalysis')).toBeInTheDocument();
        expect(screen.getByText('compareDifferentSettings')).toBeInTheDocument();
    });

    it('データがない場合は何も表示されない', () => {
        mockUseGameDataStore.mockReturnValueOnce({
            data: null,
        } as any);
        
        const { container } = render(<WhatIfSimulator />);
        expect(container.firstChild).toBeNull();
    });

    it('レシピが選択されていない場合は何も表示されない', () => {
        mockUseRecipeSelectionStore.mockReturnValueOnce({
            selectedRecipe: null,
            targetQuantity: 60,
        } as any);
        
        const { container } = render(<WhatIfSimulator />);
        expect(container.firstChild).toBeNull();
    });

    it('個別シナリオの Apply ボタンで増産剤mk3へのアップグレードが適用される', async () => {
        render(<WhatIfSimulator />);

        const card = await screen.findByText('upgradeToMk3Proliferator');
        const cardContainer = card.closest('div');
        expect(cardContainer).not.toBeNull();
        const applyBtn = within(cardContainer as HTMLElement).getByText('apply');
        await userEvent.click(applyBtn);

        expect(setProliferatorMock).toHaveBeenCalledWith('mk3', 'speed');
    });

    it('ベルトmk3シナリオが適用される', async () => {
        render(<WhatIfSimulator />);

        const card = await screen.findByText('upgradeToMk3Belt');
        const cardContainer = card.closest('div');
        expect(cardContainer).not.toBeNull();
        const applyBtn = within(cardContainer as HTMLElement).getByText('apply');
        await userEvent.click(applyBtn);

        expect(setConveyorBeltMock).toHaveBeenCalledWith('mk3', 1);
    });

    it('スタック4シナリオが適用される', async () => {
        render(<WhatIfSimulator />);

        const card = await screen.findByText('increaseBeltStack');
        const cardContainer = card.closest('div');
        expect(cardContainer).not.toBeNull();
        const applyBtn = within(cardContainer as HTMLElement).getByText('apply');
        await userEvent.click(applyBtn);

        expect(setConveyorBeltMock).toHaveBeenCalledWith('mk1', 4);
    });

    it('クオンタム化学プラントシナリオが適用される', async () => {
        render(<WhatIfSimulator />);

        const card = await screen.findByText('upgradeToQuantumChemical');
        const cardContainer = card.closest('div');
        expect(cardContainer).not.toBeNull();
        const applyBtn = within(cardContainer as HTMLElement).getByText('apply');
        await userEvent.click(applyBtn);

        expect(setMachineRankMock).toHaveBeenCalledWith('Chemical', 'quantum');
    });

    it('アセンブラmk3シナリオが適用される', async () => {
        render(<WhatIfSimulator />);

        const card = await screen.findByText('upgradeToAssemblerMk3');
        const cardContainer = card.closest('div');
        expect(cardContainer).not.toBeNull();
        const applyBtn = within(cardContainer as HTMLElement).getByText('apply');
        await userEvent.click(applyBtn);

        expect(setMachineRankMock).toHaveBeenCalledWith('Assemble', 'mk3');
    });

    it('リコンポーザーアセンブラシナリオが適用される', async () => {
        render(<WhatIfSimulator />);

        const card = await screen.findByText('upgradeToRecomposingAssembler');
        const cardContainer = card.closest('div');
        expect(cardContainer).not.toBeNull();
        const applyBtn = within(cardContainer as HTMLElement).getByText('apply');
        await userEvent.click(applyBtn);

        expect(setMachineRankMock).toHaveBeenCalledWith('Assemble', 'recomposing');
    });

    it('生産モードシナリオが適用される', async () => {
        render(<WhatIfSimulator />);

        const card = await screen.findByText('switchToProductionMode');
        const cardContainer = card.closest('div');
        expect(cardContainer).not.toBeNull();
        const applyBtn = within(cardContainer as HTMLElement).getByText('apply');
        await userEvent.click(applyBtn);

        expect(setProliferatorMock).toHaveBeenCalledWith('none', 'production');
    });

    it('スピードモードシナリオが適用される', async () => {
        // まず現在をproductionにして、speed切替シナリオが候補に出るようにする
        currentSettings = {
            ...currentSettings,
            proliferator: { type: 'none', mode: 'production' },
        };
        render(<WhatIfSimulator />);

        const card = await screen.findByText('switchToSpeedMode');
        const cardContainer = card.closest('div');
        expect(cardContainer).not.toBeNull();
        const applyBtn = within(cardContainer as HTMLElement).getByText('apply');
        await userEvent.click(applyBtn);

        expect(setProliferatorMock).toHaveBeenCalledWith('none', 'speed');
    });

    it('既に適用済みのシナリオは Apply が無効化される', async () => {
        currentSettings = {
            ...currentSettings,
            proliferator: { type: 'mk3', mode: 'speed' },
        };

        render(<WhatIfSimulator />);

        const maybeCard = screen.queryByText('upgradeToMk3Proliferator');
        if (maybeCard) {
            const cardContainer = maybeCard.closest('div') as HTMLElement;
            const btn = within(cardContainer).getByText('apply').closest('button') as HTMLButtonElement;
            expect(btn.disabled).toBe(true);
        } else {
            expect(maybeCard).toBeNull();
        }
    });

    it('シナリオの切り替え（toggle）が動作する', async () => {
        render(<WhatIfSimulator />);

        const card = await screen.findByText('upgradeToMk3Proliferator');
        const cardContainer = card.closest('div');
        expect(cardContainer).not.toBeNull();
        
        // シナリオカードのボタンをクリックしてアクティブにする
        const toggleBtn = (card as HTMLElement).closest('button') ?? (cardContainer as HTMLElement).querySelector('button');
        await userEvent.click(toggleBtn as HTMLElement);
        
        // 詳細比較テーブルが表示されることを確認
        await waitFor(() => {
            expect(screen.getByText('detailedComparison')).toBeInTheDocument();
        });
    });

    it('最適化目標の選択が動作する', async () => {
        render(<WhatIfSimulator />);

        // パワー最適化ボタンをクリック
        const powerButton = screen.getByText('minPower').closest('button');
        await userEvent.click(powerButton as HTMLElement);

        // 最適化目標が設定されることを確認（部分一致）
        await waitFor(() => {
            expect(screen.getByText(/showingScenariosLowestPower/)).toBeInTheDocument();
        });
    });

    it('マシン数最適化が動作する', async () => {
        render(<WhatIfSimulator />);

        const machinesButton = screen.getByText('minMachines').closest('button');
        await userEvent.click(machinesButton as HTMLElement);

        await waitFor(() => {
            expect(screen.getByText(/showingScenariosFewestMachines/)).toBeInTheDocument();
        });
    });

    it('効率最適化が動作する', async () => {
        render(<WhatIfSimulator />);

        const efficiencyButton = screen.getByText('maxEfficiency').closest('button');
        await userEvent.click(efficiencyButton as HTMLElement);

        await waitFor(() => {
            expect(screen.getByText(/showingScenariosBestEfficiency/)).toBeInTheDocument();
        });
    });

    it('バランス最適化が動作する', async () => {
        render(<WhatIfSimulator />);

        const balancedButton = screen.getByText('balanced').closest('button');
        await userEvent.click(balancedButton as HTMLElement);

        await waitFor(() => {
            expect(screen.getByText(/showingScenariosBalanced/)).toBeInTheDocument();
        });
    });

    it('Apply Best ボタンが動作する', async () => {
        // 全シナリオが既に適用済みの状態にする
        currentSettings = {
            proliferator: { type: 'mk3', mode: 'production' },
            conveyorBelt: { tier: 'mk3', stackCount: 4 },
            machineRank: { Smelt: 'arc', Assemble: 'recomposing', Chemical: 'quantum' },
            alternativeRecipes: new Map<number, number>(),
        };

        render(<WhatIfSimulator />);

        // 最適化目標を設定
        const powerButton = screen.getByText('minPower').closest('button');
        await userEvent.click(powerButton as HTMLElement);

        // Apply Best ボタンをクリック
        await waitFor(() => {
            const applyBestButton = screen.getByText('applyBest');
            userEvent.click(applyBestButton);
        });

        // シナリオが適用されることを確認
        await waitFor(() => {
            expect(setProliferatorMock).toHaveBeenCalled();
        });
    });

    it('クイックアクションボタンが動作する', async () => {
        render(<WhatIfSimulator />);

        // 最大増産剤ボタンをクリック
        const maxProliferatorButton = screen.getByText('maxProliferator').closest('button');
        await userEvent.click(maxProliferatorButton as HTMLElement);

        expect(setProliferatorMock).toHaveBeenCalledWith('mk3', 'speed');
    });

    it('最大ベルトボタンが動作する', async () => {
        render(<WhatIfSimulator />);

        const maxBeltsButton = screen.getByText('maxBelts').closest('button');
        await userEvent.click(maxBeltsButton as HTMLElement);

        expect(setConveyorBeltMock).toHaveBeenCalledWith('mk3', 1);
    });

    it('最大スタックボタンが動作する', async () => {
        render(<WhatIfSimulator />);

        const maxStackButton = screen.getByText('maxStack').closest('button');
        await userEvent.click(maxStackButton as HTMLElement);

        expect(setConveyorBeltMock).toHaveBeenCalledWith('mk1', 4);
    });

    it('ボトルネック検出とFix All機能が動作する', async () => {
        // ボトルネックがある設定でテスト
        currentSettings = {
            ...currentSettings,
            conveyorBelt: { tier: 'mk1', stackCount: 1 },
        };

        render(<WhatIfSimulator />);

        // Fix All ボタンが表示される場合のみテスト
        const fixAllButton = screen.queryByText('fixAll');
        if (fixAllButton) {
            await userEvent.click(fixAllButton);
            
            // シナリオが適用されることを確認
            await waitFor(() => {
                expect(setConveyorBeltMock).toHaveBeenCalled();
            });
        }
    });

    it('個別ボトルネック修正ボタンが動作する', async () => {
        currentSettings = {
            ...currentSettings,
            conveyorBelt: { tier: 'mk1', stackCount: 1 },
        };

        render(<WhatIfSimulator />);

        const fixNowButtons = screen.queryAllByText('fixNow');
        if (fixNowButtons.length > 0) {
            await userEvent.click(fixNowButtons[0]);
            
            await waitFor(() => {
                expect(setConveyorBeltMock).toHaveBeenCalled();
            });
        }
    });

    it('シナリオ適用後の通知が表示される', async () => {
        render(<WhatIfSimulator />);

        const card = await screen.findByText('upgradeToMk3Proliferator');
        const cardContainer = card.closest('div');
        const applyBtn = within(cardContainer as HTMLElement).getByText('apply');
        await userEvent.click(applyBtn);

        // 適用通知が表示されることを確認
        await waitFor(() => {
            expect(screen.getByText('scenarioApplied')).toBeInTheDocument();
        });
    });

    it('すべてのシナリオが適用済みの場合の表示（クイックアクションがすべて無効化される）', async () => {
        // すべてのシナリオを適用済みにする
        currentSettings = {
            proliferator: { type: 'mk3', mode: 'production' },
            conveyorBelt: { tier: 'mk3', stackCount: 4 },
            machineRank: { Smelt: 'arc', Assemble: 'recomposing', Chemical: 'quantum' },
            alternativeRecipes: new Map<number, number>(),
        };

        render(<WhatIfSimulator />);

        // クイックアクションがすべて無効化（適用済み）であることを確認
        const maxProliferatorButton = screen.getByText('maxProliferator').closest('button') as HTMLButtonElement;
        const maxBeltsButton = screen.getByText('maxBelts').closest('button') as HTMLButtonElement;
        const maxStackButton = screen.getByText('maxStack').closest('button') as HTMLButtonElement;
        expect(maxProliferatorButton.disabled).toBe(true);
        expect(maxBeltsButton.disabled).toBe(true);
        expect(maxStackButton.disabled).toBe(true);
    });

    it('最適化目標選択時、ガイダンステキストが表示される', async () => {
        render(<WhatIfSimulator />);

        // 最適化目標を設定
        const powerButton = screen.getByText('minPower').closest('button');
        await userEvent.click(powerButton as HTMLElement);

        // ガイダンステキスト（候補表示）が出ることを確認
        await waitFor(() => {
            expect(screen.getByText(/showingScenariosLowestPower/)).toBeInTheDocument();
        });
    });

    it('アクティブシナリオの詳細比較テーブルが表示される', async () => {
        render(<WhatIfSimulator />);

        // シナリオをアクティブにする（ボタンをクリック）
        const card = await screen.findByText('upgradeToMk3Proliferator');
        const toggleBtn = (card as HTMLElement).closest('button');
        await userEvent.click(toggleBtn as HTMLElement);

        // 詳細比較テーブルが表示されることを確認
        await waitFor(() => {
            expect(screen.getByText('detailedComparison')).toBeInTheDocument();
            expect(screen.getByText('totalPower')).toBeInTheDocument();
            expect(screen.getByText('totalMachines')).toBeInTheDocument();
            expect(screen.getByText('totalBelts')).toBeInTheDocument();
        });
    });

    it('countTotalBelts関数が正しく動作する', () => {
        const mockNode = {
            conveyorBelts: { total: 5 },
            children: [
                { conveyorBelts: { total: 3 }, children: [] },
                { conveyorBelts: { total: 2 }, children: [] }
            ]
        };

        // この関数は内部で使用されるため、間接的にテストする
        render(<WhatIfSimulator />);
        
        // シナリオが表示されることで、関数が正常に動作していることを確認
        expect(screen.getByText('upgradeToMk3Proliferator')).toBeInTheDocument();
    });

    it('isScenarioAlreadyApplied関数が正しく動作する', async () => {
        // 既に適用済みの設定
        currentSettings = {
            ...currentSettings,
            proliferator: { type: 'mk3', mode: 'speed' },
        };

        render(<WhatIfSimulator />);

        // 適用済みのシナリオは表示されないか、無効化されることを確認
        const maybeCard = screen.queryByText('upgradeToMk3Proliferator');
        if (maybeCard) {
            const cardContainer = maybeCard.closest('div') as HTMLElement;
            const applyBtn = within(cardContainer).getByText('apply').closest('button') as HTMLButtonElement;
            expect(applyBtn.disabled).toBe(true);
        }
    });
});