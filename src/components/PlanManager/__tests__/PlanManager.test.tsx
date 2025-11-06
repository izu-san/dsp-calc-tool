import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
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

const useGameDataStoreMock = vi.fn(() => ({ data: { recipes: recipesMap, items: new Map() } }));
vi.mock("../../../stores/gameDataStore", () => ({
  useGameDataStore: () => useGameDataStoreMock(),
}));

const setSelectedRecipe = vi.fn();
const setTargetQuantity = vi.fn();
const setCalculationResult = vi.fn();
const useRecipeSelectionStoreMock = vi.fn(() => ({
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
}));
vi.mock("../../../stores/recipeSelectionStore", () => ({
  useRecipeSelectionStore: () => useRecipeSelectionStoreMock(),
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
const getPlanVersionsMock = vi.fn(() => []);
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
  getRecentPlans: vi.fn(() => [
    { key: "k1", name: "Plan A", timestamp: 1700000000000, planId: "plan-id-1" },
  ]),
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
    recentPlans: [{ key: "k1", name: "Plan A", timestamp: 1700000000000, planId: "plan-id-1" }],
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

// usePlanManagerDialogs モック
// 実際のフックはuseStateを使うので、モックも状態を正しく管理する必要がある
const usePlanManagerDialogsMocks = vi.hoisted(() => {
  const dialogsState = {
    activeDialog: null as string | null,
    planName: "",
    shareURL: "",
    copySuccess: false,
    includeOverridesOnSave: true,
    includeOverridesOnShare: true,
    mergeOverridesOnLoad: false,
    selectedPlanId: null as string | null,
    diffBaseVersion: null as number | null,
    diffCompareVersion: null as number | null,
  };

  const mockInstance = {
    ...dialogsState,
    setPlanName: vi.fn((name: string) => {
      dialogsState.planName = name;
    }),
    setShareURL: vi.fn((url: string) => {
      dialogsState.shareURL = url;
    }),
    setCopySuccess: vi.fn((success: boolean) => {
      dialogsState.copySuccess = success;
    }),
    setIncludeOverridesOnSave: vi.fn((include: boolean) => {
      dialogsState.includeOverridesOnSave = include;
    }),
    setIncludeOverridesOnShare: vi.fn((include: boolean) => {
      dialogsState.includeOverridesOnShare = include;
    }),
    setMergeOverridesOnLoad: vi.fn((merge: boolean) => {
      dialogsState.mergeOverridesOnLoad = merge;
    }),
    setSelectedPlanId: vi.fn((id: string | null) => {
      dialogsState.selectedPlanId = id;
    }),
    setDiffVersions: vi.fn((base: number | null, compare: number | null) => {
      dialogsState.diffBaseVersion = base;
      dialogsState.diffCompareVersion = compare;
    }),
    openDialog: vi.fn((dialog: string) => {
      dialogsState.activeDialog = dialog;
    }),
    closeDialog: vi.fn(() => {
      dialogsState.activeDialog = null;
      dialogsState.selectedPlanId = null;
      dialogsState.diffBaseVersion = null;
      dialogsState.diffCompareVersion = null;
    }),
    closeDialogWithReset: vi.fn(() => {
      dialogsState.activeDialog = null;
      dialogsState.planName = "";
      dialogsState.shareURL = "";
      dialogsState.copySuccess = false;
    }),
  };

  // プロキシを使って、dialogsStateの変更を自動的に反映
  const createMockProxy = () => {
    return new Proxy(mockInstance, {
      get(target, prop) {
        if (prop in dialogsState) {
          return dialogsState[prop as keyof typeof dialogsState];
        }
        return target[prop as keyof typeof mockInstance];
      },
    });
  };

  return {
    dialogsState,
    usePlanManagerDialogsMock: vi.fn(() => createMockProxy()),
  };
});

vi.mock("../../../hooks/usePlanManagerDialogs", () => ({
  usePlanManagerDialogs: usePlanManagerDialogsMocks.usePlanManagerDialogsMock,
}));

const { dialogsState, usePlanManagerDialogsMock } = usePlanManagerDialogsMocks;

describe("PlanManager", () => {
  let alertMock: ReturnType<typeof vi.fn>;
  let confirmMock: ReturnType<typeof vi.fn>;
  let dialogsMock: ReturnType<typeof usePlanManagerDialogsMock>;

  // ヘルパー: 特定のダイアログを開いた状態でレンダリング
  const renderWithDialog = (dialogType: string | null = null) => {
    if (dialogType) {
      dialogsState.activeDialog = dialogType;
    }
    return render(<PlanManager />);
  };

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

    // dialogsStateをリセット
    dialogsState.activeDialog = null;
    dialogsState.planName = "";
    dialogsState.shareURL = "";
    dialogsState.copySuccess = false;
    dialogsState.includeOverridesOnSave = true;
    dialogsState.includeOverridesOnShare = true;
    dialogsState.mergeOverridesOnLoad = false;
    dialogsState.selectedPlanId = null;
    dialogsState.diffBaseVersion = null;
    dialogsState.diffCompareVersion = null;

    // モックから最新の状態を取得
    dialogsMock = usePlanManagerDialogsMock();
  });

  afterEach(() => {
    cleanup();
  });

  it("PlanManagerが正しくレンダリングされる", () => {
    render(<PlanManager />);
    // 基本的なボタンが表示されることを確認
    expect(screen.getByRole("button", { name: /save$/i })).toBeInTheDocument();
    expect(screen.getByTestId("load-button")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /shareURL$/i })).toBeInTheDocument();
  });

  it("Saveダイアログが開いたときに基本要素が表示される", async () => {
    renderWithDialog("save");

    await waitFor(
      () => {
        expect(screen.getByTestId("save-to-localstorage-button")).toBeInTheDocument();
        expect(screen.getByTestId("plan-name-input")).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it("Loadダイアログが開いたときに基本要素が表示される", async () => {
    renderWithDialog("load");

    await waitFor(
      () => {
        expect(screen.getByTestId("file-import-input")).toBeInTheDocument();
        expect(screen.getByText("recentPlans")).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it("Shareダイアログが開いたときに基本要素が表示される", async () => {
    renderWithDialog("share");

    await waitFor(
      () => {
        expect(screen.getByText("sharedUrl")).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it("ファイルインポート成功時にhandleImportFileが呼ばれる", async () => {
    renderWithDialog("load");

    await waitFor(
      () => {
        expect(screen.getByTestId("file-import-input")).toBeInTheDocument();
      },
      { timeout: 2000 }
    );

    const file = new File(['{"test":"data"}'], "plan.json", { type: "application/json" });
    const realInput = screen.getByTestId("file-import-input") as HTMLInputElement;

    await act(async () => {
      fireEvent.change(realInput, { target: { files: [file] } });
    });

    expect(usePlanImportMocks.handleImportFile).toHaveBeenCalled();
  });

  it("Saveダイアログでincludeノードオーバーライドチェックボックスが表示される", async () => {
    renderWithDialog("save");

    await waitFor(
      () => {
        expect(screen.getByRole("checkbox", { name: "includeNodeOverrides" })).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it("Shareダイアログでincludeノードオーバーライドチェックボックスが表示される", async () => {
    renderWithDialog("share");

    await waitFor(
      () => {
        expect(
          screen.getByRole("checkbox", { name: "includeNodeOverridesInURL" })
        ).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  describe("Escキーでダイアログを閉じる", () => {
    it("Saveダイアログが開いているときにEscキーで閉じる", async () => {
      renderWithDialog("save");

      await waitFor(
        () => {
          expect(screen.getByTestId("save-to-localstorage-button")).toBeInTheDocument();
        },
        { timeout: 2000 }
      );

      const event = new KeyboardEvent("keydown", { key: "Escape" });
      window.dispatchEvent(event);

      await waitFor(() => {
        expect(dialogsMock.closeDialog).toHaveBeenCalled();
      });
    });

    it("Loadダイアログが開いているときにEscキーで閉じる", async () => {
      renderWithDialog("load");

      await waitFor(
        () => {
          expect(screen.getByTestId("file-import-input")).toBeInTheDocument();
        },
        { timeout: 2000 }
      );

      const event = new KeyboardEvent("keydown", { key: "Escape" });
      window.dispatchEvent(event);

      await waitFor(() => {
        expect(dialogsMock.closeDialog).toHaveBeenCalled();
      });
    });

    it("Shareダイアログが開いているときにEscキーで閉じる", async () => {
      renderWithDialog("share");

      await waitFor(
        () => {
          expect(screen.getByText("sharedUrl")).toBeInTheDocument();
        },
        { timeout: 2000 }
      );

      const event = new KeyboardEvent("keydown", { key: "Escape" });
      window.dispatchEvent(event);

      await waitFor(() => {
        expect(dialogsMock.closeDialog).toHaveBeenCalled();
      });
    });

    it("Versionダイアログが開いているときにEscキーで閉じる", async () => {
      dialogsState.selectedPlanId = "test-plan-id";
      renderWithDialog("version");

      const event = new KeyboardEvent("keydown", { key: "Escape" });
      window.dispatchEvent(event);

      await waitFor(() => {
        expect(dialogsMock.closeDialog).toHaveBeenCalled();
        expect(dialogsMock.setSelectedPlanId).toHaveBeenCalledWith(null);
      });
    });

    it("Diffダイアログが開いているときにEscキーで閉じる", async () => {
      dialogsState.selectedPlanId = "test-plan-id";
      dialogsState.diffBaseVersion = 1;
      dialogsState.diffCompareVersion = 2;
      renderWithDialog("diff");

      const event = new KeyboardEvent("keydown", { key: "Escape" });
      window.dispatchEvent(event);

      await waitFor(() => {
        expect(dialogsMock.closeDialog).toHaveBeenCalled();
        expect(dialogsMock.setDiffVersions).toHaveBeenCalledWith(null, null);
      });
    });

    it("ダイアログが閉じているときにEscキーを押しても何も起こらない", () => {
      render(<PlanManager />);

      const event = new KeyboardEvent("keydown", { key: "Escape" });
      window.dispatchEvent(event);

      expect(dialogsMock.closeDialog).not.toHaveBeenCalled();
    });
  });

  it("Loadダイアログでmergeノードオーバーライドチェックボックスが表示される", async () => {
    renderWithDialog("load");

    await waitFor(
      () => {
        expect(
          screen.getByRole("checkbox", { name: "mergeNodeOverridesOnLoad" })
        ).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  // 以下のテストは詳細な挙動を確認しており、
  // ImportDialogとExportDialogで既にカバーされているため簡略化

  describe("異常系テスト", () => {
    it("Save: レシピ未選択時に保存ボタンがdisabled", () => {
      useRecipeSelectionStoreMock.mockReturnValueOnce({
        selectedRecipe: null,
        targetQuantity: 60,
        calculationResult: null,
        setSelectedRecipe,
        setTargetQuantity,
        setCalculationResult,
      } as any);

      render(<PlanManager />);
      const saveButton = screen.getByTestId("save-button");
      expect(saveButton).toBeDisabled();
    });

    it("Share: レシピ未選択時にURL共有ボタンがdisabled", () => {
      useRecipeSelectionStoreMock.mockReturnValueOnce({
        selectedRecipe: null,
        targetQuantity: 60,
        calculationResult: null,
        setSelectedRecipe,
        setTargetQuantity,
        setCalculationResult,
      } as any);

      render(<PlanManager />);
      const shareButton = screen.getByTestId("url-share-button");
      expect(shareButton).toBeDisabled();
    });
  });
});
