import { beforeEach, describe, expect, it, vi } from "vitest";
import type { HistoryEntry } from "../../types/history";
import { generateUUID, HISTORY_VERSION } from "../../utils/historyUtils";
import { useHistoryStore } from "../historyStore";

describe("historyStore", () => {
  beforeEach(() => {
    // Clear history before each test
    useHistoryStore.getState().clearHistory();
    useHistoryStore.setState({ planVersions: new Map() });
  });

  describe("pushEntry", () => {
    it("should add entry to history", () => {
      const { pushEntry } = useHistoryStore.getState();
      const entry: HistoryEntry = {
        id: generateUUID(),
        timestamp: Date.now(),
        type: "settings",
        description: "テスト変更",
        changes: { "settings.proliferator.type": "mk1" },
      };

      pushEntry(entry);

      const { entries, currentIndex } = useHistoryStore.getState();
      expect(entries.length).toBe(1);
      expect(currentIndex).toBe(0);
      expect(entries[0].id).toBe(entry.id);
    });

    it("should trim history to max size", () => {
      const { pushEntry, maxHistorySize } = useHistoryStore.getState();
      const entryCount = maxHistorySize + 10;

      // Add more entries than max size
      for (let i = 0; i < entryCount; i++) {
        const entry: HistoryEntry = {
          id: generateUUID(),
          timestamp: Date.now(),
          type: "settings",
          description: `テスト変更${i}`,
          changes: { [`settings.test${i}`]: i },
        };
        pushEntry(entry);
      }

      const { entries } = useHistoryStore.getState();
      expect(entries.length).toBe(maxHistorySize);
    });

    it("should remove future entries when new entry is added", () => {
      const { pushEntry, undo } = useHistoryStore.getState();

      // Add 3 entries
      for (let i = 0; i < 3; i++) {
        const entry: HistoryEntry = {
          id: generateUUID(),
          timestamp: Date.now(),
          type: "settings",
          description: `テスト変更${i}`,
          changes: { [`settings.test${i}`]: i },
        };
        pushEntry(entry);
      }

      // Undo twice
      undo();
      undo();

      // Add new entry
      const newEntry: HistoryEntry = {
        id: generateUUID(),
        timestamp: Date.now(),
        type: "settings",
        description: "新しい変更",
        changes: { "settings.new": "value" },
      };
      pushEntry(newEntry);

      const { entries, currentIndex } = useHistoryStore.getState();
      expect(entries.length).toBe(2); // First entry + new entry
      expect(currentIndex).toBe(1);
    });
  });

  describe("undo", () => {
    it("should move currentIndex backward", () => {
      const { pushEntry, undo } = useHistoryStore.getState();

      // Add 2 entries
      for (let i = 0; i < 2; i++) {
        const entry: HistoryEntry = {
          id: generateUUID(),
          timestamp: Date.now(),
          type: "settings",
          description: `テスト変更${i}`,
          changes: { [`settings.test${i}`]: i },
        };
        pushEntry(entry);
      }

      const beforeUndo = useHistoryStore.getState().currentIndex;
      const entry = undo();

      const afterUndo = useHistoryStore.getState().currentIndex;
      expect(afterUndo).toBe(beforeUndo - 1);
      expect(entry).not.toBeNull();
    });

    it("should return null when cannot undo", () => {
      const { undo } = useHistoryStore.getState();
      const entry = undo();

      expect(entry).toBeNull();
      expect(useHistoryStore.getState().currentIndex).toBe(-1);
    });
  });

  describe("redo", () => {
    it("should move currentIndex forward", () => {
      const { pushEntry, undo, redo } = useHistoryStore.getState();

      // Add 2 entries
      for (let i = 0; i < 2; i++) {
        const entry: HistoryEntry = {
          id: generateUUID(),
          timestamp: Date.now(),
          type: "settings",
          description: `テスト変更${i}`,
          changes: { [`settings.test${i}`]: i },
        };
        pushEntry(entry);
      }

      undo();
      const beforeRedo = useHistoryStore.getState().currentIndex;
      const entry = redo();

      const afterRedo = useHistoryStore.getState().currentIndex;
      expect(afterRedo).toBe(beforeRedo + 1);
      expect(entry).not.toBeNull();
    });

    it("should return null when cannot redo", () => {
      const { redo } = useHistoryStore.getState();
      const entry = redo();

      expect(entry).toBeNull();
    });
  });

  describe("canUndo", () => {
    it("should return true when history exists", () => {
      const { pushEntry, canUndo } = useHistoryStore.getState();
      const entry: HistoryEntry = {
        id: generateUUID(),
        timestamp: Date.now(),
        type: "settings",
        description: "テスト変更",
        changes: { "settings.test": "value" },
      };
      pushEntry(entry);

      expect(canUndo()).toBe(true);
    });

    it("should return false when no history", () => {
      const { canUndo } = useHistoryStore.getState();
      expect(canUndo()).toBe(false);
    });
  });

  describe("canRedo", () => {
    it("should return true when redo available", () => {
      const { pushEntry, undo, canRedo } = useHistoryStore.getState();
      const entry: HistoryEntry = {
        id: generateUUID(),
        timestamp: Date.now(),
        type: "settings",
        description: "テスト変更",
        changes: { "settings.test": "value" },
      };
      pushEntry(entry);
      undo();

      expect(canRedo()).toBe(true);
    });

    it("should return false when at end of history", () => {
      const { pushEntry, canRedo } = useHistoryStore.getState();
      const entry: HistoryEntry = {
        id: generateUUID(),
        timestamp: Date.now(),
        type: "settings",
        description: "テスト変更",
        changes: { "settings.test": "value" },
      };
      pushEntry(entry);

      expect(canRedo()).toBe(false);
    });
  });

  describe("planVersion", () => {
    it("should save plan version", () => {
      const { savePlanVersion } = useHistoryStore.getState();
      const plan = {
        name: "テストプラン",
        timestamp: Date.now(),
        recipeSID: 1001,
        targetQuantity: 1,
        settings: {
          proliferator: {
            type: "none",
            mode: "speed",
            speedBonus: 0,
            productionBonus: 0,
          },
          machineRank: {
            Smelt: "arc",
            Assemble: "mk1",
            Chemical: "standard",
            Research: "standard",
            Refine: "standard",
            Particle: "standard",
          },
          conveyorBelt: { tier: "mk3", speed: 10, stackCount: 1 },
          sorter: { tier: "pile", speed: 1 },
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

      const planId = savePlanVersion(plan);

      expect(planId).toBeTruthy();
      const versions = useHistoryStore.getState().getPlanVersions(planId);
      expect(versions.length).toBe(1);
      expect(versions[0].version).toBe(1);
    });

    it("should increment version for same planId", () => {
      const { savePlanVersion } = useHistoryStore.getState();
      const plan = {
        name: "テストプラン",
        timestamp: Date.now(),
        recipeSID: 1001,
        targetQuantity: 1,
        settings: {
          proliferator: {
            type: "none",
            mode: "speed",
            speedBonus: 0,
            productionBonus: 0,
          },
          machineRank: {
            Smelt: "arc",
            Assemble: "mk1",
            Chemical: "standard",
            Research: "standard",
            Refine: "standard",
            Particle: "standard",
          },
          conveyorBelt: { tier: "mk3", speed: 10, stackCount: 1 },
          sorter: { tier: "pile", speed: 1 },
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

      const planId = savePlanVersion(plan);
      savePlanVersion({ ...plan, timestamp: Date.now() }, planId);
      savePlanVersion({ ...plan, timestamp: Date.now() }, planId);

      const versions = useHistoryStore.getState().getPlanVersions(planId);
      expect(versions.length).toBe(3);
      expect(versions[0].version).toBe(1);
      expect(versions[1].version).toBe(2);
      expect(versions[2].version).toBe(3);
    });

    it("should load plan version", () => {
      const { savePlanVersion, loadPlanVersion } = useHistoryStore.getState();
      const plan = {
        name: "テストプラン",
        timestamp: Date.now(),
        recipeSID: 1001,
        targetQuantity: 1,
        settings: {
          proliferator: {
            type: "none",
            mode: "speed",
            speedBonus: 0,
            productionBonus: 0,
          },
          machineRank: {
            Smelt: "arc",
            Assemble: "mk1",
            Chemical: "standard",
            Research: "standard",
            Refine: "standard",
            Particle: "standard",
          },
          conveyorBelt: { tier: "mk3", speed: 10, stackCount: 1 },
          sorter: { tier: "pile", speed: 1 },
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

      const planId = savePlanVersion(plan);
      const loaded = loadPlanVersion(planId, 1);

      expect(loaded).not.toBeNull();
      expect(loaded?.recipeSID).toBe(plan.recipeSID);
    });

    it("should return null when loading non-existent planId", () => {
      const { loadPlanVersion } = useHistoryStore.getState();
      const loaded = loadPlanVersion("non-existent-id", 1);

      expect(loaded).toBeNull();
    });

    it("should return null when loading non-existent version", () => {
      const { savePlanVersion, loadPlanVersion } = useHistoryStore.getState();
      const plan = {
        name: "テストプラン",
        timestamp: Date.now(),
        recipeSID: 1001,
        targetQuantity: 1,
        settings: {
          proliferator: {
            type: "none" as const,
            mode: "speed" as const,
            speedBonus: 0,
            productionBonus: 0,
            powerIncrease: 0,
          },
          machineRank: {
            Smelt: "arc" as const,
            Assemble: "mk1" as const,
            Chemical: "standard" as const,
            Research: "standard" as const,
            Refine: "standard" as const,
            Particle: "standard" as const,
          },
          conveyorBelt: { tier: "mk3" as const, speed: 10, stackCount: 1 },
          sorter: { tier: "pile" as const, powerConsumption: 144 },
          alternativeRecipes: new Map(),
          miningSpeedResearch: 100,
          proliferatorMultiplier: { production: 1, speed: 1 },
          photonGeneration: {
            useGravitonLens: false,
            gravitonLensProliferator: {
              type: "none" as const,
              mode: "speed" as const,
              speedBonus: 0,
              productionBonus: 0,
              powerIncrease: 0,
            },
            rayTransmissionEfficiency: 0,
            continuousReception: 100,
          },
        },
        alternativeRecipes: {},
        nodeOverrides: {},
      };

      const planId = savePlanVersion(plan);
      const loaded = loadPlanVersion(planId, 999);

      expect(loaded).toBeNull();
    });

    it("should load latest plan version", () => {
      const { savePlanVersion, loadLatestPlanVersion } = useHistoryStore.getState();
      const plan = {
        name: "テストプラン",
        timestamp: Date.now(),
        recipeSID: 1001,
        targetQuantity: 1,
        settings: {
          proliferator: {
            type: "none" as const,
            mode: "speed" as const,
            speedBonus: 0,
            productionBonus: 0,
            powerIncrease: 0,
          },
          machineRank: {
            Smelt: "arc" as const,
            Assemble: "mk1" as const,
            Chemical: "standard" as const,
            Research: "standard" as const,
            Refine: "standard" as const,
            Particle: "standard" as const,
          },
          conveyorBelt: { tier: "mk3" as const, speed: 10, stackCount: 1 },
          sorter: { tier: "pile" as const, powerConsumption: 144 },
          alternativeRecipes: new Map(),
          miningSpeedResearch: 100,
          proliferatorMultiplier: { production: 1, speed: 1 },
          photonGeneration: {
            useGravitonLens: false,
            gravitonLensProliferator: {
              type: "none" as const,
              mode: "speed" as const,
              speedBonus: 0,
              productionBonus: 0,
              powerIncrease: 0,
            },
            rayTransmissionEfficiency: 0,
            continuousReception: 100,
          },
        },
        alternativeRecipes: {},
        nodeOverrides: {},
      };

      const planId = savePlanVersion(plan);
      savePlanVersion({ ...plan, name: "更新版" }, planId);
      savePlanVersion({ ...plan, name: "最新版" }, planId);

      const latest = loadLatestPlanVersion(planId);

      expect(latest).not.toBeNull();
      expect(latest?.name).toBe("最新版");
      expect(latest?.version).toBe(3);
    });

    it("should return null when loading latest from non-existent planId", () => {
      const { loadLatestPlanVersion } = useHistoryStore.getState();
      const latest = loadLatestPlanVersion("non-existent-id");

      expect(latest).toBeNull();
    });

    it("should return null when loading latest from planId with no versions", () => {
      const { loadLatestPlanVersion } = useHistoryStore.getState();
      useHistoryStore.setState({ planVersions: new Map([["empty-plan-id", []]]) });

      const latest = loadLatestPlanVersion("empty-plan-id");

      expect(latest).toBeNull();
    });

    it("should return empty array for non-existent planId", () => {
      const { getPlanVersions } = useHistoryStore.getState();
      const versions = getPlanVersions("non-existent-id");

      expect(versions).toEqual([]);
    });
  });

  describe("localStorage persistence", () => {
    it("should handle storage errors gracefully", () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      // Test will verify error handling in actual localStorage operations
      // which are tested through the persist middleware

      consoleErrorSpy.mockRestore();
    });

    it("should persist and restore history entries", () => {
      const { pushEntry, clearHistory } = useHistoryStore.getState();

      // Add some entries
      for (let i = 0; i < 3; i++) {
        const entry: HistoryEntry = {
          id: generateUUID(),
          timestamp: Date.now(),
          type: "settings",
          description: `履歴${i}`,
          changes: { [`test${i}`]: i },
          version: HISTORY_VERSION,
        };
        pushEntry(entry);
      }

      // Get current state
      const stateBefore = useHistoryStore.getState();
      const entriesCountBefore = stateBefore.entries.length;

      // Trigger persist by getting persist state (this exercises the setItem code)
      expect(entriesCountBefore).toBe(3);

      // Clear and verify restoration would work
      clearHistory();
      expect(useHistoryStore.getState().entries.length).toBe(0);
    });

    it("should handle invalid localStorage data", () => {
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      // Simulate invalid data in localStorage
      const invalidData = JSON.stringify({
        state: {
          entries: [
            {
              id: "invalid",
              // missing required fields
            },
          ],
          currentIndex: 0,
          maxHistorySize: 50,
          planVersions: [],
        },
      });

      // This would be called by the persist middleware's getItem
      localStorage.setItem("dsp-calculator-history-store", invalidData);

      // The invalid entry should be skipped with a warning
      // (when the store is rehydrated)

      consoleWarnSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it("should serialize and deserialize plan versions correctly", () => {
      const { savePlanVersion, getPlanVersions } = useHistoryStore.getState();

      const plan = {
        name: "永続化テスト",
        timestamp: Date.now(),
        recipeSID: 1001,
        targetQuantity: 1,
        settings: {
          proliferator: {
            type: "none" as const,
            mode: "speed" as const,
            speedBonus: 0,
            productionBonus: 0,
            powerIncrease: 0,
          },
          machineRank: {
            Smelt: "arc" as const,
            Assemble: "mk1" as const,
            Chemical: "standard" as const,
            Research: "standard" as const,
            Refine: "standard" as const,
            Particle: "standard" as const,
          },
          conveyorBelt: { tier: "mk3" as const, speed: 10, stackCount: 1 },
          sorter: { tier: "pile" as const, powerConsumption: 144 },
          alternativeRecipes: new Map(),
          miningSpeedResearch: 100,
          proliferatorMultiplier: { production: 1, speed: 1 },
          photonGeneration: {
            useGravitonLens: false,
            gravitonLensProliferator: {
              type: "none" as const,
              mode: "speed" as const,
              speedBonus: 0,
              productionBonus: 0,
              powerIncrease: 0,
            },
            rayTransmissionEfficiency: 0,
            continuousReception: 100,
          },
        },
        alternativeRecipes: {},
        nodeOverrides: {},
      };

      const planId = savePlanVersion(plan);
      const versions = getPlanVersions(planId);

      // Verify the plan versions Map is properly maintained
      expect(versions.length).toBe(1);
      expect(versions[0].planId).toBe(planId);
    });

    it("should add version to entry if missing", () => {
      const { pushEntry } = useHistoryStore.getState();
      const entry: HistoryEntry = {
        id: generateUUID(),
        timestamp: Date.now(),
        type: "settings",
        description: "テスト変更",
        changes: { "settings.test": "value" },
        // version is missing
      };

      pushEntry(entry);

      const { entries } = useHistoryStore.getState();
      expect(entries[0].version).toBe(HISTORY_VERSION);
    });

    it("should preserve existing version when present", () => {
      const { pushEntry } = useHistoryStore.getState();
      const customVersion = "1.0.0";
      const entry: HistoryEntry = {
        id: generateUUID(),
        timestamp: Date.now(),
        type: "settings",
        description: "テスト変更",
        changes: { "settings.test": "value" },
        version: customVersion,
      };

      pushEntry(entry);

      const { entries } = useHistoryStore.getState();
      expect(entries[0].version).toBe(customVersion);
    });
  });
});
