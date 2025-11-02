import { beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "../../i18n";
import { useGameDataStore } from "../../stores/gameDataStore";
import type { HistoryEntry } from "../../types/history";
import { regenerateHistoryDescription } from "../historyDescriptionRegenerator";

// Mock stores and modules
vi.mock("../../i18n", () => ({
  default: {
    language: "en",
    changeLanguage: vi.fn(),
    t: vi.fn((key: string) => key),
  },
}));

vi.mock("../../stores/gameDataStore", () => ({
  useGameDataStore: {
    getState: vi.fn(),
  },
}));

describe("historyDescriptionRegenerator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    i18n.language = "en";

    const mockData = {
      items: new Map([
        [1101, { id: 1101, name: "Iron Ingot", type: "material" }],
        [1102, { id: 1102, name: "Magnet", type: "material" }],
        [1103, { id: 1103, name: "Copper Ingot", type: "material" }],
      ]),
      recipes: new Map([
        [1, { sid: 1, name: "Iron Smelting" }],
        [2, { sid: 2, name: "Steel Smelting" }],
      ]),
      machines: new Map(),
    };

    vi.mocked(useGameDataStore.getState).mockReturnValue({
      data: mockData as any,
    } as any);
  });

  describe("Locale handling", () => {
    it("同じロケールの場合は元の説明を返す", () => {
      const entry: HistoryEntry = {
        id: "test-1",
        timestamp: Date.now(),
        type: "settings",
        description: "Original description",
        locale: "en",
        changes: {},
      };

      const result = regenerateHistoryDescription(entry);
      expect(result).toBe("Original description");
    });

    it("ロケールがない場合は元の説明を返す", () => {
      const entry: HistoryEntry = {
        id: "test-2",
        timestamp: Date.now(),
        type: "settings",
        description: "Original description",
        changes: {},
      };

      const result = regenerateHistoryDescription(entry);
      expect(result).toBe("Original description");
    });

    it("異なるロケールで変更がある場合は再生成する", () => {
      const entry: HistoryEntry = {
        id: "test-3",
        timestamp: Date.now(),
        type: "settings",
        description: "古い説明",
        locale: "ja",
        changes: {
          "settings.proliferator": { type: "mk1", mode: "speed" },
        },
        previousChanges: {
          "settings.proliferator": { type: "none", mode: "speed" },
        },
      };

      const result = regenerateHistoryDescription(entry);
      expect(result).toBeTruthy();
      expect(result).not.toBe("古い説明");
    });
  });

  describe("Settings changes", () => {
    it("テンプレート適用の説明を生成", () => {
      const entry: HistoryEntry = {
        id: "test",
        timestamp: Date.now(),
        type: "settings",
        description: "古い説明",
        locale: "ja",
        changes: { selectedTemplate: "balanced" },
      };

      const result = regenerateHistoryDescription(entry);
      expect(result).toBeTruthy();
    });

    it("Proliferator変更の説明を生成", () => {
      const entry: HistoryEntry = {
        id: "test",
        timestamp: Date.now(),
        type: "settings",
        description: "古い説明",
        locale: "ja",
        changes: {
          "settings.proliferator": { type: "mk2", mode: "production" },
        },
        previousChanges: {
          "settings.proliferator": { type: "mk1", mode: "speed" },
        },
      };

      const result = regenerateHistoryDescription(entry);
      expect(result).toBeTruthy();
    });

    it("代替レシピ変更の説明を生成", () => {
      const entry: HistoryEntry = {
        id: "test",
        timestamp: Date.now(),
        type: "settings",
        description: "古い説明",
        locale: "ja",
        changes: {
          "settings.alternativeRecipes": { "1101": 2 },
        },
        previousChanges: {
          "settings.alternativeRecipes": { "1101": 1 },
        },
      };

      const result = regenerateHistoryDescription(entry);
      expect(result).toBeTruthy();
      expect(result).toContain("Iron Ingot");
    });

    it("採掘速度研究変更の説明を生成", () => {
      const entry: HistoryEntry = {
        id: "test",
        timestamp: Date.now(),
        type: "settings",
        description: "古い説明",
        locale: "ja",
        changes: { "settings.miningSpeedResearch": 150 },
        previousChanges: { "settings.miningSpeedResearch": 100 },
      };

      const result = regenerateHistoryDescription(entry);
      expect(result).toBeTruthy();
    });

    it("Proliferator倍率変更の説明を生成", () => {
      const entry: HistoryEntry = {
        id: "test",
        timestamp: Date.now(),
        type: "settings",
        description: "古い説明",
        locale: "ja",
        changes: {
          "settings.proliferatorMultiplier": {
            production: 1.25,
            speed: 1.5,
          },
        },
      };

      const result = regenerateHistoryDescription(entry);
      expect(result).toBeTruthy();
    });
  });

  describe("Node override changes", () => {
    it("ノードOverride変更の説明を生成", () => {
      const entry: HistoryEntry = {
        id: "test",
        timestamp: Date.now(),
        type: "nodeOverride",
        description: "古い説明",
        locale: "ja",
        affectedNodes: ["node-123"],
        changes: {
          "nodeOverrides.node-123.proliferator": {
            type: "mk2",
            mode: "production",
          },
        },
      };

      const result = regenerateHistoryDescription(entry);
      expect(result).toBeTruthy();
    });

    it("ノードOverrideリセットの説明を生成", () => {
      const entry: HistoryEntry = {
        id: "test",
        timestamp: Date.now(),
        type: "nodeOverride",
        description: "古い説明",
        locale: "ja",
        affectedNodes: ["node-123"],
        changes: {
          "nodeOverrides.node-123": undefined,
        },
        previousChanges: {
          "nodeOverrides.node-123": { proliferator: { type: "mk1" } },
        },
      };

      const result = regenerateHistoryDescription(entry);
      expect(result).toBeTruthy();
    });
  });

  describe("Power generation changes", () => {
    it("発電テンプレート変更の説明を生成", () => {
      const entry: HistoryEntry = {
        id: "test",
        timestamp: Date.now(),
        type: "powerGeneration",
        description: "古い説明",
        locale: "ja",
        changes: { powerGenerationTemplate: "solar" },
        previousChanges: { powerGenerationTemplate: "default" },
      };

      const result = regenerateHistoryDescription(entry);
      expect(result).toBeTruthy();
    });

    it("手動発電機変更の説明を生成", () => {
      const entry: HistoryEntry = {
        id: "test",
        timestamp: Date.now(),
        type: "powerGeneration",
        description: "古い説明",
        locale: "ja",
        changes: { manualPowerGenerator: "thermal" },
        previousChanges: { manualPowerGenerator: null },
      };

      const result = regenerateHistoryDescription(entry);
      expect(result).toBeTruthy();
    });
  });

  describe("Plan changes", () => {
    it("ファイルからのプランロードの説明を生成", () => {
      const entry: HistoryEntry = {
        id: "test",
        timestamp: Date.now(),
        type: "plan",
        description: "古い説明",
        locale: "ja",
        changes: { fileName: "my-plan.json" },
        planSnapshot: {
          id: "plan-1",
          name: "My Plan",
          version: 1,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        } as any,
      };

      const result = regenerateHistoryDescription(entry);
      expect(result).toBeTruthy();
    });

    it("ブラウザからのプランロードの説明を生成", () => {
      const entry: HistoryEntry = {
        id: "test",
        timestamp: Date.now(),
        type: "plan",
        description: "古い説明",
        locale: "ja",
        changes: {},
        planSnapshot: {
          id: "plan-1",
          name: "My Plan",
          version: 2,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        } as any,
      };

      const result = regenerateHistoryDescription(entry);
      expect(result).toBeTruthy();
    });
  });

  describe("Edge cases", () => {
    it("変更がない場合は元の説明を返す", () => {
      const entry: HistoryEntry = {
        id: "test",
        timestamp: Date.now(),
        type: "settings",
        description: "Original description",
        locale: "ja",
        changes: {},
      };

      const result = regenerateHistoryDescription(entry);
      expect(result).toBe("Original description");
    });

    it("不明なタイプの場合は元の説明を返す", () => {
      const entry: HistoryEntry = {
        id: "test",
        timestamp: Date.now(),
        type: "unknown" as any,
        description: "Original description",
        locale: "ja",
        changes: { something: "value" },
      };

      const result = regenerateHistoryDescription(entry);
      expect(result).toBe("Original description");
    });

    it("エラーが発生した場合は元の説明を返す", () => {
      const entry: HistoryEntry = {
        id: "test",
        timestamp: Date.now(),
        type: "settings",
        description: "Original description",
        locale: "ja",
        changes: { "settings.invalid": "value" },
      };

      vi.mocked(useGameDataStore.getState).mockImplementation(() => {
        throw new Error("Store error");
      });

      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const result = regenerateHistoryDescription(entry);
      expect(result).toBe("Original description");

      consoleWarnSpy.mockRestore();
    });

    it("previousChangesがない場合でも動作する", () => {
      const entry: HistoryEntry = {
        id: "test",
        timestamp: Date.now(),
        type: "settings",
        description: "古い説明",
        locale: "ja",
        changes: {
          "settings.proliferator": { type: "mk1", mode: "speed" },
        },
      };

      const result = regenerateHistoryDescription(entry);
      expect(result).toBeTruthy();
    });
  });
});
