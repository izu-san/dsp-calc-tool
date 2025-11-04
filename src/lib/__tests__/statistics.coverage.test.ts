import { describe, it, expect } from "vitest";
import { calculateItemStatistics } from "../statistics";
import type { RecipeTreeNode } from "../../types/calculation";
import { PROLIFERATOR_DATA } from "../../types/settings";
import { createRecipeNode, createRawMaterialNode } from "../../test/factories/testDataFactory";

describe("statistics coverage tests", () => {
  describe("calculateItemStatistics edge cases", () => {
    it("should handle nodes with missing itemId", () => {
      const rawChild = createRawMaterialNode({
        itemId: 1001,
        itemName: "Iron Ore",
        targetOutputRate: 30,
        nodeId: "raw-1",
        miningFrom: "Iron Veins",
      });
      // itemId is missing - this should be handled gracefully
      delete (rawChild as { itemId?: number }).itemId;

      const mockNode = createRecipeNode({
        recipe: undefined,
        machine: undefined,
        targetOutputRate: 60,
        machineCount: 1,
        proliferator: { ...PROLIFERATOR_DATA.none, mode: "production" },
        power: { machines: 500, sorters: 100, dysonSphere: 0, total: 600 },
        inputs: [],
        children: [rawChild],
        conveyorBelts: { inputs: 0, outputs: 1, total: 1 },
        nodeId: "root",
      });

      const result = calculateItemStatistics(mockNode);

      expect(result).toBeDefined();
      expect(result.totalMachines).toBeGreaterThanOrEqual(0);
      expect(result.items).toBeDefined();
    });

    it("should handle nodes with undefined children", () => {
      const mockNode = createRecipeNode({
        recipe: undefined,
        machine: undefined,
        targetOutputRate: 60,
        machineCount: 1,
        proliferator: { ...PROLIFERATOR_DATA.none, mode: "production" },
        power: { machines: 500, sorters: 100, dysonSphere: 0, total: 600 },
        inputs: [],
        children: [],
        conveyorBelts: { inputs: 0, outputs: 1, total: 1 },
        nodeId: "root",
      });
      // This should be handled gracefully
      (mockNode as { children?: RecipeTreeNode[] }).children = undefined;

      const result = calculateItemStatistics(mockNode);

      expect(result).toBeDefined();
      expect(result.totalMachines).toBe(1);
      expect(result.items).toBeDefined();
    });

    it("should handle empty children array", () => {
      const mockNode = createRecipeNode({
        recipe: undefined,
        machine: undefined,
        targetOutputRate: 60,
        machineCount: 1,
        proliferator: { ...PROLIFERATOR_DATA.none, mode: "production" },
        power: { machines: 500, sorters: 100, dysonSphere: 0, total: 600 },
        inputs: [],
        children: [],
        conveyorBelts: { inputs: 0, outputs: 1, total: 1 },
        nodeId: "root",
      });

      const result = calculateItemStatistics(mockNode);

      expect(result).toBeDefined();
      expect(result.totalMachines).toBe(1);
      expect(result.items).toBeDefined();
    });

    it("should handle complex nested structures", () => {
      const rawChild = createRawMaterialNode({
        itemId: 1001,
        itemName: "Iron Ore",
        targetOutputRate: 15,
        nodeId: "raw-1",
        miningFrom: "Iron Veins",
      });

      const intermediateChild = createRecipeNode({
        recipe: undefined,
        machine: undefined,
        targetOutputRate: 30,
        machineCount: 1,
        proliferator: { ...PROLIFERATOR_DATA.none, mode: "production" },
        power: { machines: 250, sorters: 50, dysonSphere: 0, total: 300 },
        inputs: [],
        children: [rawChild],
        conveyorBelts: { inputs: 1, outputs: 1, total: 2 },
        nodeId: "intermediate-1",
      });

      const mockNode = createRecipeNode({
        recipe: undefined,
        machine: undefined,
        targetOutputRate: 60,
        machineCount: 1,
        proliferator: { ...PROLIFERATOR_DATA.none, mode: "production" },
        power: { machines: 500, sorters: 100, dysonSphere: 0, total: 600 },
        inputs: [],
        children: [intermediateChild],
        conveyorBelts: { inputs: 0, outputs: 1, total: 1 },
        nodeId: "root",
      });

      const result = calculateItemStatistics(mockNode);

      expect(result).toBeDefined();
      expect(result.totalMachines).toBeGreaterThan(0);
      expect(result.items).toBeDefined();
    });

    it("should handle nodes with missing itemName", () => {
      const rawChild = createRawMaterialNode({
        itemId: 1001,
        itemName: "Iron Ore",
        targetOutputRate: 30,
        nodeId: "raw-1",
        miningFrom: "Iron Veins",
      });
      // itemName is missing
      delete (rawChild as { itemName?: string }).itemName;

      const mockNode = createRecipeNode({
        recipe: undefined,
        machine: undefined,
        targetOutputRate: 60,
        machineCount: 1,
        proliferator: { ...PROLIFERATOR_DATA.none, mode: "production" },
        power: { machines: 500, sorters: 100, dysonSphere: 0, total: 600 },
        inputs: [],
        children: [rawChild],
        conveyorBelts: { inputs: 0, outputs: 1, total: 1 },
        nodeId: "root",
      });

      const result = calculateItemStatistics(mockNode);

      expect(result).toBeDefined();
      expect(result.totalMachines).toBeGreaterThanOrEqual(0);
      expect(result.items).toBeDefined();
    });
  });
});
