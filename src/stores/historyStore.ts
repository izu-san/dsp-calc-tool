import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { HistoryEntry, SavedPlan, SavedPlanVersion } from "../types";
import {
  generateUUID,
  HISTORY_VERSION,
  validateHistoryEntry,
  migrateHistoryEntry,
} from "../utils/history/events";

/**
 * History store interface
 */
interface HistoryStore {
  // History stack
  entries: HistoryEntry[];
  // Current position (index)
  currentIndex: number;
  // Maximum history size
  maxHistorySize: number;

  // Actions
  pushEntry: (entry: HistoryEntry) => void;
  undo: () => HistoryEntry | null;
  redo: () => HistoryEntry | null;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clearHistory: () => void;

  // Plan version management
  planVersions: Map<string, SavedPlanVersion[]>; // planId -> versions
  savePlanVersion: (plan: SavedPlan, planId?: string) => string; // Returns planId
  getPlanVersions: (planId: string) => SavedPlanVersion[];
  loadPlanVersion: (planId: string, version: number) => SavedPlan | null;
  loadLatestPlanVersion: (planId: string) => SavedPlan | null;
}

/**
 * Serialized format for localStorage persistence
 */
interface SerializedHistoryStore {
  entries: HistoryEntry[];
  currentIndex: number;
  maxHistorySize: number;
  planVersions: Array<[string, SavedPlanVersion[]]>; // Map serialization
}

const MAX_HISTORY_SIZE = 50;

export const useHistoryStore = create<HistoryStore>()(
  persist(
    (set, get) => ({
      entries: [],
      currentIndex: -1,
      maxHistorySize: MAX_HISTORY_SIZE,
      planVersions: new Map(),

      pushEntry: (entry: HistoryEntry) => {
        const state = get();

        // If we're not at the end of history, remove entries after currentIndex
        const newEntries =
          state.currentIndex < state.entries.length - 1
            ? state.entries.slice(0, state.currentIndex + 1)
            : [...state.entries];

        // Add new entry
        newEntries.push({
          ...entry,
          version: entry.version || HISTORY_VERSION,
        });

        // Trim to max size (remove oldest entries)
        const trimmedEntries =
          newEntries.length > state.maxHistorySize
            ? newEntries.slice(-state.maxHistorySize)
            : newEntries;

        // Update current index to the last entry
        const newIndex = trimmedEntries.length - 1;

        set({
          entries: trimmedEntries,
          currentIndex: newIndex,
        });
      },

      undo: () => {
        const state = get();
        if (!state.canUndo()) {
          return null;
        }

        const newIndex = state.currentIndex - 1;
        set({ currentIndex: newIndex });

        return state.entries[newIndex] || null;
      },

      redo: () => {
        const state = get();
        if (!state.canRedo()) {
          return null;
        }

        const newIndex = state.currentIndex + 1;
        set({ currentIndex: newIndex });

        return state.entries[newIndex] || null;
      },

      canUndo: () => {
        const state = get();
        return state.currentIndex >= 0;
      },

      canRedo: () => {
        const state = get();
        return state.currentIndex < state.entries.length - 1;
      },

      clearHistory: () => {
        set({
          entries: [],
          currentIndex: -1,
        });
      },

      savePlanVersion: (plan: SavedPlan, planId?: string): string => {
        const state = get();

        // Use provided planId or generate new one
        const newPlanId = planId || plan.planId || generateUUID();

        // Get existing versions for this plan
        const existingVersions = state.planVersions.get(newPlanId) || [];

        // Determine new version number
        const newVersion =
          existingVersions.length > 0
            ? Math.max(...existingVersions.map(v => v.version)) + 1
            : plan.version || 1;

        // Create version entry
        const planVersion: SavedPlanVersion = {
          planId: newPlanId,
          version: newVersion,
          timestamp: plan.timestamp || Date.now(),
          plan: {
            ...plan,
            planId: newPlanId,
            version: newVersion,
          },
        };

        // Add to versions
        const updatedVersions = [...existingVersions, planVersion];
        const newPlanVersions = new Map(state.planVersions);
        newPlanVersions.set(newPlanId, updatedVersions);

        set({ planVersions: newPlanVersions });

        return newPlanId;
      },

      getPlanVersions: (planId: string): SavedPlanVersion[] => {
        const state = get();
        return state.planVersions.get(planId) || [];
      },

      loadPlanVersion: (planId: string, version: number): SavedPlan | null => {
        const state = get();
        const versions = state.planVersions.get(planId);
        if (!versions) {
          return null;
        }

        const planVersion = versions.find(v => v.version === version);
        return planVersion ? planVersion.plan : null;
      },

      loadLatestPlanVersion: (planId: string): SavedPlan | null => {
        const state = get();
        const versions = state.planVersions.get(planId);
        if (!versions || versions.length === 0) {
          return null;
        }

        // Return the plan with the highest version number
        const latestVersion = versions.reduce((latest, current) =>
          current.version > latest.version ? current : latest
        );
        return latestVersion.plan;
      },
    }),
    {
      name: "dsp-calculator-history-store",
      storage: {
        getItem: name => {
          const str = localStorage.getItem(name);
          if (!str) return null;

          try {
            const data: SerializedHistoryStore = JSON.parse(str);

            // Migrate and validate entries
            const migratedEntries: HistoryEntry[] = [];
            for (const entry of data.entries || []) {
              const validation = validateHistoryEntry(entry);
              if (!validation.valid) {
                console.warn("Invalid history entry, skipping:", validation.error);
                continue;
              }

              const migrated = validation.needsMigration ? migrateHistoryEntry(entry) : entry;

              if (migrated) {
                migratedEntries.push(migrated);
              }
            }

            // Restore plan versions from serialized format
            const planVersions = new Map<string, SavedPlanVersion[]>();
            if (data.planVersions) {
              for (const [planId, versions] of data.planVersions) {
                planVersions.set(planId, versions);
              }
            }

            return {
              state: {
                entries: migratedEntries,
                currentIndex: data.currentIndex ?? -1,
                maxHistorySize: data.maxHistorySize ?? MAX_HISTORY_SIZE,
                planVersions,
              },
            };
          } catch (error) {
            console.error("Failed to deserialize history store:", error);
            return null;
          }
        },
        setItem: (name, value) => {
          try {
            // Serialize plan versions Map to array
            const planVersionsArray: Array<[string, SavedPlanVersion[]]> = Array.from(
              value.state.planVersions.entries()
            );

            const serialized: SerializedHistoryStore = {
              entries: value.state.entries,
              currentIndex: value.state.currentIndex,
              maxHistorySize: value.state.maxHistorySize,
              planVersions: planVersionsArray,
            };

            localStorage.setItem(name, JSON.stringify(serialized));
          } catch (error) {
            console.error("Failed to serialize history store:", error);
          }
        },
        removeItem: name => localStorage.removeItem(name),
      },
      partialize: state => ({
        entries: state.entries,
        currentIndex: state.currentIndex,
        maxHistorySize: state.maxHistorySize,
        planVersions: state.planVersions,
      }),
    }
  )
);
