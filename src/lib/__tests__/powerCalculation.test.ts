import { describe, it, expect } from 'vitest';
import { calculatePowerConsumption } from '../powerCalculation';
import type { RecipeTreeNode } from '../../types/calculation';
import type { Machine, Recipe, GameData } from '../../types/game-data';
import type { GlobalSettings } from '../../types/settings';
import type { MiningCalculation } from '../miningCalculation';
import { SORTER_DATA } from '../../types/settings';

// Mock machine data
const mockArcSmelter: Machine = {
  id: 2302,
  name: 'Arc Smelter',
  Type: 'Smelt',
  assemblerSpeed: 10000,
  workEnergyPerTick: 12, // 12 * 60 / 1000 = 0.72 kW
  idleEnergyPerTick: 4,
  exchangeEnergyPerTick: 0,
  isPowerConsumer: true,
  isPowerExchanger: false,
  isRaw: false,
};

const mockAssembler: Machine = {
  id: 2303,
  name: 'Assembling Machine Mk.I',
  Type: 'Assemble',
  assemblerSpeed: 7500,
  workEnergyPerTick: 9, // 9 * 60 / 1000 = 0.54 kW
  idleEnergyPerTick: 3,
  exchangeEnergyPerTick: 0,
  isPowerConsumer: true,
  isPowerExchanger: false,
  isRaw: false,
};

const mockChemicalPlant: Machine = {
  id: 2309,
  name: 'Chemical Plant',
  Type: 'Chemical',
  assemblerSpeed: 10000,
  workEnergyPerTick: 15, // 15 * 60 / 1000 = 0.9 kW
  idleEnergyPerTick: 5,
  exchangeEnergyPerTick: 0,
  isPowerConsumer: true,
  isPowerExchanger: false,
  isRaw: false,
};

const mockZeroPowerMachine: Machine = {
  id: 9999,
  name: 'Zero Power Machine',
  Type: 'Assemble',
  assemblerSpeed: 10000,
  workEnergyPerTick: 0, // 電力消費なし
  idleEnergyPerTick: 0,
  exchangeEnergyPerTick: 0,
  isPowerConsumer: false,
  isPowerExchanger: false,
  isRaw: false,
};

const mockRecipe: Recipe = {
  SID: 1,
  name: 'Test Recipe',
  Type: 'Smelt',
  Explicit: false,
  TimeSpend: 60,
  Items: [{ id: 1001, name: 'Input', count: 1, Type: 'Resource', isRaw: true }],
  Results: [{ id: 1101, name: 'Output', count: 1, Type: 'Material', isRaw: false }],
  GridIndex: '1101',
  productive: false,
};

// Mock game data for mining machines
const mockGameData: GameData = {
  items: new Map([
    [1001, { id: 1001, name: 'Iron Ore', Type: 'Resource', isRaw: true }],
  ]),
  machines: new Map([
    [2301, { id: 2301, name: '採掘機', Type: 'Production', assemblerSpeed: 0, workEnergyPerTick: 420, idleEnergyPerTick: 0, exchangeEnergyPerTick: 0, isPowerConsumer: true, isPowerExchanger: false, isRaw: false }],
    [2306, { id: 2306, name: 'ウォーターポンプ', Type: 'Production', assemblerSpeed: 0, workEnergyPerTick: 5000, idleEnergyPerTick: 200, exchangeEnergyPerTick: 0, isPowerConsumer: true, isPowerExchanger: false, isRaw: false }],
    [2307, { id: 2307, name: 'オイル抽出器', Type: 'Production', assemblerSpeed: 0, workEnergyPerTick: 14000, idleEnergyPerTick: 400, exchangeEnergyPerTick: 0, isPowerConsumer: true, isPowerExchanger: false, isRaw: false }],
    [2316, { id: 2316, name: '高度採掘機', Type: 'Production', assemblerSpeed: 0, workEnergyPerTick: 630, idleEnergyPerTick: 0, exchangeEnergyPerTick: 0, isPowerConsumer: true, isPowerExchanger: false, isRaw: false }],
  ]),
  recipes: new Map(),
};

describe('calculatePowerConsumption', () => {
  const mockSettings: GlobalSettings = {
    proliferator: { type: 'none', mode: 'production', productionBonus: 0, speedBonus: 0, powerIncrease: 0 },
    machineRank: { Smelt: 'arc', Assemble: 'mk1', Chemical: 'standard', Research: 'standard', Refine: 'standard', Particle: 'standard' },
    conveyorBelt: { tier: 'mk1', speed: 6, stackCount: 1 },
    sorter: SORTER_DATA.mk1,
    alternativeRecipes: new Map(),
    miningSpeedResearch: 100,
    proliferatorMultiplier: { production: 1, speed: 1 },
    photonGeneration: { useGravitonLens: false, continuousReception: false, rayTransmissionEfficiency: 100, gravitonLensProliferator: { type: 'none', mode: 'production', productionBonus: 0, speedBonus: 0, powerIncrease: 0 } },
  };
  // 基本機能テスト
  describe('基本機能', () => {
    it('単一機械の電力を計算する（workEnergyPerTick × 60 / 1000 kW）', () => {
      const node: RecipeTreeNode = {
        recipe: mockRecipe,
        machine: mockArcSmelter,
        targetOutputRate: 30,
        machineCount: 10,
        inputs: [],
        children: [],
        power: { machines: 0, sorters: 0, total: 0 },
        conveyorBelts: { inputs: 0, outputs: 0, total: 2 },
        depth: 0,
        isRawMaterial: false,
      };

      const result = calculatePowerConsumption(node, mockSettings);

      // 1機あたり: 12 * 60 / 1000 = 0.72 kW
      // 10機: 0.72 * 10 = 7.2 kW
      expect(result.total).toBeCloseTo(7.2, 2);
      expect(result.byMachine).toHaveLength(1);
      expect(result.byMachine[0].machineId).toBe(2302);
      expect(result.byMachine[0].machineName).toBe('Arc Smelter');
      expect(result.byMachine[0].machineCount).toBe(10);
      expect(result.byMachine[0].powerPerMachine).toBeCloseTo(0.72, 2);
      expect(result.byMachine[0].totalPower).toBeCloseTo(7.2, 2);
    });

    it('複数機械の電力を集計する', () => {
      const childNode: RecipeTreeNode = {
        recipe: mockRecipe,
        machine: mockArcSmelter, // 0.72 kW/機
        targetOutputRate: 30,
        machineCount: 5,
        inputs: [],
        children: [],
        power: { machines: 0, sorters: 0, total: 0 },
        conveyorBelts: { inputs: 0, outputs: 0, total: 1 },
        depth: 1,
        isRawMaterial: false,
      };

      const parentNode: RecipeTreeNode = {
        recipe: mockRecipe,
        machine: mockAssembler, // 0.54 kW/機
        targetOutputRate: 15,
        machineCount: 8,
        inputs: [],
        children: [childNode],
        power: { machines: 0, sorters: 0, total: 0 },
        conveyorBelts: { inputs: 0, outputs: 0, total: 2 },
        depth: 0,
        isRawMaterial: false,
      };

      const result = calculatePowerConsumption(parentNode, mockSettings);

      // Arc Smelter: 0.72 * 5 = 3.6 kW
      // Assembler: 0.54 * 8 = 4.32 kW
      // Total: 7.92 kW
      expect(result.total).toBeCloseTo(7.92, 2);
      expect(result.byMachine).toHaveLength(2);
    });

    it('電力割合（パーセンテージ）を計算する', () => {
      const child1: RecipeTreeNode = {
        recipe: mockRecipe,
        machine: mockArcSmelter, // 0.72 kW/機
        targetOutputRate: 30,
        machineCount: 10, // 7.2 kW
        inputs: [],
        children: [],
        power: { machines: 0, sorters: 0, total: 0 },
        conveyorBelts: { inputs: 0, outputs: 0, total: 1 },
        depth: 1,
        isRawMaterial: false,
      };

      const child2: RecipeTreeNode = {
        recipe: mockRecipe,
        machine: mockChemicalPlant, // 0.9 kW/機
        targetOutputRate: 20,
        machineCount: 4, // 3.6 kW
        inputs: [],
        children: [],
        power: { machines: 0, sorters: 0, total: 0 },
        conveyorBelts: { inputs: 0, outputs: 0, total: 1 },
        depth: 1,
        isRawMaterial: false,
      };

      const parentNode: RecipeTreeNode = {
        recipe: mockRecipe,
        machine: mockAssembler, // 0.54 kW/機
        targetOutputRate: 15,
        machineCount: 5, // 2.7 kW
        inputs: [],
        children: [child1, child2],
        power: { machines: 0, sorters: 0, total: 0 },
        conveyorBelts: { inputs: 0, outputs: 0, total: 2 },
        depth: 0,
        isRawMaterial: false,
      };

      const result = calculatePowerConsumption(parentNode, mockSettings);

      // Total: 7.2 + 3.6 + 2.7 = 13.5 kW
      expect(result.total).toBeCloseTo(13.5, 2);

      // Arc Smelter: 7.2 / 13.5 = 53.33%
      const arcSmelter = result.byMachine.find(m => m.machineId === 2302);
      expect(arcSmelter?.percentage).toBeCloseTo(53.33, 1);

      // Chemical Plant: 3.6 / 13.5 = 26.67%
      const chemicalPlant = result.byMachine.find(m => m.machineId === 2309);
      expect(chemicalPlant?.percentage).toBeCloseTo(26.67, 1);

      // Assembler: 2.7 / 13.5 = 20%
      const assembler = result.byMachine.find(m => m.machineId === 2303);
      expect(assembler?.percentage).toBeCloseTo(20, 1);
    });

    it('機械タイプ別にグループ化する', () => {
      const child1: RecipeTreeNode = {
        recipe: mockRecipe,
        machine: mockArcSmelter,
        targetOutputRate: 30,
        machineCount: 5,
        inputs: [],
        children: [],
        power: { machines: 0, sorters: 0, total: 0 },
        conveyorBelts: { inputs: 0, outputs: 0, total: 1 },
        depth: 2,
        isRawMaterial: false,
      };

      const child2: RecipeTreeNode = {
        recipe: mockRecipe,
        machine: mockArcSmelter, // 同じ機械タイプ
        targetOutputRate: 20,
        machineCount: 3,
        inputs: [],
        children: [],
        power: { machines: 0, sorters: 0, total: 0 },
        conveyorBelts: { inputs: 0, outputs: 0, total: 1 },
        depth: 2,
        isRawMaterial: false,
      };

      const parentNode: RecipeTreeNode = {
        recipe: mockRecipe,
        machine: mockAssembler,
        targetOutputRate: 15,
        machineCount: 4,
        inputs: [],
        children: [child1, child2],
        power: { machines: 0, sorters: 0, total: 0 },
        conveyorBelts: { inputs: 0, outputs: 0, total: 2 },
        depth: 0,
        isRawMaterial: false,
      };

      const result = calculatePowerConsumption(parentNode, mockSettings);

      // Arc Smelterは統合されるべき
      expect(result.byMachine).toHaveLength(2);
      
      const arcSmelter = result.byMachine.find(m => m.machineId === 2302);
      expect(arcSmelter?.machineCount).toBe(8); // 5 + 3
      expect(arcSmelter?.totalPower).toBeCloseTo(5.76, 2); // 0.72 * 8
    });

    it('電力消費量の降順でソートする', () => {
      const child1: RecipeTreeNode = {
        recipe: mockRecipe,
        machine: mockAssembler, // 0.54 * 3 = 1.62 kW
        targetOutputRate: 10,
        machineCount: 3,
        inputs: [],
        children: [],
        power: { machines: 0, sorters: 0, total: 0 },
        conveyorBelts: { inputs: 0, outputs: 0, total: 1 },
        depth: 1,
        isRawMaterial: false,
      };

      const child2: RecipeTreeNode = {
        recipe: mockRecipe,
        machine: mockChemicalPlant, // 0.9 * 10 = 9.0 kW
        targetOutputRate: 20,
        machineCount: 10,
        inputs: [],
        children: [],
        power: { machines: 0, sorters: 0, total: 0 },
        conveyorBelts: { inputs: 0, outputs: 0, total: 1 },
        depth: 1,
        isRawMaterial: false,
      };

      const parentNode: RecipeTreeNode = {
        recipe: mockRecipe,
        machine: mockArcSmelter, // 0.72 * 5 = 3.6 kW
        targetOutputRate: 15,
        machineCount: 5,
        inputs: [],
        children: [child1, child2],
        power: { machines: 0, sorters: 0, total: 0 },
        conveyorBelts: { inputs: 0, outputs: 0, total: 2 },
        depth: 0,
        isRawMaterial: false,
      };

      const result = calculatePowerConsumption(parentNode, mockSettings);

      // 降順: Chemical Plant (9.0) > Arc Smelter (3.6) > Assembler (1.62)
      expect(result.byMachine[0].machineId).toBe(2309); // Chemical Plant
      expect(result.byMachine[1].machineId).toBe(2302); // Arc Smelter
      expect(result.byMachine[2].machineId).toBe(2303); // Assembler
    });
  });

  // エッジケーステスト
  describe('エッジケース', () => {
    it('nullノードの処理（total: 0, byMachine: []）', () => {
      const result = calculatePowerConsumption(null, mockSettings);

      expect(result.total).toBe(0);
      expect(result.byMachine).toEqual([]);
    });

    it('原材料ノード（機械なし）をスキップする', () => {
      const rawMaterialNode: RecipeTreeNode = {
        recipe: undefined,
        machine: undefined,
        targetOutputRate: 30,
        machineCount: 0,
        inputs: [],
        children: [],
        power: { machines: 0, sorters: 0, total: 0 },
        conveyorBelts: { inputs: 0, outputs: 0, total: 0 },
        depth: 1,
        isRawMaterial: true,
        itemId: 1001,
      };

      const parentNode: RecipeTreeNode = {
        recipe: mockRecipe,
        machine: mockArcSmelter,
        targetOutputRate: 30,
        machineCount: 5,
        inputs: [],
        children: [rawMaterialNode],
        power: { machines: 0, sorters: 0, total: 0 },
        conveyorBelts: { inputs: 0, outputs: 0, total: 2 },
        depth: 0,
        isRawMaterial: false,
      };

      const result = calculatePowerConsumption(parentNode, mockSettings);

      // 原材料ノードは無視され、Arc Smelterのみ
      expect(result.byMachine).toHaveLength(1);
      expect(result.byMachine[0].machineId).toBe(2302);
    });

    it('workEnergyPerTickが0の機械を処理する', () => {
      const node: RecipeTreeNode = {
        recipe: mockRecipe,
        machine: mockZeroPowerMachine,
        targetOutputRate: 10,
        machineCount: 5,
        inputs: [],
        children: [],
        power: { machines: 0, sorters: 0, total: 0 },
        conveyorBelts: { inputs: 0, outputs: 0, total: 1 },
        depth: 0,
        isRawMaterial: false,
      };

      const result = calculatePowerConsumption(node, mockSettings);

      expect(result.total).toBe(0);
      expect(result.byMachine).toHaveLength(1);
      expect(result.byMachine[0].powerPerMachine).toBe(0);
      expect(result.byMachine[0].totalPower).toBe(0);
    });
  });

  // 検証テスト
  describe('検証テスト', () => {
    it('パーセンテージの合計が100%になる', () => {
      const child1: RecipeTreeNode = {
        recipe: mockRecipe,
        machine: mockArcSmelter,
        targetOutputRate: 30,
        machineCount: 10,
        inputs: [],
        children: [],
        power: { machines: 0, sorters: 0, total: 0 },
        conveyorBelts: { inputs: 0, outputs: 0, total: 1 },
        depth: 1,
        isRawMaterial: false,
      };

      const child2: RecipeTreeNode = {
        recipe: mockRecipe,
        machine: mockChemicalPlant,
        targetOutputRate: 20,
        machineCount: 5,
        inputs: [],
        children: [],
        power: { machines: 0, sorters: 0, total: 0 },
        conveyorBelts: { inputs: 0, outputs: 0, total: 1 },
        depth: 1,
        isRawMaterial: false,
      };

      const parentNode: RecipeTreeNode = {
        recipe: mockRecipe,
        machine: mockAssembler,
        targetOutputRate: 15,
        machineCount: 8,
        inputs: [],
        children: [child1, child2],
        power: { machines: 0, sorters: 0, total: 0 },
        conveyorBelts: { inputs: 0, outputs: 0, total: 2 },
        depth: 0,
        isRawMaterial: false,
      };

      const result = calculatePowerConsumption(parentNode, mockSettings);

      const totalPercentage = result.byMachine.reduce(
        (sum, item) => sum + item.percentage,
        0
      );

      expect(totalPercentage).toBeCloseTo(100, 1);
    });

    it('深い階層ツリーの処理（再帰的集計）', () => {
      // 5階層のツリー
      const level4: RecipeTreeNode = {
        recipe: mockRecipe,
        machine: mockArcSmelter,
        targetOutputRate: 5,
        machineCount: 2,
        inputs: [],
        children: [],
        power: { machines: 0, sorters: 0, total: 0 },
        conveyorBelts: { inputs: 0, outputs: 0, total: 1 },
        depth: 4,
        isRawMaterial: false,
      };

      const level3: RecipeTreeNode = {
        recipe: mockRecipe,
        machine: mockAssembler,
        targetOutputRate: 5,
        machineCount: 3,
        inputs: [],
        children: [level4],
        power: { machines: 0, sorters: 0, total: 0 },
        conveyorBelts: { inputs: 0, outputs: 0, total: 1 },
        depth: 3,
        isRawMaterial: false,
      };

      const level2: RecipeTreeNode = {
        recipe: mockRecipe,
        machine: mockChemicalPlant,
        targetOutputRate: 5,
        machineCount: 4,
        inputs: [],
        children: [level3],
        power: { machines: 0, sorters: 0, total: 0 },
        conveyorBelts: { inputs: 0, outputs: 0, total: 1 },
        depth: 2,
        isRawMaterial: false,
      };

      const level1: RecipeTreeNode = {
        recipe: mockRecipe,
        machine: mockArcSmelter,
        targetOutputRate: 5,
        machineCount: 5,
        inputs: [],
        children: [level2],
        power: { machines: 0, sorters: 0, total: 0 },
        conveyorBelts: { inputs: 0, outputs: 0, total: 1 },
        depth: 1,
        isRawMaterial: false,
      };

      const rootNode: RecipeTreeNode = {
        recipe: mockRecipe,
        machine: mockAssembler,
        targetOutputRate: 5,
        machineCount: 6,
        inputs: [],
        children: [level1],
        power: { machines: 0, sorters: 0, total: 0 },
        conveyorBelts: { inputs: 0, outputs: 0, total: 1 },
        depth: 0,
        isRawMaterial: false,
      };

      const result = calculatePowerConsumption(rootNode, mockSettings);

      // Arc Smelter: 2 + 5 = 7機, 0.72 * 7 = 5.04 kW
      // Assembler: 3 + 6 = 9機, 0.54 * 9 = 4.86 kW
      // Chemical Plant: 4機, 0.9 * 4 = 3.6 kW
      // Total: 13.5 kW
      expect(result.total).toBeCloseTo(13.5, 2);
      expect(result.byMachine).toHaveLength(3);
    });
  });

  // γ線レシーバーテスト
  describe('γ線レシーバー（ダイソンスフィア電力）', () => {
    it('γ線レシーバーを電力配分から除外する', () => {
      const rayReceiverNode: RecipeTreeNode = {
        recipe: mockRecipe,
        machine: {
          id: 2208, // γ線レシーバーのID
          name: 'γ線レシーバー',
          Type: 'PhotonGeneration',
          assemblerSpeed: 10000,
          workEnergyPerTick: 1000, // 高い電力消費
          idleEnergyPerTick: 100,
          exchangeEnergyPerTick: 0,
          isPowerConsumer: true,
          isPowerExchanger: false,
          isRaw: false,
        },
        targetOutputRate: 30,
        machineCount: 5,
        inputs: [],
        children: [],
        power: { machines: 5000, sorters: 10.0, total: 5010 }, // 高い電力消費
        conveyorBelts: { inputs: 0, outputs: 0, total: 2 },
        depth: 0,
        isRawMaterial: false,
      };

      const result = calculatePowerConsumption(rayReceiverNode, mockSettings);

      // γ線レシーバーは電力配分から除外される
      expect(result.total).toBeCloseTo(10.0, 2); // ソーターの電力のみ
      expect(result.byMachine).toHaveLength(1); // ソーターのみ
      
      // γ線レシーバーが含まれていないかチェック
      const rayReceiverEntry = result.byMachine.find(m => m.machineId === 2208);
      expect(rayReceiverEntry).toBeUndefined();
      
      // ソーターが含まれているかチェック（設定に基づくアイコンID）
      const sorterEntry = result.byMachine.find(m => m.machineName === 'ソーター');
      expect(sorterEntry).toBeDefined();
      expect(sorterEntry?.totalPower).toBeCloseTo(10.0, 2);
    });

    it('γ線レシーバーと他の機械の組み合わせで正しく計算する', () => {
      const childNode: RecipeTreeNode = {
        recipe: mockRecipe,
        machine: mockArcSmelter,
        targetOutputRate: 30,
        machineCount: 3,
        inputs: [],
        children: [],
        power: { machines: 216, sorters: 5.0, total: 221 },
        conveyorBelts: { inputs: 0, outputs: 0, total: 2 },
        depth: 1,
        isRawMaterial: false,
      };

      const rayReceiverNode: RecipeTreeNode = {
        recipe: mockRecipe,
        machine: {
          id: 2208,
          name: 'γ線レシーバー',
          Type: 'PhotonGeneration',
          assemblerSpeed: 10000,
          workEnergyPerTick: 1000,
          idleEnergyPerTick: 100,
          exchangeEnergyPerTick: 0,
          isPowerConsumer: true,
          isPowerExchanger: false,
          isRaw: false,
        },
        targetOutputRate: 30,
        machineCount: 2,
        inputs: [],
        children: [childNode],
        power: { machines: 2000, sorters: 8.0, total: 2008 },
        conveyorBelts: { inputs: 0, outputs: 0, total: 2 },
        depth: 0,
        isRawMaterial: false,
      };

      const result = calculatePowerConsumption(rayReceiverNode, mockSettings);

      // Arc Smelter: 0.72 * 3 = 2.16 kW
      // Sorters: 5.0 + 8.0 = 13.0 kW
      // Total: 15.16 kW (γ線レシーバーの機械電力は除外)
      expect(result.total).toBeCloseTo(15.16, 2);
      expect(result.byMachine).toHaveLength(2); // Arc Smelter + Sorters
      
      // γ線レシーバーが含まれていないかチェック
      const rayReceiverEntry = result.byMachine.find(m => m.machineId === 2208);
      expect(rayReceiverEntry).toBeUndefined();
    });
  });

  // 新機能テスト
  describe('新機能', () => {
    it('ソーターの電力を電力配分に含める', () => {
      const node: RecipeTreeNode = {
        recipe: mockRecipe,
        machine: mockArcSmelter,
        targetOutputRate: 30,
        machineCount: 10,
        inputs: [],
        children: [],
        power: { machines: 0, sorters: 5.0, total: 0 }, // 5.0 kW のソーター電力
        conveyorBelts: { inputs: 0, outputs: 0, total: 2 },
        depth: 0,
        isRawMaterial: false,
      };

      const result = calculatePowerConsumption(node, mockSettings);

      // Arc Smelter: 0.72 * 10 = 7.2 kW
      // Sorters: 5.0 kW
      // Total: 12.2 kW
      expect(result.total).toBeCloseTo(12.2, 2);
      expect(result.byMachine).toHaveLength(2);
      
      // ソーターが含まれているかチェック（設定に基づくアイコンID）
      const sorterEntry = result.byMachine.find(m => m.machineName === 'ソーター');
      expect(sorterEntry).toBeDefined();
      expect(sorterEntry?.machineName).toBe('ソーター');
      expect(sorterEntry?.totalPower).toBeCloseTo(5.0, 2);
      expect(sorterEntry?.percentage).toBeCloseTo(40.98, 1); // 5.0 / 12.2 * 100
    });

    it('増産剤による電力増加を反映する', () => {
      const node: RecipeTreeNode = {
        recipe: mockRecipe,
        machine: mockArcSmelter,
        targetOutputRate: 30,
        machineCount: 10,
        inputs: [],
        children: [],
        power: { machines: 0, sorters: 0, total: 0 },
        conveyorBelts: { inputs: 0, outputs: 0, total: 2 },
        depth: 0,
        isRawMaterial: false,
        proliferator: {
          type: 'mk1',
          mode: 'speed',
          productionBonus: 0.125,
          speedBonus: 0.25,
          powerIncrease: 0.30, // 30% 電力増加
        },
      };

      const result = calculatePowerConsumption(node, mockSettings);

      // 基本電力: 0.72 kW/機
      // 増産剤効果: 0.72 * (1 + 0.30) = 0.936 kW/機
      // 10機: 0.936 * 10 = 9.36 kW
      expect(result.total).toBeCloseTo(9.36, 2);
      expect(result.byMachine).toHaveLength(1);
      expect(result.byMachine[0].powerPerMachine).toBeCloseTo(0.936, 3);
      expect(result.byMachine[0].totalPower).toBeCloseTo(9.36, 2);
    });

    it('異なる増産剤設定の機械で高い電力値を採用する', () => {
      const child1: RecipeTreeNode = {
        recipe: mockRecipe,
        machine: mockArcSmelter,
        targetOutputRate: 30,
        machineCount: 5,
        inputs: [],
        children: [],
        power: { machines: 0, sorters: 0, total: 0 },
        conveyorBelts: { inputs: 0, outputs: 0, total: 1 },
        depth: 1,
        isRawMaterial: false,
        proliferator: {
          type: 'mk1',
          mode: 'speed',
          productionBonus: 0.125,
          speedBonus: 0.25,
          powerIncrease: 0.30, // 30% 電力増加
        },
      };

      const child2: RecipeTreeNode = {
        recipe: mockRecipe,
        machine: mockArcSmelter, // 同じ機械
        targetOutputRate: 20,
        machineCount: 3,
        inputs: [],
        children: [],
        power: { machines: 0, sorters: 0, total: 0 },
        conveyorBelts: { inputs: 0, outputs: 0, total: 1 },
        depth: 1,
        isRawMaterial: false,
        proliferator: {
          type: 'mk2',
          mode: 'production',
          productionBonus: 0.25,
          speedBonus: 0.5,
          powerIncrease: 0.50, // 50% 電力増加（より高い値）
        },
      };

      const parentNode: RecipeTreeNode = {
        recipe: mockRecipe,
        machine: mockAssembler,
        targetOutputRate: 15,
        machineCount: 4,
        inputs: [],
        children: [child1, child2],
        power: { machines: 0, sorters: 0, total: 0 },
        conveyorBelts: { inputs: 0, outputs: 0, total: 2 },
        depth: 0,
        isRawMaterial: false,
      };

      const result = calculatePowerConsumption(parentNode, mockSettings);

      // Arc Smelterは統合されるが、高い電力増加率（50%）が採用される
      expect(result.byMachine).toHaveLength(2);
      
      const arcSmelter = result.byMachine.find(m => m.machineId === 2302);
      expect(arcSmelter?.machineCount).toBe(8); // 5 + 3
      // 高い電力増加率（50%）が採用される: 0.72 * (1 + 0.50) = 1.08 kW/機
      expect(arcSmelter?.powerPerMachine).toBeCloseTo(1.08, 2);
      expect(arcSmelter?.totalPower).toBeCloseTo(8.64, 2); // 1.08 * 8
    });

    it('ソーターと増産剤の両方の効果を組み合わせる', () => {
      const node: RecipeTreeNode = {
        recipe: mockRecipe,
        machine: mockArcSmelter,
        targetOutputRate: 30,
        machineCount: 10,
        inputs: [],
        children: [],
        power: { machines: 0, sorters: 3.0, total: 0 }, // 3.0 kW のソーター電力
        conveyorBelts: { inputs: 0, outputs: 0, total: 2 },
        depth: 0,
        isRawMaterial: false,
        proliferator: {
          type: 'mk1',
          mode: 'speed',
          productionBonus: 0.125,
          speedBonus: 0.25,
          powerIncrease: 0.30, // 30% 電力増加
        },
      };

      const result = calculatePowerConsumption(node, mockSettings);

      // Arc Smelter: 0.72 * (1 + 0.30) * 10 = 9.36 kW
      // Sorters: 3.0 kW
      // Total: 12.36 kW
      expect(result.total).toBeCloseTo(12.36, 2);
      expect(result.byMachine).toHaveLength(2);
      
      // Arc Smelterの電力増加が反映されている
      const arcSmelter = result.byMachine.find(m => m.machineId === 2302);
      expect(arcSmelter?.powerPerMachine).toBeCloseTo(0.936, 3); // 0.72 * 1.30
      expect(arcSmelter?.totalPower).toBeCloseTo(9.36, 2);
      
      // ソーターも含まれている（設定に基づくアイコンID）
      const sorterEntry = result.byMachine.find(m => m.machineName === 'ソーター');
      expect(sorterEntry?.totalPower).toBeCloseTo(3.0, 2);
      expect(sorterEntry?.machineId).toBe(2011); // Mk.I sorter icon ID
    });
  });

  describe('ソーター設定によるアイコン変更', () => {
    it('Mk.II ソーター設定でアイコンIDが2012になる', () => {
      const mk2Settings = { ...mockSettings, sorter: SORTER_DATA.mk2 };
      
      const node: RecipeTreeNode = {
        recipe: mockRecipe,
        machine: mockArcSmelter,
        targetOutputRate: 30,
        machineCount: 10,
        inputs: [],
        children: [],
        power: { machines: 7.2, sorters: 3.0, total: 10.2 },
        conveyorBelts: { inputs: 0, outputs: 0, total: 2 },
        depth: 0,
        isRawMaterial: false,
      };

      const result = calculatePowerConsumption(node, mk2Settings);
      
      const sorterEntry = result.byMachine.find(m => m.machineName === 'ソーター');
      expect(sorterEntry?.machineId).toBe(2012); // Mk.II sorter icon ID
    });

    it('Mk.III ソーター設定でアイコンIDが2013になる', () => {
      const mk3Settings = { ...mockSettings, sorter: SORTER_DATA.mk3 };
      
      const node: RecipeTreeNode = {
        recipe: mockRecipe,
        machine: mockArcSmelter,
        targetOutputRate: 30,
        machineCount: 10,
        inputs: [],
        children: [],
        power: { machines: 7.2, sorters: 3.0, total: 10.2 },
        conveyorBelts: { inputs: 0, outputs: 0, total: 2 },
        depth: 0,
        isRawMaterial: false,
      };

      const result = calculatePowerConsumption(node, mk3Settings);
      
      const sorterEntry = result.byMachine.find(m => m.machineName === 'ソーター');
      expect(sorterEntry?.machineId).toBe(2013); // Mk.III sorter icon ID
    });

    it('集積ソーター設定でアイコンIDが2014になる', () => {
      const pileSettings = { ...mockSettings, sorter: SORTER_DATA.pile };
      
      const node: RecipeTreeNode = {
        recipe: mockRecipe,
        machine: mockArcSmelter,
        targetOutputRate: 30,
        machineCount: 10,
        inputs: [],
        children: [],
        power: { machines: 7.2, sorters: 2.4, total: 9.6 }, // 144kW per sorter
        conveyorBelts: { inputs: 0, outputs: 0, total: 2 },
        depth: 0,
        isRawMaterial: false,
      };

      const result = calculatePowerConsumption(node, pileSettings);
      
      const sorterEntry = result.byMachine.find(m => m.machineName === 'ソーター');
      expect(sorterEntry?.machineId).toBe(2014); // Pile sorter icon ID
    });
  });

  describe('採掘機の電力計算', () => {
    it('採掘機の電力消費を計算する', () => {
      const miningCalculation: MiningCalculation = {
        rawMaterials: [
          {
            itemId: 1001,
            itemName: 'Iron Ore',
            requiredRate: 30,
            miningSpeedBonus: 1.0,
            workSpeedMultiplier: 100,
            powerMultiplier: 1.0,
            outputPerSecond: 3.0,
            minersNeeded: 10,
            veinsNeeded: 60,
            machineType: 'Mining Machine',
          },
        ],
        totalMiners: 10,
        totalOrbitalCollectors: 0,
      };

      const result = calculatePowerConsumption(null, mockSettings, miningCalculation, mockGameData);

      // 採掘機: 420 kW * 1.0 * 10機 = 4200 kW = 4.2 MW
      expect(result.total).toBeCloseTo(4200, 2);
      expect(result.byMachine).toHaveLength(1);
      
      const miningMachine = result.byMachine[0];
      expect(miningMachine.machineId).toBe(2301);
      expect(miningMachine.machineName).toBe('採掘機'); // 速度表示なし
      expect(miningMachine.machineCount).toBe(10);
      expect(miningMachine.powerPerMachine).toBeCloseTo(420, 2);
      expect(miningMachine.totalPower).toBeCloseTo(4200, 2);
    });

    it('高度採掘機の電力消費を計算する（100%速度）', () => {
      const miningCalculation: MiningCalculation = {
        rawMaterials: [
          {
            itemId: 1001,
            itemName: 'Iron Ore',
            requiredRate: 60,
            miningSpeedBonus: 1.0,
            workSpeedMultiplier: 100,
            powerMultiplier: 1.0,
            outputPerSecond: 6.0,
            minersNeeded: 10,
            veinsNeeded: 60,
            machineType: 'Advanced Mining Machine',
          },
        ],
        totalMiners: 10,
        totalOrbitalCollectors: 0,
      };

      const result = calculatePowerConsumption(null, mockSettings, miningCalculation, mockGameData);

      // 高度採掘機: 630 kW * 1.0 * 10機 = 6300 kW = 6.3 MW
      expect(result.total).toBeCloseTo(6300, 2);
      expect(result.byMachine).toHaveLength(1);
      
      const advancedMiningMachine = result.byMachine[0];
      expect(advancedMiningMachine.machineId).toBe(2316);
      expect(advancedMiningMachine.machineName).toBe('高度採掘機'); // 100%速度なので表示なし
      expect(advancedMiningMachine.machineCount).toBe(10);
      expect(advancedMiningMachine.powerPerMachine).toBeCloseTo(630, 2);
      expect(advancedMiningMachine.totalPower).toBeCloseTo(6300, 2);
    });

    it('高度採掘機の電力消費を計算する（150%速度）', () => {
      const miningCalculation: MiningCalculation = {
        rawMaterials: [
          {
            itemId: 1001,
            itemName: 'Iron Ore',
            requiredRate: 90,
            miningSpeedBonus: 1.0,
            workSpeedMultiplier: 150,
            powerMultiplier: 2.25, // (150/100)^2 = 2.25
            outputPerSecond: 9.0,
            minersNeeded: 10,
            veinsNeeded: 60,
            machineType: 'Advanced Mining Machine',
          },
        ],
        totalMiners: 10,
        totalOrbitalCollectors: 0,
      };

      const result = calculatePowerConsumption(null, mockSettings, miningCalculation, mockGameData);

      // 高度採掘機: 630 kW * 2.25 * 10機 = 14175 kW = 14.175 MW
      expect(result.total).toBeCloseTo(14175, 2);
      expect(result.byMachine).toHaveLength(1);
      
      const advancedMiningMachine = result.byMachine[0];
      expect(advancedMiningMachine.machineId).toBe(2316);
      expect(advancedMiningMachine.machineName).toBe('高度採掘機 (150%)'); // 速度表示あり
      expect(advancedMiningMachine.machineCount).toBe(10);
      expect(advancedMiningMachine.powerPerMachine).toBeCloseTo(1417.5, 2); // 630 * 2.25
      expect(advancedMiningMachine.totalPower).toBeCloseTo(14175, 2);
    });

    it('高度採掘機の電力消費を計算する（200%速度）', () => {
      const miningCalculation: MiningCalculation = {
        rawMaterials: [
          {
            itemId: 1001,
            itemName: 'Iron Ore',
            requiredRate: 120,
            miningSpeedBonus: 1.0,
            workSpeedMultiplier: 200,
            powerMultiplier: 4.0, // (200/100)^2 = 4.0
            outputPerSecond: 12.0,
            minersNeeded: 10,
            veinsNeeded: 60,
            machineType: 'Advanced Mining Machine',
          },
        ],
        totalMiners: 10,
        totalOrbitalCollectors: 0,
      };

      const result = calculatePowerConsumption(null, mockSettings, miningCalculation, mockGameData);

      // 高度採掘機: 630 kW * 4.0 * 10機 = 25200 kW = 25.2 MW
      expect(result.total).toBeCloseTo(25200, 2);
      expect(result.byMachine).toHaveLength(1);
      
      const advancedMiningMachine = result.byMachine[0];
      expect(advancedMiningMachine.machineId).toBe(2316);
      expect(advancedMiningMachine.machineName).toBe('高度採掘機 (200%)'); // 速度表示あり
      expect(advancedMiningMachine.machineCount).toBe(10);
      expect(advancedMiningMachine.powerPerMachine).toBeCloseTo(2520, 2); // 630 * 4.0
      expect(advancedMiningMachine.totalPower).toBeCloseTo(25200, 2);
    });

    it('複数の採掘機タイプを組み合わせる', () => {
      const miningCalculation: MiningCalculation = {
        rawMaterials: [
          {
            itemId: 1001,
            itemName: 'Iron Ore',
            requiredRate: 30,
            miningSpeedBonus: 1.0,
            workSpeedMultiplier: 100,
            powerMultiplier: 1.0,
            outputPerSecond: 3.0,
            minersNeeded: 5,
            veinsNeeded: 30,
            machineType: 'Mining Machine',
          },
          {
            itemId: 1002,
            itemName: 'Copper Ore',
            requiredRate: 60,
            miningSpeedBonus: 1.0,
            workSpeedMultiplier: 150,
            powerMultiplier: 2.25,
            outputPerSecond: 9.0,
            minersNeeded: 5,
            veinsNeeded: 30,
            machineType: 'Advanced Mining Machine',
          },
        ],
        totalMiners: 10,
        totalOrbitalCollectors: 0,
      };

      const result = calculatePowerConsumption(null, mockSettings, miningCalculation, mockGameData);

      // 採掘機: 420 kW * 1.0 * 5機 = 2100 kW
      // 高度採掘機: 630 kW * 2.25 * 5機 = 7087.5 kW
      // Total: 9187.5 kW = 9.1875 MW
      expect(result.total).toBeCloseTo(9187.5, 2);
      expect(result.byMachine).toHaveLength(2);
      
      // 電力消費量の降順でソートされる
      expect(result.byMachine[0].machineId).toBe(2316); // 高度採掘機（高い電力）
      expect(result.byMachine[1].machineId).toBe(2301); // 採掘機（低い電力）
      
      const advancedMiningMachine = result.byMachine[0];
      expect(advancedMiningMachine.machineName).toBe('高度採掘機 (150%)');
      expect(advancedMiningMachine.totalPower).toBeCloseTo(7087.5, 2);
      
      const miningMachine = result.byMachine[1];
      expect(miningMachine.machineName).toBe('採掘機');
      expect(miningMachine.totalPower).toBeCloseTo(2100, 2);
    });

    it('軌道コレクターは電力消費に含まれない', () => {
      const miningCalculation: MiningCalculation = {
        rawMaterials: [
          {
            itemId: 1120,
            itemName: 'Hydrogen',
            requiredRate: 8.4,
            miningSpeedBonus: 1.0,
            workSpeedMultiplier: 100,
            powerMultiplier: 1.0,
            outputPerSecond: 0,
            minersNeeded: 0,
            veinsNeeded: 0,
            orbitCollectorsNeeded: 10,
            orbitalCollectorSpeed: 0.84,
            machineType: 'Advanced Mining Machine',
          },
        ],
        totalMiners: 0,
        totalOrbitalCollectors: 10,
      };

      const result = calculatePowerConsumption(null, mockSettings, miningCalculation, mockGameData);

      // 軌道コレクターは電力消費しない
      expect(result.total).toBe(0);
      expect(result.byMachine).toHaveLength(0);
    });

    it('採掘機と通常の機械の電力消費を組み合わせる', () => {
      const node: RecipeTreeNode = {
        recipe: mockRecipe,
        machine: mockArcSmelter,
        targetOutputRate: 30,
        machineCount: 5,
        inputs: [],
        children: [],
        power: { machines: 0, sorters: 0, total: 0 },
        conveyorBelts: { inputs: 0, outputs: 0, total: 2 },
        depth: 0,
        isRawMaterial: false,
      };

      const miningCalculation: MiningCalculation = {
        rawMaterials: [
          {
            itemId: 1001,
            itemName: 'Iron Ore',
            requiredRate: 60,
            miningSpeedBonus: 1.0,
            workSpeedMultiplier: 200,
            powerMultiplier: 4.0,
            outputPerSecond: 12.0,
            minersNeeded: 10,
            veinsNeeded: 60,
            machineType: 'Advanced Mining Machine',
          },
        ],
        totalMiners: 10,
        totalOrbitalCollectors: 0,
      };

      const result = calculatePowerConsumption(node, mockSettings, miningCalculation, mockGameData);

      // Arc Smelter: 0.72 kW * 5機 = 3.6 kW
      // 高度採掘機: 630 kW * 4.0 * 10機 = 25200 kW
      // Total: 25203.6 kW
      expect(result.total).toBeCloseTo(25203.6, 2);
      expect(result.byMachine).toHaveLength(2);
      
      // 電力消費量の降順でソートされる
      expect(result.byMachine[0].machineId).toBe(2316); // 高度採掘機（高い電力）
      expect(result.byMachine[1].machineId).toBe(2302); // Arc Smelter（低い電力）
    });

    describe('液体採掘設備の電力計算', () => {
      it('ウォーターポンプの電力消費を計算する', () => {
        const miningCalculation: MiningCalculation = {
          rawMaterials: [
            {
              itemId: 1000,
              itemName: 'Water',
              requiredRate: 1.0,
              miningSpeedBonus: 1.0,
              workSpeedMultiplier: 100,
              powerMultiplier: 1.0,
              outputPerSecond: 0.833333,
              minersNeeded: 2,
              veinsNeeded: 2,
              machineType: 'Water Pump',
            },
          ],
          totalMiners: 2,
          totalOrbitalCollectors: 0,
        };

        const result = calculatePowerConsumption(null, mockSettings, miningCalculation, mockGameData);

        expect(result.total).toBeCloseTo(600, 2); // 300 kW * 2機 = 600 kW
        expect(result.byMachine).toHaveLength(1);
        
        const waterPump = result.byMachine[0];
        expect(waterPump.machineId).toBe(2306); // Water Pump ID
        expect(waterPump.machineName).toBe('ウォーターポンプ');
        expect(waterPump.machineCount).toBe(2);
        expect(waterPump.powerPerMachine).toBeCloseTo(300, 2);
        expect(waterPump.totalPower).toBeCloseTo(600, 2);
        expect(waterPump.percentage).toBeCloseTo(100, 2);
      });

      it('オイル抽出器の電力消費を計算する', () => {
        const miningCalculation: MiningCalculation = {
          rawMaterials: [
            {
              itemId: 1007,
              itemName: 'Crude Oil',
              requiredRate: 4.0,
              miningSpeedBonus: 1.0,
              workSpeedMultiplier: 100,
              powerMultiplier: 1.0,
              outputPerSecond: 4.0,
              minersNeeded: 1,
              veinsNeeded: 1,
              machineType: 'Oil Extractor',
            },
          ],
          totalMiners: 1,
          totalOrbitalCollectors: 0,
        };

        const result = calculatePowerConsumption(null, mockSettings, miningCalculation, mockGameData);

        expect(result.total).toBeCloseTo(840, 2); // 840 kW * 1機 = 840 kW
        expect(result.byMachine).toHaveLength(1);
        
        const oilExtractor = result.byMachine[0];
        expect(oilExtractor.machineId).toBe(2307); // Oil Extractor ID
        expect(oilExtractor.machineName).toBe('オイル抽出器');
        expect(oilExtractor.machineCount).toBe(1);
        expect(oilExtractor.powerPerMachine).toBeCloseTo(840, 2);
        expect(oilExtractor.totalPower).toBeCloseTo(840, 2);
        expect(oilExtractor.percentage).toBeCloseTo(100, 2);
      });

      it('硫酸のウォーターポンプの電力消費を計算する', () => {
        const miningCalculation: MiningCalculation = {
          rawMaterials: [
            {
              itemId: 1116,
              itemName: 'Sulfuric Acid',
              requiredRate: 2.5,
              miningSpeedBonus: 1.0,
              workSpeedMultiplier: 100,
              powerMultiplier: 1.0,
              outputPerSecond: 0.833333,
              minersNeeded: 3,
              veinsNeeded: 3,
              machineType: 'Water Pump',
            },
          ],
          totalMiners: 3,
          totalOrbitalCollectors: 0,
        };

        const result = calculatePowerConsumption(null, mockSettings, miningCalculation, mockGameData);

        expect(result.total).toBeCloseTo(900, 2); // 300 kW * 3機 = 900 kW
        expect(result.byMachine).toHaveLength(1);
        
        const sulfuricPump = result.byMachine[0];
        expect(sulfuricPump.machineId).toBe(2306); // Water Pump ID
        expect(sulfuricPump.machineName).toBe('ウォーターポンプ');
        expect(sulfuricPump.machineCount).toBe(3);
        expect(sulfuricPump.powerPerMachine).toBeCloseTo(300, 2);
        expect(sulfuricPump.totalPower).toBeCloseTo(900, 2);
      });

      it('液体採掘設備と通常の採掘機を混在させる', () => {
        const miningCalculation: MiningCalculation = {
          rawMaterials: [
            {
              itemId: 1000,
              itemName: 'Water',
              requiredRate: 1.0,
              miningSpeedBonus: 1.0,
              workSpeedMultiplier: 100,
              powerMultiplier: 1.0,
              outputPerSecond: 0.833333,
              minersNeeded: 2,
              veinsNeeded: 2,
              machineType: 'Water Pump',
            },
            {
              itemId: 1001,
              itemName: 'Iron Ore',
              requiredRate: 6.0,
              miningSpeedBonus: 1.0,
              workSpeedMultiplier: 100,
              powerMultiplier: 1.0,
              outputPerSecond: 6.0,
              minersNeeded: 1,
              veinsNeeded: 6,
              machineType: 'Advanced Mining Machine',
            },
          ],
          totalMiners: 3,
          totalOrbitalCollectors: 0,
        };

        const result = calculatePowerConsumption(null, mockSettings, miningCalculation, mockGameData);

        // Water Pump: 300 kW * 2機 = 600 kW
        // Advanced Mining Machine: 630 kW * 1機 = 630 kW
        // Total: 1230 kW
        expect(result.total).toBeCloseTo(1230, 2);
        expect(result.byMachine).toHaveLength(2);
        
        // 電力消費量の降順でソートされる
        expect(result.byMachine[0].machineId).toBe(2316); // Advanced Mining Machine（630 kW）
        expect(result.byMachine[1].machineId).toBe(2306); // Water Pump（600 kW）
        
        expect(result.byMachine[0].totalPower).toBeCloseTo(630, 2);
        expect(result.byMachine[1].totalPower).toBeCloseTo(600, 2);
      });
    });
  });
});
