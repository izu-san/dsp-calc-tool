import { describe, it, expect } from 'vitest';
import { transformToExportData } from '../dataTransformer';
import type { CalculationResult, RecipeTreeNode } from '../../../types/calculation';
import type { Recipe, Machine, RecipeItem } from '../../../types/game-data';
import type { GlobalSettings } from '../../../types/settings';
import { EXPORT_VERSION } from '../../../constants/exportVersion';

describe('dataTransformer', () => {
  describe('transformToExportData', () => {
    const createMockRecipeItem = (id: number, name: string, count: number = 1): RecipeItem => ({
      id,
      name,
      count,
    });

    const createMockRecipe = (sid: number, name: string): Recipe => ({
      SID: sid,
      id: sid,
      name,
      Type: 1,
      Handcraft: false,
      Explicit: true,
      TimeSpend: 60,
      Items: [createMockRecipeItem(1001, 'Iron Ore', 2)],
      Results: [createMockRecipeItem(1101, 'Iron Ingot', 1)],
      GridIndex: 0,
      IconPath: '',
      Description: '',
    });

    const createMockMachine = (id: number, name: string, power: number): Machine => ({
      id,
      name,
      type: 'Smelter',
      speed: 1.0,
      power,
      iconPath: '',
      description: '',
    });

    const createMockTreeNode = (
      recipe: Recipe,
      machine: Machine | null,
      machineCount: number,
      targetOutputRate: number
    ): RecipeTreeNode => ({
      id: `node-${recipe.SID}`,
      recipe,
      machine,
      machineCount,
      targetOutputRate,
      inputs: recipe.Items.map((item, index) => ({
        itemId: item.id,
        itemName: item.name,
        requiredRate: (targetOutputRate * item.count) / recipe.TimeSpend,
        sourceType: 'raw' as const,
      })),
      children: [],
      depth: 0,
      power: {
        machines: machine ? machine.power * machineCount : 0,
        sorters: 0,
        total: machine ? machine.power * machineCount : 0,
      },
      conveyorBelts: {
        total: 0,
        saturation: 0,
      },
    });

    const createMockCalculationResult = (
      rootNode: RecipeTreeNode,
      totalMachines: number,
      totalPower: number
    ): CalculationResult => ({
      rootNode,
      totalMachines,
      totalPower: {
        machines: totalPower,
        sorters: 0,
        dysonSphere: 0,
        total: totalPower,
      },
      rawMaterials: new Map([[1001, 2.0]]),
      totalRawMaterials: new Map([[1001, 2.0]]),
      itemProduction: new Map(),
      itemConsumption: new Map(),
    });

    const createMockGlobalSettings = (): GlobalSettings => ({
      proliferator: { type: 'none', mode: 'speed', speedBonus: 0, productionBonus: 0, powerIncrease: 0 },
      machineRank: { Smelt: 'arc', Assemble: 'mk1', Chemical: 'standard', Research: 'standard', Refine: 'standard', Particle: 'standard' },
      conveyorBelt: { type: 'mk3', speed: 10.0, stackSize: 4 },
      sorter: { type: 'pile', speed: 1.0 },
      alternativeRecipes: new Map(),
      miningSpeedResearch: 100,
      proliferatorMultiplier: { production: 1, speed: 1 },
      photonGeneration: {
        useGravitonLens: false,
        gravitonLensProliferator: { type: 'none', mode: 'speed', speedBonus: 0, productionBonus: 0, powerIncrease: 0 },
        rayTransmissionEfficiency: 0,
        continuousReception: 100,
      },
    });

    const createMockPowerGenerationSettings = () => ({
      template: 'default' as const,
      manualGenerator: null,
      manualFuel: null,
      powerFuelProliferator: { type: 'none', mode: 'speed', speedBonus: 0, productionBonus: 0, powerIncrease: 0 },
    });

    it('基本的なエクスポートデータ変換', () => {
      const recipe = createMockRecipe(1, 'Iron Ingot Recipe');
      const machine = createMockMachine(2301, 'Smelter', 360);
      const rootNode = createMockTreeNode(recipe, machine, 10, 1.0);
      const calculationResult = createMockCalculationResult(rootNode, 10, 3600);
      const globalSettings = createMockGlobalSettings();
      const planName = 'Test Plan';
      const exportDate = Date.now();

      const powerGenerationSettings = createMockPowerGenerationSettings();
      const gameData = { items: new Map([[1001, { name: 'Iron Ore' }]]) };

      const result = transformToExportData(
        calculationResult,
        recipe,
        60.0,
        globalSettings,
        planName,
        exportDate,
        powerGenerationSettings,
        gameData
      );

      expect(result.version).toBe(EXPORT_VERSION);
      expect(result.exportDate).toBe(exportDate);
      expect(result.planInfo.planName).toBe(planName);
      expect(result.planInfo.recipeSID).toBe(1);
      expect(result.planInfo.recipeName).toBe('Iron Ingot Recipe');
      expect(result.planInfo.targetQuantity).toBe(60.0);
      expect(result.statistics.totalMachines).toBe(10);
      expect(result.statistics.totalPower).toBe(3600);
      expect(result.statistics.rawMaterialCount).toBe(1);
    });

    it('原材料リストの正しい変換', () => {
      const recipe = createMockRecipe(1, 'Iron Ingot Recipe');
      const machine = createMockMachine(2301, 'Smelter', 360);
      const rootNode = createMockTreeNode(recipe, machine, 10, 1.0);
      const calculationResult = createMockCalculationResult(rootNode, 10, 3600);
      const globalSettings = createMockGlobalSettings();

      const powerGenerationSettings = createMockPowerGenerationSettings();
      const gameData = { items: new Map([[1001, { name: 'Iron Ore' }]]) };

      const result = transformToExportData(
        calculationResult,
        recipe,
        60.0,
        globalSettings,
        'Test',
        Date.now(),
        powerGenerationSettings,
        gameData
      );

      expect(result.rawMaterials).toHaveLength(1);
      expect(result.rawMaterials[0].itemId).toBe(1001);
      expect(result.rawMaterials[0].itemName).toBe('Iron Ore');
      expect(result.rawMaterials[0].consumptionRate).toBe(2.0);
      expect(result.rawMaterials[0].unit).toBe('/s');
    });

    it('機械リストの正しい変換', () => {
      const recipe = createMockRecipe(1, 'Iron Ingot Recipe');
      const machine = createMockMachine(2301, 'Smelter', 360);
      const rootNode = createMockTreeNode(recipe, machine, 10, 1.0);
      const calculationResult = createMockCalculationResult(rootNode, 10, 3600);
      const globalSettings = createMockGlobalSettings();

      const powerGenerationSettings = createMockPowerGenerationSettings();
      const gameData = { items: new Map([[1001, { name: 'Iron Ore' }]]) };

      const result = transformToExportData(
        calculationResult,
        recipe,
        60.0,
        globalSettings,
        'Test',
        Date.now(),
        powerGenerationSettings,
        gameData
      );

      expect(result.machines).toHaveLength(1);
      expect(result.machines[0].machineId).toBe(2301);
      expect(result.machines[0].machineName).toBe('Smelter');
      expect(result.machines[0].count).toBe(10);
      expect(result.machines[0].powerPerMachine).toBe(360);
      expect(result.machines[0].totalPower).toBe(3600);
    });

    it('電力消費の正しい変換', () => {
      const recipe = createMockRecipe(1, 'Iron Ingot Recipe');
      const machine = createMockMachine(2301, 'Smelter', 360);
      const rootNode = createMockTreeNode(recipe, machine, 10, 1.0);
      const calculationResult = createMockCalculationResult(rootNode, 10, 3600);
      const globalSettings = createMockGlobalSettings();

      const powerGenerationSettings = createMockPowerGenerationSettings();
      const gameData = { items: new Map([[1001, { name: 'Iron Ore' }]]) };

      const result = transformToExportData(
        calculationResult,
        recipe,
        60.0,
        globalSettings,
        'Test',
        Date.now(),
        powerGenerationSettings,
        gameData
      );

      expect(result.powerConsumption.machines).toBe(3600);
      expect(result.powerConsumption.sorters).toBe(0);
      expect(result.powerConsumption.dysonSphere).toBe(0);
      expect(result.powerConsumption.total).toBe(3600);
      expect(result.powerConsumption.breakdown).toHaveLength(1);
    });

    it('コンベアベルト情報の正しい変換', () => {
      const recipe = createMockRecipe(1, 'Iron Ingot Recipe');
      const machine = createMockMachine(2301, 'Smelter', 360);
      const rootNode = createMockTreeNode(recipe, machine, 10, 1.0);
      rootNode.conveyorBelts = {
        total: 5,
        saturation: 75.5,
        bottleneckType: 'input',
      };
      const calculationResult = createMockCalculationResult(rootNode, 10, 3600);
      const globalSettings = createMockGlobalSettings();

      const powerGenerationSettings = createMockPowerGenerationSettings();
      const gameData = { items: new Map([[1001, { name: 'Iron Ore' }]]) };

      const result = transformToExportData(
        calculationResult,
        recipe,
        60.0,
        globalSettings,
        'Test',
        Date.now(),
        powerGenerationSettings,
        gameData
      );

      expect(result.conveyorBelts.totalBelts).toBe(5);
      expect(result.conveyorBelts.maxSaturation).toBe(75.5);
      expect(result.conveyorBelts.bottleneckType).toBe('input');
    });

    it('設定と発電情報の正しい変換', () => {
      const recipe = createMockRecipe(1, 'Iron Ingot Recipe');
      const machine = createMockMachine(2301, 'Smelter', 360);
      const rootNode = createMockTreeNode(recipe, machine, 10, 1.0);
      const calculationResult = createMockCalculationResult(rootNode, 10, 3600);
      const globalSettings = createMockGlobalSettings();

      const powerGenerationSettings = createMockPowerGenerationSettings();
      const gameData = { items: new Map([[1001, { name: 'Iron Ore' }]]) };

      const result = transformToExportData(
        calculationResult,
        recipe,
        60.0,
        globalSettings,
        'Test',
        Date.now(),
        powerGenerationSettings,
        gameData
      );

      expect(result.settings).toBeDefined();
      // 発電設備の計算結果を検証
      expect(result.powerGeneration.totalRequiredPower).toBe(3600);
      expect(result.powerGeneration.totalGeneratedPower).toBeGreaterThanOrEqual(0);
      expect(result.powerGeneration.generators).toBeDefined();
    });
  });
});

