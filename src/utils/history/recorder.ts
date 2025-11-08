import type { HistoryEntry, HistoryEntryType } from "../../types/history";
import type { SavedPlan } from "../../types";
import { useHistoryStore } from "../../stores/historyStore";
import { generateUUID, HISTORY_VERSION, calculateChanges } from "./events";
import { historyDebouncer, DEBOUNCE_TIMES } from "./debouncer";
import i18n from "../../i18n";

/**
 * Flag to prevent recording history during state restoration
 * This prevents infinite loops when restoring state triggers store updates
 */
let isRestoringState = false;

/**
 * Flag to prevent recording history for internal changes
 * This prevents recording automatic changes that are not user-initiated
 */
let isInternalChange = false;

/**
 * Check if currently restoring state from history
 */
export function isRestoring(): boolean {
  return isRestoringState;
}

/**
 * Set restoring flag (used by historyRestore)
 */
export function setRestoring(restoring: boolean): void {
  isRestoringState = restoring;
}

/**
 * Check if currently recording internal changes
 */
export function isInternal(): boolean {
  return isInternalChange;
}

/**
 * Set internal change flag (used to prevent recording automatic changes)
 */
export function setInternal(internal: boolean): void {
  isInternalChange = internal;
}

/**
 * Record a history entry with automatic debouncing
 */
export function recordHistoryEntry(
  type: HistoryEntryType,
  description: string,
  before: unknown,
  after: unknown,
  affectedNodes?: string[]
): void {
  // Don't record history if we're currently restoring state from history
  if (isRestoringState) {
    return;
  }

  // Don't record history if this is an internal automatic change
  if (isInternalChange) {
    return;
  }

  // Don't record history if description is empty (used to skip certain changes)
  if (!description || description === "") {
    return;
  }

  const changes = calculateChanges(before, after);

  // If no changes detected, skip recording
  if (Object.keys(changes).length === 0) {
    return;
  }

  // Calculate previous changes (for undo)
  const previousChanges = calculateChanges(after, before);

  const entry: HistoryEntry = {
    id: generateUUID(),
    timestamp: Date.now(),
    type,
    description,
    changes, // 変更後の状態（Redo用）
    previousChanges, // 変更前の状態（Undo用）
    version: HISTORY_VERSION,
    affectedNodes,
    locale: i18n.language,
  };

  const delay = DEBOUNCE_TIMES[type] ?? 500;
  const pushEntry = useHistoryStore.getState().pushEntry;

  if (delay === 0) {
    // Immediate recording (no debounce)
    pushEntry(entry);
  } else {
    // Debounced recording
    historyDebouncer.debounce(entry, delay, pushEntry);
  }
}

/**
 * Record a history entry with plan snapshot (for plan save operations)
 */
export function recordPlanSaveEntry(
  description: string,
  plan: unknown, // SavedPlan
  before?: unknown,
  after?: unknown
): void {
  const changes = before && after ? calculateChanges(before, after) : {};

  const entry: HistoryEntry = {
    id: generateUUID(),
    timestamp: Date.now(),
    type: "plan",
    description,
    changes,
    version: HISTORY_VERSION,
    planSnapshot: plan as SavedPlan,
    locale: i18n.language,
  };

  // Plan saves are always immediate (no debounce)
  useHistoryStore.getState().pushEntry(entry);
}

/**
 * Generate description for setting change
 */
export function generateSettingsDescription(
  action: string,
  params: Record<string, unknown>
): string {
  // Basic description generation
  // Can be enhanced with i18n later
  const descriptions: Record<string, (p: Record<string, unknown>) => string> = {
    setProliferator: p => `増産剤を${p.type}に変更（${p.mode}）`,
    setMachineRank: p => `${p.recipeType}を${p.rank}に変更`,
    setConveyorBelt: p => `コンベアベルトを${p.tier}に変更`,
    setSorter: p => `ソーターを${p.tier}に変更`,
    setAlternativeRecipe: p => `${p.itemName}の代替レシピを変更`,
    setMiningSpeedResearch: p => `採掘速度研究を${p.bonus}%に変更`,
    setProliferatorMultiplier: p => `増産剤倍率を変更（生産:${p.production}x、速度:${p.speed}x）`,
    applyTemplate: p => `テンプレート「${p.templateId}」を適用`,
  };

  const generator = descriptions[action];
  return generator ? generator(params) : `${action}を変更`;
}
