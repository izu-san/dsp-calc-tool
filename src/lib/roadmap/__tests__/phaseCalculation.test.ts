import { describe, it, expect, beforeEach } from "vitest";
import type { RecipeTreeNode } from "../../../types/calculation";
import type { GameData } from "../../../types/game-data";
import { calculatePhases } from "../phaseCalculation";
import {
  createMockGameData,
  createMockRecipe,
  createMockItem,
  createRawMaterialNode,
  createRecipeNode,
  createMachineByType,
  createDefaultPowerConsumption,
  createDefaultConveyorBelts,
} from "../../../test/factories/testDataFactory";
import { PROLIFERATOR_DATA } from "../../../types/settings";
import i18n from "../../../i18n";

/**
 * Test helper to create a RecipeTreeNode
 */
function createRecipeTreeNode(
  itemId: number,
  itemName: string,
  isRawMaterial: boolean,
  recipe?: ReturnType<typeof createMockRecipe>,
  children: RecipeTreeNode[] = []
): RecipeTreeNode {
  if (isRawMaterial) {
    return createRawMaterialNode({
      itemId,
      itemName,
      targetOutputRate: 30,
      nodeId: `node-${itemId}`,
      miningFrom: "Gas Giant Orbit",
    });
  }

  if (!recipe) {
    throw new Error("Recipe is required for non-raw material nodes");
  }

  const machine = createMachineByType({
    id: 2301,
    name: "Assembler Mk.I",
    type: "Assemble",
  });

  return createRecipeNode({
    recipe,
    machine,
    nodeId: `node-${itemId}`,
    targetOutputRate: 30,
    machineCount: 10,
    proliferator: { ...PROLIFERATOR_DATA.none, mode: "production" },
    power: createDefaultPowerConsumption({
      machines: 0,
      sorters: 0,
      dysonSphere: 0,
      total: 0,
    }),
    inputs: [],
    children,
    conveyorBelts: createDefaultConveyorBelts({
      inputs: 0,
      outputs: 1,
      total: 1,
    }),
    itemId,
    itemName,
  });
}

function extractStageFromTitle(title: string): number | null {
  const jaMatch = title.match(/(\d+)次加工/);
  if (jaMatch) {
    return Number(jaMatch[1]);
  }

  const enMatch = title.match(/Stage\s+(\d+)/i);
  if (enMatch) {
    return Number(enMatch[1]);
  }

  return null;
}

describe("phaseCalculation - Hydrogen and Deuterium placement", () => {
  const HYDROGEN_ID = 1120;
  const DEUTERIUM_ID = 1121;
  const CRITICAL_PHOTON_ID = 1208;

  let gameData: GameData;

  beforeEach(() => {
    gameData = createMockGameData();
    // Add Hydrogen and Deuterium to gameData
    gameData.items.set(HYDROGEN_ID, {
      id: HYDROGEN_ID,
      name: "水素",
      Type: "Item",
      isRaw: true,
      count: 0,
    });
    gameData.items.set(DEUTERIUM_ID, {
      id: DEUTERIUM_ID,
      name: "重水素",
      Type: "Item",
      isRaw: true,
      count: 0,
    });
    gameData.items.set(CRITICAL_PHOTON_ID, {
      id: CRITICAL_PHOTON_ID,
      name: "臨界光子",
      Type: "Item",
      isRaw: false,
      count: 0,
    });
  });

  describe("Hydrogen", () => {
    it("should appear ONLY in Phase 1 when mined (isRawMaterial === true)", () => {
      // Create a root node that uses Hydrogen (mined)
      const hydrogenNode = createRecipeTreeNode(HYDROGEN_ID, "水素", true);
      const rootNode = createRecipeNode({
        recipe: createMockRecipe(1, "Test Recipe"),
        machine: createMachineByType({
          id: 2301,
          name: "Assembler Mk.I",
          type: "Assemble",
        }),
        nodeId: "root",
        targetOutputRate: 30,
        machineCount: 10,
        proliferator: { ...PROLIFERATOR_DATA.none, mode: "production" },
        power: createDefaultPowerConsumption({
          machines: 0,
          sorters: 0,
          dysonSphere: 0,
          total: 0,
        }),
        inputs: [],
        children: [hydrogenNode],
        conveyorBelts: createDefaultConveyorBelts({
          inputs: 0,
          outputs: 1,
          total: 1,
        }),
      });

      const phases = calculatePhases(rootNode, gameData);

      // Hydrogen should appear ONLY in Phase 1
      const phase1 = phases.find(p => p.phaseNumber === 1);
      const phase2AndAbove = phases.filter(p => p.phaseNumber >= 2);

      expect(phase1).toBeDefined();
      expect(phase1?.nodes.some(n => n.itemId === HYDROGEN_ID)).toBe(true);

      // Should NOT appear in Phase 2 or later
      phase2AndAbove.forEach(phase => {
        expect(phase.nodes.some(n => n.itemId === HYDROGEN_ID)).toBe(false);
      });
    });

    it("should appear ONLY in Phase 2+ when produced via recipe (isRawMaterial === false)", () => {
      // Create a root node that uses Hydrogen (produced via recipe)
      const hydrogenRecipe = createMockRecipe(100, "水素精製");
      hydrogenRecipe.Results = [
        { id: HYDROGEN_ID, name: "水素", count: 1, Type: "Item", isRaw: true },
      ];
      hydrogenRecipe.Type = "Refine";

      const hydrogenNode = createRecipeTreeNode(HYDROGEN_ID, "水素", false, hydrogenRecipe);
      const rootNode = createRecipeNode({
        recipe: createMockRecipe(1, "Test Recipe"),
        machine: createMachineByType({
          id: 2301,
          name: "Assembler Mk.I",
          type: "Assemble",
        }),
        nodeId: "root",
        targetOutputRate: 30,
        machineCount: 10,
        proliferator: { ...PROLIFERATOR_DATA.none, mode: "production" },
        power: createDefaultPowerConsumption({
          machines: 0,
          sorters: 0,
          dysonSphere: 0,
          total: 0,
        }),
        inputs: [],
        children: [hydrogenNode],
        conveyorBelts: createDefaultConveyorBelts({
          inputs: 0,
          outputs: 1,
          total: 1,
        }),
      });

      const phases = calculatePhases(rootNode, gameData);

      // Hydrogen should appear ONLY in Phase 2 or later
      const phase1 = phases.find(p => p.phaseNumber === 1);
      const phase2AndAbove = phases.filter(p => p.phaseNumber >= 2);

      expect(phase1).toBeDefined();
      expect(phase1?.nodes.some(n => n.itemId === HYDROGEN_ID)).toBe(false);

      // Should appear in Phase 2 or later
      const appearsInPhase2Plus = phase2AndAbove.some(phase =>
        phase.nodes.some(n => n.itemId === HYDROGEN_ID)
      );
      expect(appearsInPhase2Plus).toBe(true);
    });
  });

  describe("Deuterium", () => {
    it("should appear ONLY in Phase 1 when mined (isRawMaterial === true)", () => {
      // Create a root node that uses Deuterium (mined)
      const deuteriumNode = createRecipeTreeNode(DEUTERIUM_ID, "重水素", true);
      const rootNode = createRecipeNode({
        recipe: createMockRecipe(1, "Test Recipe"),
        machine: createMachineByType({
          id: 2301,
          name: "Assembler Mk.I",
          type: "Assemble",
        }),
        nodeId: "root",
        targetOutputRate: 30,
        machineCount: 10,
        proliferator: { ...PROLIFERATOR_DATA.none, mode: "production" },
        power: createDefaultPowerConsumption({
          machines: 0,
          sorters: 0,
          dysonSphere: 0,
          total: 0,
        }),
        inputs: [],
        children: [deuteriumNode],
        conveyorBelts: createDefaultConveyorBelts({
          inputs: 0,
          outputs: 1,
          total: 1,
        }),
      });

      const phases = calculatePhases(rootNode, gameData);

      // Deuterium should appear ONLY in Phase 1
      const phase1 = phases.find(p => p.phaseNumber === 1);
      const phase2AndAbove = phases.filter(p => p.phaseNumber >= 2);

      expect(phase1).toBeDefined();
      expect(phase1?.nodes.some(n => n.itemId === DEUTERIUM_ID)).toBe(true);

      // Should NOT appear in Phase 2 or later
      phase2AndAbove.forEach(phase => {
        expect(phase.nodes.some(n => n.itemId === DEUTERIUM_ID)).toBe(false);
      });
    });

    it("should appear ONLY in Phase 2+ when produced via recipe (isRawMaterial === false)", () => {
      // Create a root node that uses Deuterium (produced via recipe)
      const deuteriumRecipe = createMockRecipe(101, "重水素分離");
      deuteriumRecipe.Results = [
        { id: DEUTERIUM_ID, name: "重水素", count: 1, Type: "Item", isRaw: true },
      ];
      deuteriumRecipe.Type = "Fractionate";

      // Deuterium is produced from Hydrogen
      const hydrogenNode = createRecipeTreeNode(HYDROGEN_ID, "水素", true);
      const deuteriumNode = createRecipeTreeNode(DEUTERIUM_ID, "重水素", false, deuteriumRecipe, [
        hydrogenNode,
      ]);

      const rootNode = createRecipeNode({
        recipe: createMockRecipe(1, "Test Recipe"),
        machine: createMachineByType({
          id: 2301,
          name: "Assembler Mk.I",
          type: "Assemble",
        }),
        nodeId: "root",
        targetOutputRate: 30,
        machineCount: 10,
        proliferator: { ...PROLIFERATOR_DATA.none, mode: "production" },
        power: createDefaultPowerConsumption({
          machines: 0,
          sorters: 0,
          dysonSphere: 0,
          total: 0,
        }),
        inputs: [],
        children: [deuteriumNode],
        conveyorBelts: createDefaultConveyorBelts({
          inputs: 0,
          outputs: 1,
          total: 1,
        }),
      });

      const phases = calculatePhases(rootNode, gameData);

      // Deuterium should appear ONLY in Phase 2 or later
      const phase1 = phases.find(p => p.phaseNumber === 1);
      const phase2AndAbove = phases.filter(p => p.phaseNumber >= 2);

      expect(phase1).toBeDefined();
      expect(phase1?.nodes.some(n => n.itemId === DEUTERIUM_ID)).toBe(false);

      // Should appear in Phase 2 or later
      const appearsInPhase2Plus = phase2AndAbove.some(phase =>
        phase.nodes.some(n => n.itemId === DEUTERIUM_ID)
      );
      expect(appearsInPhase2Plus).toBe(true);
    });
  });

  describe("Complex scenario: Both Hydrogen and Deuterium", () => {
    it("should place Hydrogen in Phase 1 (mined) and Deuterium in Phase 2+ (recipe)", () => {
      // Hydrogen is mined
      const hydrogenNode = createRecipeTreeNode(HYDROGEN_ID, "水素", true);

      // Deuterium is produced from Hydrogen via recipe
      const deuteriumRecipe = createMockRecipe(101, "重水素分離");
      deuteriumRecipe.Results = [
        { id: DEUTERIUM_ID, name: "重水素", count: 1, Type: "Item", isRaw: true },
      ];
      deuteriumRecipe.Type = "Fractionate";
      const deuteriumNode = createRecipeTreeNode(DEUTERIUM_ID, "重水素", false, deuteriumRecipe, [
        hydrogenNode,
      ]);

      const rootNode = createRecipeNode({
        recipe: createMockRecipe(1, "Test Recipe"),
        machine: createMachineByType({
          id: 2301,
          name: "Assembler Mk.I",
          type: "Assemble",
        }),
        nodeId: "root",
        targetOutputRate: 30,
        machineCount: 10,
        proliferator: { ...PROLIFERATOR_DATA.none, mode: "production" },
        power: createDefaultPowerConsumption({
          machines: 0,
          sorters: 0,
          dysonSphere: 0,
          total: 0,
        }),
        inputs: [],
        children: [deuteriumNode],
        conveyorBelts: createDefaultConveyorBelts({
          inputs: 0,
          outputs: 1,
          total: 1,
        }),
      });

      const phases = calculatePhases(rootNode, gameData);

      const phase1 = phases.find(p => p.phaseNumber === 1);
      const phase2AndAbove = phases.filter(p => p.phaseNumber >= 2);

      // Hydrogen should be in Phase 1
      expect(phase1?.nodes.some(n => n.itemId === HYDROGEN_ID)).toBe(true);
      // Deuterium should NOT be in Phase 1
      expect(phase1?.nodes.some(n => n.itemId === DEUTERIUM_ID)).toBe(false);

      // Deuterium should be in Phase 2 or later
      const deuteriumInPhase2Plus = phase2AndAbove.some(phase =>
        phase.nodes.some(n => n.itemId === DEUTERIUM_ID)
      );
      expect(deuteriumInPhase2Plus).toBe(true);
    });
  });

  describe("Critical Photon", () => {
    it("should be placed in Phase 1 even though it is recipe-based", () => {
      const photonRecipe = createMockRecipe(-1, "臨界光子生成");
      photonRecipe.Type = "PhotonGeneration";
      photonRecipe.Items = [];
      photonRecipe.Results = [
        {
          id: CRITICAL_PHOTON_ID,
          name: "臨界光子",
          count: 1,
          Type: "Item",
          isRaw: false,
        },
      ];

      const photonNode = createRecipeNode({
        recipe: photonRecipe,
        machine: createMachineByType({
          id: 2208,
          name: "Ray Receiver",
          type: "Assemble",
        }),
        nodeId: `node-${CRITICAL_PHOTON_ID}`,
        targetOutputRate: 30,
        machineCount: 5,
        proliferator: { ...PROLIFERATOR_DATA.none, mode: "production" },
        power: createDefaultPowerConsumption({
          machines: 0,
          sorters: 0,
          dysonSphere: 0,
          total: 0,
        }),
        inputs: [],
        children: [],
        conveyorBelts: createDefaultConveyorBelts({
          inputs: 0,
          outputs: 1,
          total: 1,
        }),
        itemId: CRITICAL_PHOTON_ID,
        itemName: "臨界光子",
      });

      const rootNode = createRecipeNode({
        recipe: createMockRecipe(1, "Test Recipe"),
        machine: createMachineByType({
          id: 2301,
          name: "Assembler Mk.I",
          type: "Assemble",
        }),
        nodeId: "root",
        targetOutputRate: 30,
        machineCount: 10,
        proliferator: { ...PROLIFERATOR_DATA.none, mode: "production" },
        power: createDefaultPowerConsumption({
          machines: 0,
          sorters: 0,
          dysonSphere: 0,
          total: 0,
        }),
        inputs: [],
        children: [photonNode],
        conveyorBelts: createDefaultConveyorBelts({
          inputs: 0,
          outputs: 1,
          total: 1,
        }),
      });

      const phases = calculatePhases(rootNode, gameData);

      const phase1 = phases.find(p => p.phaseNumber === 1);
      const phase2Plus = phases.filter(p => p.phaseNumber >= 2);

      expect(phase1).toBeDefined();
      const photonEntry = phase1?.nodes.find(n => n.itemId === CRITICAL_PHOTON_ID);
      expect(photonEntry).toBeDefined();
      expect(photonEntry?.machineType).toBe("Ray Receiver");

      phase2Plus.forEach(phase => {
        expect(phase.nodes.some(n => n.itemId === CRITICAL_PHOTON_ID)).toBe(false);
      });
    });
  });

  describe("Processing stage hierarchy and final phase", () => {
    it("assigns stages based on dependency depth and marks the final phase", () => {
      const finalProductLabel = i18n.t("roadmap.finalProductLabel");

      const addItem = (id: number, name: string) => {
        const item = createMockItem(id, name);
        gameData.items.set(id, item);
        gameData.allItems.set(id, item);
      };

      addItem(101, "一次加工製品");
      addItem(201, "二次加工製品");
      addItem(301, "三次加工製品");
      addItem(401, "最終製品");

      const rawNode = createRecipeTreeNode(1, "Iron Ore", true);

      const stage1Recipe = createMockRecipe(10, "一次加工レシピ");
      stage1Recipe.Results = [
        { id: 101, name: "一次加工製品", count: 1, Type: "Item", isRaw: false },
      ];
      const stage1Node = createRecipeTreeNode(101, "一次加工製品", false, stage1Recipe, [rawNode]);

      const stage2Recipe = createMockRecipe(20, "二次加工レシピ");
      stage2Recipe.Results = [
        { id: 201, name: "二次加工製品", count: 1, Type: "Item", isRaw: false },
      ];
      const stage2Node = createRecipeTreeNode(201, "二次加工製品", false, stage2Recipe, [
        stage1Node,
      ]);

      const stage3Recipe = createMockRecipe(30, "三次加工レシピ");
      stage3Recipe.Results = [
        { id: 301, name: "三次加工製品", count: 1, Type: "Item", isRaw: false },
      ];
      const stage3Node = createRecipeTreeNode(301, "三次加工製品", false, stage3Recipe, [
        stage2Node,
      ]);

      const finalRecipe = createMockRecipe(40, "最終製品レシピ");
      finalRecipe.Results = [{ id: 401, name: "最終製品", count: 1, Type: "Item", isRaw: false }];
      const finalNode = createRecipeTreeNode(401, "最終製品", false, finalRecipe, [stage3Node]);
      finalNode.nodeId = "root";

      const phases = calculatePhases(finalNode, gameData);

      expect(phases.map(p => p.phaseNumber)).toEqual([1, 2, 3, 4, 5]);

      const phase1 = phases.find(p => p.phaseNumber === 1);
      expect(phase1).toBeDefined();
      expect(phase1?.nodes.some(n => n.itemId === 1)).toBe(true);

      const phase2 = phases.find(p => p.phaseNumber === 2);
      expect(phase2).toBeDefined();
      expect(extractStageFromTitle(phase2!.title)).toBe(1);
      expect(phase2?.nodes.some(n => n.itemId === 101)).toBe(true);

      const phase3 = phases.find(p => p.phaseNumber === 3);
      expect(phase3).toBeDefined();
      expect(extractStageFromTitle(phase3!.title)).toBe(2);
      expect(phase3?.nodes.some(n => n.itemId === 201)).toBe(true);

      const phase4 = phases.find(p => p.phaseNumber === 4);
      expect(phase4).toBeDefined();
      expect(extractStageFromTitle(phase4!.title)).toBe(3);
      expect(phase4?.nodes.some(n => n.itemId === 301)).toBe(true);

      const finalPhase = phases[phases.length - 1];
      expect(finalPhase.phaseNumber).toBe(5);
      expect(extractStageFromTitle(finalPhase.title)).toBe(4);
      expect(finalPhase.title).toContain(finalProductLabel);
      expect(finalPhase.nodes).toHaveLength(1);
      expect(finalPhase.nodes[0].itemId).toBe(401);
      expect(finalPhase.nodes[0].itemName).toBe("最終製品");
    });
  });
});
