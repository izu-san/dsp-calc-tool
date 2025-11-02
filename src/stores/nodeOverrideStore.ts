import { create } from "zustand";
import i18n from "../i18n";
import type { NodeOverrideSettings } from "../types";
import {
  generateNodeOverrideDescription,
  generateNodeOverrideResetDescription,
} from "../utils/historyDescriptionHelper";
import { recordHistoryEntry } from "../utils/historyRecorder";

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
      const before = state.nodeOverrides.get(nodeId);
      const after = settings;

      // Record history
      const t = (key: string) => i18n.t(key);
      const description = generateNodeOverrideDescription(nodeId, t, i18n.language);
      recordHistoryEntry(
        "nodeOverride",
        description,
        { [`nodeOverrides.${nodeId}`]: before },
        { [`nodeOverrides.${nodeId}`]: after },
        [nodeId]
      );

      const newOverrides = new Map(state.nodeOverrides);
      newOverrides.set(nodeId, settings);

      return { nodeOverrides: newOverrides, version: state.version + 1 };
    }),

  clearNodeOverride: nodeId =>
    set(state => {
      const before = state.nodeOverrides.get(nodeId);

      // Record history
      const t = (key: string) => i18n.t(key);
      const description = generateNodeOverrideResetDescription(nodeId, t, i18n.language);
      recordHistoryEntry(
        "nodeOverride",
        description,
        { [`nodeOverrides.${nodeId}`]: before },
        { [`nodeOverrides.${nodeId}`]: undefined },
        [nodeId]
      );

      const newOverrides = new Map(state.nodeOverrides);
      newOverrides.delete(nodeId);
      return { nodeOverrides: newOverrides, version: state.version + 1 };
    }),

  setAllOverrides: overrides =>
    set(state => ({ nodeOverrides: new Map(overrides), version: state.version + 1 })),

  clearAllOverrides: () => set(state => ({ nodeOverrides: new Map(), version: state.version + 1 })),
}));
