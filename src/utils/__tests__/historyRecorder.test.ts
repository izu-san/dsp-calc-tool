import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useHistoryStore } from "../../stores/historyStore";
import { historyDebouncer } from "../historyDebouncer";
import {
  generateSettingsDescription,
  isInternal,
  isRestoring,
  recordHistoryEntry,
  recordPlanSaveEntry,
  setInternal,
  setRestoring,
} from "../historyRecorder";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

global.localStorage = localStorageMock as Storage;

describe("historyRecorder", () => {
  beforeEach(() => {
    useHistoryStore.getState().clearHistory();
    historyDebouncer.cancelAll();
    setRestoring(false);
    setInternal(false);
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    setRestoring(false);
    setInternal(false);
  });

  describe("isRestoring / setRestoring", () => {
    it("should track restoring state", () => {
      expect(isRestoring()).toBe(false);
      setRestoring(true);
      expect(isRestoring()).toBe(true);
      setRestoring(false);
      expect(isRestoring()).toBe(false);
    });
  });

  describe("isInternal / setInternal", () => {
    it("should track internal change state", () => {
      expect(isInternal()).toBe(false);
      setInternal(true);
      expect(isInternal()).toBe(true);
      setInternal(false);
      expect(isInternal()).toBe(false);
    });
  });

  describe("recordHistoryEntry", () => {
    it("should not record when restoring state", () => {
      setRestoring(true);

      const before = { settings: { test: "old" } };
      const after = { settings: { test: "new" } };

      recordHistoryEntry("settings", "テスト変更", before, after);

      const { entries } = useHistoryStore.getState();
      expect(entries.length).toBe(0);
    });

    it("should record immediate entry for plan type", () => {
      const before = { plan: { name: "old" } };
      const after = { plan: { name: "new" } };

      recordHistoryEntry("plan", "プラン変更", before, after);

      // Plan entries are immediate (delay = 0)
      const { entries } = useHistoryStore.getState();
      expect(entries.length).toBe(1);
      expect(entries[0].description).toBe("プラン変更");
    });

    it("should debounce settings entry", () => {
      const before = { settings: { test: "old" } };
      const after = { settings: { test: "new" } };

      recordHistoryEntry("settings", "設定変更", before, after);

      // Should not be recorded immediately
      let { entries } = useHistoryStore.getState();
      expect(entries.length).toBe(0);

      // After debounce delay
      vi.advanceTimersByTime(500);
      entries = useHistoryStore.getState().entries;
      expect(entries.length).toBe(1);
      expect(entries[0].description).toBe("設定変更");
    });

    it("should not record when no changes detected", () => {
      const state = { settings: { test: "value" } };

      recordHistoryEntry("settings", "変更なし", state, state);

      vi.advanceTimersByTime(500);
      const { entries } = useHistoryStore.getState();
      expect(entries.length).toBe(0);
    });

    it("should calculate previousChanges for undo", () => {
      const before = { settings: { test: "old" } };
      const after = { settings: { test: "new" } };

      recordHistoryEntry("settings", "変更", before, after);
      vi.advanceTimersByTime(500);

      const { entries } = useHistoryStore.getState();
      expect(entries.length).toBe(1);
      expect(entries[0].previousChanges).toBeDefined();
      expect(entries[0].previousChanges).toHaveProperty("settings.test", "old");
    });

    it("should include affectedNodes when provided", () => {
      const before = { nodeOverrides: {} };
      const after = { nodeOverrides: { "node-1": {} } };

      recordHistoryEntry("nodeOverride", "ノード変更", before, after, ["node-1", "node-2"]);

      vi.advanceTimersByTime(300);
      const { entries } = useHistoryStore.getState();
      expect(entries.length).toBe(1);
      expect(entries[0].affectedNodes).toEqual(["node-1", "node-2"]);
    });

    it("should not record when internal change flag is set", () => {
      setInternal(true);

      const before = { settings: { test: "old" } };
      const after = { settings: { test: "new" } };

      recordHistoryEntry("settings", "内部変更", before, after);

      vi.advanceTimersByTime(500);
      const { entries } = useHistoryStore.getState();
      expect(entries.length).toBe(0);
    });

    it("should not record when description is empty", () => {
      const before = { settings: { test: "old" } };
      const after = { settings: { test: "new" } };

      recordHistoryEntry("settings", "", before, after);

      vi.advanceTimersByTime(500);
      const { entries } = useHistoryStore.getState();
      expect(entries.length).toBe(0);
    });
  });

  describe("recordPlanSaveEntry", () => {
    it("should record plan save entry immediately", () => {
      const plan = {
        name: "テストプラン",
        timestamp: Date.now(),
        recipeSID: 1001,
        targetQuantity: 1,
        settings: {
          proliferator: { type: "none", mode: "speed", speedBonus: 0, productionBonus: 0 },
          machineRank: {
            Smelt: "arc",
            Assemble: "mk1",
            Chemical: "standard",
            Research: "standard",
            Refine: "standard",
            Particle: "standard",
          },
          conveyorBelt: { tier: "mk1", speed: 6, stackCount: 1 },
          sorter: { tier: "mk1", powerConsumption: 0.27 },
          alternativeRecipes: new Map(),
          miningSpeedResearch: 100,
          proliferatorMultiplier: { production: 1, speed: 1 },
          photonGeneration: {
            enabled: false,
            mode: "rayReceiver",
            rayReceiverEfficiency: 100,
          },
        },
        alternativeRecipes: {},
        nodeOverrides: {},
      };

      recordPlanSaveEntry("プラン保存", plan);

      const { entries } = useHistoryStore.getState();
      expect(entries.length).toBe(1);
      expect(entries[0].type).toBe("plan");
      expect(entries[0].planSnapshot).toEqual(plan);
    });

    it("should calculate changes when before/after provided", () => {
      const before = { plan: { name: "old" } };
      const after = { plan: { name: "new" } };
      const plan = {
        name: "new",
        timestamp: Date.now(),
        recipeSID: 1001,
        targetQuantity: 1,
        settings: {
          proliferator: { type: "none", mode: "speed", speedBonus: 0, productionBonus: 0 },
          machineRank: {
            Smelt: "arc",
            Assemble: "mk1",
            Chemical: "standard",
            Research: "standard",
            Refine: "standard",
            Particle: "standard",
          },
          conveyorBelt: { tier: "mk1", speed: 6, stackCount: 1 },
          sorter: { tier: "mk1", powerConsumption: 0.27 },
          alternativeRecipes: new Map(),
          miningSpeedResearch: 100,
          proliferatorMultiplier: { production: 1, speed: 1 },
          photonGeneration: {
            enabled: false,
            mode: "rayReceiver",
            rayReceiverEfficiency: 100,
          },
        },
        alternativeRecipes: {},
        nodeOverrides: {},
      };

      recordPlanSaveEntry("プラン保存", plan, before, after);

      const { entries } = useHistoryStore.getState();
      expect(entries.length).toBe(1);
      expect(Object.keys(entries[0].changes).length).toBeGreaterThan(0);
    });
  });

  describe("generateSettingsDescription", () => {
    it("should generate description for setProliferator", () => {
      const desc = generateSettingsDescription("setProliferator", {
        type: "mk1",
        mode: "speed",
      });
      expect(desc).toBe("増産剤をmk1に変更（speed）");
    });

    it("should generate description for setMachineRank", () => {
      const desc = generateSettingsDescription("setMachineRank", {
        recipeType: "Assemble",
        rank: "mk2",
      });
      expect(desc).toBe("Assembleをmk2に変更");
    });

    it("should generate description for setConveyorBelt", () => {
      const desc = generateSettingsDescription("setConveyorBelt", {
        tier: "mk3",
      });
      expect(desc).toBe("コンベアベルトをmk3に変更");
    });

    it("should generate description for applyTemplate", () => {
      const desc = generateSettingsDescription("applyTemplate", {
        templateId: "earlyGame",
      });
      expect(desc).toBe("テンプレート「earlyGame」を適用");
    });

    it("should generate default description for unknown action", () => {
      const desc = generateSettingsDescription("unknownAction", {});
      expect(desc).toBe("unknownActionを変更");
    });

    it("should generate description for setSorter", () => {
      const desc = generateSettingsDescription("setSorter", {
        tier: "pile",
      });
      expect(desc).toBe("ソーターをpileに変更");
    });

    it("should generate description for setAlternativeRecipe", () => {
      const desc = generateSettingsDescription("setAlternativeRecipe", {
        itemName: "高純度シリコン",
      });
      expect(desc).toBe("高純度シリコンの代替レシピを変更");
    });

    it("should generate description for setMiningSpeedResearch", () => {
      const desc = generateSettingsDescription("setMiningSpeedResearch", {
        bonus: 150,
      });
      expect(desc).toBe("採掘速度研究を150%に変更");
    });

    it("should generate description for setProliferatorMultiplier", () => {
      const desc = generateSettingsDescription("setProliferatorMultiplier", {
        production: 1.25,
        speed: 2.0,
      });
      expect(desc).toBe("増産剤倍率を変更（生産:1.25x、速度:2x）");
    });
  });
});
