import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { BuildingRoadmap, BuildingRoadmapState } from "../types/roadmap";

interface BuildingRoadmapStore {
  // Current roadmap state
  currentRoadmap: BuildingRoadmap | null;

  // Check state (nodeId -> isCompleted)
  nodeCompletions: Map<string, boolean>;

  // Actions
  generateRoadmap: (
    roadmap: BuildingRoadmap,
    existingCompletions?: Record<string, boolean>
  ) => void;
  toggleNodeCompletion: (nodeId: string) => void;
  togglePhaseCompletion: (phaseNumber: number) => void;
  resetAllCompletions: () => void;

  // Persistence
  saveToPlan: (planId: string) => void;
  loadFromPlan: (planId: string) => Record<string, boolean> | null;

  // Internal: update roadmap
  setRoadmap: (roadmap: BuildingRoadmap | null) => void;
}

export const useBuildingRoadmapStore = create<BuildingRoadmapStore>()(
  persist(
    (set, get) => ({
      currentRoadmap: null,
      nodeCompletions: new Map(),

      generateRoadmap: (roadmap, existingCompletions) => {
        // Apply existing completions if provided
        const completions = new Map<string, boolean>();
        if (existingCompletions) {
          Object.entries(existingCompletions).forEach(([nodeId, isCompleted]) => {
            completions.set(nodeId, isCompleted);
          });
        }

        // Update roadmap with completion states
        roadmap.phases.forEach(phase => {
          phase.nodes.forEach(node => {
            const isCompleted = completions.get(node.nodeId) || false;
            node.isCompleted = isCompleted;
          });
          phase.completedCount = phase.nodes.filter(n => n.isCompleted).length;
          phase.isCompleted = phase.completedCount === phase.totalCount && phase.totalCount > 0;
        });

        set({
          currentRoadmap: roadmap,
          nodeCompletions: completions,
        });
      },

      toggleNodeCompletion: (nodeId: string) => {
        const state = get();
        const newCompletions = new Map(state.nodeCompletions);
        const current = newCompletions.get(nodeId) || false;
        newCompletions.set(nodeId, !current);

        // Update roadmap if exists
        if (state.currentRoadmap) {
          const updatedRoadmap = { ...state.currentRoadmap };
          updatedRoadmap.phases = updatedRoadmap.phases.map(phase => {
            const updatedNodes = phase.nodes.map(node => {
              if (node.nodeId === nodeId) {
                return { ...node, isCompleted: !current };
              }
              return node;
            });
            const completedCount = updatedNodes.filter(n => n.isCompleted).length;
            return {
              ...phase,
              nodes: updatedNodes,
              completedCount,
              isCompleted: completedCount === phase.totalCount && phase.totalCount > 0,
            };
          });
          updatedRoadmap.updatedAt = Date.now();

          set({
            currentRoadmap: updatedRoadmap,
            nodeCompletions: newCompletions,
          });
        } else {
          set({ nodeCompletions: newCompletions });
        }
      },

      togglePhaseCompletion: (phaseNumber: number) => {
        const state = get();
        if (!state.currentRoadmap) return;

        const phase = state.currentRoadmap.phases.find(p => p.phaseNumber === phaseNumber);
        if (!phase) return;

        const allCompleted = phase.isCompleted;
        const newCompletions = new Map(state.nodeCompletions);

        phase.nodes.forEach(node => {
          newCompletions.set(node.nodeId, !allCompleted);
        });

        // Update roadmap
        const updatedRoadmap = { ...state.currentRoadmap };
        updatedRoadmap.phases = updatedRoadmap.phases.map(p => {
          if (p.phaseNumber === phaseNumber) {
            const updatedNodes = p.nodes.map(node => ({ ...node, isCompleted: !allCompleted }));
            const completedCount = !allCompleted ? p.totalCount : 0;
            return {
              ...p,
              nodes: updatedNodes,
              completedCount,
              isCompleted: !allCompleted,
            };
          }
          return p;
        });
        updatedRoadmap.updatedAt = Date.now();

        set({
          currentRoadmap: updatedRoadmap,
          nodeCompletions: newCompletions,
        });
      },

      resetAllCompletions: () => {
        const state = get();
        const newCompletions = new Map<string, boolean>();

        if (state.currentRoadmap) {
          const updatedRoadmap = { ...state.currentRoadmap };
          updatedRoadmap.phases = updatedRoadmap.phases.map(phase => {
            const updatedNodes = phase.nodes.map(node => ({ ...node, isCompleted: false }));
            return {
              ...phase,
              nodes: updatedNodes,
              completedCount: 0,
              isCompleted: false,
            };
          });
          updatedRoadmap.updatedAt = Date.now();

          set({
            currentRoadmap: updatedRoadmap,
            nodeCompletions: newCompletions,
          });
        } else {
          set({ nodeCompletions: newCompletions });
        }
      },

      saveToPlan: (planId: string) => {
        const state = get();
        const completions: Record<string, boolean> = {};
        state.nodeCompletions.forEach((isCompleted, nodeId) => {
          completions[nodeId] = isCompleted;
        });

        const roadmapState: BuildingRoadmapState = {
          planId,
          nodeCompletions: completions,
          lastUpdated: Date.now(),
        };

        localStorage.setItem(`dsp-calculator-roadmap-${planId}`, JSON.stringify(roadmapState));
      },

      loadFromPlan: (planId: string) => {
        const stored = localStorage.getItem(`dsp-calculator-roadmap-${planId}`);
        if (!stored) return null;

        try {
          const roadmapState: BuildingRoadmapState = JSON.parse(stored);
          return roadmapState.nodeCompletions;
        } catch {
          return null;
        }
      },

      setRoadmap: roadmap => {
        set({ currentRoadmap: roadmap });
      },
    }),
    {
      name: "building-roadmap-store",
      partialize: state => ({
        // Don't persist currentRoadmap (recalculated on load)
        // Only persist nodeCompletions per plan
        nodeCompletions: Object.fromEntries(state.nodeCompletions),
      }),
    }
  )
);
