import { create } from "zustand";
import type { NodeOverrideSettings } from "../types";

interface NodeOverrideStore {
  nodeOverrides: Map<string, NodeOverrideSettings>;
  /**
   * Monotonic counter that increments whenever overrides meaningfully change.
   * Use this for lightweight dependency tracking in effects to avoid recalculating
   * on every Map reference change.
   */
  version: number;
  setNodeOverride: (nodeId: string, settings: NodeOverrideSettings) => void;
  clearNodeOverride: (nodeId: string) => void;
  clearAllOverrides: () => void;
  setAllOverrides: (overrides: Map<string, NodeOverrideSettings>) => void;
}

export const useNodeOverrideStore = create<NodeOverrideStore>(set => ({
  nodeOverrides: new Map(),
  version: 0,

  setNodeOverride: (nodeId, settings) =>
    set(state => {
      const newOverrides = new Map(state.nodeOverrides);
      newOverrides.set(nodeId, settings);

      return { nodeOverrides: newOverrides, version: state.version + 1 };
    }),

  clearNodeOverride: nodeId =>
    set(state => {
      const newOverrides = new Map(state.nodeOverrides);
      newOverrides.delete(nodeId);
      return { nodeOverrides: newOverrides, version: state.version + 1 };
    }),

  setAllOverrides: overrides =>
    set(state => ({ nodeOverrides: new Map(overrides), version: state.version + 1 })),

  clearAllOverrides: () => set(state => ({ nodeOverrides: new Map(), version: state.version + 1 })),
}));
