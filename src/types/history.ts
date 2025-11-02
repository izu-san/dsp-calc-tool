import type { SavedPlan } from "./saved-plan";

/**
 * History entry types
 */
export type HistoryEntryType = "settings" | "nodeOverride" | "plan" | "powerGeneration";

/**
 * History entry for tracking state changes
 */
export interface HistoryEntry {
  /** Unique ID (UUID) */
  id: string;

  /** Timestamp when the change occurred */
  timestamp: number;

  /** Type of change */
  type: HistoryEntryType;

  /** Human-readable description of the change */
  description: string;

  /**
   * Changed properties in diff format
   * Key: property path (e.g., "settings.proliferator.type")
   * Value: new value (for redo)
   */
  changes: {
    [path: string]: unknown;
  };

  /**
   * Previous state changes (for undo)
   * Key: property path
   * Value: previous value (to restore when undoing)
   */
  previousChanges?: {
    [path: string]: unknown;
  };

  /**
   * Full plan snapshot (optional, only for plan save operations)
   */
  planSnapshot?: SavedPlan;

  /**
   * History entry version (for migration)
   */
  version?: string;

  /**
   * Affected node IDs (for nodeOverride type)
   */
  affectedNodes?: string[];

  /**
   * Locale when the entry was created
   */
  locale?: string;
}

/**
 * Validation result for history entry
 */
export interface HistoryValidationResult {
  valid: boolean;
  error?: string;
  needsMigration?: boolean;
}

/**
 * Saved plan version for version management
 */
export interface SavedPlanVersion {
  /** Plan ID (UUID) */
  planId: string;

  /** Version number */
  version: number;

  /** Timestamp when saved */
  timestamp: number;

  /** Plan data */
  plan: SavedPlan;

  /** Version description (optional) */
  description?: string;

  /** List of changes (optional) */
  changes?: string[];
}
