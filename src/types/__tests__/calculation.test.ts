import { describe, it, expect } from "vitest";
import type {
  NodeOverrideSettings,
  RecipeTreeNode,
  RecipeInput,
  PowerConsumption,
  ConveyorBeltRequirement,
  CalculationResult,
  GridPosition,
} from "../calculation";

describe("calculation types", () => {
  describe("NodeOverrideSettings", () => {
    it("should have optional proliferator and machineRank properties", () => {
      const settings: NodeOverrideSettings = {};
      expect(settings).toBeDefined();

      const settingsWithProliferator: NodeOverrideSettings = {
        proliferator: { type: "none", level: 0 },
      };
      expect(settingsWithProliferator.proliferator).toBeDefined();

      const settingsWithMachineRank: NodeOverrideSettings = {
        machineRank: "mk2",
      };
      expect(settingsWithMachineRank.machineRank).toBe("mk2");
    });
  });

  describe("RecipeInput", () => {
    it("should have required properties", () => {
      const input: RecipeInput = {
        itemId: 1001,
        itemName: "Iron Ore",
        requiredRate: 30,
      };

      expect(input.itemId).toBe(1001);
      expect(input.itemName).toBe("Iron Ore");
      expect(input.requiredRate).toBe(30);
    });
  });

  describe("PowerConsumption", () => {
    it("should have power consumption properties", () => {
      const power: PowerConsumption = {
        machines: 1000,
        sorters: 200,
        total: 1200,
      };

      expect(power.machines).toBe(1000);
      expect(power.sorters).toBe(200);
      expect(power.total).toBe(1200);
    });
  });

  describe("ConveyorBeltRequirement", () => {
    it("should have conveyor belt properties", () => {
      const belts: ConveyorBeltRequirement = {
        inputs: 2,
        outputs: 1,
        total: 3,
        saturation: 85,
        bottleneckType: "input",
      };

      expect(belts.inputs).toBe(2);
      expect(belts.outputs).toBe(1);
      expect(belts.total).toBe(3);
      expect(belts.saturation).toBe(85);
      expect(belts.bottleneckType).toBe("input");
    });
  });

  describe("GridPosition", () => {
    it("should have grid coordinates", () => {
      const position: GridPosition = {
        x: 5,
        y: 3,
        z: 1,
      };

      expect(position.x).toBe(5);
      expect(position.y).toBe(3);
      expect(position.z).toBe(1);
    });
  });

  describe("RecipeTreeNode", () => {
    it("should handle raw material nodes", () => {
      const rawMaterialNode: RecipeTreeNode = {
        targetOutputRate: 30,
        machineCount: 0,
        proliferator: { type: "none", level: 0 },
        power: { machines: 0, sorters: 0, total: 0 },
        inputs: [],
        children: [],
        conveyorBelts: { inputs: 0, outputs: 1, total: 1 },
        nodeId: "raw-iron-1",
        isRawMaterial: true,
        itemId: 1001,
        itemName: "Iron Ore",
        miningFrom: "Iron Veins",
      };

      expect(rawMaterialNode.isRawMaterial).toBe(true);
      expect(rawMaterialNode.itemId).toBe(1001);
      expect(rawMaterialNode.miningFrom).toBe("Iron Veins");
    });

    it("should handle production nodes", () => {
      const productionNode: RecipeTreeNode = {
        targetOutputRate: 60,
        machineCount: 2,
        proliferator: { type: "speed", level: 3 },
        power: { machines: 1000, sorters: 200, total: 1200 },
        inputs: [{ itemId: 1001, itemName: "Iron Ore", requiredRate: 30 }],
        children: [],
        conveyorBelts: { inputs: 1, outputs: 1, total: 2 },
        nodeId: "smelt-iron-1",
        overrideSettings: {
          proliferator: { type: "speed", level: 3 },
          machineRank: "mk2",
        },
      };

      expect(productionNode.machineCount).toBe(2);
      expect(productionNode.overrideSettings?.machineRank).toBe("mk2");
    });
  });

  describe("CalculationResult", () => {
    it("should contain calculation results", () => {
      const result: CalculationResult = {
        rootNode: {
          targetOutputRate: 60,
          machineCount: 1,
          proliferator: { type: "none", level: 0 },
          power: { machines: 500, sorters: 100, total: 600 },
          inputs: [],
          children: [],
          conveyorBelts: { inputs: 0, outputs: 1, total: 1 },
          nodeId: "root",
        },
        totalPower: { machines: 500, sorters: 100, total: 600 },
        totalMachines: 1,
        rawMaterials: new Map([[1001, 30]]),
      };

      expect(result.rootNode).toBeDefined();
      expect(result.totalMachines).toBe(1);
      expect(result.rawMaterials.get(1001)).toBe(30);
    });
  });
});
