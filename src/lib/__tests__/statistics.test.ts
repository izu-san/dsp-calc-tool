import { describe, expect, it } from "vitest";
import type { RecipeTreeNode } from "../../types/calculation";
import type { ProliferatorConfig } from "../../types/settings";
import { PROLIFERATOR_DATA } from "../../types/settings";
import type { MiningCalculation } from "../miningCalculation";
import {
  calculateItemStatistics,
  getFinalProducts,
  getIntermediateProducts,
  getRawMaterials,
  getSortedItems,
} from "../statistics";
import {
  createRecipeNode,
  createRawMaterialNode,
  createMultiOutputRecipe,
  machinePresets,
  recipePresets,
} from "../../test/factories/testDataFactory";

// Mock data
const mockNoProliferator: ProliferatorConfig = {
  ...PROLIFERATOR_DATA.none,
  mode: "speed",
};

const mockMachine = machinePresets.assemblerMk1();
const mockIronIngotRecipe = recipePresets.ironIngot();
const mockGearRecipe = recipePresets.gear();
const mockMultiOutputRecipe = recipePresets.refinedOil();

describe("statistics", () => {
  describe("calculateItemStatistics", () => {
    it("単一レシピの生産/消費量を計算する", () => {
      const node = createRecipeNode({
        recipe: mockIronIngotRecipe,
        machine: mockMachine,
        targetOutputRate: 30, // 30 Iron Ingot/s
        machineCount: 5,
        proliferator: mockNoProliferator,
        power: { machines: 540, sorters: 0, dysonSphere: 0, total: 540 },
        inputs: [{ itemId: 1001, itemName: "Iron Ore", requiredRate: 30 }],
        children: [],
        conveyorBelts: { inputs: 1, outputs: 1, total: 2 },
        nodeId: "root",
      });

      const result = calculateItemStatistics(node);

      expect(result.totalMachines).toBe(5);
      expect(result.totalPower).toBe(540);

      // Iron Ingot: 生産のみ
      const ironIngot = result.items.get(1101);
      expect(ironIngot).toBeDefined();
      expect(ironIngot?.totalProduction).toBe(30);
      expect(ironIngot?.totalConsumption).toBe(0);
      expect(ironIngot?.netProduction).toBe(30);
      expect(ironIngot?.isRawMaterial).toBe(false);
    });

    it("複数出力レシピの処理（副産物の比率計算）", () => {
      const node = createRecipeNode({
        recipe: mockMultiOutputRecipe,
        machine: mockMachine,
        targetOutputRate: 20, // 20 Refined Oil/s (main output)
        machineCount: 10,
        proliferator: mockNoProliferator,
        power: { machines: 900, sorters: 0, dysonSphere: 0, total: 900 },
        inputs: [{ itemId: 1007, itemName: "Crude Oil", requiredRate: 20 }],
        children: [],
        conveyorBelts: { inputs: 1, outputs: 2, total: 3 },
        nodeId: "root",
      });

      const result = calculateItemStatistics(node);

      // Refined Oil (main output): 20/s
      const refinedOil = result.items.get(1114);
      expect(refinedOil?.totalProduction).toBe(20);

      // Hydrogen (byproduct): ratio = 1/2 = 0.5, so 20 * 0.5 = 10/s
      const hydrogen = result.items.get(1120);
      expect(hydrogen?.totalProduction).toBe(10);
    });

    it("原材料のマーク（isRawMaterial: true）", () => {
      const rawNode = createRawMaterialNode({
        itemId: 1001,
        itemName: "Iron Ore",
        targetOutputRate: 30, // Children ノードの targetOutputRate が消費量として追加される
        nodeId: "raw-1001",
      });

      const parentNode = createRecipeNode({
        recipe: mockIronIngotRecipe,
        machine: mockMachine,
        targetOutputRate: 30,
        machineCount: 5,
        proliferator: mockNoProliferator,
        power: { machines: 540, sorters: 0, dysonSphere: 0, total: 540 },
        inputs: [{ itemId: 1001, itemName: "Iron Ore", requiredRate: 30 }], // inputs の requiredRate も消費量として追加される
        children: [rawNode],
        conveyorBelts: { inputs: 1, outputs: 1, total: 2 },
        nodeId: "root",
      });

      const result = calculateItemStatistics(parentNode);

      // Iron Ore: 原材料としてマーク
      // 消費量 = inputs の requiredRate (30)
      // children の targetOutputRate は重複してカウントしない（inputs で既にカウント済み）
      const ironOre = result.items.get(1001);
      expect(ironOre?.isRawMaterial).toBe(true);
      expect(ironOre?.totalProduction).toBe(0);
      expect(ironOre?.totalConsumption).toBe(30);
    });

    it("正味生産量を計算する（production - consumption）", () => {
      const ironOreNode = createRawMaterialNode({
        itemId: 1001,
        itemName: "Iron Ore",
        targetOutputRate: 60,
        nodeId: "raw-1001",
        proliferator: mockNoProliferator,
        power: { machines: 0, sorters: 0, dysonSphere: 0, total: 0 },
        conveyorBelts: { inputs: 0, outputs: 0, total: 0 },
      });

      const ironIngotNode = createRecipeNode({
        recipe: mockIronIngotRecipe,
        machine: mockMachine,
        targetOutputRate: 60, // 60 Iron Ingot/s 生産
        machineCount: 10,
        proliferator: mockNoProliferator,
        power: { machines: 1080, sorters: 0, dysonSphere: 0, total: 1080 },
        inputs: [{ itemId: 1001, itemName: "Iron Ore", requiredRate: 60 }],
        children: [ironOreNode],
        conveyorBelts: { inputs: 1, outputs: 1, total: 2 },
        nodeId: "iron-ingot",
      });

      const gearNode = createRecipeNode({
        recipe: mockGearRecipe,
        machine: mockMachine,
        targetOutputRate: 30, // 30 Gear/s 生産
        machineCount: 6,
        proliferator: mockNoProliferator,
        power: { machines: 540, sorters: 0, dysonSphere: 0, total: 540 },
        inputs: [{ itemId: 1101, itemName: "Iron Ingot", requiredRate: 30 }], // 30 Iron Ingot/s 消費
        children: [ironIngotNode],
        conveyorBelts: { inputs: 1, outputs: 1, total: 2 },
        nodeId: "root",
      });

      const result = calculateItemStatistics(gearNode);

      // Iron Ingot: 60生産 - 30消費 = 30正味
      const ironIngot = result.items.get(1101);
      expect(ironIngot?.totalProduction).toBe(60);
      expect(ironIngot?.totalConsumption).toBe(30);
      expect(ironIngot?.netProduction).toBe(30);

      // Gear: 30生産 - 0消費 = 30正味
      const gear = result.items.get(1103);
      expect(gear?.totalProduction).toBe(30);
      expect(gear?.totalConsumption).toBe(0);
      expect(gear?.netProduction).toBe(30);
    });

    it("機械数と電力を集計する", () => {
      const child1 = createRecipeNode({
        recipe: mockIronIngotRecipe,
        machine: mockMachine,
        targetOutputRate: 30,
        machineCount: 5,
        proliferator: mockNoProliferator,
        power: { machines: 540, sorters: 0, dysonSphere: 0, total: 540 },
        inputs: [],
        children: [],
        conveyorBelts: { inputs: 1, outputs: 1, total: 2 },
        nodeId: "child1",
      });

      const child2 = createRecipeNode({
        recipe: mockGearRecipe,
        machine: mockMachine,
        targetOutputRate: 20,
        machineCount: 3,
        proliferator: mockNoProliferator,
        power: { machines: 324, sorters: 0, dysonSphere: 0, total: 324 },
        inputs: [],
        children: [],
        conveyorBelts: { inputs: 1, outputs: 1, total: 2 },
        nodeId: "child2",
      });

      const parentNode = createRecipeNode({
        recipe: mockGearRecipe,
        machine: mockMachine,
        targetOutputRate: 10,
        machineCount: 2,
        proliferator: mockNoProliferator,
        power: { machines: 216, sorters: 0, dysonSphere: 0, total: 216 },
        inputs: [],
        children: [child1, child2],
        conveyorBelts: { inputs: 1, outputs: 1, total: 2 },
        nodeId: "root",
      });

      const result = calculateItemStatistics(parentNode);

      // 機械数: 2 + 5 + 3 = 10
      expect(result.totalMachines).toBe(10);

      // 電力: 216 + 540 + 324 = 1080
      expect(result.totalPower).toBe(1080);
    });

    it("再帰的なツリー走査を行う", () => {
      const level3 = createRecipeNode({
        recipe: mockIronIngotRecipe,
        machine: mockMachine,
        targetOutputRate: 10,
        machineCount: 2,
        proliferator: mockNoProliferator,
        power: { machines: 216, sorters: 0, dysonSphere: 0, total: 216 },
        inputs: [],
        children: [],
        conveyorBelts: { inputs: 1, outputs: 1, total: 2 },
        nodeId: "level3",
      });

      const level2 = createRecipeNode({
        recipe: mockGearRecipe,
        machine: mockMachine,
        targetOutputRate: 10,
        machineCount: 2,
        proliferator: mockNoProliferator,
        power: { machines: 216, sorters: 0, dysonSphere: 0, total: 216 },
        inputs: [],
        children: [level3],
        conveyorBelts: { inputs: 1, outputs: 1, total: 2 },
        nodeId: "level2",
      });

      const level1 = createRecipeNode({
        recipe: mockIronIngotRecipe,
        machine: mockMachine,
        targetOutputRate: 10,
        machineCount: 2,
        proliferator: mockNoProliferator,
        power: { machines: 216, sorters: 0, dysonSphere: 0, total: 216 },
        inputs: [],
        children: [level2],
        conveyorBelts: { inputs: 1, outputs: 1, total: 2 },
        nodeId: "level1",
      });

      const rootNode = createRecipeNode({
        recipe: mockGearRecipe,
        machine: mockMachine,
        targetOutputRate: 10,
        machineCount: 2,
        proliferator: mockNoProliferator,
        power: { machines: 216, sorters: 0, dysonSphere: 0, total: 216 },
        inputs: [],
        children: [level1],
        conveyorBelts: { inputs: 1, outputs: 1, total: 2 },
        nodeId: "root",
      });

      const result = calculateItemStatistics(rootNode);

      // 機械数: 2 + 2 + 2 + 2 = 8
      expect(result.totalMachines).toBe(8);

      // 電力: 4 * 216 = 864
      expect(result.totalPower).toBe(864);
    });
  });

  describe("複雑なケース", () => {
    it("中間製品（生産も消費もされる）を処理する", () => {
      const ironOreNode = createRawMaterialNode({
        itemId: 1001,
        itemName: "Iron Ore",
        targetOutputRate: 60,
        nodeId: "raw-1001",
        proliferator: mockNoProliferator,
        power: { machines: 0, sorters: 0, dysonSphere: 0, total: 0 },
        conveyorBelts: { inputs: 0, outputs: 0, total: 0 },
      });

      const ironIngotNode = createRecipeNode({
        recipe: mockIronIngotRecipe,
        machine: mockMachine,
        targetOutputRate: 60,
        machineCount: 10,
        proliferator: mockNoProliferator,
        power: { machines: 1080, sorters: 0, dysonSphere: 0, total: 1080 },
        inputs: [{ itemId: 1001, itemName: "Iron Ore", requiredRate: 60 }],
        children: [ironOreNode],
        conveyorBelts: { inputs: 1, outputs: 1, total: 2 },
        nodeId: "iron-ingot",
      });

      const gearNode = createRecipeNode({
        recipe: mockGearRecipe,
        machine: mockMachine,
        targetOutputRate: 30,
        machineCount: 6,
        proliferator: mockNoProliferator,
        power: { machines: 540, sorters: 0, dysonSphere: 0, total: 540 },
        inputs: [{ itemId: 1101, itemName: "Iron Ingot", requiredRate: 30 }],
        children: [ironIngotNode],
        conveyorBelts: { inputs: 1, outputs: 1, total: 2 },
        nodeId: "root",
      });

      const result = calculateItemStatistics(gearNode);

      // Iron Ingot: 中間製品（生産60、消費30）
      const ironIngot = result.items.get(1101);
      expect(ironIngot?.totalProduction).toBeGreaterThan(0);
      expect(ironIngot?.totalConsumption).toBeGreaterThan(0);
      expect(ironIngot?.isRawMaterial).toBe(false);
    });

    it("最終製品（生産のみ）を処理する", () => {
      const node = createRecipeNode({
        recipe: mockGearRecipe,
        machine: mockMachine,
        targetOutputRate: 30,
        machineCount: 6,
        proliferator: mockNoProliferator,
        power: { machines: 540, sorters: 0, dysonSphere: 0, total: 540 },
        inputs: [],
        children: [],
        conveyorBelts: { inputs: 1, outputs: 1, total: 2 },
        nodeId: "root",
      });

      const result = calculateItemStatistics(node);

      // Gear: 最終製品（生産のみ）
      const gear = result.items.get(1103);
      expect(gear?.totalProduction).toBe(30);
      expect(gear?.totalConsumption).toBe(0);
      expect(gear?.netProduction).toBe(30);
    });

    it("原材料（消費のみ）を処理する", () => {
      const rawNode = createRawMaterialNode({
        itemId: 1001,
        itemName: "Iron Ore",
        targetOutputRate: 30, // Children ノードの targetOutputRate が消費量として追加される
        nodeId: "raw-1001",
        proliferator: mockNoProliferator,
        power: { machines: 0, sorters: 0, dysonSphere: 0, total: 0 },
        conveyorBelts: { inputs: 0, outputs: 0, total: 0 },
      });

      const parentNode = createRecipeNode({
        recipe: mockIronIngotRecipe,
        machine: mockMachine,
        targetOutputRate: 30,
        machineCount: 5,
        proliferator: mockNoProliferator,
        power: { machines: 540, sorters: 0, dysonSphere: 0, total: 540 },
        inputs: [{ itemId: 1001, itemName: "Iron Ore", requiredRate: 30 }], // inputs の requiredRate も消費量として追加される
        children: [rawNode],
        conveyorBelts: { inputs: 1, outputs: 1, total: 2 },
        nodeId: "root",
      });

      const result = calculateItemStatistics(parentNode);

      // Iron Ore: 原材料（消費のみ）
      // 消費量 = inputs の requiredRate (30)
      // children の targetOutputRate は重複してカウントしない（inputs で既にカウント済み）
      const ironOre = result.items.get(1001);
      expect(ironOre?.totalProduction).toBe(0);
      expect(ironOre?.totalConsumption).toBe(30);
      expect(ironOre?.isRawMaterial).toBe(true);
    });

    it("副産物の生産レートを計算する（比率に基づく）", () => {
      const node = createRecipeNode({
        recipe: mockMultiOutputRecipe,
        machine: mockMachine,
        targetOutputRate: 20, // Main output: 20 Refined Oil/s
        machineCount: 10,
        proliferator: mockNoProliferator,
        power: { machines: 900, sorters: 0, dysonSphere: 0, total: 900 },
        inputs: [],
        children: [],
        conveyorBelts: { inputs: 1, outputs: 2, total: 3 },
        nodeId: "root",
      });

      const result = calculateItemStatistics(node);

      // Refined Oil: 20/s (main output, count=2)
      const refinedOil = result.items.get(1114);
      expect(refinedOil?.totalProduction).toBe(20);

      // Hydrogen: ratio = 1/2 = 0.5, so 20 * 0.5 = 10/s
      const hydrogen = result.items.get(1120);
      expect(hydrogen?.totalProduction).toBe(10);
    });
  });

  describe("getSortedItems", () => {
    it("原材料を最優先でソートする", () => {
      const stats = {
        items: new Map([
          [
            1102,
            {
              itemId: 1102,
              totalProduction: 30,
              totalConsumption: 0,
              netProduction: 30,
              isRawMaterial: false,
            },
          ],
          [
            1001,
            {
              itemId: 1001,
              totalProduction: 0,
              totalConsumption: 60,
              netProduction: -60,
              isRawMaterial: true,
            },
          ],
          [
            1101,
            {
              itemId: 1101,
              totalProduction: 60,
              totalConsumption: 30,
              netProduction: 30,
              isRawMaterial: false,
            },
          ],
        ]),
        totalMachines: 10,
        totalPower: 1000,
      };

      const sorted = getSortedItems(stats);

      // 原材料が最初に来る
      expect(sorted[0].itemId).toBe(1001);
      expect(sorted[0].isRawMaterial).toBe(true);
    });

    it("正味生産量の絶対値でソートする", () => {
      const stats = {
        items: new Map([
          [
            1,
            {
              itemId: 1,
              totalProduction: 10,
              totalConsumption: 0,
              netProduction: 10,
              isRawMaterial: false,
            },
          ],
          [
            2,
            {
              itemId: 2,
              totalProduction: 50,
              totalConsumption: 0,
              netProduction: 50,
              isRawMaterial: false,
            },
          ],
          [
            3,
            {
              itemId: 3,
              totalProduction: 30,
              totalConsumption: 0,
              netProduction: 30,
              isRawMaterial: false,
            },
          ],
        ]),
        totalMachines: 10,
        totalPower: 1000,
      };

      const sorted = getSortedItems(stats);

      // 降順: 50, 30, 10
      expect(sorted[0].netProduction).toBe(50);
      expect(sorted[1].netProduction).toBe(30);
      expect(sorted[2].netProduction).toBe(10);
    });
  });

  describe("getRawMaterials", () => {
    it("原材料のみフィルタする", () => {
      const stats = {
        items: new Map([
          [
            1001,
            {
              itemId: 1001,
              totalProduction: 0,
              totalConsumption: 60,
              netProduction: -60,
              isRawMaterial: true,
            },
          ],
          [
            1101,
            {
              itemId: 1101,
              totalProduction: 60,
              totalConsumption: 0,
              netProduction: 60,
              isRawMaterial: false,
            },
          ],
          [
            1002,
            {
              itemId: 1002,
              totalProduction: 0,
              totalConsumption: 30,
              netProduction: -30,
              isRawMaterial: true,
            },
          ],
        ]),
        totalMachines: 10,
        totalPower: 1000,
      };

      const rawMaterials = getRawMaterials(stats);

      expect(rawMaterials).toHaveLength(2);
      expect(rawMaterials[0].isRawMaterial).toBe(true);
      expect(rawMaterials[1].isRawMaterial).toBe(true);
    });

    it("消費量でソート（降順）する", () => {
      const stats = {
        items: new Map([
          [
            1001,
            {
              itemId: 1001,
              totalProduction: 0,
              totalConsumption: 30,
              netProduction: -30,
              isRawMaterial: true,
            },
          ],
          [
            1002,
            {
              itemId: 1002,
              totalProduction: 0,
              totalConsumption: 60,
              netProduction: -60,
              isRawMaterial: true,
            },
          ],
          [
            1003,
            {
              itemId: 1003,
              totalProduction: 0,
              totalConsumption: 45,
              netProduction: -45,
              isRawMaterial: true,
            },
          ],
        ]),
        totalMachines: 10,
        totalPower: 1000,
      };

      const rawMaterials = getRawMaterials(stats);

      // 降順: 60, 45, 30
      expect(rawMaterials[0].totalConsumption).toBe(60);
      expect(rawMaterials[1].totalConsumption).toBe(45);
      expect(rawMaterials[2].totalConsumption).toBe(30);
    });
  });

  describe("getIntermediateProducts", () => {
    it("生産と消費両方のアイテムのみフィルタする", () => {
      const stats = {
        items: new Map([
          [
            1001,
            {
              itemId: 1001,
              totalProduction: 0,
              totalConsumption: 60,
              netProduction: -60,
              isRawMaterial: true,
            },
          ],
          [
            1101,
            {
              itemId: 1101,
              totalProduction: 60,
              totalConsumption: 30,
              netProduction: 30,
              isRawMaterial: false,
            },
          ], // 中間製品
          [
            1102,
            {
              itemId: 1102,
              totalProduction: 30,
              totalConsumption: 0,
              netProduction: 30,
              isRawMaterial: false,
            },
          ], // 最終製品
        ]),
        totalMachines: 10,
        totalPower: 1000,
      };

      const intermediateProducts = getIntermediateProducts(stats);

      expect(intermediateProducts).toHaveLength(1);
      expect(intermediateProducts[0].itemId).toBe(1101);
      expect(intermediateProducts[0].totalProduction).toBeGreaterThan(0);
      expect(intermediateProducts[0].totalConsumption).toBeGreaterThan(0);
    });

    it("生産量でソート（降順）する", () => {
      const stats = {
        items: new Map([
          [
            1,
            {
              itemId: 1,
              totalProduction: 30,
              totalConsumption: 10,
              netProduction: 20,
              isRawMaterial: false,
            },
          ],
          [
            2,
            {
              itemId: 2,
              totalProduction: 60,
              totalConsumption: 20,
              netProduction: 40,
              isRawMaterial: false,
            },
          ],
          [
            3,
            {
              itemId: 3,
              totalProduction: 45,
              totalConsumption: 15,
              netProduction: 30,
              isRawMaterial: false,
            },
          ],
        ]),
        totalMachines: 10,
        totalPower: 1000,
      };

      const intermediateProducts = getIntermediateProducts(stats);

      // 降順: 60, 45, 30
      expect(intermediateProducts[0].totalProduction).toBe(60);
      expect(intermediateProducts[1].totalProduction).toBe(45);
      expect(intermediateProducts[2].totalProduction).toBe(30);
    });
  });

  describe("getFinalProducts", () => {
    it("生産されて消費されないアイテムを最終生産物として認識する", () => {
      const stats = {
        items: new Map([
          [
            1001,
            {
              itemId: 1001,
              totalProduction: 0,
              totalConsumption: 60,
              netProduction: -60,
              isRawMaterial: true,
            },
          ],
          [
            1101,
            {
              itemId: 1101,
              totalProduction: 60,
              totalConsumption: 30,
              netProduction: 30,
              isRawMaterial: false,
            },
          ], // 中間生産物
          [
            1102,
            {
              itemId: 1102,
              totalProduction: 30,
              totalConsumption: 0,
              netProduction: 30,
              isRawMaterial: false,
            },
          ], // 最終生産物
        ]),
        totalMachines: 10,
        totalPower: 1000,
      };

      const finalProducts = getFinalProducts(stats);

      // 消費されないアイテムのみが最終生産物として認識される
      expect(finalProducts).toHaveLength(1);
      expect(finalProducts[0].itemId).toBe(1102);

      // 中間生産物は含まれない
      expect(finalProducts.find(p => p.itemId === 1101)).toBeUndefined();

      // 原材料は含まれない
      expect(finalProducts.find(p => p.itemId === 1001)).toBeUndefined();
    });

    it("生産量でソート（降順）する", () => {
      const stats = {
        items: new Map([
          [
            1,
            {
              itemId: 1,
              totalProduction: 30,
              totalConsumption: 0,
              netProduction: 30,
              isRawMaterial: false,
            },
          ],
          [
            2,
            {
              itemId: 2,
              totalProduction: 60,
              totalConsumption: 0,
              netProduction: 60,
              isRawMaterial: false,
            },
          ],
          [
            3,
            {
              itemId: 3,
              totalProduction: 45,
              totalConsumption: 0,
              netProduction: 45,
              isRawMaterial: false,
            },
          ],
        ]),
        totalMachines: 10,
        totalPower: 1000,
      };

      const finalProducts = getFinalProducts(stats);

      // 降順: 60, 45, 30
      expect(finalProducts[0].totalProduction).toBe(60);
      expect(finalProducts[1].totalProduction).toBe(45);
      expect(finalProducts[2].totalProduction).toBe(30);
    });

    it("複数出力レシピの最終生産物を正しく識別する", () => {
      const stats = {
        items: new Map([
          [
            1114,
            {
              itemId: 1114,
              totalProduction: 20,
              totalConsumption: 0,
              netProduction: 20,
              isRawMaterial: false,
            },
          ], // Refined Oil
          [
            1120,
            {
              itemId: 1120,
              totalProduction: 10,
              totalConsumption: 0,
              netProduction: 10,
              isRawMaterial: false,
            },
          ], // Hydrogen
        ]),
        totalMachines: 10,
        totalPower: 1000,
      };

      const finalProducts = getFinalProducts(stats);

      // 両方とも最終生産物として認識されるべき
      expect(finalProducts).toHaveLength(2);
      expect(finalProducts.find(p => p.itemId === 1114)).toBeDefined();
      expect(finalProducts.find(p => p.itemId === 1120)).toBeDefined();
    });

    it("X線クラッキングレシピの統計計算（入力と出力に同じアイテム）", () => {
      const xRayCrackingRecipe = createMultiOutputRecipe({
        SID: 1207,
        name: "X-Ray Cracking",
        type: "Refine",
        timeSpend: 240,
        inputs: [
          { id: 1114, name: "Refined Oil", count: 1, isRaw: true },
          { id: 1120, name: "Hydrogen", count: 2, isRaw: true },
        ],
        outputs: [
          { id: 1120, name: "Hydrogen", count: 3, isRaw: true },
          { id: 1109, name: "High-Energy Graphite", count: 1, isRaw: false },
        ],
        explicit: true,
        gridIndex: "1207",
        productive: false,
      });

      const node = createRecipeNode({
        recipe: xRayCrackingRecipe,
        machine: mockMachine,
        targetOutputRate: 2.0, // 2.0 Hydrogen/s (main output)
        machineCount: 1,
        proliferator: mockNoProliferator,
        power: { machines: 100, sorters: 0, dysonSphere: 0, total: 100 },
        inputs: [
          { itemId: 1114, itemName: "Refined Oil", requiredRate: 0.7 },
          { itemId: 1120, itemName: "Hydrogen", requiredRate: 1.3 },
        ],
        children: [],
        conveyorBelts: { inputs: 2, outputs: 2, total: 4 },
        nodeId: "root",
      });

      const result = calculateItemStatistics(node);

      // Hydrogen: 生産2.0/s - 消費1.3/s = 正味0.7/s
      const hydrogen = result.items.get(1120);
      expect(hydrogen?.totalProduction).toBeCloseTo(2.0);
      expect(hydrogen?.totalConsumption).toBeCloseTo(1.3);
      expect(hydrogen?.netProduction).toBeCloseTo(0.7);

      // High-Energy Graphite: 生産0.67/s - 消費0/s = 正味0.67/s
      const graphite = result.items.get(1109);
      expect(graphite?.totalProduction).toBeCloseTo(0.67);
      expect(graphite?.totalConsumption).toBeCloseTo(0);
      expect(graphite?.netProduction).toBeCloseTo(0.67);

      // Refined Oil: 生産0/s - 消費0.7/s = 正味-0.7/s
      const refinedOil = result.items.get(1114);
      expect(refinedOil?.totalProduction).toBeCloseTo(0);
      expect(refinedOil?.totalConsumption).toBeCloseTo(0.7);
      expect(refinedOil?.netProduction).toBeCloseTo(-0.7);

      // 最終生産物の確認
      const finalProducts = getFinalProducts(result);
      // 子ノードがないこのテストケースでは、水素にisRawMaterialフラグが設定されないため、
      // 高エネルギーグラファイトのみが最終生産物として認識される
      expect(finalProducts).toHaveLength(1);

      // 高エネルギーグラファイトは消費されないので最終生産物
      const graphiteFinal = finalProducts.find(p => p.itemId === 1109);
      expect(graphiteFinal).toBeDefined();
      expect(graphiteFinal?.totalConsumption).toBeCloseTo(0);
      expect(graphiteFinal?.totalProduction).toBeCloseTo(0.67);

      // 水素はisRawMaterialフラグがないため、中間生産物として扱われる
      const hydrogenFinal = finalProducts.find(p => p.itemId === 1120);
      expect(hydrogenFinal).toBeUndefined();
    });

    it("X線クラッキングレシピの統計計算（子ノードに水素の原材料ノード）", () => {
      const hydrogenRawNode = createRawMaterialNode({
        itemId: 1120,
        itemName: "Hydrogen",
        targetOutputRate: 1.3, // 1.3 Hydrogen/s (raw material)
        nodeId: "root/raw-1120",
        machine: mockMachine,
        proliferator: mockNoProliferator,
        power: { machines: 0, sorters: 0, dysonSphere: 0, total: 0 },
        conveyorBelts: { inputs: 0, outputs: 0, total: 0 },
      });

      const xRayCrackingRecipe = createMultiOutputRecipe({
        SID: 1207,
        name: "X-Ray Cracking",
        type: "Refine",
        timeSpend: 240,
        inputs: [
          { id: 1114, name: "Refined Oil", count: 1, isRaw: true },
          { id: 1120, name: "Hydrogen", count: 2, isRaw: true },
        ],
        outputs: [
          { id: 1120, name: "Hydrogen", count: 3, isRaw: true },
          { id: 1109, name: "High-Energy Graphite", count: 1, isRaw: false },
        ],
        explicit: true,
        gridIndex: "1207",
        productive: false,
      });

      const node = createRecipeNode({
        recipe: xRayCrackingRecipe,
        machine: mockMachine,
        targetOutputRate: 2.0, // 2.0 Hydrogen/s (main output)
        machineCount: 1,
        proliferator: mockNoProliferator,
        power: { machines: 100, sorters: 0, dysonSphere: 0, total: 100 },
        inputs: [
          { itemId: 1114, itemName: "Refined Oil", requiredRate: 0.7 },
          { itemId: 1120, itemName: "Hydrogen", requiredRate: 1.3 },
        ],
        children: [hydrogenRawNode], // 水素の原材料ノードを子ノードに追加
        conveyorBelts: { inputs: 2, outputs: 2, total: 4 },
        nodeId: "root",
      });

      const result = calculateItemStatistics(node);

      // Hydrogen: 生産2.0/s - 消費1.3/s = 正味0.7/s
      const hydrogen = result.items.get(1120);
      expect(hydrogen?.totalProduction).toBeCloseTo(2.0);
      expect(hydrogen?.totalConsumption).toBeCloseTo(1.3);
      expect(hydrogen?.netProduction).toBeCloseTo(0.7);
      // 原材料としてマークされているべき
      expect(hydrogen?.isRawMaterial).toBe(true);

      // 原材料の確認
      const rawMaterials = getRawMaterials(result);
      // 実際には水素のみが原材料としてマークされている
      // 精製油は原材料として定義されていないため、原材料セクションに表示されない
      expect(rawMaterials).toHaveLength(1); // 水素のみ

      const hydrogenRaw = rawMaterials.find(r => r.itemId === 1120);
      expect(hydrogenRaw).toBeDefined();
      expect(hydrogenRaw?.totalConsumption).toBeCloseTo(1.3); // 正しい消費量

      // 最終生産物の確認
      const finalProducts = getFinalProducts(result);
      expect(finalProducts).toHaveLength(2); // 水素と高エネルギーグラファイト

      // 水素は原材料フラグがあり、正味0.7/sで最終生産物
      const hydrogenFinal = finalProducts.find(p => p.itemId === 1120);
      expect(hydrogenFinal).toBeDefined();
      expect(hydrogenFinal?.isRawMaterial).toBe(true);
      expect(hydrogenFinal?.netProduction).toBeCloseTo(0.7);

      // 高エネルギーグラファイトは消費されないので最終生産物
      const graphiteFinal = finalProducts.find(p => p.itemId === 1109);
      expect(graphiteFinal).toBeDefined();
      expect(graphiteFinal?.totalConsumption).toBeCloseTo(0);
      expect(graphiteFinal?.totalProduction).toBeCloseTo(0.67);
    });
  });

  describe("採掘計算の統合", () => {
    it("採掘計算なしの場合、採掘関連の統計は0", () => {
      const node = createRecipeNode({
        recipe: mockIronIngotRecipe,
        machine: mockMachine,
        targetOutputRate: 30,
        machineCount: 5,
        proliferator: mockNoProliferator,
        power: { machines: 540, sorters: 0, dysonSphere: 0, total: 540 },
        inputs: [],
        children: [],
        conveyorBelts: { inputs: 1, outputs: 1, total: 2 },
        nodeId: "root",
      });

      const result = calculateItemStatistics(node);

      expect(result.totalMiningMachines).toBe(0);
      expect(result.totalMiningPower).toBe(0);
      expect(result.totalOrbitalCollectors).toBe(0);
    });

    it("採掘計算ありの場合、採掘関連の統計を計算する", () => {
      const node = createRecipeNode({
        recipe: mockIronIngotRecipe,
        machine: mockMachine,
        targetOutputRate: 30,
        machineCount: 5,
        proliferator: mockNoProliferator,
        power: { machines: 540, sorters: 0, dysonSphere: 0, total: 540 },
        inputs: [],
        children: [],
        conveyorBelts: { inputs: 1, outputs: 1, total: 2 },
        nodeId: "root",
      });

      const miningCalculation: MiningCalculation = {
        rawMaterials: [
          {
            itemId: 1001,
            itemName: "Iron Ore",
            requiredRate: 30,
            miningSpeedBonus: 1.0,
            workSpeedMultiplier: 100,
            powerMultiplier: 1.0,
            outputPerSecond: 3.0,
            minersNeeded: 10,
            veinsNeeded: 60,
            machineType: "Mining Machine",
          },
          {
            itemId: 1002,
            itemName: "Copper Ore",
            requiredRate: 60,
            miningSpeedBonus: 1.0,
            workSpeedMultiplier: 150,
            powerMultiplier: 2.25,
            outputPerSecond: 9.0,
            minersNeeded: 5,
            veinsNeeded: 30,
            machineType: "Advanced Mining Machine",
          },
        ],
        totalMiners: 15,
        totalOrbitalCollectors: 0,
      };

      const result = calculateItemStatistics(node, miningCalculation);

      // 採掘機の総数
      expect(result.totalMiningMachines).toBe(15);

      // 採掘電力の計算
      // Mining Machine: 420 kW * 1.0 * 10機 = 4200 kW
      // Advanced Mining Machine: 630 kW * 2.25 * 5機 = 7087.5 kW
      // Total: 11287.5 kW
      expect(result.totalMiningPower).toBeCloseTo(11287.5, 2);

      // 軌道コレクターの総数
      expect(result.totalOrbitalCollectors).toBe(0);
    });

    it("軌道コレクターを含む採掘計算の統計", () => {
      const node = createRecipeNode({
        recipe: mockIronIngotRecipe,
        machine: mockMachine,
        targetOutputRate: 30,
        machineCount: 5,
        proliferator: mockNoProliferator,
        power: { machines: 540, sorters: 0, dysonSphere: 0, total: 540 },
        inputs: [],
        children: [],
        conveyorBelts: { inputs: 1, outputs: 1, total: 2 },
        nodeId: "root",
      });

      const miningCalculation: MiningCalculation = {
        rawMaterials: [
          {
            itemId: 1001,
            itemName: "Iron Ore",
            requiredRate: 30,
            miningSpeedBonus: 1.0,
            workSpeedMultiplier: 100,
            powerMultiplier: 1.0,
            outputPerSecond: 3.0,
            minersNeeded: 10,
            veinsNeeded: 60,
            machineType: "Mining Machine",
          },
          {
            itemId: 1120,
            itemName: "Hydrogen",
            requiredRate: 8.4,
            miningSpeedBonus: 1.0,
            workSpeedMultiplier: 100,
            powerMultiplier: 1.0,
            outputPerSecond: 0,
            minersNeeded: 0,
            veinsNeeded: 0,
            orbitCollectorsNeeded: 10,
            orbitalCollectorSpeed: 0.84,
            machineType: "Advanced Mining Machine",
          },
        ],
        totalMiners: 10,
        totalOrbitalCollectors: 10,
      };

      const result = calculateItemStatistics(node, miningCalculation);

      // 採掘機の総数（軌道コレクターは含まない）
      expect(result.totalMiningMachines).toBe(10);

      // 採掘電力の計算（軌道コレクターは電力消費しない）
      // Mining Machine: 420 kW * 1.0 * 10機 = 4200 kW
      expect(result.totalMiningPower).toBeCloseTo(4200, 2);

      // 軌道コレクターの総数
      expect(result.totalOrbitalCollectors).toBe(10);
    });

    it("採掘計算と通常の統計を組み合わせる", () => {
      const node = createRecipeNode({
        recipe: mockIronIngotRecipe,
        machine: mockMachine,
        targetOutputRate: 30,
        machineCount: 5,
        proliferator: mockNoProliferator,
        power: { machines: 540, sorters: 0, dysonSphere: 0, total: 540 },
        inputs: [],
        children: [],
        conveyorBelts: { inputs: 1, outputs: 1, total: 2 },
        nodeId: "root",
      });

      const miningCalculation: MiningCalculation = {
        rawMaterials: [
          {
            itemId: 1001,
            itemName: "Iron Ore",
            requiredRate: 30,
            miningSpeedBonus: 1.0,
            workSpeedMultiplier: 200,
            powerMultiplier: 4.0,
            outputPerSecond: 6.0,
            minersNeeded: 10,
            veinsNeeded: 60,
            machineType: "Advanced Mining Machine",
          },
        ],
        totalMiners: 10,
        totalOrbitalCollectors: 0,
      };

      const result = calculateItemStatistics(node, miningCalculation);

      // デバッグ: 実際の計算結果を確認
      console.log(`Total Power: ${result.totalPower}`);
      console.log(`Total Mining Power: ${result.totalMiningPower}`);
      console.log(`Expected Total Power: 540 + 25200 = ${540 + 25200}`);

      // 通常の統計
      expect(result.totalMachines).toBe(5);
      expect(result.totalPower).toBe(540 + 25200); // 採掘電力を含む

      // 採掘関連の統計
      expect(result.totalMiningMachines).toBe(10);
      // Advanced Mining Machine: 630 kW * 4.0 * 10機 = 25200 kW
      expect(result.totalMiningPower).toBeCloseTo(25200, 2);
      expect(result.totalOrbitalCollectors).toBe(0);
    });
  });
});
