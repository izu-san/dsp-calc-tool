import { beforeEach, describe, expect, it } from "vitest";
import {
  createMockGameData,
  createMockSettings,
  createRecipeNode,
  createSingleOutputRecipe,
  createMachineByType,
  createDefaultPowerConsumption,
} from "../../test/factories/testDataFactory";
import type { RecipeTreeNode } from "../../types";
import type { MiningCalculation } from "../miningCalculation";
import { calculateItemStatistics } from "../statistics";
import { calculateUnifiedPower } from "../unifiedPowerCalculation";

// モックデータの作成
function createMockRecipeTreeNode(): RecipeTreeNode {
  const recipe = createSingleOutputRecipe({
    SID: 1,
    name: "Test Recipe",
    type: "Assemble",
    timeSpend: 1,
    inputId: 1001,
    inputName: "Iron Ore",
    inputCount: 1,
    isRawInput: true,
    outputId: 1002,
    outputName: "Iron Ingot",
    outputCount: 1,
    gridIndex: "1101",
  });

  const machine = createMachineByType({
    id: 2301,
    name: "Assembling Machine Mk.I",
    type: "Assemble",
    assemblerSpeed: 7500, // 0.75 crafting speed
    workEnergyPerTick: 7000, // 420 kW = 7000 * 60 / 1000
    idleEnergyPerTick: 300,
  });

  return createRecipeNode({
    recipe,
    machine,
    nodeId: "test-node",
    targetOutputRate: 1,
    machineCount: 2,
    power: createDefaultPowerConsumption({
      machines: 840, // 420 * 2
      sorters: 60, // 30 * 2 (入力1 + 出力1)
      dysonSphere: 0,
      total: 900,
    }),
    children: [],
  });
}

function createMockMiningCalculation(): MiningCalculation {
  return {
    rawMaterials: [
      {
        itemId: 1001,
        itemName: "Iron Ore",
        requiredRate: 1.0,
        miningSpeedBonus: 1.0,
        workSpeedMultiplier: 1.0,
        powerMultiplier: 1.0,
        outputPerSecond: 0.5,
        minersNeeded: 2,
        veinsNeeded: 1,
        machineType: "Mining Machine",
      },
    ],
    totalMiners: 2,
    totalOrbitalCollectors: 0,
  };
}

describe("電力表示の一致確認", () => {
  let mockGameData: any;
  let mockSettings: any;
  let mockRootNode: RecipeTreeNode;
  let mockMiningCalculation: MiningCalculation;

  beforeEach(() => {
    mockGameData = createMockGameData();
    mockSettings = createMockSettings();
    mockRootNode = createMockRecipeTreeNode();
    mockMiningCalculation = createMockMiningCalculation();
  });

  describe("統計ビューと電力グラフの一致", () => {
    it("統計ビューの総電力と電力グラフの総消費電力が一致する", () => {
      // 統計ビューの電力計算
      const statistics = calculateItemStatistics(
        mockRootNode,
        mockMiningCalculation,
        mockSettings,
        mockGameData
      );

      // 電力グラフの電力計算
      const powerBreakdown = calculateUnifiedPower(
        mockRootNode,
        mockMiningCalculation,
        mockSettings,
        mockGameData
      );

      // 両方の総電力が一致することを確認
      expect(statistics.totalPower).toBe(powerBreakdown.totalConsumption);
    });

    it("採掘電力も含めて一致する", () => {
      // 採掘計算を含む統計
      const statistics = calculateItemStatistics(
        mockRootNode,
        mockMiningCalculation,
        mockSettings,
        mockGameData
      );

      // 採掘計算を含む電力グラフ
      const powerBreakdown = calculateUnifiedPower(
        mockRootNode,
        mockMiningCalculation,
        mockSettings,
        mockGameData
      );

      // 採掘電力も含めた総電力が一致することを確認
      expect(statistics.totalPower).toBe(powerBreakdown.totalConsumption);
      expect(statistics.totalMiningPower).toBe(powerBreakdown.miningPower);
    });
  });

  describe("発電設備タブとの一致", () => {
    it("発電設備タブの必要電力が統計ビューと一致する", () => {
      // 統計ビューの電力計算
      const statistics = calculateItemStatistics(
        mockRootNode,
        mockMiningCalculation,
        mockSettings,
        mockGameData
      );

      // 発電設備タブの電力計算（同じcalculateUnifiedPowerを使用）
      const powerBreakdown = calculateUnifiedPower(
        mockRootNode,
        mockMiningCalculation,
        mockSettings,
        mockGameData
      );

      // 発電設備で供給する必要がある電力 = 統計ビューの総電力
      expect(powerBreakdown.totalConsumption).toBe(statistics.totalPower);
    });

    it("電力グラフと発電設備タブの電力が一致する", () => {
      // 電力グラフの電力計算
      const powerGraphPower = calculateUnifiedPower(
        mockRootNode,
        mockMiningCalculation,
        mockSettings,
        mockGameData
      );

      // 発電設備タブの電力計算
      const powerGenerationPower = calculateUnifiedPower(
        mockRootNode,
        mockMiningCalculation,
        mockSettings,
        mockGameData
      );

      // 両方の電力が一致することを確認
      expect(powerGraphPower.totalConsumption).toBe(powerGenerationPower.totalConsumption);
    });
  });

  describe("三箇所すべての一致", () => {
    it("統計ビュー、電力グラフ、発電設備タブの電力がすべて一致する", () => {
      // 統計ビューの電力計算
      const statistics = calculateItemStatistics(
        mockRootNode,
        mockMiningCalculation,
        mockSettings,
        mockGameData
      );

      // 電力グラフの電力計算
      const powerGraphPower = calculateUnifiedPower(
        mockRootNode,
        mockMiningCalculation,
        mockSettings,
        mockGameData
      );

      // 発電設備タブの電力計算
      const powerGenerationPower = calculateUnifiedPower(
        mockRootNode,
        mockMiningCalculation,
        mockSettings,
        mockGameData
      );

      // 三箇所すべての電力が一致することを確認
      expect(statistics.totalPower).toBe(powerGraphPower.totalConsumption);
      expect(powerGraphPower.totalConsumption).toBe(powerGenerationPower.totalConsumption);
      expect(statistics.totalPower).toBe(powerGenerationPower.totalConsumption);
    });

    it("採掘電力も含めて三箇所すべてが一致する", () => {
      // 統計ビューの電力計算
      const statistics = calculateItemStatistics(
        mockRootNode,
        mockMiningCalculation,
        mockSettings,
        mockGameData
      );

      // 電力グラフの電力計算
      const powerGraphPower = calculateUnifiedPower(
        mockRootNode,
        mockMiningCalculation,
        mockSettings,
        mockGameData
      );

      // 発電設備タブの電力計算
      const powerGenerationPower = calculateUnifiedPower(
        mockRootNode,
        mockMiningCalculation,
        mockSettings,
        mockGameData
      );

      // 総電力の一致
      expect(statistics.totalPower).toBe(powerGraphPower.totalConsumption);
      expect(powerGraphPower.totalConsumption).toBe(powerGenerationPower.totalConsumption);

      // 採掘電力の一致
      expect(statistics.totalMiningPower).toBe(powerGraphPower.miningPower);
      expect(powerGraphPower.miningPower).toBe(powerGenerationPower.miningPower);
    });
  });

  describe("エッジケースでの一致", () => {
    it("採掘計算がない場合でも一致する", () => {
      // 採掘計算なしの統計ビュー
      const statistics = calculateItemStatistics(
        mockRootNode,
        undefined,
        mockSettings,
        mockGameData
      );

      // 採掘計算なしの電力グラフ
      const powerGraphPower = calculateUnifiedPower(
        mockRootNode,
        undefined,
        mockSettings,
        mockGameData
      );

      // 採掘計算なしの発電設備タブ
      const powerGenerationPower = calculateUnifiedPower(
        mockRootNode,
        undefined,
        mockSettings,
        mockGameData
      );

      // 三箇所すべての電力が一致することを確認
      expect(statistics.totalPower).toBe(powerGraphPower.totalConsumption);
      expect(powerGraphPower.totalConsumption).toBe(powerGenerationPower.totalConsumption);
      expect(statistics.totalPower).toBe(powerGenerationPower.totalConsumption);
    });

    it("設定がない場合でも一致する", () => {
      // 設定なしの統計ビュー
      const statistics = calculateItemStatistics(
        mockRootNode,
        mockMiningCalculation,
        undefined,
        undefined
      );

      // 設定なしの電力グラフ
      const powerGraphPower = calculateUnifiedPower(
        mockRootNode,
        mockMiningCalculation,
        undefined,
        undefined
      );

      // 設定なしの発電設備タブ
      const powerGenerationPower = calculateUnifiedPower(
        mockRootNode,
        mockMiningCalculation,
        undefined,
        undefined
      );

      // 三箇所すべての電力が一致することを確認
      expect(statistics.totalPower).toBe(powerGraphPower.totalConsumption);
      expect(powerGraphPower.totalConsumption).toBe(powerGenerationPower.totalConsumption);
      expect(statistics.totalPower).toBe(powerGenerationPower.totalConsumption);
    });
  });

  describe("複雑な生産チェーンでの一致", () => {
    it("複数の子ノードがある場合でも一致する", () => {
      // 複雑な生産チェーンを作成
      const childRecipe1 = createSingleOutputRecipe({
        SID: 2,
        name: "Child Recipe 1",
        type: "Assemble",
        timeSpend: 1,
        inputId: 1003,
        inputName: "Copper Ore",
        inputCount: 1,
        isRawInput: true,
        outputId: 1001,
        outputName: "Iron Ore",
        outputCount: 1,
      });

      const childMachine1 = createMachineByType({
        id: 2302,
        name: "Assembling Machine Mk.II",
        type: "Assemble",
        assemblerSpeed: 10000, // 1.0 crafting speed
        workEnergyPerTick: 10500, // 630 kW
        idleEnergyPerTick: 300,
      });

      const childNode1 = createRecipeNode({
        recipe: childRecipe1,
        machine: childMachine1,
        nodeId: "child-1",
        targetOutputRate: 1,
        machineCount: 1,
        power: createDefaultPowerConsumption({
          machines: 630,
          sorters: 30,
          dysonSphere: 0,
          total: 660,
        }),
        children: [],
      });

      const childRecipe2 = createSingleOutputRecipe({
        SID: 3,
        name: "Child Recipe 2",
        type: "Assemble",
        timeSpend: 1,
        inputId: 1004,
        inputName: "Stone",
        inputCount: 1,
        isRawInput: true,
        outputId: 1003,
        outputName: "Copper Ore",
        outputCount: 1,
      });

      const childMachine2 = createMachineByType({
        id: 2303,
        name: "Assembling Machine Mk.III",
        type: "Assemble",
        assemblerSpeed: 15000, // 1.5 crafting speed
        workEnergyPerTick: 14000, // 840 kW
        idleEnergyPerTick: 300,
      });

      const childNode2 = createRecipeNode({
        recipe: childRecipe2,
        machine: childMachine2,
        nodeId: "child-2",
        targetOutputRate: 1,
        machineCount: 1,
        power: createDefaultPowerConsumption({
          machines: 840,
          sorters: 30,
          dysonSphere: 0,
          total: 870,
        }),
        children: [],
      });

      const complexRootNode: RecipeTreeNode = {
        ...mockRootNode,
        children: [childNode1, childNode2],
      };

      // 統計ビューの電力計算
      const statistics = calculateItemStatistics(
        complexRootNode,
        mockMiningCalculation,
        mockSettings,
        mockGameData
      );

      // 電力グラフの電力計算
      const powerGraphPower = calculateUnifiedPower(
        complexRootNode,
        mockMiningCalculation,
        mockSettings,
        mockGameData
      );

      // 発電設備タブの電力計算
      const powerGenerationPower = calculateUnifiedPower(
        complexRootNode,
        mockMiningCalculation,
        mockSettings,
        mockGameData
      );

      // 三箇所すべての電力が一致することを確認
      expect(statistics.totalPower).toBe(powerGraphPower.totalConsumption);
      expect(powerGraphPower.totalConsumption).toBe(powerGenerationPower.totalConsumption);
      expect(statistics.totalPower).toBe(powerGenerationPower.totalConsumption);
    });
  });
});
