import { describe, it, expect } from "vitest";
import {
  calculateTotalPower,
  calculateTotalMachines,
  calculateRawMaterials,
} from "../aggregations";
import type { RecipeTreeNode, Recipe } from "../../../types";
import { PROLIFERATOR_DATA, CONVEYOR_BELT_DATA, SORTER_DATA } from "../../../types/settings";

describe("aggregations", () => {
  const createMockNode = (overrides?: Partial<RecipeTreeNode>): RecipeTreeNode => {
    const mockRecipe: Recipe = {
      SID: 1,
      name: "Test Recipe",
      TimeSpend: 60,
      Results: [{ id: 1, name: "Test Item", count: 1, Type: "0", isRaw: false }],
      Items: [],
      Type: "Assemble",
      Explicit: false,
      GridIndex: "1",
      productive: true,
    };

    return {
      recipe: mockRecipe,
      targetOutputRate: 1,
      machineCount: 1,
      proliferator: { ...PROLIFERATOR_DATA.none, mode: "speed" },
      power: { machines: 100, sorters: 10, total: 110 },
      inputs: [],
      children: [],
      conveyorBelts: { inputs: 0, outputs: 0, total: 0 },
      nodeId: "test-node",
      ...overrides,
    };
  };

  describe("calculateTotalPower", () => {
    it("should calculate power for single node", () => {
      const node = createMockNode({
        power: { machines: 100, sorters: 10, total: 110 },
      });

      const result = calculateTotalPower(node);

      expect(result.machines).toBe(100);
      expect(result.sorters).toBe(10);
      expect(result.total).toBe(110);
    });

    it("should sum power across tree", () => {
      const child1 = createMockNode({
        power: { machines: 50, sorters: 5, total: 55 },
        nodeId: "child1",
      });

      const child2 = createMockNode({
        power: { machines: 30, sorters: 3, total: 33 },
        nodeId: "child2",
      });

      const parent = createMockNode({
        power: { machines: 100, sorters: 10, total: 110 },
        children: [child1, child2],
      });

      const result = calculateTotalPower(parent);

      expect(result.machines).toBe(180); // 100 + 50 + 30
      expect(result.sorters).toBe(18); // 10 + 5 + 3
      expect(result.total).toBe(198); // 180 + 18
    });

    it("should handle deep tree structures", () => {
      const grandchild = createMockNode({
        power: { machines: 20, sorters: 2, total: 22 },
        nodeId: "grandchild",
      });

      const child = createMockNode({
        power: { machines: 50, sorters: 5, total: 55 },
        children: [grandchild],
        nodeId: "child",
      });

      const parent = createMockNode({
        power: { machines: 100, sorters: 10, total: 110 },
        children: [child],
      });

      const result = calculateTotalPower(parent);

      expect(result.machines).toBe(170); // 100 + 50 + 20
      expect(result.sorters).toBe(17); // 10 + 5 + 2
      expect(result.total).toBe(187);
    });
  });

  describe("calculateTotalMachines", () => {
    it("should count machines for single node", () => {
      const node = createMockNode({ machineCount: 5 });

      const result = calculateTotalMachines(node);

      expect(result).toBe(5);
    });

    it("should sum machines across tree", () => {
      const child1 = createMockNode({ machineCount: 3, nodeId: "child1" });
      const child2 = createMockNode({ machineCount: 2, nodeId: "child2" });
      const parent = createMockNode({
        machineCount: 5,
        children: [child1, child2],
      });

      const result = calculateTotalMachines(parent);

      expect(result).toBe(10); // 5 + 3 + 2
    });

    it("should handle deep tree structures", () => {
      const grandchild = createMockNode({ machineCount: 1, nodeId: "grandchild" });
      const child = createMockNode({
        machineCount: 2,
        children: [grandchild],
        nodeId: "child",
      });
      const parent = createMockNode({
        machineCount: 3,
        children: [child],
      });

      const result = calculateTotalMachines(parent);

      expect(result).toBe(6); // 3 + 2 + 1
    });

    it("should handle raw material nodes with zero machines", () => {
      const rawNode = createMockNode({
        isRawMaterial: true,
        machineCount: 0,
        nodeId: "raw",
      });
      const parent = createMockNode({
        machineCount: 5,
        children: [rawNode],
      });

      const result = calculateTotalMachines(parent);

      expect(result).toBe(5); // 5 + 0
    });
  });

  describe("calculateRawMaterials", () => {
    it("should collect raw materials from tree", () => {
      const rawNode = createMockNode({
        isRawMaterial: true,
        itemId: 1001,
        itemName: "Iron Ore",
        targetOutputRate: 10,
        nodeId: "raw-1001",
      });

      const parent = createMockNode({
        children: [rawNode],
      });

      const result = calculateRawMaterials(parent);

      expect(result.size).toBe(1);
      expect(result.get(1001)).toBe(10);
    });

    it("should sum same raw materials from multiple nodes", () => {
      const rawNode1 = createMockNode({
        isRawMaterial: true,
        itemId: 1001,
        targetOutputRate: 10,
        nodeId: "raw-1",
      });

      const rawNode2 = createMockNode({
        isRawMaterial: true,
        itemId: 1001,
        targetOutputRate: 5,
        nodeId: "raw-2",
      });

      const parent = createMockNode({
        children: [rawNode1, rawNode2],
      });

      const result = calculateRawMaterials(parent);

      expect(result.size).toBe(1);
      expect(result.get(1001)).toBe(15); // 10 + 5
    });

    it("should collect multiple different raw materials", () => {
      const ironNode = createMockNode({
        isRawMaterial: true,
        itemId: 1001,
        targetOutputRate: 10,
        nodeId: "raw-iron",
      });

      const copperNode = createMockNode({
        isRawMaterial: true,
        itemId: 1002,
        targetOutputRate: 5,
        nodeId: "raw-copper",
      });

      const parent = createMockNode({
        children: [ironNode, copperNode],
      });

      const result = calculateRawMaterials(parent);

      expect(result.size).toBe(2);
      expect(result.get(1001)).toBe(10);
      expect(result.get(1002)).toBe(5);
    });

    it("should handle deep tree structures", () => {
      const grandchildRaw = createMockNode({
        isRawMaterial: true,
        itemId: 1001,
        targetOutputRate: 3,
        nodeId: "grandchild-raw",
      });

      const childRaw = createMockNode({
        isRawMaterial: true,
        itemId: 1001,
        targetOutputRate: 5,
        nodeId: "child-raw",
      });

      const child = createMockNode({
        children: [childRaw, grandchildRaw],
        nodeId: "child",
      });

      const parentRaw = createMockNode({
        isRawMaterial: true,
        itemId: 1002,
        targetOutputRate: 7,
        nodeId: "parent-raw",
      });

      const parent = createMockNode({
        children: [child, parentRaw],
      });

      const result = calculateRawMaterials(parent);

      expect(result.size).toBe(2);
      expect(result.get(1001)).toBe(8); // 5 + 3
      expect(result.get(1002)).toBe(7);
    });
  });
});
