import { describe, it, expect } from "vitest";
import {
  calculateProductionRate,
  calculateConveyorBelts,
  buildRecipeTreeFromParams,
} from "../calculator";
import {
  createSingleOutputRecipe,
  createMachineByType,
  createMockSettings,
  createMockGameData,
  createMockItem,
} from "../../test/factories/testDataFactory";
import type { Recipe, Machine } from "../../types/game-data";
import type { ProliferatorConfig } from "../../types/settings";
import { PROLIFERATOR_DATA } from "../../types/settings";

describe("calculator boundary cases", () => {
  it("calculateProductionRate handles assemblerSpeed=0 as 100%", () => {
    const recipe = createSingleOutputRecipe({
      SID: 1,
      name: "Test Recipe",
      type: "Assemble",
      timeSpend: 60,
      inputId: 1,
      inputName: "Input",
      inputCount: 1,
      outputId: 1,
      outputName: "Output",
      outputCount: 1,
    });
    const machine = createMachineByType({
      id: 2901,
      name: "Matrix Lab",
      type: "Research",
      assemblerSpeed: 0, // 0として扱い、100%として動作
      workEnergyPerTick: 6000,
    });
    const proliferator: ProliferatorConfig = {
      ...PROLIFERATOR_DATA.none,
      mode: "speed",
    };
    const pr = calculateProductionRate(recipe, machine, proliferator, { production: 1, speed: 1 });
    // 60 ticks = 1s, speed=100% → 1 item/s
    expect(pr).toBeCloseTo(1, 6);
  });

  it("calculateConveyorBelts returns zero when beltSpeed<=0", () => {
    const belts = calculateConveyorBelts(60, [{ itemId: 1, itemName: "A", requiredRate: 60 }], 0);
    expect(belts.total).toBe(0);
    expect(belts.saturation).toBe(0);
    expect(belts.bottleneckType).toBeUndefined();
  });

  it("buildRecipeTree throws on exceeding maxDepth", () => {
    const recipe = createSingleOutputRecipe({
      SID: 1,
      name: "Test Recipe",
      type: "Assemble",
      timeSpend: 60,
      inputId: 3,
      inputName: "B",
      inputCount: 1,
      outputId: 2,
      outputName: "Output",
      outputCount: 1,
      productive: false,
    });

    const gameData = createMockGameData();
    // 必要なアイテムを追加
    gameData.allItems.set(3, createMockItem(3, "B"));
    // 必要な機械を追加
    const machine = createMachineByType({
      id: 1,
      name: "Assembler",
      type: "Assemble",
      assemblerSpeed: 10000,
      workEnergyPerTick: 60,
    });
    gameData.machines.set(1, machine);
    // 循環レシピを追加（入力アイテムBが自分自身を出力）
    const circularRecipe = createSingleOutputRecipe({
      SID: 1,
      name: "Circular Recipe",
      type: "Assemble",
      timeSpend: 60,
      inputId: 999,
      inputName: "Other",
      inputCount: 1,
      outputId: 3,
      outputName: "B",
      outputCount: 1,
      productive: false,
    });
    gameData.recipesByItemId.set(3, [circularRecipe]);

    const settings = createMockSettings();
    const overrides = new Map();
    expect(() =>
      buildRecipeTreeFromParams(recipe, 1, gameData, settings, overrides, 0, 0, "r-1")
    ).toThrowError("Maximum recursion depth reached");
  });
});
