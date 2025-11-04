import { describe, it, expect, beforeEach } from "vitest";
import { useNodeOverrideStore } from "../nodeOverrideStore";
import type { NodeOverrideSettings } from "../../types";
import { PROLIFERATOR_DATA } from "../../types/settings";

describe("nodeOverrideStore", () => {
  beforeEach(() => {
    // Reset store to initial state
    useNodeOverrideStore.getState().clearAllOverrides();
  });

  describe("Initial State", () => {
    it("should have empty Map", () => {
      const { nodeOverrides } = useNodeOverrideStore.getState();

      expect(nodeOverrides).toBeInstanceOf(Map);
      expect(nodeOverrides.size).toBe(0);
    });
  });

  describe("setNodeOverride", () => {
    it("should add new node override", () => {
      const { setNodeOverride } = useNodeOverrideStore.getState();

      const override: NodeOverrideSettings = {
        proliferator: { ...PROLIFERATOR_DATA.mk1, mode: "speed" },
      };

      setNodeOverride("node-1", override);

      const { nodeOverrides } = useNodeOverrideStore.getState();
      expect(nodeOverrides.has("node-1")).toBe(true);
      expect(nodeOverrides.get("node-1")).toEqual(override);
    });

    it("should update existing node override", () => {
      const { setNodeOverride } = useNodeOverrideStore.getState();

      const override1: NodeOverrideSettings = {
        proliferator: { ...PROLIFERATOR_DATA.mk1, mode: "speed" },
      };
      const override2: NodeOverrideSettings = {
        proliferator: { ...PROLIFERATOR_DATA.mk2, mode: "production" },
      };

      setNodeOverride("node-1", override1);
      setNodeOverride("node-1", override2); // Update

      const { nodeOverrides } = useNodeOverrideStore.getState();
      expect(nodeOverrides.get("node-1")).toEqual(override2);
    });

    it("should increment version on each change", () => {
      const { setNodeOverride } = useNodeOverrideStore.getState();

      const initialVersion = useNodeOverrideStore.getState().version;

      setNodeOverride("node-1", { proliferator: { ...PROLIFERATOR_DATA.mk1, mode: "speed" } });
      const version1 = useNodeOverrideStore.getState().version;
      expect(version1).toBe(initialVersion + 1);

      setNodeOverride("node-2", { proliferator: { ...PROLIFERATOR_DATA.mk2, mode: "speed" } });
      const version2 = useNodeOverrideStore.getState().version;
      expect(version2).toBe(initialVersion + 2);
    });

    it("should handle multiple node overrides", () => {
      const { setNodeOverride } = useNodeOverrideStore.getState();

      setNodeOverride("node-1", { proliferator: { ...PROLIFERATOR_DATA.mk1, mode: "speed" } });
      setNodeOverride("node-2", { proliferator: { ...PROLIFERATOR_DATA.mk2, mode: "production" } });
      setNodeOverride("node-3", { proliferator: { ...PROLIFERATOR_DATA.mk3, mode: "speed" } });

      const { nodeOverrides } = useNodeOverrideStore.getState();
      expect(nodeOverrides.size).toBe(3);
      expect(nodeOverrides.has("node-1")).toBe(true);
      expect(nodeOverrides.has("node-2")).toBe(true);
      expect(nodeOverrides.has("node-3")).toBe(true);
    });

    it("should handle complex override settings", () => {
      const { setNodeOverride } = useNodeOverrideStore.getState();

      const override: NodeOverrideSettings = {
        proliferator: { ...PROLIFERATOR_DATA.mk3, mode: "production" },
        machineRank: "mk3",
      };

      setNodeOverride("node-complex", override);

      const { nodeOverrides } = useNodeOverrideStore.getState();
      const stored = nodeOverrides.get("node-complex");
      expect(stored).toEqual(override);
      expect(stored?.machineRank).toBe("mk3");
      expect(stored?.proliferator?.type).toBe("mk3");
    });
  });

  describe("clearNodeOverride", () => {
    it("should remove specific node override", () => {
      const { setNodeOverride, clearNodeOverride } = useNodeOverrideStore.getState();

      setNodeOverride("node-1", { proliferator: { ...PROLIFERATOR_DATA.mk1, mode: "speed" } });
      setNodeOverride("node-2", { proliferator: { ...PROLIFERATOR_DATA.mk2, mode: "speed" } });

      clearNodeOverride("node-1");

      const { nodeOverrides } = useNodeOverrideStore.getState();
      expect(nodeOverrides.has("node-1")).toBe(false);
      expect(nodeOverrides.has("node-2")).toBe(true);
      expect(nodeOverrides.size).toBe(1);
    });

    it("should increment version when clearing", () => {
      const { setNodeOverride, clearNodeOverride } = useNodeOverrideStore.getState();

      setNodeOverride("node-1", { proliferator: { ...PROLIFERATOR_DATA.mk1, mode: "speed" } });
      const versionBefore = useNodeOverrideStore.getState().version;

      clearNodeOverride("node-1");

      const versionAfter = useNodeOverrideStore.getState().version;
      expect(versionAfter).toBe(versionBefore + 1);
    });

    it("should handle clearing non-existent node", () => {
      const { clearNodeOverride } = useNodeOverrideStore.getState();

      clearNodeOverride("non-existent");

      const { nodeOverrides } = useNodeOverrideStore.getState();
      expect(nodeOverrides.size).toBe(0);
    });
  });

  describe("setAllOverrides", () => {
    it("should replace all overrides with new Map", () => {
      const { setNodeOverride, setAllOverrides } = useNodeOverrideStore.getState();

      // Set initial overrides
      setNodeOverride("node-1", { proliferator: { ...PROLIFERATOR_DATA.mk1, mode: "speed" } });
      setNodeOverride("node-2", { proliferator: { ...PROLIFERATOR_DATA.mk2, mode: "speed" } });

      // Replace with new Map
      const newOverrides = new Map<string, NodeOverrideSettings>();
      newOverrides.set("node-3", {
        proliferator: { ...PROLIFERATOR_DATA.mk3, mode: "production" },
      });
      newOverrides.set("node-4", { proliferator: { ...PROLIFERATOR_DATA.mk3, mode: "speed" } });

      setAllOverrides(newOverrides);

      const { nodeOverrides } = useNodeOverrideStore.getState();
      expect(nodeOverrides.size).toBe(2);
      expect(nodeOverrides.has("node-1")).toBe(false);
      expect(nodeOverrides.has("node-2")).toBe(false);
      expect(nodeOverrides.has("node-3")).toBe(true);
      expect(nodeOverrides.has("node-4")).toBe(true);
    });

    it("should create new Map instance", () => {
      const { setAllOverrides } = useNodeOverrideStore.getState();

      const sourceMap = new Map<string, NodeOverrideSettings>();
      sourceMap.set("node-1", { proliferator: { ...PROLIFERATOR_DATA.mk1, mode: "speed" } });

      setAllOverrides(sourceMap);

      const { nodeOverrides } = useNodeOverrideStore.getState();
      expect(nodeOverrides).not.toBe(sourceMap); // Different Map instance
      expect(nodeOverrides.get("node-1")).toEqual(sourceMap.get("node-1"));
    });

    it("should increment version", () => {
      const { setAllOverrides } = useNodeOverrideStore.getState();

      const versionBefore = useNodeOverrideStore.getState().version;

      const newOverrides = new Map<string, NodeOverrideSettings>();
      newOverrides.set("node-1", { proliferator: { ...PROLIFERATOR_DATA.mk1, mode: "speed" } });

      setAllOverrides(newOverrides);

      const versionAfter = useNodeOverrideStore.getState().version;
      expect(versionAfter).toBe(versionBefore + 1);
    });
  });

  describe("clearAllOverrides", () => {
    it("should remove all overrides", () => {
      const { setNodeOverride, clearAllOverrides } = useNodeOverrideStore.getState();

      setNodeOverride("node-1", { proliferator: { ...PROLIFERATOR_DATA.mk1, mode: "speed" } });
      setNodeOverride("node-2", { proliferator: { ...PROLIFERATOR_DATA.mk2, mode: "speed" } });
      setNodeOverride("node-3", { proliferator: { ...PROLIFERATOR_DATA.mk3, mode: "speed" } });

      clearAllOverrides();

      const { nodeOverrides } = useNodeOverrideStore.getState();
      expect(nodeOverrides.size).toBe(0);
    });

    it("should increment version", () => {
      const { setNodeOverride, clearAllOverrides } = useNodeOverrideStore.getState();

      setNodeOverride("node-1", { proliferator: { ...PROLIFERATOR_DATA.mk1, mode: "speed" } });
      const versionBefore = useNodeOverrideStore.getState().version;

      clearAllOverrides();

      const versionAfter = useNodeOverrideStore.getState().version;
      expect(versionAfter).toBe(versionBefore + 1);
    });

    it("should handle clearing empty overrides", () => {
      const { clearAllOverrides } = useNodeOverrideStore.getState();

      const versionBefore = useNodeOverrideStore.getState().version;
      clearAllOverrides();

      const { nodeOverrides, version } = useNodeOverrideStore.getState();
      expect(nodeOverrides.size).toBe(0);
      expect(version).toBe(versionBefore + 1);
    });
  });

  describe("Version tracking", () => {
    it("should track version monotonically", () => {
      const { setNodeOverride, clearNodeOverride } = useNodeOverrideStore.getState();

      const versions: number[] = [];

      versions.push(useNodeOverrideStore.getState().version);

      setNodeOverride("node-1", { proliferator: { ...PROLIFERATOR_DATA.mk1, mode: "speed" } });
      versions.push(useNodeOverrideStore.getState().version);

      setNodeOverride("node-2", { proliferator: { ...PROLIFERATOR_DATA.mk2, mode: "speed" } });
      versions.push(useNodeOverrideStore.getState().version);

      clearNodeOverride("node-1");
      versions.push(useNodeOverrideStore.getState().version);

      // Verify monotonic increase
      for (let i = 1; i < versions.length; i++) {
        expect(versions[i]).toBeGreaterThan(versions[i - 1]);
      }
    });

    it("should use version for dependency tracking", () => {
      const { setNodeOverride } = useNodeOverrideStore.getState();

      const version1 = useNodeOverrideStore.getState().version;

      // Simulate useEffect dependency
      setNodeOverride("node-1", { proliferator: { ...PROLIFERATOR_DATA.mk1, mode: "speed" } });
      const version2 = useNodeOverrideStore.getState().version;

      // Version changed, so effect should re-run
      expect(version2).not.toBe(version1);
    });
  });

  describe("Map operations", () => {
    it("should maintain Map immutability pattern", () => {
      const { setNodeOverride } = useNodeOverrideStore.getState();

      const map1 = useNodeOverrideStore.getState().nodeOverrides;

      setNodeOverride("node-1", { proliferator: { ...PROLIFERATOR_DATA.mk1, mode: "speed" } });

      const map2 = useNodeOverrideStore.getState().nodeOverrides;

      expect(map1).not.toBe(map2); // New Map instance created
    });

    it("should preserve other entries when updating one", () => {
      const { setNodeOverride } = useNodeOverrideStore.getState();

      setNodeOverride("node-1", { proliferator: { ...PROLIFERATOR_DATA.mk1, mode: "speed" } });
      setNodeOverride("node-2", { proliferator: { ...PROLIFERATOR_DATA.mk2, mode: "speed" } });

      const entry1Before = useNodeOverrideStore.getState().nodeOverrides.get("node-1");

      setNodeOverride("node-2", { proliferator: { ...PROLIFERATOR_DATA.mk3, mode: "production" } });

      const entry1After = useNodeOverrideStore.getState().nodeOverrides.get("node-1");

      expect(entry1After).toEqual(entry1Before); // node-1 unchanged
    });
  });
});
