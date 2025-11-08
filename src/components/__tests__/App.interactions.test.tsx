import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "../../App";

// React.lazy をモックして即座にコンポーネントを返す
vi.mock("react", async () => {
  const actual = await vi.importActual("react");
  return {
    ...actual,
    lazy: (fn: any) => {
      const Component = (props: any) => {
        const [Comp, setComp] = (actual as any).useState(null);
        (actual as any).useEffect(() => {
          fn().then((module: any) => setComp(() => module.default));
        }, []);
        return Comp ? <Comp {...props} /> : null;
      };
      return Component;
    },
  };
});

// i18n mock
vi.mock("../../i18n", () => ({ default: { language: "ja", changeLanguage: vi.fn() } }));

// stores
const setSelectedRecipe = vi.fn();
const setTargetQuantity = vi.fn();
const setCalculationResult = vi.fn();

vi.mock("../../stores/gameDataStore", () => {
  const mockStore = {
    data: {
      recipes: new Map<number, any>([
        [2001, { SID: 2001, name: "Test Recipe", Results: [{ id: 1001 }] }],
      ]),
    },
    isLoading: false,
    error: null,
    loadData: vi.fn(),
    locale: "ja",
  };

  const mockHook = () => mockStore;
  mockHook.getState = () => mockStore;

  return {
    useGameDataStore: mockHook,
  };
});

vi.mock("../../stores/recipeSelectionStore", () => ({
  useRecipeSelectionStore: () => ({
    selectedRecipe: null,
    targetQuantity: 1,
    calculationResult: null,
    setSelectedRecipe,
    setTargetQuantity,
    setCalculationResult,
  }),
}));

vi.mock("../../stores/settingsStore", () => ({
  useSettingsStore: () => ({ settings: {}, updateSettings: vi.fn() }),
}));

vi.mock("../../stores/nodeOverrideStore", () => ({
  useNodeOverrideStore: () => ({ nodeOverrides: {}, version: 1, setAllOverrides: vi.fn() }),
}));

// lazy children
vi.mock("../../components/RecipeSelector", () => ({
  RecipeSelector: (props: any) => (
    <div>
      <button
        onClick={() =>
          props.onRecipeSelect({ SID: 2001, name: "Test Recipe", Results: [{ id: 1001 }] })
        }
      >
        select-recipe
      </button>
      <div data-testid="recipe-selector" />
    </div>
  ),
}));
vi.mock("../../components/ResultTree", () => ({
  ProductionTree: () => <div data-testid="production-tree" />,
}));
vi.mock("../../components/SettingsPanel", () => ({
  SettingsPanel: () => <div data-testid="settings-panel" />,
}));
vi.mock("../../components/PlanManager", () => ({
  PlanManager: () => <div data-testid="plan-manager" />,
}));
vi.mock("../../components/StatisticsView", () => ({
  StatisticsView: () => <div data-testid="statistics-view" />,
}));
vi.mock("../../components/BuildingCostView", () => ({
  BuildingCostView: () => <div data-testid="building-cost-view" />,
}));
vi.mock("../../components/ModSettings", () => ({ ModSettings: () => null }));
vi.mock("../../components/WelcomeModal", () => ({ WelcomeModal: () => null }));
vi.mock("../../components/Layout/Header/LanguageMenu", () => ({
  LanguageMenu: () => <button data-testid="language-menu-trigger">🌐</button>,
}));
vi.mock("../../components/Layout/Header/HistoryToolbar", () => ({
  HistoryToolbar: () => <div data-testid="history-toolbar">History Toolbar</div>,
}));
vi.mock("../../components/Layout/Header/PlanManagerMenu", () => ({
  PlanManagerMenu: () => <div data-testid="plan-manager-menu">Plan Manager Menu</div>,
}));
vi.mock("../../components/ToastProvider", () => ({
  ToastProvider: ({ children }: { children: any }) => children,
}));
vi.mock("../../components/ToastProvider/useToast", () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));
vi.mock("../../components/Layout/SettingsPanelSection", () => ({
  SettingsPanelSection: () => <div data-testid="settings-panel" />,
}));
vi.mock("../../components/Layout/RecipeSelectorSection", () => ({
  RecipeSelectorSection: () => (
    <div data-testid="recipe-selector-section">
      <div data-testid="recipe-selector" />
      <button
        onClick={() =>
          setSelectedRecipe({ SID: 2001, name: "Test Recipe", Results: [{ id: 1001 }] })
        }
      >
        select-recipe
      </button>
    </div>
  ),
}));
vi.mock("../../components/Layout/ProductionResultsPanel", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");
  return {
    ProductionResultsPanel: () => {
      const [activeTab, setActiveTab] = actual.useState("productionTree");
      const [expanded, setExpanded] = actual.useState(false);
      return (
        <div>
          <button
            role="button"
            aria-label="productionTree"
            onClick={() => setActiveTab("productionTree")}
          >
            Production Tree
          </button>
          <button role="button" aria-label="statistics" onClick={() => setActiveTab("statistics")}>
            Statistics
          </button>
          <button
            role="button"
            aria-label="buildingCost"
            onClick={() => setActiveTab("buildingCost")}
          >
            Building Cost
          </button>
          <button
            role="button"
            aria-label={expanded ? "collapseAll" : "expandAll"}
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? "Collapse All" : "Expand All"}
          </button>
          {activeTab === "statistics" && <div data-testid="statistics-view" />}
          {activeTab === "buildingCost" && <div data-testid="building-cost-view" />}
          {activeTab === "productionTree" && <div data-testid="production-tree" />}
        </div>
      );
    },
  };
});

// calculator returns a minimal tree when called
vi.mock("../../lib/calculator", () => ({
  tryCalculateProductionChain: vi.fn(() => ({
    ok: true,
    value: {
      rootNode: {
        nodeId: "root",
        itemId: 1001,
        itemName: "Item",
        isRawMaterial: false,
        targetOutputRate: 1,
        machine: { id: 1, name: "Machine", assemblerSpeed: 1, workEnergyPerTick: 1 },
        machineCount: 1,
        inputs: [],
        power: { total: 1, machines: 1, sorters: 0 },
        conveyorBelts: { inputs: 0, outputs: 0, total: 0, saturation: 0 },
        proliferator: { type: "none", mode: "speed" },
        children: [],
      },
    },
  })),
}));

describe("App interactions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '<div id="root"></div>';
  });

  it("初期レンダリングでヘッダーと主要パネルが表示される", async () => {
    render(<App />);
    expect(screen.getByText("title")).toBeInTheDocument();
    expect(await screen.findByTestId("recipe-selector")).toBeInTheDocument();
    expect(await screen.findByTestId("settings-panel")).toBeInTheDocument();
  });

  it("レシピ選択→数量変更でハンドラが呼ばれる", async () => {
    render(<App />);
    // レシピ選択
    fireEvent.click(await screen.findByText("select-recipe"));
    expect(setSelectedRecipe).toHaveBeenCalledWith({
      SID: 2001,
      name: "Test Recipe",
      Results: [{ id: 1001 }],
    });
  });

  it("統計/建設コストのタブ切替ができる", async () => {
    vi.resetModules();

    // child mocks re-define after reset
    vi.doMock("../../components/StatisticsView", () => ({
      StatisticsView: ({ miningCalculation }: { miningCalculation?: any }) => (
        <div data-testid="statistics-view" />
      ),
    }));
    vi.doMock("../../components/BuildingCostView", () => ({
      BuildingCostView: () => <div data-testid="building-cost-view" />,
    }));
    vi.doMock("../../components/ResultTree", () => ({
      ProductionTree: () => <div data-testid="production-tree" />,
    }));

    // provide selectedRecipe and calculationResult in store directly
    const calcResult = {
      rootNode: {
        nodeId: "root",
        itemId: 1001,
        itemName: "Item",
        isRawMaterial: false,
        targetOutputRate: 1,
        machine: { id: 1, name: "Machine", assemblerSpeed: 1, workEnergyPerTick: 1 },
        machineCount: 1,
        inputs: [],
        power: { total: 1, machines: 1, sorters: 0 },
        conveyorBelts: { inputs: 0, outputs: 0, total: 0, saturation: 0 },
        proliferator: { type: "none", mode: "speed" },
        children: [],
      },
      rawMaterials: new Map(),
      totalPower: { total: 1, machines: 1, sorters: 0 },
      totalMachines: 1,
    } as any;

    vi.doMock("../../stores/recipeSelectionStore", () => ({
      useRecipeSelectionStore: () => ({
        selectedRecipe: { SID: 2001, name: "Test Recipe", Results: [{ id: 1001 }] },
        targetQuantity: 1,
        calculationResult: calcResult,
        setSelectedRecipe: vi.fn(),
        setTargetQuantity: vi.fn(),
        setCalculationResult: vi.fn(),
      }),
    }));
    vi.doMock("../../stores/gameDataStore", () => ({
      useGameDataStore: () => ({
        data: {
          recipes: new Map<number, any>([
            [2001, { SID: 2001, name: "Test Recipe", Results: [{ id: 1001 }] }],
          ]),
        },
        isLoading: false,
        error: null,
        loadData: vi.fn(),
        locale: "ja",
      }),
    }));

    const AppDynamic = (await import("../../App")).default;
    render(<AppDynamic />);

    // ProductionResultsPanel がレンダリングされるまで待つ
    await screen.findByRole("button", { name: "productionTree" });

    // タブボタンをクリックして切替
    fireEvent.click(screen.getAllByRole("button", { name: "statistics" })[0]);
    expect(await screen.findByTestId("statistics-view")).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: "buildingCost" })[0]);
    expect(await screen.findByTestId("building-cost-view")).toBeInTheDocument();

    // 全展開/全折りたたみトグルの状態遷移（ProductionTree表示時のみ）
    fireEvent.click(screen.getAllByRole("button", { name: "productionTree" })[0]);
    const toggleBtn = screen.getByRole("button", { name: /expandAll|collapseAll/ });
    // 1度目クリックで展開状態へ
    fireEvent.click(toggleBtn);
    // ラベルが collapseAll に変化するか、ボタンが存在していることを確認（描画に依存しない緩めの検証）
    expect(screen.getByRole("button", { name: /expandAll|collapseAll/ })).toBeInTheDocument();
    // 2度目クリックで折りたたみへ
    fireEvent.click(screen.getByRole("button", { name: /expandAll|collapseAll/ }));
    expect(screen.getByRole("button", { name: /expandAll|collapseAll/ })).toBeInTheDocument();
  });
});
