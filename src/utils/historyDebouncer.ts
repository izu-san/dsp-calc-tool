import type { HistoryEntry } from "../types/history";
import { DEBOUNCE_TIMES } from "./historyUtils";

export { DEBOUNCE_TIMES };

/**
 * Debouncer for history entries
 */
export class HistoryDebouncer {
  private timers = new Map<string, ReturnType<typeof setTimeout>>();
  private pendingEntries = new Map<string, HistoryEntry>();

  /**
   * Debounce history entry push
   * @param entry - History entry to push
   * @param delay - Delay in milliseconds (0 = immediate)
   * @param callback - Callback to execute after delay
   */
  debounce(entry: HistoryEntry, delay: number, callback: (entry: HistoryEntry) => void): void {
    const key = `${entry.type}_${entry.id}`;

    // Store the entry
    this.pendingEntries.set(key, entry);

    // Clear existing timer
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key)!);
    }

    // Set new timer
    const timer = setTimeout(() => {
      callback(entry);
      this.timers.delete(key);
      this.pendingEntries.delete(key);
    }, delay);

    this.timers.set(key, timer);
  }

  /**
   * Get all pending entries (for immediate push when undo is called)
   */
  getPendingEntries(): HistoryEntry[] {
    return Array.from(this.pendingEntries.values());
  }

  /**
   * Flush all pending entries (push them immediately)
   */
  flushAll(callback: (entry: HistoryEntry) => void): void {
    const entries = this.getPendingEntries();
    for (const entry of entries) {
      callback(entry);
    }
    this.cancelAll();
  }

  /**
   * Cancel debounce for specific type
   * @param type - History entry type to cancel
   */
  cancel(type: HistoryEntry["type"]): void {
    for (const [key, timer] of this.timers.entries()) {
      if (key.startsWith(type)) {
        clearTimeout(timer);
        this.timers.delete(key);
      }
    }
  }

  /**
   * Cancel all pending debounces
   */
  cancelAll(): void {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
    this.pendingEntries.clear();
  }

  /**
   * Get debounce delay for entry type
   */
  getDelay(type: HistoryEntry["type"]): number {
    return DEBOUNCE_TIMES[type] ?? 500;
  }
}

// Singleton instance
export const historyDebouncer = new HistoryDebouncer();
