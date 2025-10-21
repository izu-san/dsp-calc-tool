import { describe, it, expect } from 'vitest';
import {
  calculateItemStatistics,
  getSortedItems,
  getRawMaterials,
  getIntermediateProducts,
  getFinalProducts,
} from '../statistics';
import type { RecipeTreeNode } from '../../types/calculation';
import type { Machine, Recipe } from '../../types/game-data';
import type { ProliferatorConfig } from '../../types/settings';
import { PROLIFERATOR_DATA } from '../../types/settings';

// Mock data
const mockNoProliferator: ProliferatorConfig = {
  ...PROLIFERATOR_DATA.none,
  mode: 'speed',
};

const mockMachine: Machine = {
  id: 2303,
  name: 'Assembler',
  Type: 'Assemble',
  assemblerSpeed: 7500,
  workEnergyPerTick: 9,
  idleEnergyPerTick: 3,
  exchangeEnergyPerTick: 0,
  isPowerConsumer: true,
  isPowerExchanger: false,
  isRaw: false,
};

const mockIronIngotRecipe: Recipe = {
  SID: 1,
  name: 'Iron Ingot',
  Type: 'Smelt',
  Explicit: false,
  TimeSpend: 60,
  Items: [{ id: 1001, name: 'Iron Ore', count: 1, Type: 'Resource', isRaw: true }],
  Results: [{ id: 1101, name: 'Iron Ingot', count: 1, Type: 'Material', isRaw: false }],
  GridIndex: '1101',
  productive: false,
};

const mockGearRecipe: Recipe = {
  SID: 2,
  name: 'Gear',
  Type: 'Assemble',
  Explicit: false,
  TimeSpend: 60,
  Items: [{ id: 1101, name: 'Iron Ingot', count: 1, Type: 'Material', isRaw: false }],
  Results: [{ id: 1102, name: 'Gear', count: 1, Type: 'Component', isRaw: false }],
  GridIndex: '1102',
  productive: false,
};

// レシピ: 副産物あり（Chemical Plant Mk.III）
const mockMultiOutputRecipe: Recipe = {
  SID: 100,
  name: 'Refined Oil',
  Type: 'Chemical',
  Explicit: true,
  TimeSpend: 240,
  Items: [{ id: 1007, name: 'Crude Oil', count: 2, Type: 'Resource', isRaw: true }],
  Results: [
    { id: 1114, name: 'Refined Oil', count: 2, Type: 'Material', isRaw: false },
    { id: 1120, name: 'Hydrogen', count: 1, Type: 'Material', isRaw: false },
  ],
  GridIndex: '5001',
  productive: false,
};

describe('statistics', () => {
  describe('calculateItemStatistics', () => {
    it('単一レシピの生産/消費量を計算する', () => {
      const node: RecipeTreeNode = {
        recipe: mockIronIngotRecipe,
        machine: mockMachine,
        targetOutputRate: 30, // 30 Iron Ingot/s
        machineCount: 5,
        proliferator: mockNoProliferator,
        power: { machines: 540, sorters: 0, total: 540 },
        inputs: [{ itemId: 1001, itemName: 'Iron Ore', requiredRate: 30 }],
        children: [],
        conveyorBelts: { inputs: 1, outputs: 1, total: 2 },
        nodeId: 'root',
      };

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

    it('複数出力レシピの処理（副産物の比率計算）', () => {
      const node: RecipeTreeNode = {
        recipe: mockMultiOutputRecipe,
        machine: mockMachine,
        targetOutputRate: 20, // 20 Refined Oil/s (main output)
        machineCount: 10,
        proliferator: mockNoProliferator,
        power: { machines: 900, sorters: 0, total: 900 },
        inputs: [{ itemId: 1007, itemName: 'Crude Oil', requiredRate: 20 }],
        children: [],
        conveyorBelts: { inputs: 1, outputs: 2, total: 3 },
        nodeId: 'root',
      };

      const result = calculateItemStatistics(node);

      // Refined Oil (main output): 20/s
      const refinedOil = result.items.get(1114);
      expect(refinedOil?.totalProduction).toBe(20);

      // Hydrogen (byproduct): ratio = 1/2 = 0.5, so 20 * 0.5 = 10/s
      const hydrogen = result.items.get(1120);
      expect(hydrogen?.totalProduction).toBe(10);
    });

    it('原材料のマーク（isRawMaterial: true）', () => {
      const rawNode: RecipeTreeNode = {
        recipe: undefined,
        machine: undefined,
        targetOutputRate: 30, // Children ノードの targetOutputRate が消費量として追加される
        machineCount: 0,
        proliferator: mockNoProliferator,
        power: { machines: 0, sorters: 0, total: 0 },
        inputs: [],
        children: [],
        conveyorBelts: { inputs: 0, outputs: 0, total: 0 },
        nodeId: 'raw-1001',
        isRawMaterial: true,
        itemId: 1001,
        itemName: 'Iron Ore',
      };

      const parentNode: RecipeTreeNode = {
        recipe: mockIronIngotRecipe,
        machine: mockMachine,
        targetOutputRate: 30,
        machineCount: 5,
        proliferator: mockNoProliferator,
        power: { machines: 540, sorters: 0, total: 540 },
        inputs: [{ itemId: 1001, itemName: 'Iron Ore', requiredRate: 30 }], // inputs の requiredRate も消費量として追加される
        children: [rawNode],
        conveyorBelts: { inputs: 1, outputs: 1, total: 2 },
        nodeId: 'root',
      };

      const result = calculateItemStatistics(parentNode);

      // Iron Ore: 原材料としてマーク
      // 消費量 = children の targetOutputRate (30) + inputs の requiredRate (30) = 60
      const ironOre = result.items.get(1001);
      expect(ironOre?.isRawMaterial).toBe(true);
      expect(ironOre?.totalProduction).toBe(0);
      expect(ironOre?.totalConsumption).toBe(60);
    });

    it('正味生産量を計算する（production - consumption）', () => {
      const ironOreNode: RecipeTreeNode = {
        recipe: undefined,
        machine: undefined,
        targetOutputRate: 60,
        machineCount: 0,
        proliferator: mockNoProliferator,
        power: { machines: 0, sorters: 0, total: 0 },
        inputs: [],
        children: [],
        conveyorBelts: { inputs: 0, outputs: 0, total: 0 },
        nodeId: 'raw-1001',
        isRawMaterial: true,
        itemId: 1001,
        itemName: 'Iron Ore',
      };

      const ironIngotNode: RecipeTreeNode = {
        recipe: mockIronIngotRecipe,
        machine: mockMachine,
        targetOutputRate: 60, // 60 Iron Ingot/s 生産
        machineCount: 10,
        proliferator: mockNoProliferator,
        power: { machines: 1080, sorters: 0, total: 1080 },
        inputs: [{ itemId: 1001, itemName: 'Iron Ore', requiredRate: 60 }],
        children: [ironOreNode],
        conveyorBelts: { inputs: 1, outputs: 1, total: 2 },
        nodeId: 'iron-ingot',
      };

      const gearNode: RecipeTreeNode = {
        recipe: mockGearRecipe,
        machine: mockMachine,
        targetOutputRate: 30, // 30 Gear/s 生産
        machineCount: 6,
        proliferator: mockNoProliferator,
        power: { machines: 540, sorters: 0, total: 540 },
        inputs: [{ itemId: 1101, itemName: 'Iron Ingot', requiredRate: 30 }], // 30 Iron Ingot/s 消費
        children: [ironIngotNode],
        conveyorBelts: { inputs: 1, outputs: 1, total: 2 },
        nodeId: 'root',
      };

      const result = calculateItemStatistics(gearNode);

      // Iron Ingot: 60生産 - 30消費 = 30正味
      const ironIngot = result.items.get(1101);
      expect(ironIngot?.totalProduction).toBe(60);
      expect(ironIngot?.totalConsumption).toBe(30);
      expect(ironIngot?.netProduction).toBe(30);

      // Gear: 30生産 - 0消費 = 30正味
      const gear = result.items.get(1102);
      expect(gear?.totalProduction).toBe(30);
      expect(gear?.totalConsumption).toBe(0);
      expect(gear?.netProduction).toBe(30);
    });

    it('機械数と電力を集計する', () => {
      const child1: RecipeTreeNode = {
        recipe: mockIronIngotRecipe,
        machine: mockMachine,
        targetOutputRate: 30,
        machineCount: 5,
        proliferator: mockNoProliferator,
        power: { machines: 540, sorters: 0, total: 540 },
        inputs: [],
        children: [],
        conveyorBelts: { inputs: 1, outputs: 1, total: 2 },
        nodeId: 'child1',
      };

      const child2: RecipeTreeNode = {
        recipe: mockGearRecipe,
        machine: mockMachine,
        targetOutputRate: 20,
        machineCount: 3,
        proliferator: mockNoProliferator,
        power: { machines: 324, sorters: 0, total: 324 },
        inputs: [],
        children: [],
        conveyorBelts: { inputs: 1, outputs: 1, total: 2 },
        nodeId: 'child2',
      };

      const parentNode: RecipeTreeNode = {
        recipe: mockGearRecipe,
        machine: mockMachine,
        targetOutputRate: 10,
        machineCount: 2,
        proliferator: mockNoProliferator,
        power: { machines: 216, sorters: 0, total: 216 },
        inputs: [],
        children: [child1, child2],
        conveyorBelts: { inputs: 1, outputs: 1, total: 2 },
        nodeId: 'root',
      };

      const result = calculateItemStatistics(parentNode);

      // 機械数: 2 + 5 + 3 = 10
      expect(result.totalMachines).toBe(10);

      // 電力: 216 + 540 + 324 = 1080
      expect(result.totalPower).toBe(1080);
    });

    it('再帰的なツリー走査を行う', () => {
      const level3: RecipeTreeNode = {
        recipe: mockIronIngotRecipe,
        machine: mockMachine,
        targetOutputRate: 10,
        machineCount: 2,
        proliferator: mockNoProliferator,
        power: { machines: 216, sorters: 0, total: 216 },
        inputs: [],
        children: [],
        conveyorBelts: { inputs: 1, outputs: 1, total: 2 },
        nodeId: 'level3',
      };

      const level2: RecipeTreeNode = {
        recipe: mockGearRecipe,
        machine: mockMachine,
        targetOutputRate: 10,
        machineCount: 2,
        proliferator: mockNoProliferator,
        power: { machines: 216, sorters: 0, total: 216 },
        inputs: [],
        children: [level3],
        conveyorBelts: { inputs: 1, outputs: 1, total: 2 },
        nodeId: 'level2',
      };

      const level1: RecipeTreeNode = {
        recipe: mockIronIngotRecipe,
        machine: mockMachine,
        targetOutputRate: 10,
        machineCount: 2,
        proliferator: mockNoProliferator,
        power: { machines: 216, sorters: 0, total: 216 },
        inputs: [],
        children: [level2],
        conveyorBelts: { inputs: 1, outputs: 1, total: 2 },
        nodeId: 'level1',
      };

      const rootNode: RecipeTreeNode = {
        recipe: mockGearRecipe,
        machine: mockMachine,
        targetOutputRate: 10,
        machineCount: 2,
        proliferator: mockNoProliferator,
        power: { machines: 216, sorters: 0, total: 216 },
        inputs: [],
        children: [level1],
        conveyorBelts: { inputs: 1, outputs: 1, total: 2 },
        nodeId: 'root',
      };

      const result = calculateItemStatistics(rootNode);

      // 機械数: 2 + 2 + 2 + 2 = 8
      expect(result.totalMachines).toBe(8);

      // 電力: 4 * 216 = 864
      expect(result.totalPower).toBe(864);
    });
  });

  describe('複雑なケース', () => {
    it('中間製品（生産も消費もされる）を処理する', () => {
      const ironOreNode: RecipeTreeNode = {
        recipe: undefined,
        machine: undefined,
        targetOutputRate: 60,
        machineCount: 0,
        proliferator: mockNoProliferator,
        power: { machines: 0, sorters: 0, total: 0 },
        inputs: [],
        children: [],
        conveyorBelts: { inputs: 0, outputs: 0, total: 0 },
        nodeId: 'raw-1001',
        isRawMaterial: true,
        itemId: 1001,
        itemName: 'Iron Ore',
      };

      const ironIngotNode: RecipeTreeNode = {
        recipe: mockIronIngotRecipe,
        machine: mockMachine,
        targetOutputRate: 60,
        machineCount: 10,
        proliferator: mockNoProliferator,
        power: { machines: 1080, sorters: 0, total: 1080 },
        inputs: [{ itemId: 1001, itemName: 'Iron Ore', requiredRate: 60 }],
        children: [ironOreNode],
        conveyorBelts: { inputs: 1, outputs: 1, total: 2 },
        nodeId: 'iron-ingot',
      };

      const gearNode: RecipeTreeNode = {
        recipe: mockGearRecipe,
        machine: mockMachine,
        targetOutputRate: 30,
        machineCount: 6,
        proliferator: mockNoProliferator,
        power: { machines: 540, sorters: 0, total: 540 },
        inputs: [{ itemId: 1101, itemName: 'Iron Ingot', requiredRate: 30 }],
        children: [ironIngotNode],
        conveyorBelts: { inputs: 1, outputs: 1, total: 2 },
        nodeId: 'root',
      };

      const result = calculateItemStatistics(gearNode);

      // Iron Ingot: 中間製品（生産60、消費30）
      const ironIngot = result.items.get(1101);
      expect(ironIngot?.totalProduction).toBeGreaterThan(0);
      expect(ironIngot?.totalConsumption).toBeGreaterThan(0);
      expect(ironIngot?.isRawMaterial).toBe(false);
    });

    it('最終製品（生産のみ）を処理する', () => {
      const node: RecipeTreeNode = {
        recipe: mockGearRecipe,
        machine: mockMachine,
        targetOutputRate: 30,
        machineCount: 6,
        proliferator: mockNoProliferator,
        power: { machines: 540, sorters: 0, total: 540 },
        inputs: [],
        children: [],
        conveyorBelts: { inputs: 1, outputs: 1, total: 2 },
        nodeId: 'root',
      };

      const result = calculateItemStatistics(node);

      // Gear: 最終製品（生産のみ）
      const gear = result.items.get(1102);
      expect(gear?.totalProduction).toBe(30);
      expect(gear?.totalConsumption).toBe(0);
      expect(gear?.netProduction).toBe(30);
    });

    it('原材料（消費のみ）を処理する', () => {
      const rawNode: RecipeTreeNode = {
        recipe: undefined,
        machine: undefined,
        targetOutputRate: 30, // Children ノードの targetOutputRate が消費量として追加される
        machineCount: 0,
        proliferator: mockNoProliferator,
        power: { machines: 0, sorters: 0, total: 0 },
        inputs: [],
        children: [],
        conveyorBelts: { inputs: 0, outputs: 0, total: 0 },
        nodeId: 'raw-1001',
        isRawMaterial: true,
        itemId: 1001,
        itemName: 'Iron Ore',
      };

      const parentNode: RecipeTreeNode = {
        recipe: mockIronIngotRecipe,
        machine: mockMachine,
        targetOutputRate: 30,
        machineCount: 5,
        proliferator: mockNoProliferator,
        power: { machines: 540, sorters: 0, total: 540 },
        inputs: [{ itemId: 1001, itemName: 'Iron Ore', requiredRate: 30 }], // inputs の requiredRate も消費量として追加される
        children: [rawNode],
        conveyorBelts: { inputs: 1, outputs: 1, total: 2 },
        nodeId: 'root',
      };

      const result = calculateItemStatistics(parentNode);

      // Iron Ore: 原材料（消費のみ）
      // 消費量 = children の targetOutputRate (30) + inputs の requiredRate (30) = 60
      const ironOre = result.items.get(1001);
      expect(ironOre?.totalProduction).toBe(0);
      expect(ironOre?.totalConsumption).toBe(60);
      expect(ironOre?.isRawMaterial).toBe(true);
    });

    it('副産物の生産レートを計算する（比率に基づく）', () => {
      const node: RecipeTreeNode = {
        recipe: mockMultiOutputRecipe,
        machine: mockMachine,
        targetOutputRate: 20, // Main output: 20 Refined Oil/s
        machineCount: 10,
        proliferator: mockNoProliferator,
        power: { machines: 900, sorters: 0, total: 900 },
        inputs: [],
        children: [],
        conveyorBelts: { inputs: 1, outputs: 2, total: 3 },
        nodeId: 'root',
      };

      const result = calculateItemStatistics(node);

      // Refined Oil: 20/s (main output, count=2)
      const refinedOil = result.items.get(1114);
      expect(refinedOil?.totalProduction).toBe(20);

      // Hydrogen: ratio = 1/2 = 0.5, so 20 * 0.5 = 10/s
      const hydrogen = result.items.get(1120);
      expect(hydrogen?.totalProduction).toBe(10);
    });
  });

  describe('getSortedItems', () => {
    it('原材料を最優先でソートする', () => {
      const stats = {
        items: new Map([
          [1102, { itemId: 1102, totalProduction: 30, totalConsumption: 0, netProduction: 30, isRawMaterial: false }],
          [1001, { itemId: 1001, totalProduction: 0, totalConsumption: 60, netProduction: -60, isRawMaterial: true }],
          [1101, { itemId: 1101, totalProduction: 60, totalConsumption: 30, netProduction: 30, isRawMaterial: false }],
        ]),
        totalMachines: 10,
        totalPower: 1000,
      };

      const sorted = getSortedItems(stats);

      // 原材料が最初に来る
      expect(sorted[0].itemId).toBe(1001);
      expect(sorted[0].isRawMaterial).toBe(true);
    });

    it('正味生産量の絶対値でソートする', () => {
      const stats = {
        items: new Map([
          [1, { itemId: 1, totalProduction: 10, totalConsumption: 0, netProduction: 10, isRawMaterial: false }],
          [2, { itemId: 2, totalProduction: 50, totalConsumption: 0, netProduction: 50, isRawMaterial: false }],
          [3, { itemId: 3, totalProduction: 30, totalConsumption: 0, netProduction: 30, isRawMaterial: false }],
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

  describe('getRawMaterials', () => {
    it('原材料のみフィルタする', () => {
      const stats = {
        items: new Map([
          [1001, { itemId: 1001, totalProduction: 0, totalConsumption: 60, netProduction: -60, isRawMaterial: true }],
          [1101, { itemId: 1101, totalProduction: 60, totalConsumption: 0, netProduction: 60, isRawMaterial: false }],
          [1002, { itemId: 1002, totalProduction: 0, totalConsumption: 30, netProduction: -30, isRawMaterial: true }],
        ]),
        totalMachines: 10,
        totalPower: 1000,
      };

      const rawMaterials = getRawMaterials(stats);

      expect(rawMaterials).toHaveLength(2);
      expect(rawMaterials[0].isRawMaterial).toBe(true);
      expect(rawMaterials[1].isRawMaterial).toBe(true);
    });

    it('消費量でソート（降順）する', () => {
      const stats = {
        items: new Map([
          [1001, { itemId: 1001, totalProduction: 0, totalConsumption: 30, netProduction: -30, isRawMaterial: true }],
          [1002, { itemId: 1002, totalProduction: 0, totalConsumption: 60, netProduction: -60, isRawMaterial: true }],
          [1003, { itemId: 1003, totalProduction: 0, totalConsumption: 45, netProduction: -45, isRawMaterial: true }],
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

  describe('getIntermediateProducts', () => {
    it('生産と消費両方のアイテムのみフィルタする', () => {
      const stats = {
        items: new Map([
          [1001, { itemId: 1001, totalProduction: 0, totalConsumption: 60, netProduction: -60, isRawMaterial: true }],
          [1101, { itemId: 1101, totalProduction: 60, totalConsumption: 30, netProduction: 30, isRawMaterial: false }], // 中間製品
          [1102, { itemId: 1102, totalProduction: 30, totalConsumption: 0, netProduction: 30, isRawMaterial: false }], // 最終製品
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

    it('生産量でソート（降順）する', () => {
      const stats = {
        items: new Map([
          [1, { itemId: 1, totalProduction: 30, totalConsumption: 10, netProduction: 20, isRawMaterial: false }],
          [2, { itemId: 2, totalProduction: 60, totalConsumption: 20, netProduction: 40, isRawMaterial: false }],
          [3, { itemId: 3, totalProduction: 45, totalConsumption: 15, netProduction: 30, isRawMaterial: false }],
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

  describe('getFinalProducts', () => {
    it('生産のみで消費されないアイテムをフィルタする', () => {
      const stats = {
        items: new Map([
          [1001, { itemId: 1001, totalProduction: 0, totalConsumption: 60, netProduction: -60, isRawMaterial: true }],
          [1101, { itemId: 1101, totalProduction: 60, totalConsumption: 30, netProduction: 30, isRawMaterial: false }], // 中間製品
          [1102, { itemId: 1102, totalProduction: 30, totalConsumption: 0, netProduction: 30, isRawMaterial: false }], // 最終製品
        ]),
        totalMachines: 10,
        totalPower: 1000,
      };

      const finalProducts = getFinalProducts(stats);

      expect(finalProducts).toHaveLength(1);
      expect(finalProducts[0].itemId).toBe(1102);
      expect(finalProducts[0].totalProduction).toBeGreaterThan(0);
      expect(finalProducts[0].totalConsumption).toBe(0);
    });

    it('生産量でソート（降順）する', () => {
      const stats = {
        items: new Map([
          [1, { itemId: 1, totalProduction: 30, totalConsumption: 0, netProduction: 30, isRawMaterial: false }],
          [2, { itemId: 2, totalProduction: 60, totalConsumption: 0, netProduction: 60, isRawMaterial: false }],
          [3, { itemId: 3, totalProduction: 45, totalConsumption: 0, netProduction: 45, isRawMaterial: false }],
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
  });
});
