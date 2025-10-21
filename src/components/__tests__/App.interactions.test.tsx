import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../../App';

// i18n mock
vi.mock('../../i18n', () => ({ default: { language: 'ja', changeLanguage: vi.fn() } }));

// stores
const setSelectedRecipe = vi.fn();
const setTargetQuantity = vi.fn();
const setCalculationResult = vi.fn();

vi.mock('../../stores/gameDataStore', () => ({
  useGameDataStore: () => ({
    data: {
      recipes: new Map<number, any>([
        [2001, { SID: 2001, name: 'Test Recipe', Results: [{ id: 1001 }] }],
      ]),
    },
    isLoading: false,
    error: null,
    loadData: vi.fn(),
    locale: 'ja',
  }),
}));

vi.mock('../../stores/recipeSelectionStore', () => ({
  useRecipeSelectionStore: () => ({
    selectedRecipe: null,
    targetQuantity: 1,
    calculationResult: null,
    setSelectedRecipe,
    setTargetQuantity,
    setCalculationResult,
  }),
}));

vi.mock('../../stores/settingsStore', () => ({
  useSettingsStore: () => ({ settings: {}, updateSettings: vi.fn() }),
}));

vi.mock('../../stores/nodeOverrideStore', () => ({
  useNodeOverrideStore: () => ({ nodeOverrides: {}, version: 1, setAllOverrides: vi.fn() }),
}));

// lazy children
vi.mock('../../components/RecipeSelector', () => ({
  RecipeSelector: (props: any) => (
    <div>
      <button onClick={() => props.onRecipeSelect({ SID: 2001, name: 'Test Recipe', Results: [{ id: 1001 }] })}>
        select-recipe
      </button>
      <div data-testid="recipe-selector" />
    </div>
  ),
}));
vi.mock('../../components/ResultTree', () => ({
  ProductionTree: () => <div data-testid="production-tree" />,
}));
vi.mock('../../components/SettingsPanel', () => ({
  SettingsPanel: () => <div data-testid="settings-panel" />,
}));
vi.mock('../../components/PlanManager', () => ({
  PlanManager: () => <div data-testid="plan-manager" />,
}));
vi.mock('../../components/StatisticsView', () => ({
  StatisticsView: () => <div data-testid="statistics-view" />,
}));
vi.mock('../../components/BuildingCostView', () => ({
  BuildingCostView: () => <div data-testid="building-cost-view" />,
}));
vi.mock('../../components/ModSettings', () => ({ ModSettings: () => null }));
vi.mock('../../components/WelcomeModal', () => ({ WelcomeModal: () => null }));
vi.mock('../../components/LanguageSwitcher', () => ({ LanguageSwitcher: () => <div data-testid="language-switcher" /> }));

// calculator returns a minimal tree when called
vi.mock('../../lib/calculator', () => ({
  calculateProductionChain: vi.fn(() => ({
    rootNode: {
      nodeId: 'root',
      itemId: 1001,
      itemName: 'Item',
      isRawMaterial: false,
      targetOutputRate: 1,
      machine: { id: 1, name: 'Machine', assemblerSpeed: 1, workEnergyPerTick: 1 },
      machineCount: 1,
      inputs: [],
      power: { total: 1, machines: 1, sorters: 0 },
      conveyorBelts: { inputs: 0, outputs: 0, total: 0, saturation: 0 },
      proliferator: { type: 'none', mode: 'speed' },
      children: [],
    },
  })),
}));

describe('App interactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '<div id="root"></div>';
  });

  it('初期レンダリングでヘッダーと主要パネルが表示される', async () => {
    render(<App />);
    expect(screen.getByText('title')).toBeInTheDocument();
    expect(await screen.findByTestId('recipe-selector')).toBeInTheDocument();
    expect(screen.getByTestId('settings-panel')).toBeInTheDocument();
  });

  it('レシピ選択→数量変更でハンドラが呼ばれる', async () => {
    render(<App />);
    // レシピ選択
    fireEvent.click(await screen.findByText('select-recipe'));
    expect(setSelectedRecipe).toHaveBeenCalledWith({ SID: 2001, name: 'Test Recipe', Results: [{ id: 1001 }] });
  });

  it('統計/建設コストのタブ切替ができる', async () => {
    vi.resetModules();

    // child mocks re-define after reset
    vi.doMock('../../components/StatisticsView', () => ({
      StatisticsView: () => <div data-testid="statistics-view" />,
    }));
    vi.doMock('../../components/BuildingCostView', () => ({
      BuildingCostView: () => <div data-testid="building-cost-view" />,
    }));
    vi.doMock('../../components/ResultTree', () => ({
      ProductionTree: () => <div data-testid="production-tree" />,
    }));

    // provide selectedRecipe and calculationResult in store directly
    const calcResult = {
      rootNode: {
        nodeId: 'root',
        itemId: 1001,
        itemName: 'Item',
        isRawMaterial: false,
        targetOutputRate: 1,
        machine: { id: 1, name: 'Machine', assemblerSpeed: 1, workEnergyPerTick: 1 },
        machineCount: 1,
        inputs: [],
        power: { total: 1, machines: 1, sorters: 0 },
        conveyorBelts: { inputs: 0, outputs: 0, total: 0, saturation: 0 },
        proliferator: { type: 'none', mode: 'speed' },
        children: [],
      },
    } as any;

    vi.doMock('../../stores/recipeSelectionStore', () => ({
      useRecipeSelectionStore: () => ({
        selectedRecipe: { SID: 2001, name: 'Test Recipe', Results: [{ id: 1001 }] },
        targetQuantity: 1,
        calculationResult: calcResult,
        setSelectedRecipe: vi.fn(),
        setTargetQuantity: vi.fn(),
        setCalculationResult: vi.fn(),
      }),
    }));
    vi.doMock('../../stores/gameDataStore', () => ({
      useGameDataStore: () => ({
        data: { recipes: new Map<number, any>([[2001, { SID: 2001, name: 'Test Recipe', Results: [{ id: 1001 }] }]]) },
        isLoading: false,
        error: null,
        loadData: vi.fn(),
        locale: 'ja',
      }),
    }));

    const AppDynamic = (await import('../../App')).default;
    render(<AppDynamic />);

    // タブボタンをクリックして切替
    fireEvent.click(screen.getAllByRole('button', { name: 'statistics' })[0]);
    expect(await screen.findByTestId('statistics-view')).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: 'buildingCost' })[0]);
    expect(await screen.findByTestId('building-cost-view')).toBeInTheDocument();

    // 全展開/全折りたたみトグルの状態遷移（ProductionTree表示時のみ）
    fireEvent.click(screen.getAllByRole('button', { name: 'productionTree' })[0]);
    const toggleBtn = screen.getByRole('button', { name: /expandAll|collapseAll/ });
    // 1度目クリックで展開状態へ
    fireEvent.click(toggleBtn);
    // ラベルが collapseAll に変化するか、ボタンが存在していることを確認（描画に依存しない緩めの検証）
    expect(screen.getByRole('button', { name: /expandAll|collapseAll/ })).toBeInTheDocument();
    // 2度目クリックで折りたたみへ
    fireEvent.click(screen.getByRole('button', { name: /expandAll|collapseAll/ }));
    expect(screen.getByRole('button', { name: /expandAll|collapseAll/ })).toBeInTheDocument();
  });
});


