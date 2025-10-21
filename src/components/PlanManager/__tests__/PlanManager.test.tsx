import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { PlanManager } from '../index';

// i18n モック（キーを返す）
vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key: string, _opts?: unknown) => key }),
}));

// stores モック
const recipesMap = new Map<number, any>([
    [2001, { SID: 2001, name: 'Test Recipe' }],
]);

vi.mock('../../../stores/gameDataStore', () => ({
    useGameDataStore: () => ({ data: { recipes: recipesMap } }),
}));

const setSelectedRecipe = vi.fn();
const setTargetQuantity = vi.fn();
vi.mock('../../../stores/recipeSelectionStore', () => ({
    useRecipeSelectionStore: () => ({
        selectedRecipe: { SID: 2001, name: 'Test Recipe' },
        targetQuantity: 60,
        setSelectedRecipe,
        setTargetQuantity,
    }),
}));

const updateSettings = vi.fn();
vi.mock('../../../stores/settingsStore', () => ({
    useSettingsStore: () => ({
        settings: {
            machineRank: { Smelt: 'arc', Assemble: 'mk1', Chemical: 'standard', Research: 'standard', Refine: 'standard', Particle: 'standard' },
            proliferator: { type: 'none', mode: 'speed' },
            proliferatorMultiplier: { production: 1, speed: 1 },
            alternativeRecipes: new Map<number, number>(),
        },
        updateSettings,
    }),
}));

const setAllOverrides = vi.fn();
vi.mock('../../../stores/nodeOverrideStore', () => ({
    useNodeOverrideStore: () => ({
        nodeOverrides: new Map<number, any>([[101, { proliferator: { type: 'mk1', mode: 'speed' } }]]),
        setAllOverrides,
    }),
}));

// planExport/urlShare モック（hoisted）
const planExportMocks = vi.hoisted(() => ({
    exportPlan: vi.fn(),
    importPlan: vi.fn(),
    restorePlan: vi.fn(),
    savePlanToLocalStorage: vi.fn(),
    getRecentPlans: vi.fn(() => ([{ key: 'k1', name: 'Plan A', timestamp: 1700000000000 }])),
    loadPlanFromLocalStorage: vi.fn(() => ({
        name: 'Plan A', timestamp: 1700000000000, recipeSID: 2001, targetQuantity: 60, settings: {}, alternativeRecipes: {}, nodeOverrides: {},
    })),
    deletePlanFromLocalStorage: vi.fn(),
}));
vi.mock('../../../utils/planExport', () => planExportMocks);

const urlShareMocks = vi.hoisted(() => ({
    generateShareURL: vi.fn(() => 'https://example.com/?plan=abc'),
    copyToClipboard: vi.fn(async () => true),
}));
vi.mock('../../../utils/urlShare', () => urlShareMocks);

describe('PlanManager', () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const confirmSpy = vi.spyOn(window, 'confirm').mockImplementation(() => true);

    beforeEach(() => {
        vi.clearAllMocks();
        alertSpy.mockClear();
        confirmSpy.mockClear();
    });

    afterEach(() => {
        cleanup();
    });

    it('Save ダイアログで saveToLocalStorage が呼ばれ、アラート表示・ダイアログ閉じる', () => {
        render(<PlanManager />);
        fireEvent.click(screen.getByRole('button', { name: /save$/i }));
        fireEvent.change(screen.getByPlaceholderText(/Plan_/), { target: { value: 'MyPlan' } });
        fireEvent.click(screen.getByRole('button', { name: /saveToLocalStorage/i }));
        expect(planExportMocks.savePlanToLocalStorage).toHaveBeenCalled();
        expect(alertSpy).toHaveBeenCalledWith('saved');
        expect(screen.queryByRole('button', { name: /saveToLocalStorage/i })).not.toBeInTheDocument();
    });

    it('Save ダイアログで saveToFile(exportPlan) が呼ばれダイアログ閉じる', () => {
        render(<PlanManager />);
        fireEvent.click(screen.getByRole('button', { name: /save$/i }));
        fireEvent.click(screen.getByRole('button', { name: /saveToFile/i }));
        expect(planExportMocks.exportPlan).toHaveBeenCalled();
        expect(screen.queryByRole('button', { name: /saveToFile/i })).not.toBeInTheDocument();
    });

    it('Load ダイアログで recent plan の load が restorePlan を呼び、閉じる', () => {
        render(<PlanManager />);
        fireEvent.click(screen.getByRole('button', { name: /load$/i }));
        // ダイアログ内の Recent Plans のロードボタン（見出し load と区別）
        const buttons = screen.getAllByRole('button', { name: /^load$/i });
        const recentLoad = buttons.find((b) => b.className.includes('bg-blue-600'))!;
        fireEvent.click(recentLoad);
        expect(planExportMocks.loadPlanFromLocalStorage).toHaveBeenCalledWith('k1');
        expect(planExportMocks.restorePlan).toHaveBeenCalled();
        expect(alertSpy).toHaveBeenCalledWith('planLoaded');
        expect(screen.queryByText('recentPlans')).not.toBeInTheDocument();
    });

    it('Load ダイアログで delete クリック時に confirm → deletePlanFromLocalStorage が呼ばれる', () => {
        render(<PlanManager />);
        fireEvent.click(screen.getByRole('button', { name: /load$/i }));
        const del = screen.getByText('delete');
        fireEvent.click(del);
        expect(confirmSpy).toHaveBeenCalled();
        expect(planExportMocks.deletePlanFromLocalStorage).toHaveBeenCalledWith('k1');
    });

    it('共有ボタンで URL 生成→ダイアログ表示→コピー成功表示', async () => {
        render(<PlanManager />);
        fireEvent.click(screen.getByRole('button', { name: /shareURL$/i }));
        expect(urlShareMocks.generateShareURL).toHaveBeenCalled();
        expect(screen.getByText('sharedUrl')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: /copy|copied/i }));
        // コピー実行でボタンが copied 表示に変化
        expect(urlShareMocks.copyToClipboard).toHaveBeenCalled();
    });

    it('ファイルインポートで importPlan → restorePlan と planLoaded アラート', async () => {
        planExportMocks.importPlan.mockResolvedValueOnce({
            name: 'Imp', timestamp: Date.now(), recipeSID: 2001, nodeOverrides: {},
        });
        render(<PlanManager />);
        fireEvent.click(screen.getByRole('button', { name: /load$/i }));
        const file = new File([JSON.stringify({})], 'plan.json', { type: 'application/json' });
        const realInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        await fireEvent.change(realInput, { target: { files: [file] } });
        expect(planExportMocks.importPlan).toHaveBeenCalled();
        expect(planExportMocks.restorePlan).toHaveBeenCalled();
        expect(alertSpy).toHaveBeenCalledWith('planLoaded');
    });

    it('Save: includeOverridesOnSave=false で nodeOverrides が空で保存される', () => {
        render(<PlanManager />);
        fireEvent.click(screen.getByRole('button', { name: /save$/i }));
        const checkbox = screen.getByRole('checkbox', { name: 'includeNodeOverrides' });
        // チェック解除
        fireEvent.click(checkbox);
        fireEvent.click(screen.getByRole('button', { name: /saveToLocalStorage/i }));
        const calls = planExportMocks.savePlanToLocalStorage.mock.calls as unknown[] as [any[]];
        const arg = calls.length ? calls[0][0] : undefined as any;
        expect(arg && (arg as any).nodeOverrides).toEqual({});
    });

    it('Share: includeOverridesOnShare=false で nodeOverrides が空でURL生成', () => {
        render(<PlanManager />);
        // 1回目（デフォルト: include=true）
        fireEvent.click(screen.getByRole('button', { name: /shareURL$/i }));
        const checkbox = screen.getByRole('checkbox', { name: 'includeNodeOverridesInURL' });
        fireEvent.click(checkbox); // off にする
        // ダイアログを閉じてから再度Shareを押す（現在の設定で再生成）
        fireEvent.click(screen.getByRole('button', { name: /^close$/i }));
        fireEvent.click(screen.getByRole('button', { name: /shareURL$/i }));
        const calls2 = urlShareMocks.generateShareURL.mock.calls as unknown[] as [any[]];
        const last = calls2[calls2.length - 1];
        const arg2 = last ? last[0] : undefined as any;
        expect(arg2 && (arg2 as any).nodeOverrides).toEqual({});
    });

    it('Load: mergeOverridesOnLoad=true で既存とインポートをマージして setAllOverrides 呼び出し', () => {
        // recent plan の nodeOverrides に別キーを含める
        planExportMocks.loadPlanFromLocalStorage.mockReturnValueOnce({
            name: 'Plan A', timestamp: 1700000000000, recipeSID: 2001, targetQuantity: 60,
            settings: {}, alternativeRecipes: {}, nodeOverrides: { '202': { proliferator: { type: 'mk2', mode: 'speed' } } },
        });

        render(<PlanManager />);
        fireEvent.click(screen.getByRole('button', { name: /load$/i }));
        // マージチェックON
        const mergeCb = screen.getByRole('checkbox', { name: 'mergeNodeOverridesOnLoad' });
        fireEvent.click(mergeCb);
        // RecentのLoad押下
        const buttons = screen.getAllByRole('button', { name: /^load$/i });
        const recentLoad = buttons.find((b) => b.className.includes('bg-blue-600'))!;
        fireEvent.click(recentLoad);

        // マージ適用が呼ばれ、両者のキーが含まれること
        expect(setAllOverrides).toHaveBeenCalled();
        const mergedArg = (setAllOverrides as any).mock.calls[(setAllOverrides as any).mock.calls.length - 1][0] as Map<string, unknown>;
        // 既存(101 number)とインポート('202' string)の両方が含まれる（型差を許容）
        const keys = Array.from(mergedArg.keys());
        expect(keys).toEqual(expect.arrayContaining([101 as any, '202' as any]));
    });

    it('Share: generateShareURL でエラー時にアラート表示', () => {
        urlShareMocks.generateShareURL.mockImplementationOnce(() => { throw new Error('boom'); });
        render(<PlanManager />);
        fireEvent.click(screen.getByRole('button', { name: /shareURL$/i }));
        expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('urlGenerationError'));
    });

    it('Share Dialog: copyToClipboard=false でコピー失敗アラート', async () => {
        urlShareMocks.copyToClipboard.mockResolvedValueOnce(false);
        render(<PlanManager />);
        fireEvent.click(screen.getByRole('button', { name: /shareURL$/i }));
        fireEvent.click(screen.getByRole('button', { name: /copy|copied/i }));
        await waitFor(() => expect(alertSpy).toHaveBeenCalledWith('copyFailed'));
    });

    it('Import: importPlan が失敗した場合にエラーダイアログ表示', async () => {
        planExportMocks.importPlan.mockRejectedValueOnce(new Error('bad'));
        render(<PlanManager />);
        fireEvent.click(screen.getByRole('button', { name: /load$/i }));
        const file = new File([JSON.stringify({})], 'plan.json', { type: 'application/json' });
        const realInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        await fireEvent.change(realInput, { target: { files: [file] } });
        expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('loadError'));
    });

    it('Load: 保存データが見つからない場合は planNotFound をアラート', () => {
        planExportMocks.loadPlanFromLocalStorage.mockReturnValueOnce(null as any);
        render(<PlanManager />);
        fireEvent.click(screen.getByRole('button', { name: /load$/i }));
        const buttons = screen.getAllByRole('button', { name: /^load$/i });
        const recentLoad = buttons.find((b) => b.className.includes('bg-blue-600'))!;
        fireEvent.click(recentLoad);
        expect(alertSpy).toHaveBeenCalledWith('planNotFound');
    });


    it('Import: レシピが見つからない場合は recipeNotFound アラート', async () => {
        planExportMocks.importPlan.mockResolvedValueOnce({
            name: 'Imp', timestamp: Date.now(), recipeSID: 9999, nodeOverrides: {}, // 存在しないレシピID
        });
        
        render(<PlanManager />);
        fireEvent.click(screen.getByRole('button', { name: /load$/i }));
        const file = new File([JSON.stringify({})], 'plan.json', { type: 'application/json' });
        const realInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        await fireEvent.change(realInput, { target: { files: [file] } });
        expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('recipeNotFound'));
    });


    it('Load: レシピが見つからない場合は recipeNotFound アラート', () => {
        planExportMocks.loadPlanFromLocalStorage.mockReturnValueOnce({
            name: 'Plan A', timestamp: 1700000000000, recipeSID: 9999, // 存在しないレシピID
            targetQuantity: 60, settings: {}, alternativeRecipes: {}, nodeOverrides: {},
        });
        
        render(<PlanManager />);
        fireEvent.click(screen.getByRole('button', { name: /load$/i }));
        const buttons = screen.getAllByRole('button', { name: /^load$/i });
        const recentLoad = buttons.find((b) => b.className.includes('bg-blue-600'))!;
        fireEvent.click(recentLoad);
        expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('recipeNotFound'));
    });

    it('Delete: confirm がキャンセルされた場合は削除されない', () => {
        confirmSpy.mockReturnValueOnce(false);
        render(<PlanManager />);
        fireEvent.click(screen.getByRole('button', { name: /load$/i }));
        const del = screen.getByText('delete');
        fireEvent.click(del);
        expect(confirmSpy).toHaveBeenCalled();
        expect(planExportMocks.deletePlanFromLocalStorage).not.toHaveBeenCalled();
    });

    it('Save: プラン名が空の場合はデフォルト名が使用される', () => {
        render(<PlanManager />);
        fireEvent.click(screen.getByRole('button', { name: /save$/i }));
        // プラン名を入力せずに保存
        fireEvent.click(screen.getByRole('button', { name: /saveToLocalStorage/i }));
        expect(planExportMocks.savePlanToLocalStorage).toHaveBeenCalled();
        const calls = planExportMocks.savePlanToLocalStorage.mock.calls as unknown[] as [any[]];
        const arg = calls.length ? calls[0][0] : undefined as any;
        expect(arg && (arg as any).name).toMatch(/^Plan_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}$/);
    });

    it('Share: プラン名が空の場合はデフォルト名が使用される', () => {
        render(<PlanManager />);
        fireEvent.click(screen.getByRole('button', { name: /shareURL$/i }));
        expect(urlShareMocks.generateShareURL).toHaveBeenCalled();
        const calls = urlShareMocks.generateShareURL.mock.calls as unknown[] as [any[]];
        const arg = calls.length ? calls[0][0] : undefined as any;
        expect(arg && (arg as any).name).toMatch(/^Plan_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}$/);
    });

    it('Load: recent plans が空の場合は noPlans メッセージが表示される', () => {
        planExportMocks.getRecentPlans.mockReturnValueOnce([]);
        render(<PlanManager />);
        fireEvent.click(screen.getByRole('button', { name: /load$/i }));
        expect(screen.getByText('noPlans')).toBeInTheDocument();
    });

});


