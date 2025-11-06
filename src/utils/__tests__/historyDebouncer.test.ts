import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { HistoryEntry } from "../../types/history";
import { DEBOUNCE_TIMES, HistoryDebouncer } from "../history/debouncer";
import { generateUUID, HISTORY_VERSION } from "../history/events";

describe("HistoryDebouncer", () => {
  let debouncer: HistoryDebouncer;

  beforeEach(() => {
    debouncer = new HistoryDebouncer();
    vi.useFakeTimers();
  });

  afterEach(() => {
    debouncer.cancelAll();
    vi.useRealTimers();
  });

  describe("debounce", () => {
    it("should delay callback execution", () => {
      const entry: HistoryEntry = {
        id: generateUUID(),
        timestamp: Date.now(),
        type: "settings",
        description: "テスト変更",
        changes: { "settings.test": "value" },
        version: HISTORY_VERSION,
      };

      const callback = vi.fn();
      debouncer.debounce(entry, 500, callback);

      expect(callback).not.toHaveBeenCalled();

      vi.advanceTimersByTime(500);
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(entry);
    });

    it("should cancel previous debounce for same entry", () => {
      const entry: HistoryEntry = {
        id: generateUUID(),
        timestamp: Date.now(),
        type: "settings",
        description: "テスト変更",
        changes: { "settings.test": "value" },
        version: HISTORY_VERSION,
      };

      const callback = vi.fn();
      debouncer.debounce(entry, 500, callback);
      debouncer.debounce(entry, 500, callback); // Second call should cancel first

      vi.advanceTimersByTime(500);
      expect(callback).toHaveBeenCalledTimes(1); // Only called once
    });

    it("should handle immediate execution when delay is 0", () => {
      const entry: HistoryEntry = {
        id: generateUUID(),
        timestamp: Date.now(),
        type: "plan",
        description: "プラン保存",
        changes: {},
        version: HISTORY_VERSION,
      };

      const callback = vi.fn();
      debouncer.debounce(entry, 0, callback);

      // delay=0 でも setTimeout を使うため、次の tick で実行される
      vi.advanceTimersByTime(0);
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe("getPendingEntries", () => {
    it("should return pending entries", () => {
      const entry1: HistoryEntry = {
        id: generateUUID(),
        timestamp: Date.now(),
        type: "settings",
        description: "変更1",
        changes: { "settings.test1": "value1" },
        version: HISTORY_VERSION,
      };

      const entry2: HistoryEntry = {
        id: generateUUID(),
        timestamp: Date.now(),
        type: "nodeOverride",
        description: "変更2",
        changes: { "nodeOverrides.node1": {} },
        version: HISTORY_VERSION,
      };

      const callback = vi.fn();
      debouncer.debounce(entry1, 500, callback);
      debouncer.debounce(entry2, 300, callback);

      const pending = debouncer.getPendingEntries();
      expect(pending.length).toBe(2);
      expect(pending).toContainEqual(entry1);
      expect(pending).toContainEqual(entry2);
    });

    it("should return empty array when no pending entries", () => {
      const pending = debouncer.getPendingEntries();
      expect(pending).toEqual([]);
    });
  });

  describe("flushAll", () => {
    it("should execute all pending callbacks immediately", () => {
      const entry1: HistoryEntry = {
        id: generateUUID(),
        timestamp: Date.now(),
        type: "settings",
        description: "変更1",
        changes: { "settings.test1": "value1" },
        version: HISTORY_VERSION,
      };

      const entry2: HistoryEntry = {
        id: generateUUID(),
        timestamp: Date.now(),
        type: "settings",
        description: "変更2",
        changes: { "settings.test2": "value2" },
        version: HISTORY_VERSION,
      };

      const callback = vi.fn();
      debouncer.debounce(entry1, 500, callback);
      debouncer.debounce(entry2, 500, callback);

      debouncer.flushAll(callback);

      // flushAll は pendingEntries の各エントリに対して callback を実行する
      expect(callback).toHaveBeenCalledTimes(2); // flushAll で 2 回
      expect(callback).toHaveBeenCalledWith(entry1);
      expect(callback).toHaveBeenCalledWith(entry2);

      // After flush, no pending entries
      const pending = debouncer.getPendingEntries();
      expect(pending.length).toBe(0);
    });
  });

  describe("cancel", () => {
    it("should cancel debounces for specific type", () => {
      const settingsEntry: HistoryEntry = {
        id: generateUUID(),
        timestamp: Date.now(),
        type: "settings",
        description: "設定変更",
        changes: { "settings.test": "value" },
        version: HISTORY_VERSION,
      };

      const nodeOverrideEntry: HistoryEntry = {
        id: generateUUID(),
        timestamp: Date.now(),
        type: "nodeOverride",
        description: "ノード変更",
        changes: { "nodeOverrides.node1": {} },
        version: HISTORY_VERSION,
      };

      const callback = vi.fn();
      debouncer.debounce(settingsEntry, 500, callback);
      debouncer.debounce(nodeOverrideEntry, 300, callback);

      debouncer.cancel("settings");

      vi.advanceTimersByTime(500);
      expect(callback).not.toHaveBeenCalledWith(settingsEntry);

      vi.advanceTimersByTime(300);
      expect(callback).toHaveBeenCalledWith(nodeOverrideEntry);
    });
  });

  describe("cancelAll", () => {
    it("should cancel all pending debounces", () => {
      const entry1: HistoryEntry = {
        id: generateUUID(),
        timestamp: Date.now(),
        type: "settings",
        description: "変更1",
        changes: { "settings.test1": "value1" },
        version: HISTORY_VERSION,
      };

      const entry2: HistoryEntry = {
        id: generateUUID(),
        timestamp: Date.now(),
        type: "nodeOverride",
        description: "変更2",
        changes: { "nodeOverrides.node1": {} },
        version: HISTORY_VERSION,
      };

      const callback = vi.fn();
      debouncer.debounce(entry1, 500, callback);
      debouncer.debounce(entry2, 300, callback);

      debouncer.cancelAll();

      vi.advanceTimersByTime(1000);
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe("getDelay", () => {
    it("should return correct delay for entry type", () => {
      expect(debouncer.getDelay("settings")).toBe(DEBOUNCE_TIMES.settings);
      expect(debouncer.getDelay("plan")).toBe(DEBOUNCE_TIMES.plan);
      expect(debouncer.getDelay("nodeOverride")).toBe(DEBOUNCE_TIMES.nodeOverride);
      expect(debouncer.getDelay("powerGeneration")).toBe(DEBOUNCE_TIMES.powerGeneration);
    });

    it("should return default delay for unknown type", () => {
      // getDelayはDEBOUNCE_TIMESから取得するため、存在しないキーの場合はundefined
      // 実装では500がデフォルトとして返されるはず
      expect(debouncer.getDelay("unknown" as any)).toBe(500);
    });
  });
});
