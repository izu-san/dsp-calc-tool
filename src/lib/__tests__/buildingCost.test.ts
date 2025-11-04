import { describe, it, expect } from "vitest";
import { calculateBuildingCost } from "../buildingCost";
import type { RecipeTreeNode } from "../../types/calculation";
import {
  createRecipeNode,
  createRawMaterialNode,
  createDefaultPowerConsumption,
  createMultiOutputRecipe,
  machinePresets,
  recipePresets,
} from "../../test/factories/testDataFactory";

// Mock machine data
const mockArcSmelter = machinePresets.arcSmelter();
const mockAssembler = machinePresets.assemblerMk1();
const mockSorter = machinePresets.sorterMk1();
const mockChemicalPlant = machinePresets.chemicalPlant();

// Mock recipe data
const mockIronIngotRecipe = recipePresets.ironIngot();
const mockGearRecipe = recipePresets.gear();

describe("calculateBuildingCost", () => {
  // 基本機能テスト
  describe("基本機能", () => {
    it("単一レシピノードの建物コストを計算する", () => {
      const node = createRecipeNode({
        recipe: mockIronIngotRecipe,
        machine: mockArcSmelter,
        targetOutputRate: 30,
        machineCount: 5.5,
        inputs: [],
        children: [],
        power: createDefaultPowerConsumption({ total: 720, machines: 720 }),
        conveyorBelts: { total: 2 },
        nodeId: "test-node",
      });

      const result = calculateBuildingCost(node);

      expect(result.machines).toHaveLength(1);
      expect(result.machines[0].machineId).toBe(2302);
      expect(result.machines[0].count).toBe(6); // Math.ceil(5.5) = 6
      expect(result.sorters).toBeGreaterThan(0);
      expect(result.belts).toBe(2);
    });

    it("複数機械タイプを集計する", () => {
      const childNode = createRecipeNode({
        recipe: mockIronIngotRecipe,
        machine: mockArcSmelter,
        targetOutputRate: 30,
        machineCount: 3.2,
        inputs: [],
        children: [],
        power: { total: 360, machines: 360 },
        conveyorBelts: { total: 1, perSecond: 30 },
        depth: 1,
        isRawMaterial: false,
      });

      const parentNode = createRecipeNode({
        recipe: mockGearRecipe,
        machine: mockAssembler,
        targetOutputRate: 15,
        machineCount: 2.8,
        inputs: [{ itemId: 1101, requiredRate: 30 }],
        children: [childNode],
        power: { total: 540, machines: 540 },
        conveyorBelts: { total: 2, perSecond: 15 },
        depth: 0,
        isRawMaterial: false,
      });

      const result = calculateBuildingCost(parentNode);

      expect(result.machines).toHaveLength(2);

      // ソート順の確認（machineIdでソート）
      expect(result.machines[0].machineId).toBe(2302); // Arc Smelter
      expect(result.machines[0].count).toBe(4); // Math.ceil(3.2)
      expect(result.machines[1].machineId).toBe(2303); // Assembler
      expect(result.machines[1].count).toBe(3); // Math.ceil(2.8)

      expect(result.belts).toBe(3); // 1 + 2
    });

    it("ソーター数を計算する（入力+出力アイテム数）", () => {
      const node = createRecipeNode({
        recipe: mockIronIngotRecipe,
        machine: mockArcSmelter,
        targetOutputRate: 30,
        machineCount: 5,
        inputs: [],
        children: [],
        power: { total: 720, machines: 720 },
        conveyorBelts: { total: 2, perSecond: 30 },
        depth: 0,
        isRawMaterial: false,
      });

      const result = calculateBuildingCost(node);

      // Iron Ingot recipe: 1 input + 1 output = 2 sorters per machine
      // 5 machines × 2 sorters = 10 sorters
      expect(result.sorters).toBe(10);
    });

    it("コンベアベルト数を集計する", () => {
      const child1 = createRecipeNode({
        recipe: mockIronIngotRecipe,
        machine: mockArcSmelter,
        targetOutputRate: 30,
        machineCount: 5,
        inputs: [],
        children: [],
        power: { total: 720, machines: 720 },
        conveyorBelts: { total: 3, perSecond: 30 },
        depth: 1,
        isRawMaterial: false,
      });

      const child2 = createRecipeNode({
        recipe: mockIronIngotRecipe,
        machine: mockArcSmelter,
        targetOutputRate: 15,
        machineCount: 2.5,
        inputs: [],
        children: [],
        power: { total: 360, machines: 360 },
        conveyorBelts: { total: 2, perSecond: 15 },
        depth: 1,
        isRawMaterial: false,
      });

      const parentNode = createRecipeNode({
        recipe: mockGearRecipe,
        machine: mockAssembler,
        targetOutputRate: 45,
        machineCount: 6,
        inputs: [{ itemId: 1101, requiredRate: 45 }],
        children: [child1, child2],
        power: { total: 540, machines: 540 },
        conveyorBelts: { total: 5, perSecond: 45 },
        depth: 0,
        isRawMaterial: false,
      });

      const result = calculateBuildingCost(parentNode);

      expect(result.belts).toBe(10); // 5 + 3 + 2
    });

    it("機械IDでソート済み配列を返す", () => {
      const child1 = createRecipeNode({
        recipe: mockGearRecipe,
        machine: mockChemicalPlant, // ID: 2309
        targetOutputRate: 10,
        machineCount: 2,
        inputs: [],
        children: [],
        power: { total: 300, machines: 300 },
        conveyorBelts: { total: 1, perSecond: 10 },
        depth: 1,
        isRawMaterial: false,
      });

      const child2 = createRecipeNode({
        recipe: mockIronIngotRecipe,
        machine: mockArcSmelter, // ID: 2302
        targetOutputRate: 30,
        machineCount: 5,
        inputs: [],
        children: [],
        power: { total: 720, machines: 720 },
        conveyorBelts: { total: 2, perSecond: 30 },
        depth: 1,
        isRawMaterial: false,
      });

      const parentNode = createRecipeNode({
        recipe: mockGearRecipe,
        machine: mockAssembler, // ID: 2303
        targetOutputRate: 15,
        machineCount: 3,
        inputs: [],
        children: [child1, child2],
        power: { total: 270, machines: 270 },
        conveyorBelts: { total: 2, perSecond: 15 },
        depth: 0,
        isRawMaterial: false,
      });

      const result = calculateBuildingCost(parentNode);

      expect(result.machines).toHaveLength(3);
      expect(result.machines[0].machineId).toBe(2302); // Arc Smelter
      expect(result.machines[1].machineId).toBe(2303); // Assembler
      expect(result.machines[2].machineId).toBe(2309); // Chemical Plant
    });

    it("machineCountの小数点を切り上げる", () => {
      const node = createRecipeNode({
        recipe: mockIronIngotRecipe,
        machine: mockArcSmelter,
        targetOutputRate: 30,
        machineCount: 5.1, // 小数点あり
        inputs: [],
        children: [],
        power: { total: 720, machines: 720 },
        conveyorBelts: { total: 2, perSecond: 30 },
        depth: 0,
        isRawMaterial: false,
      });

      const result = calculateBuildingCost(node);

      expect(result.machines[0].count).toBe(6); // Math.ceil(5.1) = 6
    });
  });

  // エッジケーステスト
  describe("エッジケース", () => {
    it('物流機械（Type="Logistics"）を除外する', () => {
      const sorterNode = createRecipeNode({
        recipe: mockIronIngotRecipe,
        machine: mockSorter, // Type: 'Logistics'
        targetOutputRate: 10,
        machineCount: 5,
        inputs: [],
        children: [],
        power: { total: 5, machines: 5 },
        conveyorBelts: { total: 0, perSecond: 0 },
        depth: 1,
        isRawMaterial: false,
      });

      const parentNode = createRecipeNode({
        recipe: mockGearRecipe,
        machine: mockAssembler,
        targetOutputRate: 15,
        machineCount: 3,
        inputs: [],
        children: [sorterNode],
        power: { total: 270, machines: 270 },
        conveyorBelts: { total: 2, perSecond: 15 },
        depth: 0,
        isRawMaterial: false,
      });

      const result = calculateBuildingCost(parentNode);

      // ソーターは除外されるため、Assemblerのみ
      expect(result.machines).toHaveLength(1);
      expect(result.machines[0].machineId).toBe(2303);
    });

    it("原材料ノード（機械なし）を処理する", () => {
      const rawMaterialNode = createRawMaterialNode({
        itemId: 1001,
        itemName: "Iron Ore",
        targetOutputRate: 30,
        depth: 1,
        power: { total: 0 },
        conveyorBelts: { total: 0, perSecond: 0 },
      });

      const parentNode = createRecipeNode({
        recipe: mockIronIngotRecipe,
        machine: mockArcSmelter,
        targetOutputRate: 30,
        machineCount: 5,
        inputs: [{ itemId: 1001, requiredRate: 30 }],
        children: [rawMaterialNode],
        power: { total: 720, machines: 720 },
        conveyorBelts: { total: 2, perSecond: 30 },
        depth: 0,
        isRawMaterial: false,
      });

      const result = calculateBuildingCost(parentNode);

      // 原材料ノードは無視され、Arc Smelterのみカウント
      expect(result.machines).toHaveLength(1);
      expect(result.machines[0].machineId).toBe(2302);
    });

    it("深い階層ツリー（5階層）を処理する", () => {
      // 5階層のツリーを構築
      const level4 = createRecipeNode({
        recipe: mockIronIngotRecipe,
        machine: mockArcSmelter,
        targetOutputRate: 5,
        machineCount: 1,
        inputs: [],
        children: [],
        power: { total: 72, machines: 72 },
        conveyorBelts: { total: 1, perSecond: 5 },
        depth: 4,
        isRawMaterial: false,
      });

      const level3 = createRecipeNode({
        recipe: mockGearRecipe,
        machine: mockAssembler,
        targetOutputRate: 5,
        machineCount: 1,
        inputs: [],
        children: [level4],
        power: { total: 54, machines: 54 },
        conveyorBelts: { total: 1, perSecond: 5 },
        depth: 3,
        isRawMaterial: false,
      });

      const level2 = createRecipeNode({
        recipe: mockIronIngotRecipe,
        machine: mockArcSmelter,
        targetOutputRate: 5,
        machineCount: 1,
        inputs: [],
        children: [level3],
        power: { total: 72, machines: 72 },
        conveyorBelts: { total: 1, perSecond: 5 },
        depth: 2,
        isRawMaterial: false,
      });

      const level1 = createRecipeNode({
        recipe: mockGearRecipe,
        machine: mockAssembler,
        targetOutputRate: 5,
        machineCount: 1,
        inputs: [],
        children: [level2],
        power: { total: 54, machines: 54 },
        conveyorBelts: { total: 1, perSecond: 5 },
        depth: 1,
        isRawMaterial: false,
      });

      const rootNode = createRecipeNode({
        recipe: mockIronIngotRecipe,
        machine: mockArcSmelter,
        targetOutputRate: 5,
        machineCount: 1,
        inputs: [],
        children: [level1],
        power: { total: 72, machines: 72 },
        conveyorBelts: { total: 1, perSecond: 5 },
        depth: 0,
        isRawMaterial: false,
      });

      const result = calculateBuildingCost(rootNode);

      // 各階層の機械を集計
      expect(result.machines).toHaveLength(2);
      expect(result.machines[0].count).toBe(3); // Arc Smelter × 3
      expect(result.machines[1].count).toBe(2); // Assembler × 2
      expect(result.belts).toBe(5); // 各階層1本ずつ
    });

    it("空のツリー（子ノードなし）を処理する", () => {
      const node = createRecipeNode({
        recipe: mockIronIngotRecipe,
        machine: mockArcSmelter,
        targetOutputRate: 30,
        machineCount: 5,
        inputs: [],
        children: [],
        power: { total: 720, machines: 720 },
        conveyorBelts: { total: 2, perSecond: 30 },
        depth: 0,
        isRawMaterial: false,
      });

      const result = calculateBuildingCost(node);

      expect(result.machines).toHaveLength(1);
      expect(result.machines[0].count).toBe(5);
      expect(result.belts).toBe(2);
    });
  });

  // 統合テスト
  describe("統合テスト", () => {
    it("複雑な生産チェーンの総コストを計算する", () => {
      // 複雑なツリー: Gear生産に必要なすべての建物
      const ironOreNode = createRawMaterialNode({
        itemId: 1001,
        itemName: "Iron Ore",
        targetOutputRate: 60,
        depth: 2,
        power: { total: 0 },
        conveyorBelts: { total: 0, perSecond: 0 },
      });

      const ironIngotNode = createRecipeNode({
        recipe: mockIronIngotRecipe,
        machine: mockArcSmelter,
        targetOutputRate: 60,
        machineCount: 10,
        inputs: [{ itemId: 1001, requiredRate: 60 }],
        children: [ironOreNode],
        power: { total: 1440, machines: 1440 },
        conveyorBelts: { total: 4, perSecond: 60 },
        depth: 1,
        isRawMaterial: false,
      });

      const gearNode = createRecipeNode({
        recipe: mockGearRecipe,
        machine: mockAssembler,
        targetOutputRate: 60,
        machineCount: 12,
        inputs: [{ itemId: 1101, requiredRate: 60 }],
        children: [ironIngotNode],
        power: { total: 1080, machines: 1080 },
        conveyorBelts: { total: 5, perSecond: 60 },
        depth: 0,
        isRawMaterial: false,
      });

      const result = calculateBuildingCost(gearNode);

      expect(result.machines).toHaveLength(2);
      expect(result.machines[0].machineId).toBe(2302); // Arc Smelter
      expect(result.machines[0].count).toBe(10);
      expect(result.machines[1].machineId).toBe(2303); // Assembler
      expect(result.machines[1].count).toBe(12);

      expect(result.belts).toBe(9); // 4 + 5

      // ソーター計算: Arc Smelter (10機 × 2) + Assembler (12機 × 2) = 44
      expect(result.sorters).toBe(44);
    });

    it("ソーター計算の正確性を検証する", () => {
      // 複数入力・複数出力のレシピ
      const complexRecipe = createMultiOutputRecipe({
        SID: 100,
        name: "Complex Item",
        type: "Chemical",
        timeSpend: 120,
        inputs: [
          { id: 1, name: "Input A", count: 2, isRaw: false },
          { id: 2, name: "Input B", count: 1, isRaw: false },
          { id: 3, name: "Input C", count: 3, isRaw: false },
        ],
        outputs: [
          { id: 101, name: "Output A", count: 2, isRaw: false },
          { id: 102, name: "Output B", count: 1, isRaw: false },
        ],
        explicit: true,
        gridIndex: "5001",
        productive: false,
      });

      const node = createRecipeNode({
        recipe: complexRecipe,
        machine: mockChemicalPlant,
        targetOutputRate: 10,
        machineCount: 5,
        inputs: [],
        children: [],
        power: { total: 750, machines: 750 },
        conveyorBelts: { total: 3, perSecond: 10 },
        depth: 0,
        isRawMaterial: false,
      });

      const result = calculateBuildingCost(node);

      // 3 inputs + 2 outputs = 5 sorters per machine
      // 5 machines × 5 sorters = 25 sorters
      expect(result.sorters).toBe(25);
    });
  });
});
