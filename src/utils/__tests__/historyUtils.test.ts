import { describe, expect, it } from "vitest";
import type { HistoryEntry } from "../../types/history";
import {
  calculateChanges,
  DEBOUNCE_TIMES,
  generateUUID,
  HISTORY_VERSION,
  migrateHistoryEntry,
  validateHistoryEntry,
} from "../history/events";

describe("historyUtils", () => {
  describe("generateUUID", () => {
    it("should generate unique UUIDs", () => {
      const uuid1 = generateUUID();
      const uuid2 = generateUUID();

      expect(uuid1).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      expect(uuid2).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      expect(uuid1).not.toBe(uuid2);
    });
  });

  describe("HISTORY_VERSION", () => {
    it("should be defined", () => {
      expect(HISTORY_VERSION).toBe("1.0.0");
    });
  });

  describe("DEBOUNCE_TIMES", () => {
    it("should have correct debounce times", () => {
      expect(DEBOUNCE_TIMES.settings).toBe(500);
      expect(DEBOUNCE_TIMES.plan).toBe(0);
      expect(DEBOUNCE_TIMES.nodeOverride).toBe(300);
      expect(DEBOUNCE_TIMES.powerGeneration).toBe(500);
    });
  });

  describe("validateHistoryEntry", () => {
    it("should validate valid entry", () => {
      const entry: HistoryEntry = {
        id: generateUUID(),
        timestamp: Date.now(),
        type: "settings",
        description: "テスト変更",
        changes: { "settings.test": "value" },
        version: HISTORY_VERSION,
      };

      const result = validateHistoryEntry(entry);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
      expect(result.needsMigration).toBeUndefined();
    });

    it("should reject invalid entry structure", () => {
      const invalidEntry = { foo: "bar" };
      const result = validateHistoryEntry(invalidEntry);

      expect(result.valid).toBe(false);
      expect(result.error).toBe("Invalid entry structure");
    });

    it("should reject entry with missing required fields", () => {
      // id, timestamp, type, description, changes のいずれかが欠けている場合は isHistoryEntry で弾かれる
      const invalidEntry = {
        id: generateUUID(),
        timestamp: Date.now(),
        type: "settings",
        description: "テスト",
        changes: {},
        // id が空文字列のケースをテスト
      };

      // 空文字列のidをテスト
      const invalidEntry2 = {
        id: "",
        timestamp: Date.now(),
        type: "settings" as const,
        description: "テスト",
        changes: {},
      };

      const result = validateHistoryEntry(invalidEntry2);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Missing required fields");
    });

    it("should reject entry with invalid type", () => {
      const invalidEntry: HistoryEntry = {
        id: generateUUID(),
        timestamp: Date.now(),
        type: "invalidType" as HistoryEntry["type"],
        description: "テスト",
        changes: {},
      };

      const result = validateHistoryEntry(invalidEntry);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("Invalid entry type");
    });

    it("should mark entry as needing migration when version is missing", () => {
      const entry = {
        id: generateUUID(),
        timestamp: Date.now(),
        type: "settings" as const,
        description: "テスト変更",
        changes: { "settings.test": "value" },
        // version missing
      };

      const result = validateHistoryEntry(entry);
      expect(result.valid).toBe(true);
      expect(result.needsMigration).toBe(true);
    });
  });

  describe("migrateHistoryEntry", () => {
    it("should migrate entry without version", () => {
      const entry = {
        id: generateUUID(),
        timestamp: Date.now(),
        type: "settings" as const,
        description: "テスト変更",
        changes: { "settings.test": "value" },
      };

      const migrated = migrateHistoryEntry(entry);
      expect(migrated).not.toBeNull();
      expect(migrated?.version).toBe(HISTORY_VERSION);
      expect(migrated?.changes).toEqual(entry.changes);
    });

    it("should migrate entry with old before/after format", () => {
      const entry: any = {
        id: generateUUID(),
        timestamp: Date.now(),
        type: "settings" as const,
        description: "テスト変更",
        changes: {}, // changes is required by isHistoryEntry
        before: { settings: { test: "old" } },
        after: { settings: { test: "new" } },
        version: "1.0.0",
      };

      const migrated = migrateHistoryEntry(entry);
      expect(migrated).not.toBeNull();
      expect(migrated?.version).toBe(HISTORY_VERSION);
      expect(migrated?.changes).toBeDefined();
      expect(Object.keys(migrated?.changes || {})).not.toHaveLength(0);
      // before/after は spread operator で残るが、changes が優先される
      expect(migrated?.changes).toEqual(expect.objectContaining({ settings: expect.anything() }));
    });

    it("should return null for invalid entry", () => {
      const invalidEntry = { foo: "bar" };
      const migrated = migrateHistoryEntry(invalidEntry);

      expect(migrated).toBeNull();
    });
  });

  describe("calculateChanges", () => {
    it("should detect primitive value changes", () => {
      const changes = calculateChanges({ value: "old" }, { value: "new" });
      expect(changes).toEqual({ value: "new" });
    });

    it("should detect nested property changes", () => {
      const before = {
        settings: {
          proliferator: { type: "none", mode: "speed" },
        },
      };
      const after = {
        settings: {
          proliferator: { type: "mk1", mode: "speed" },
        },
      };

      const changes = calculateChanges(before, after);
      expect(changes).toEqual({
        "settings.proliferator.type": "mk1",
      });
    });

    it("should detect Map entry changes", () => {
      const before = new Map<number, number>([
        [1, 10],
        [2, 20],
      ]);
      const after = new Map<number, number>([
        [1, 10],
        [2, 30], // changed
        [3, 40], // new
      ]);

      const changes = calculateChanges(before, after);
      expect(changes).toHaveProperty("alternativeRecipes");
      const mapChanges = changes.alternativeRecipes as Record<string, unknown>;
      expect(mapChanges["2"]).toBe(30);
      expect(mapChanges["3"]).toBe(40);
    });

    it("should detect Map property changes in object", () => {
      const before = {
        settings: {
          alternativeRecipes: new Map<number, number>([
            [1, 10],
            [2, 20],
          ]),
        },
      };
      const after = {
        settings: {
          alternativeRecipes: new Map<number, number>([
            [1, 10],
            [2, 30], // changed
          ]),
        },
      };

      const changes = calculateChanges(before, after);
      expect(changes).toHaveProperty("settings.alternativeRecipes");
      const mapChanges = changes["settings.alternativeRecipes"] as Record<string, unknown>;
      expect(mapChanges["2"]).toBe(30);
    });

    it("should detect deleted properties", () => {
      const before = {
        prop1: "value1",
        prop2: "value2",
      };
      const after = {
        prop1: "value1",
      };

      const changes = calculateChanges(before, after);
      expect(changes).toHaveProperty("prop2");
      expect(changes.prop2).toBeUndefined();
    });

    it("should detect new properties", () => {
      const before = {
        prop1: "value1",
      };
      const after = {
        prop1: "value1",
        prop2: "value2",
      };

      const changes = calculateChanges(before, after);
      expect(changes).toEqual({ prop2: "value2" });
    });

    it("should return empty object when no changes", () => {
      const obj = {
        prop: "value",
        nested: { key: "value" },
      };

      const changes = calculateChanges(obj, obj);
      expect(Object.keys(changes).length).toBe(0);
    });

    it("should handle type changes", () => {
      const before = { value: "string" };
      const after = { value: 123 };

      const changes = calculateChanges(before, after);
      expect(changes).toEqual({ value: 123 });
    });

    it("should handle array changes", () => {
      const before = { items: [1, 2, 3] };
      const after = { items: [1, 2, 4] };

      const changes = calculateChanges(before, after);
      expect(changes).toEqual({ items: [1, 2, 4] });
    });

    it("should handle Map deletion", () => {
      const before = new Map<number, number>([
        [1, 10],
        [2, 20],
      ]);
      const after = new Map<number, number>([[1, 10]]);

      const changes = calculateChanges(before, after);
      expect(changes).toHaveProperty("alternativeRecipes");
      const mapChanges = changes.alternativeRecipes as Record<string, unknown>;
      expect(mapChanges["2"]).toBeUndefined();
    });

    it("should handle complex nested structures", () => {
      const before = {
        settings: {
          proliferator: { type: "none", mode: "speed" },
          machineRank: { Assemble: "mk1", Smelt: "arc" },
          conveyorBelt: { tier: "mk1", stackCount: 1 },
        },
      };
      const after = {
        settings: {
          proliferator: { type: "mk1", mode: "speed" },
          machineRank: { Assemble: "mk2", Smelt: "arc" },
          conveyorBelt: { tier: "mk1", stackCount: 1 },
        },
      };

      const changes = calculateChanges(before, after);
      expect(changes).toHaveProperty("settings.proliferator.type", "mk1");
      expect(changes).toHaveProperty("settings.machineRank.Assemble", "mk2");
    });
  });
});
