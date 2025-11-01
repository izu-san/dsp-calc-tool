/**
 * 共通モック設定
 * テスト間で重複するモック設定を統合し、保守性を向上
 */

import { vi } from "vitest";
import {
  createMockGameData,
  createMockSettings,
  createMockStoreStates,
} from "../factories/testDataFactory";

// 共通のモック設定を一元的に管理
export const setupCommonMocks = () => {
  // i18n モック
  vi.mock("react-i18next", () => ({
    useTranslation: () => ({
      t: (key: string) => key,
      i18n: { language: "ja" },
    }),
    initReactI18next: { type: "3rdParty", init: () => {} },
  }));

  // ポータル簡略化
  vi.mock("react-dom", () => ({
    createPortal: (node: unknown) => node,
  }));

  // コンソールエラーの抑制（テスト実行時のノイズ削減）
  const originalConsoleError = console.error;
  vi.spyOn(console, "error").mockImplementation((...args) => {
    // 計算エラーは抑制（テスト実行時のノイズ削減）
    if (args[0]?.includes?.("Machines map is undefined")) {
      return;
    }
    originalConsoleError(...args);
  });
};

// ストアモックの設定
export const setupStoreMocks = () => {
  const mockGameData = createMockGameData();
  const mockSettings = createMockSettings();
  const mockStoreStates = createMockStoreStates();

  // gameDataStore モック
  vi.mock("../../stores/gameDataStore", () => ({
    useGameDataStore: () => ({
      data: mockGameData,
      isLoading: false,
      error: null,
      locale: "ja",
      loadData: vi.fn(),
      updateData: vi.fn(),
      setLocale: vi.fn(),
      getMachineById: vi.fn((id: string) => mockGameData.machines.get(id)),
    }),
  }));

  // settingsStore モック
  vi.mock("../../stores/settingsStore", () => ({
    useSettingsStore: () => ({
      settings: mockSettings,
      setProliferator: vi.fn(),
      setConveyorBelt: vi.fn(),
      setMachineRank: vi.fn(),
      setAlternativeRecipe: vi.fn(),
      setMiningSpeedResearch: vi.fn(),
      setProliferatorMultiplier: vi.fn(),
      applyTemplate: vi.fn(),
      updateSettings: vi.fn(),
      resetSettings: vi.fn(),
    }),
  }));

  // nodeOverrideStore モック
  vi.mock("../../stores/nodeOverrideStore", () => ({
    useNodeOverrideStore: () => ({
      nodeOverrides: new Map(),
      version: 0,
      setNodeOverride: vi.fn(),
      clearNodeOverride: vi.fn(),
      setAllOverrides: vi.fn(),
      clearAllOverrides: vi.fn(),
    }),
  }));

  // recipeSelectionStore モック
  vi.mock("../../stores/recipeSelectionStore", () => ({
    useRecipeSelectionStore: () => ({
      selectedRecipe: null,
      targetCount: 60,
      setSelectedRecipe: vi.fn(),
      setTargetCount: vi.fn(),
    }),
  }));

  // favoritesStore モック
  vi.mock("../../stores/favoritesStore", () => ({
    useFavoritesStore: () => ({
      favoriteRecipes: new Set(),
      toggleFavorite: vi.fn(),
      isFavorite: vi.fn(() => false),
      clearFavorites: vi.fn(),
    }),
  }));
};

// ユーティリティ関数のモック
export const setupUtilityMocks = () => {
  // フォーマット関数のモック
  vi.mock("../../utils/format", () => ({
    formatPower: vi.fn((kw?: number) => (kw ? `${kw.toFixed(1)} kW` : "0.0 kW")),
    formatRate: vi.fn((perSec?: number) => (perSec ? `${perSec.toFixed(1)}/s` : "0.0/s")),
    formatNumber: vi.fn((n?: number) => (n ? n.toFixed(1) : "0.0")),
    formatBuildingCount: vi.fn((count?: number) => (count ? Math.ceil(count).toString() : "0")),
  }));

  // URL共有関数のモック
  vi.mock("../../utils/urlShare", () => ({
    getPlanFromURL: vi.fn(() => null),
    generateShareURL: vi.fn(() => "https://example.com"),
    copyToClipboard: vi.fn(() => Promise.resolve()),
  }));

  // プランエクスポート関数のモック
  vi.mock("../../utils/planExport", () => ({
    exportPlan: vi.fn(() => "exported-plan-data"),
    importPlan: vi.fn(() => Promise.resolve({ success: true })),
    restorePlan: vi.fn(() => Promise.resolve({ success: true })),
  }));

  // グリッド関数のモック
  vi.mock("../../utils/grid", () => ({
    parseGridIndex: vi.fn((index: string) => ({ x: 0, y: 0, z: 0 })),
    toGridIndex: vi.fn((pos: any) => "0000"),
    getRecipeIconPath: vi.fn(() => "/icons/recipe.png"),
    getItemIconPath: vi.fn(() => "/icons/item.png"),
    getMachineIconPath: vi.fn(() => "/icons/machine.png"),
  }));
};

// パーサー関数のモック
export const setupParserMocks = () => {
  vi.mock("../../lib/parser", () => ({
    loadGameData: vi.fn(() => Promise.resolve(createMockGameData())),
  }));
};

// 計算関数のモック
export const setupCalculationMocks = () => {
  vi.mock("../../lib/calculator", () => ({
    calculateProductionChain: vi.fn(() => createMockGameData()),
    buildRecipeTree: vi.fn(() => ({ nodeId: "root" })),
  }));

  vi.mock("../../lib/statistics", () => ({
    calculateItemStatistics: vi.fn(() => ({
      rawMaterials: new Map(),
      intermediateProducts: new Map(),
      finalProducts: new Map(),
    })),
  }));

  vi.mock("../../lib/powerCalculation", () => ({
    calculatePowerConsumption: vi.fn(() => ({
      total: 100,
      byMachine: [],
    })),
  }));

  vi.mock("../../lib/buildingCost", () => ({
    calculateBuildingCost: vi.fn(() => ({
      machines: [],
      sorters: 0,
      conveyorBelts: 0,
    })),
  }));
};

// 全モックの一括設定
export const setupAllMocks = () => {
  setupCommonMocks();
  setupStoreMocks();
  setupUtilityMocks();
  setupParserMocks();
  setupCalculationMocks();
};

// モックのクリーンアップ
export const cleanupMocks = () => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
};

// テスト用のヘルパー関数
export const createMockEvent = (type: string, target?: any) => ({
  type,
  target: target || { value: "test" },
  preventDefault: vi.fn(),
  stopPropagation: vi.fn(),
});

export const createMockFileList = (files: File[]): FileList => {
  const fileList = Object.assign(files, {
    item: (index: number) => files[index] || null,
    length: files.length,
  });
  return fileList as FileList;
};

// 非同期処理用のヘルパー
export const waitForAsync = async (callback: () => void, timeout = 1000) => {
  return new Promise<void>((resolve, reject) => {
    const startTime = Date.now();

    const check = () => {
      try {
        callback();
        resolve();
      } catch (error) {
        if (Date.now() - startTime > timeout) {
          reject(new Error(`Timeout after ${timeout}ms`));
        } else {
          setTimeout(check, 10);
        }
      }
    };

    check();
  });
};
