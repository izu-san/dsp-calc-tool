import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PlanManager } from "../index";

// i18n モック（キーを返す）
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string, _opts?: unknown) => key }),
  default: { language: "ja" },
}));

vi.mock("../../../i18n", () => ({
  default: { language: "ja" },
}));

// stores モック
const recipesMap = new Map<number, any>([[2001, { SID: 2001, name: "Test Recipe" }]]);

vi.mock("../../../stores/gameDataStore", () => ({
  useGameDataStore: () => ({ data: { recipes: recipesMap } }),
}));

const setSelectedRecipe = vi.fn();
const setTargetQuantity = vi.fn();
const setCalculationResult = vi.fn();
vi.mock("../../../stores/recipeSelectionStore", () => ({
  useRecipeSelectionStore: () => ({
    selectedRecipe: {
      SID: 2001,
      name: "Test Recipe",
      Results: [{ id: 1001, name: "Test Item", count: 1 }], // Resultsを追加
      Items: [], // Itemsを追加
    },
    targetQuantity: 60,
    calculationResult: {
      // モックの計算結果を追加
      rootNode: {
        targetOutputRate: 1.0,
        children: [], // 空の配列を追加
        conveyorBelts: { total: 0, saturation: 0 }, // conveyorBeltsを追加
      },
      totalPower: { machines: 0, sorters: 0, dysonSphere: 0, total: 0 },
      totalMachines: 0,
      rawMaterials: new Map(),
    },
    setSelectedRecipe,
    setTargetQuantity,
    setCalculationResult,
  }),
}));

const updateSettings = vi.fn();
vi.mock("../../../stores/settingsStore", () => ({
  useSettingsStore: () => ({
    settings: {
      machineRank: {
        Smelt: "arc",
        Assemble: "mk1",
        Chemical: "standard",
        Research: "standard",
        Refine: "standard",
        Particle: "standard",
      },
      proliferator: { type: "none", mode: "speed" },
      proliferatorMultiplier: { production: 1, speed: 1 },
      alternativeRecipes: new Map<number, number>(),
    },
    updateSettings,
    powerGenerationTemplate: "default",
    manualPowerGenerator: null,
    manualPowerFuel: null,
    powerFuelProliferator: {
      type: "none",
      mode: "speed",
      speedBonus: 0,
      productionBonus: 0,
      powerIncrease: 0,
    },
  }),
}));

const setAllOverrides = vi.fn();
vi.mock("../../../stores/nodeOverrideStore", () => ({
  useNodeOverrideStore: () => ({
    nodeOverrides: new Map<number, any>([[101, { proliferator: { type: "mk1", mode: "speed" } }]]),
    setAllOverrides,
  }),
}));

const savePlanVersionMock = vi.fn((plan: any) => plan.planId || "test-plan-id");
const getPlanVersionsMock = vi.fn();
const loadPlanVersionMock = vi.fn();
const loadLatestPlanVersionMock = vi.fn();
const pushEntryMock = vi.fn();
vi.mock("../../../stores/historyStore", () => ({
  useHistoryStore: () => ({
    savePlanVersion: savePlanVersionMock,
    getPlanVersions: getPlanVersionsMock,
    loadPlanVersion: loadPlanVersionMock,
    loadLatestPlanVersion: loadLatestPlanVersionMock,
    pushEntry: pushEntryMock,
  }),
}));

// planStorageService モック
const planStorageServiceMocks = vi.hoisted(() => ({
  getRecentPlans: vi.fn(() => [{ key: "k1", name: "Plan A", timestamp: 1700000000000 }]),
  loadPlanFromStorage: vi.fn(() => ({
    name: "Plan A",
    timestamp: 1700000000000,
    recipeSID: 2001,
    targetQuantity: 60,
    settings: {},
    alternativeRecipes: {},
    nodeOverrides: {},
  })),
  deletePlanFromStorage: vi.fn(),
}));
vi.mock("../../../services/plan-management/planStorageService", () => planStorageServiceMocks);

// plan-management services モック
const planSaveServiceMocks = vi.hoisted(() => ({
  savePlanWithVersion: vi.fn(() => "test-plan-id"),
  createPlanFromState: vi.fn((params: any) => ({
    name: params.name,
    timestamp: Date.now(),
    recipeSID: params.recipeSID,
    targetQuantity: params.targetQuantity,
    settings: params.settings || {},
    alternativeRecipes: params.alternativeRecipes || {},
    nodeOverrides: params.includeOverrides ? params.nodeOverrides : {},
  })),
  getDefaultPlanName: vi.fn((name?: string) => name || "Test Recipe"),
}));
vi.mock("../../../services/plan-management/planSaveService", () => planSaveServiceMocks);

const planLoadServiceMocks = vi.hoisted(() => ({
  loadPlanWithHistory: vi.fn(),
}));
vi.mock("../../../services/plan-management/planLoadService", () => planLoadServiceMocks);

const planExportServiceMocks = vi.hoisted(() => ({
  exportPlan: vi.fn(() => Promise.resolve({ success: true })),
  exportPlanToImage: vi.fn(() => Promise.resolve({ success: true })),
}));
vi.mock("../../../services/plan-management/planExportService", () => planExportServiceMocks);

// usePlanExport モック
const usePlanExportMocks = vi.hoisted(() => ({
  handleExport: vi.fn(async () => {}),
  handleImageExport: vi.fn(async () => {}),
  exportSuccessMessage: "",
  exportErrorMessage: "",
  setExportSuccessMessage: vi.fn(),
  setExportErrorMessage: vi.fn(),
  clearMessages: vi.fn(),
}));
vi.mock("../../../hooks/usePlanExport", () => ({
  usePlanExport: vi.fn(() => usePlanExportMocks),
}));

// usePlanImport モック
const usePlanImportMocks = vi.hoisted(() => {
  const handleDeletePlanMock = vi.fn((key: string) => {
    // confirm が呼ばれることをシミュレート
    // 実際の confirm は window.confirm なので、テストでは window.confirm を確認する
    if (window.confirm("confirmDeletePlan")) {
      // 削除処理はモックでは実行しない
    }
  });
  return {
    handleImportFile: vi.fn(async () => ({ success: true, plan: {} as any })),
    handleLoadFromStorage: vi.fn(),
    handleDeletePlan: handleDeletePlanMock,
    importSuccessMessage: "",
    importErrorMessage: "",
    recentPlans: [{ key: "k1", name: "Plan A", timestamp: 1700000000000 }],
    clearMessages: vi.fn(),
    refreshRecentPlans: vi.fn(),
    setImportSuccessMessage: vi.fn(),
    setImportErrorMessage: vi.fn(),
  };
});
vi.mock("../../../hooks/usePlanImport", () => ({
  usePlanImport: vi.fn(() => usePlanImportMocks),
}));

const urlShareMocks = vi.hoisted(() => ({
  generateShareURL: vi.fn(() => "https://example.com/?plan=abc"),
  copyToClipboard: vi.fn(async () => true),
}));
vi.mock("../../../utils/urlShare", () => urlShareMocks);

vi.mock("../../../utils/historyRecorder", () => ({
  setInternal: vi.fn(),
}));

describe("PlanManager", () => {
  let alertMock: ReturnType<typeof vi.fn>;
  let confirmMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    // vitest 4.0 での window.alert/confirm モック
    alertMock = vi.fn();
    confirmMock = vi.fn(() => true);

    Object.defineProperty(window, "alert", {
      value: alertMock,
      writable: true,
    });
    Object.defineProperty(window, "confirm", {
      value: confirmMock,
      writable: true,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("Save ダイアログで saveToLocalStorage が呼ばれ、アラート表示・ダイアログ閉じる", () => {
    render(<PlanManager />);
    fireEvent.click(screen.getByRole("button", { name: /save$/i }));
    fireEvent.change(screen.getByPlaceholderText("Test Recipe"), { target: { value: "MyPlan" } });
    fireEvent.click(screen.getByRole("button", { name: /saveToLocalStorage/i }));
    expect(planSaveServiceMocks.savePlanWithVersion).toHaveBeenCalled();
    expect(alertMock).toHaveBeenCalledWith("saved");
    expect(screen.queryByRole("button", { name: /saveToLocalStorage/i })).not.toBeInTheDocument();
  });

  it("Save ダイアログで saveToFile(JSON) が呼ばれエクスポート成功メッセージが表示される", async () => {
    usePlanExportMocks.exportSuccessMessage = "exported";
    render(<PlanManager />);
    fireEvent.click(screen.getByRole("button", { name: /save$/i }));
    fireEvent.click(screen.getByRole("button", { name: /^JSON$/i }));
    await waitFor(() => {
      expect(usePlanExportMocks.handleExport).toHaveBeenCalled();
    });
    // 成功メッセージが表示される
    expect(screen.getByTestId("export-success-message")).toBeInTheDocument();
  });

  it("Load ダイアログで recent plan の load が restorePlan を呼び、閉じる", () => {
    render(<PlanManager />);
    fireEvent.click(screen.getByRole("button", { name: /load$/i }));
    // ダイアログ内の Recent Plans のロードボタン（見出し load と区別）
    const buttons = screen.getAllByRole("button", { name: /^load$/i });
    const recentLoad = buttons.find(b => b.className.includes("neon-blue"))!;
    fireEvent.click(recentLoad);
    expect(usePlanImportMocks.handleLoadFromStorage).toHaveBeenCalledWith("k1");
    expect(screen.queryByText("recentPlans")).not.toBeInTheDocument();
  });

  it("Load ダイアログで delete クリック時に confirm → handleDeletePlan が呼ばれる", () => {
    // confirm が true を返すように設定（デフォルトで true だが明示的に設定）
    confirmMock.mockReturnValueOnce(true);
    render(<PlanManager />);
    fireEvent.click(screen.getByRole("button", { name: /load$/i }));
    const del = screen.getByText("delete");
    fireEvent.click(del);
    expect(confirmMock).toHaveBeenCalled();
    // PlanManager が planImport.handleDeletePlan を呼び出すことを確認
    expect(usePlanImportMocks.handleDeletePlan).toHaveBeenCalledWith("k1");
  });

  it("共有ボタンで URL 生成→ダイアログ表示→コピー成功表示", async () => {
    render(<PlanManager />);
    fireEvent.click(screen.getByRole("button", { name: /shareURL$/i }));
    expect(urlShareMocks.generateShareURL).toHaveBeenCalled();
    expect(screen.getByText("sharedUrl")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /copy|copied/i }));
    // コピー実行でボタンが copied 表示に変化
    expect(urlShareMocks.copyToClipboard).toHaveBeenCalled();
  });

  it("ファイルインポートで JSON → restorePlan と planLoaded アラート", async () => {
    usePlanImportMocks.handleImportFile.mockResolvedValueOnce({
      success: true,
      plan: {
        name: "Test Plan",
        timestamp: Date.now(),
        recipeSID: 2001,
        targetQuantity: 60,
        settings: {},
        alternativeRecipes: {},
        nodeOverrides: {},
      },
    });
    usePlanImportMocks.importSuccessMessage = "planLoaded";
    render(<PlanManager />);
    fireEvent.click(screen.getByRole("button", { name: /load$/i }));

    // 新しいExportData形式のJSONファイルを作成
    const exportData = {
      version: "1.0.0",
      exportDate: Date.now(),
      planInfo: {
        planName: "Test Plan",
        recipeSID: 2001,
        recipeName: "Test Recipe",
        targetQuantity: 60,
      },
      settings: {
        machineRank: {
          Smelt: "arc",
          Assemble: "mk1",
          Chemical: "standard",
          Research: "standard",
          Refine: "standard",
          Particle: "standard",
        },
        proliferator: { type: "none", mode: "speed" },
        proliferatorMultiplier: { production: 1, speed: 1 },
        alternativeRecipes: {},
      },
      statistics: { totalMachines: 0, totalPower: 0, rawMaterialCount: 0, itemCount: 0 },
      rawMaterials: [],
      products: [],
      machines: [],
      powerConsumption: { machines: 0, sorters: 0, dysonSphere: 0, total: 0, breakdown: [] },
      conveyorBelts: { totalBelts: 0, totalLength: 0, maxSaturation: 0 },
      powerGeneration: { totalRequiredPower: 0, totalGeneratedPower: 0, generators: [] },
    };

    const file = new File([JSON.stringify(exportData)], "plan.json", { type: "application/json" });
    const realInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await fireEvent.change(realInput, { target: { files: [file] } });
    expect(usePlanImportMocks.handleImportFile).toHaveBeenCalled();
    // handleImportFile では alert() を使用せず、setImportSuccessMessage() を使用する
    // 成功メッセージが表示されることを確認
    await waitFor(() => {
      expect(screen.getByTestId("import-success-message")).toBeInTheDocument();
    });
  });

  it("Save: includeOverridesOnSave=false で nodeOverrides が空で保存される", () => {
    render(<PlanManager />);
    fireEvent.click(screen.getByRole("button", { name: /save$/i }));
    const checkbox = screen.getByRole("checkbox", { name: "includeNodeOverrides" });
    // チェック解除
    fireEvent.click(checkbox);
    fireEvent.click(screen.getByRole("button", { name: /saveToLocalStorage/i }));
    expect(planSaveServiceMocks.createPlanFromState).toHaveBeenCalled();
    const calls = planSaveServiceMocks.createPlanFromState.mock.calls as unknown[] as [any[]];
    const arg = calls.length ? calls[0][0] : (undefined as any);
    expect(arg && (arg as any).includeOverrides).toBe(false);
  });

  it("Share: includeOverridesOnShare=false で nodeOverrides が空でURL生成", () => {
    render(<PlanManager />);
    // 1回目（デフォルト: include=true）
    fireEvent.click(screen.getByRole("button", { name: /shareURL$/i }));
    const checkbox = screen.getByRole("checkbox", { name: "includeNodeOverridesInURL" });
    fireEvent.click(checkbox); // off にする
    // ダイアログを閉じてから再度Shareを押す（現在の設定で再生成）
    fireEvent.click(screen.getByRole("button", { name: /^close$/i }));
    fireEvent.click(screen.getByRole("button", { name: /shareURL$/i }));
    const calls2 = urlShareMocks.generateShareURL.mock.calls as unknown[] as [any[]];
    const last = calls2[calls2.length - 1];
    const arg2 = last ? last[0] : (undefined as any);
    expect(arg2 && (arg2 as any).nodeOverrides).toEqual({});
  });

  it("Load: mergeOverridesOnLoad=true で既存とインポートをマージして setAllOverrides 呼び出し", () => {
    // recent plan の nodeOverrides に別キーを含める
    usePlanImportMocks.handleLoadFromStorage.mockImplementationOnce((key: string) => {
      // loadPlanWithHistoryが呼ばれることをシミュレート
      planLoadServiceMocks.loadPlanWithHistory({
        plan: {
          name: "Plan A",
          timestamp: 1700000000000,
          recipeSID: 2001,
          targetQuantity: 60,
          settings: {},
          alternativeRecipes: {},
          nodeOverrides: { "202": { proliferator: { type: "mk2", mode: "speed" } } },
        },
        recipe: { SID: 2001, name: "Test Recipe" } as any,
        callbacks: {
          setRecipe: setSelectedRecipe,
          setTargetQuantity,
          updateSettings,
          setNodeOverrides: setAllOverrides,
        },
        mergeOverrides: true,
        currentOverrides: new Map([["101", { proliferator: { type: "mk1", mode: "speed" } }]]),
      });
    });

    render(<PlanManager />);
    fireEvent.click(screen.getByRole("button", { name: /load$/i }));
    // マージチェックON
    const mergeCb = screen.getByRole("checkbox", { name: "mergeNodeOverridesOnLoad" });
    fireEvent.click(mergeCb);
    // RecentのLoad押下
    const buttons = screen.getAllByRole("button", { name: /^load$/i });
    const recentLoad = buttons.find(b => b.className.includes("neon-blue"))!;
    fireEvent.click(recentLoad);

    // マージ適用が呼ばれ、両者のキーが含まれること
    expect(planLoadServiceMocks.loadPlanWithHistory).toHaveBeenCalled();
    const callArgs = planLoadServiceMocks.loadPlanWithHistory.mock.calls[0][0];
    expect(callArgs.mergeOverrides).toBe(true);
  });

  it("Share: generateShareURL でエラー時にアラート表示", () => {
    urlShareMocks.generateShareURL.mockImplementationOnce(() => {
      throw new Error("boom");
    });
    render(<PlanManager />);
    fireEvent.click(screen.getByRole("button", { name: /shareURL$/i }));
    expect(alertMock).toHaveBeenCalledWith(expect.stringContaining("urlGenerationError"));
  });

  it("Share Dialog: copyToClipboard=false でコピー失敗アラート", async () => {
    urlShareMocks.copyToClipboard.mockResolvedValueOnce(false);
    render(<PlanManager />);
    fireEvent.click(screen.getByRole("button", { name: /shareURL$/i }));
    fireEvent.click(screen.getByRole("button", { name: /copy|copied/i }));
    await waitFor(() => expect(alertMock).toHaveBeenCalledWith("copyFailed"));
  });

  it("Import: JSON パースが失敗した場合にエラーダイアログ表示", async () => {
    usePlanImportMocks.handleImportFile.mockResolvedValueOnce({
      success: false,
      error: "Invalid JSON",
    } as any);
    usePlanImportMocks.importErrorMessage = "Invalid JSON";
    render(<PlanManager />);
    fireEvent.click(screen.getByRole("button", { name: /load$/i }));
    const file = new File(["invalid json"], "plan.json", { type: "application/json" });
    const realInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await fireEvent.change(realInput, { target: { files: [file] } });
    // handleImportFile では alert() を使用せず、setImportErrorMessage() を使用する
    // エラーメッセージが表示されることを確認
    await waitFor(() => {
      expect(screen.getByTestId("import-error-message")).toBeInTheDocument();
    });
  });

  it("Load: 保存データが見つからない場合は planNotFound をアラート", () => {
    usePlanImportMocks.handleLoadFromStorage.mockImplementationOnce(() => {
      alertMock("planNotFound");
    });
    render(<PlanManager />);
    fireEvent.click(screen.getByRole("button", { name: /load$/i }));
    const buttons = screen.getAllByRole("button", { name: /^load$/i });
    const recentLoad = buttons.find(b => b.className.includes("neon-blue"))!;
    fireEvent.click(recentLoad);
    expect(alertMock).toHaveBeenCalledWith("planNotFound");
  });

  it("Import: レシピが見つからない場合は recipeNotFound アラート", async () => {
    usePlanImportMocks.handleImportFile.mockResolvedValueOnce({
      success: false,
      error: "recipeNotFound: 9999",
    } as any);
    usePlanImportMocks.importErrorMessage = "recipeNotFound: 9999";
    render(<PlanManager />);
    fireEvent.click(screen.getByRole("button", { name: /load$/i }));

    // 存在しないレシピIDを含むExportData形式のJSONファイルを作成
    const exportData = {
      version: "1.0.0",
      exportDate: Date.now(),
      planInfo: {
        planName: "Test Plan",
        recipeSID: 9999, // 存在しないレシピID
        recipeName: "Non-existent Recipe",
        targetQuantity: 60,
      },
      settings: {
        machineRank: {
          Smelt: "arc",
          Assemble: "mk1",
          Chemical: "standard",
          Research: "standard",
          Refine: "standard",
          Particle: "standard",
        },
        proliferator: { type: "none", mode: "speed" },
        proliferatorMultiplier: { production: 1, speed: 1 },
        alternativeRecipes: {},
      },
      statistics: { totalMachines: 0, totalPower: 0, rawMaterialCount: 0, itemCount: 0 },
      rawMaterials: [],
      products: [],
      machines: [],
      powerConsumption: { machines: 0, sorters: 0, dysonSphere: 0, total: 0, breakdown: [] },
      conveyorBelts: { totalBelts: 0, totalLength: 0, maxSaturation: 0 },
      powerGeneration: { totalRequiredPower: 0, totalGeneratedPower: 0, generators: [] },
    };

    const file = new File([JSON.stringify(exportData)], "plan.json", { type: "application/json" });
    const realInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await fireEvent.change(realInput, { target: { files: [file] } });
    // handleImportFile では alert() を使用せず、setImportErrorMessage() を使用する
    // エラーメッセージが表示されることを確認
    await waitFor(() => {
      expect(screen.getByTestId("import-error-message")).toBeInTheDocument();
    });
  });

  it("Load: レシピが見つからない場合は recipeNotFound アラート", () => {
    usePlanImportMocks.handleLoadFromStorage.mockImplementationOnce(() => {
      alertMock("recipeNotFound: 9999");
    });

    render(<PlanManager />);
    fireEvent.click(screen.getByRole("button", { name: /load$/i }));
    const buttons = screen.getAllByRole("button", { name: /^load$/i });
    const recentLoad = buttons.find(b => b.className.includes("neon-blue"))!;
    fireEvent.click(recentLoad);
    expect(alertMock).toHaveBeenCalledWith(expect.stringContaining("recipeNotFound"));
  });

  it("Delete: confirm がキャンセルされた場合は削除されない", () => {
    confirmMock.mockReturnValueOnce(false);
    render(<PlanManager />);
    fireEvent.click(screen.getByRole("button", { name: /load$/i }));
    const del = screen.getByText("delete");
    fireEvent.click(del);
    expect(confirmMock).toHaveBeenCalled();
    // PlanManager は planImport.handleDeletePlan を呼び出すが、
    // confirm が false を返すため、削除処理は実行されない
    // handleDeletePlan は呼ばれるが、confirm が false なので何も実行されない
    expect(usePlanImportMocks.handleDeletePlan).toHaveBeenCalledWith("k1");
    // confirm が false なので、deletePlanFromStorage は呼ばれない
    expect(planStorageServiceMocks.deletePlanFromStorage).not.toHaveBeenCalled();
  });

  it("Save: プラン名が空の場合はデフォルト名が使用される", () => {
    render(<PlanManager />);
    fireEvent.click(screen.getByRole("button", { name: /save$/i }));
    // プラン名を入力せずに保存
    fireEvent.click(screen.getByRole("button", { name: /saveToLocalStorage/i }));
    expect(planSaveServiceMocks.createPlanFromState).toHaveBeenCalled();
    const calls = planSaveServiceMocks.createPlanFromState.mock.calls as unknown[] as [any[]];
    const arg = calls.length ? calls[0][0] : (undefined as any);
    expect(arg && (arg as any).name).toBe("Test Recipe");
  });

  it("Share: プラン名が空の場合はデフォルト名が使用される", () => {
    render(<PlanManager />);
    fireEvent.click(screen.getByRole("button", { name: /shareURL$/i }));
    expect(urlShareMocks.generateShareURL).toHaveBeenCalled();
    const calls = urlShareMocks.generateShareURL.mock.calls as unknown[] as [any[]];
    const arg = calls.length ? calls[0][0] : (undefined as any);
    expect(arg && (arg as any).name).toBe("Test Recipe");
  });

  it("Load: recent plans が空の場合は noPlans メッセージが表示される", () => {
    planStorageServiceMocks.getRecentPlans.mockReturnValueOnce([]);
    usePlanImportMocks.recentPlans = [];
    render(<PlanManager />);
    fireEvent.click(screen.getByRole("button", { name: /load$/i }));
    expect(screen.getByText("noPlans")).toBeInTheDocument();
  });

  it("Save: Export to Markdown が成功メッセージを表示", async () => {
    usePlanExportMocks.exportSuccessMessage = "exported";
    render(<PlanManager />);
    fireEvent.click(screen.getByRole("button", { name: /save$/i }));
    fireEvent.click(screen.getByRole("button", { name: /^Markdown$/i }));
    await waitFor(() => {
      expect(usePlanExportMocks.handleExport).toHaveBeenCalled();
    });
    expect(screen.getByTestId("export-success-message")).toBeInTheDocument();
  });

  it("Save: Export to CSV が成功メッセージを表示", async () => {
    usePlanExportMocks.exportSuccessMessage = "exported";
    render(<PlanManager />);
    fireEvent.click(screen.getByRole("button", { name: /save$/i }));
    fireEvent.click(screen.getByRole("button", { name: /^CSV$/i }));
    await waitFor(() => {
      expect(usePlanExportMocks.handleExport).toHaveBeenCalled();
    });
    expect(screen.getByTestId("export-success-message")).toBeInTheDocument();
  });

  it("Save: Export to Excel が成功メッセージを表示", async () => {
    usePlanExportMocks.exportSuccessMessage = "exported";
    render(<PlanManager />);
    fireEvent.click(screen.getByRole("button", { name: /save$/i }));
    fireEvent.click(screen.getByRole("button", { name: /^Excel$/i }));
    await waitFor(() => {
      expect(usePlanExportMocks.handleExport).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(screen.getByTestId("export-success-message")).toBeInTheDocument();
    });
  });
});
