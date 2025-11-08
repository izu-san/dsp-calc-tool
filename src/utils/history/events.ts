import type { HistoryEntry, HistoryValidationResult } from "../../types/history";

/**
 * Generate UUID v4
 */
export function generateUUID(): string {
  return crypto.randomUUID();
}

/**
 * History entry version
 */
export const HISTORY_VERSION = "1.0.0";

/**
 * Debounce times for different operation types (in milliseconds)
 */
export const DEBOUNCE_TIMES = {
  settings: 500, // 設定変更は500ms
  plan: 0, // プラン変更は即座
  nodeOverride: 300, // ノード設定は300ms
  powerGeneration: 500, // 発電設備設定は500ms
} as const;

/**
 * Validate history entry
 */
export function validateHistoryEntry(entry: unknown): HistoryValidationResult {
  // Type guard
  if (!isHistoryEntry(entry)) {
    return { valid: false, error: "Invalid entry structure" };
  }

  // Required fields validation
  if (!entry.id || !entry.timestamp || !entry.type) {
    return { valid: false, error: "Missing required fields" };
  }

  // Type validation
  const validTypes: HistoryEntry["type"][] = [
    "settings",
    "nodeOverride",
    "plan",
    "powerGeneration",
  ];
  if (!validTypes.includes(entry.type)) {
    return { valid: false, error: `Invalid entry type: ${entry.type}` };
  }

  // Version check (for migration)
  if (!entry.version) {
    return { valid: true, needsMigration: true };
  }

  return { valid: true };
}

/**
 * Type guard for HistoryEntry
 */
function isHistoryEntry(entry: unknown): entry is HistoryEntry {
  return (
    typeof entry === "object" &&
    entry !== null &&
    "id" in entry &&
    "timestamp" in entry &&
    "type" in entry &&
    "description" in entry &&
    "changes" in entry
  );
}

/**
 * Migrate history entry from old format to new format
 */
export function migrateHistoryEntry(entry: unknown): HistoryEntry | null {
  if (!isHistoryEntry(entry)) return null;

  // Version 1.0.0 (initial format) to latest format
  if (!entry.version || entry.version === "1.0.0") {
    // If entry has old before/after format, convert to changes format
    if ("before" in entry && "after" in entry) {
      // Convert old format to new format
      const changes = convertToChangesFormat(entry.before, entry.after);
      return {
        ...entry,
        version: HISTORY_VERSION,
        changes,
      };
    }
    // Already in new format, just update version
    return {
      ...entry,
      version: HISTORY_VERSION,
    };
  }

  return entry;
}

/**
 * Convert before/after format to changes format
 * @param before - Old state (partial or full)
 * @param after - New state (partial or full)
 * @returns Changes in path->value format
 */
function convertToChangesFormat(before: unknown, after: unknown): Record<string, unknown> {
  // Simple implementation: if before/after are objects, extract changed properties
  // This is a simplified version - full implementation would use deep diff
  const changes: Record<string, unknown> = {};

  if (
    typeof before === "object" &&
    before !== null &&
    typeof after === "object" &&
    after !== null
  ) {
    const beforeObj = before as Record<string, unknown>;
    const afterObj = after as Record<string, unknown>;

    // Extract all keys from both objects
    const allKeys = new Set([...Object.keys(beforeObj), ...Object.keys(afterObj)]);

    for (const key of allKeys) {
      const beforeValue = beforeObj[key];
      const afterValue = afterObj[key];

      if (JSON.stringify(beforeValue) !== JSON.stringify(afterValue)) {
        changes[key] = afterValue;
      }
    }
  }

  return changes;
}

/**
 * Calculate changes between two states
 * @param before - Previous state
 * @param after - New state
 * @param prefix - Property path prefix (for nested objects)
 * @returns Changes in path->value format
 */
export function calculateChanges(
  before: unknown,
  after: unknown,
  prefix = ""
): Record<string, unknown> {
  const changes: Record<string, unknown> = {};

  if (typeof before !== typeof after) {
    // Type changed - record the new value
    if (prefix) {
      changes[prefix] = after;
    }
    return changes;
  }

  if (
    typeof before === "object" &&
    before !== null &&
    typeof after === "object" &&
    after !== null
  ) {
    // Handle Map objects specially (when comparing Map directly, not nested in object)
    if (before instanceof Map && after instanceof Map) {
      // Compare Map entries
      const allKeys = new Set([...before.keys(), ...after.keys()]);
      const mapChanges: Record<string, unknown> = {};

      for (const key of allKeys) {
        const beforeValue = before.get(key);
        const afterValue = after.get(key);

        if (!before.has(key)) {
          // New entry
          mapChanges[String(key)] = afterValue;
        } else if (!after.has(key)) {
          // Deleted entry
          mapChanges[String(key)] = undefined;
        } else if (JSON.stringify(beforeValue) !== JSON.stringify(afterValue)) {
          // Changed entry
          mapChanges[String(key)] = afterValue;
        }
      }

      // If there are any changes, record them
      if (Object.keys(mapChanges).length > 0) {
        if (prefix) {
          // Nested Map - store changes at the prefix path
          changes[prefix] = mapChanges;
        } else {
          // Top-level Map - use "alternativeRecipes" as default path
          changes["alternativeRecipes"] = mapChanges;
        }
      }

      return changes;
    }

    const beforeObj = before as Record<string, unknown>;
    const afterObj = after as Record<string, unknown>;

    // Check all keys in after
    for (const key of Object.keys(afterObj)) {
      const path = prefix ? `${prefix}.${key}` : key;
      const beforeValue = beforeObj[key];
      const afterValue = afterObj[key];

      if (!(key in beforeObj)) {
        // New property
        changes[path] = afterValue;
      } else if (beforeValue instanceof Map && afterValue instanceof Map) {
        // Handle Map property - compare individual entries
        const allKeys = new Set([...beforeValue.keys(), ...afterValue.keys()]);
        const mapChanges: Record<string, unknown> = {};
        let hasMapChanges = false;

        for (const mapKey of allKeys) {
          const beforeMapValue = beforeValue.get(mapKey);
          const afterMapValue = afterValue.get(mapKey);

          if (!beforeValue.has(mapKey)) {
            // New entry
            mapChanges[String(mapKey)] = afterMapValue;
            hasMapChanges = true;
          } else if (!afterValue.has(mapKey)) {
            // Deleted entry
            mapChanges[String(mapKey)] = undefined;
            hasMapChanges = true;
          } else if (JSON.stringify(beforeMapValue) !== JSON.stringify(afterMapValue)) {
            // Changed entry
            mapChanges[String(mapKey)] = afterMapValue;
            hasMapChanges = true;
          }
        }

        // If there are any changes, record them
        if (hasMapChanges && Object.keys(mapChanges).length > 0) {
          changes[path] = mapChanges;
        }
      } else {
        // Check if values are different (skip JSON.stringify for Map comparison)
        let valuesAreDifferent = false;
        let hasMapProperties = false;

        // Check if this is an object with Map properties (before JSON.stringify comparison)
        if (
          typeof beforeValue === "object" &&
          beforeValue !== null &&
          typeof afterValue === "object" &&
          afterValue !== null &&
          !Array.isArray(beforeValue) &&
          !Array.isArray(afterValue) &&
          !(beforeValue instanceof Map) &&
          !(afterValue instanceof Map)
        ) {
          // Check if there are any Map properties
          const beforeKeys = Object.keys(beforeValue);
          const afterKeys = Object.keys(afterValue);
          const beforeObj = beforeValue as Record<string, unknown>;
          const afterObj = afterValue as Record<string, unknown>;
          hasMapProperties =
            beforeKeys.some(k => beforeObj[k] instanceof Map) ||
            afterKeys.some(k => afterObj[k] instanceof Map);

          // If Map properties exist, compare them specially instead of JSON.stringify
          if (hasMapProperties) {
            // Compare non-Map properties with JSON.stringify
            const beforeWithoutMaps: Record<string, unknown> = {};
            const afterWithoutMaps: Record<string, unknown> = {};
            for (const k of new Set([...beforeKeys, ...afterKeys])) {
              const bv = (beforeValue as Record<string, unknown>)[k];
              const av = (afterValue as Record<string, unknown>)[k];
              if (!(bv instanceof Map) && !(av instanceof Map)) {
                beforeWithoutMaps[k] = bv;
                afterWithoutMaps[k] = av;
              }
            }
            const nonMapDifferent =
              JSON.stringify(beforeWithoutMaps) !== JSON.stringify(afterWithoutMaps);

            // Always recurse if there are Map properties, or if non-Map properties differ
            valuesAreDifferent = nonMapDifferent;

            // Always recurse when Map properties exist to check Map changes
            const nestedChanges = calculateChanges(beforeValue, afterValue, path);
            if (Object.keys(nestedChanges).length > 0) {
              Object.assign(changes, nestedChanges);
              valuesAreDifferent = true; // Mark as different if nested changes found
            }
          }
        }

        if (!hasMapProperties) {
          // No Map properties - use standard comparison
          if (beforeValue instanceof Map && afterValue instanceof Map) {
            // Map comparison - check if entries differ
            if (beforeValue.size !== afterValue.size) {
              valuesAreDifferent = true;
            } else {
              for (const [key, value] of beforeValue) {
                if (
                  !afterValue.has(key) ||
                  JSON.stringify(afterValue.get(key)) !== JSON.stringify(value)
                ) {
                  valuesAreDifferent = true;
                  break;
                }
              }
            }
          } else {
            // Use JSON.stringify for non-Map values
            valuesAreDifferent = JSON.stringify(beforeValue) !== JSON.stringify(afterValue);
          }

          if (valuesAreDifferent) {
            // Value changed
            if (
              typeof beforeValue === "object" &&
              beforeValue !== null &&
              typeof afterValue === "object" &&
              afterValue !== null &&
              !Array.isArray(beforeValue) &&
              !Array.isArray(afterValue)
            ) {
              // Recursively process nested objects
              const nestedChanges = calculateChanges(beforeValue, afterValue, path);
              Object.assign(changes, nestedChanges);
            } else {
              // Primitive or array change
              changes[path] = afterValue;
            }
          }
        }
      }
    }

    // Check for deleted keys
    for (const key of Object.keys(beforeObj)) {
      if (!(key in afterObj)) {
        const path = prefix ? `${prefix}.${key}` : key;
        changes[path] = undefined;
      }
    }
  } else if (JSON.stringify(before) !== JSON.stringify(after)) {
    // Primitive values changed
    if (prefix) {
      changes[prefix] = after;
    }
  }

  return changes;
}
