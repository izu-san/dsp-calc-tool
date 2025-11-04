/**
 * Recipe ビルダー
 * テスト用の Recipe を簡単に作成するためのファクトリ関数
 */

import type { Recipe } from "../../types/game-data";
import { createMockRecipe } from "./testDataFactory";

/**
 * 基本的なレシピを作成（createMockRecipe のラッパー）
 */
export function createRecipe(overrides?: Partial<Recipe>): Recipe {
  return createMockRecipe(overrides?.SID ?? 1, overrides?.name ?? "Test Recipe");
}

/**
 * 単一出力レシピを作成
 */
export function createSingleOutputRecipe(params: {
  SID: number;
  name: string;
  type?: Recipe["Type"];
  timeSpend?: number;
  inputId: number;
  inputName: string;
  inputCount: number;
  outputId: number;
  outputName: string;
  outputCount: number;
  isRawInput?: boolean;
  isRawOutput?: boolean;
  explicit?: boolean;
  gridIndex?: string;
  productive?: boolean;
}): Recipe {
  return {
    SID: params.SID,
    name: params.name,
    Type: params.type ?? "Assemble",
    Explicit: params.explicit ?? false,
    TimeSpend: params.timeSpend ?? 60,
    Items: [
      {
        id: params.inputId,
        name: params.inputName,
        count: params.inputCount,
        Type: params.isRawInput ? "Resource" : "Material",
        isRaw: params.isRawInput ?? false,
      },
    ],
    Results: [
      {
        id: params.outputId,
        name: params.outputName,
        count: params.outputCount,
        Type: params.isRawOutput ? "Resource" : "Material",
        isRaw: params.isRawOutput ?? false,
      },
    ],
    GridIndex: params.gridIndex ?? `${params.SID}`,
    productive: params.productive ?? false,
  };
}

/**
 * 複数出力レシピを作成（副産物あり）
 */
export function createMultiOutputRecipe(params: {
  SID: number;
  name: string;
  type?: Recipe["Type"];
  timeSpend?: number;
  inputs: Array<{ id: number; name: string; count: number; isRaw?: boolean }>;
  outputs: Array<{ id: number; name: string; count: number; isRaw?: boolean }>;
  explicit?: boolean;
  gridIndex?: string;
  productive?: boolean;
}): Recipe {
  return {
    SID: params.SID,
    name: params.name,
    Type: params.type ?? "Chemical",
    Explicit: params.explicit ?? true,
    TimeSpend: params.timeSpend ?? 240,
    Items: params.inputs.map(input => ({
      id: input.id,
      name: input.name,
      count: input.count,
      Type: input.isRaw ? "Resource" : "Material",
      isRaw: input.isRaw ?? false,
    })),
    Results: params.outputs.map(output => ({
      id: output.id,
      name: output.name,
      count: output.count,
      Type: output.isRaw ? "Resource" : "Material",
      isRaw: output.isRaw ?? false,
    })),
    GridIndex: params.gridIndex ?? `${params.SID}`,
    productive: params.productive ?? false,
  };
}

/**
 * よく使われるレシピのプリセット
 */
export const recipePresets = {
  /**
   * Iron Ingot レシピ
   */
  ironIngot: (): Recipe =>
    createSingleOutputRecipe({
      SID: 1,
      name: "Iron Ingot",
      type: "Smelt",
      timeSpend: 60,
      inputId: 1001,
      inputName: "Iron Ore",
      inputCount: 1,
      isRawInput: true,
      outputId: 1101,
      outputName: "Iron Ingot",
      outputCount: 1,
      gridIndex: "1101",
    }),

  /**
   * Copper Ingot レシピ
   */
  copperIngot: (): Recipe =>
    createSingleOutputRecipe({
      SID: 2,
      name: "Copper Ingot",
      type: "Smelt",
      timeSpend: 60,
      inputId: 1002,
      inputName: "Copper Ore",
      inputCount: 1,
      isRawInput: true,
      outputId: 1102,
      outputName: "Copper Ingot",
      outputCount: 1,
      gridIndex: "1102",
    }),

  /**
   * Gear レシピ
   */
  gear: (): Recipe =>
    createSingleOutputRecipe({
      SID: 3,
      name: "Gear",
      type: "Assemble",
      timeSpend: 60,
      inputId: 1101,
      inputName: "Iron Ingot",
      inputCount: 1,
      outputId: 1103,
      outputName: "Gear",
      outputCount: 1,
      gridIndex: "1103",
    }),

  /**
   * Refined Oil レシピ（副産物: Hydrogen）
   */
  refinedOil: (): Recipe =>
    createMultiOutputRecipe({
      SID: 100,
      name: "Refined Oil",
      type: "Chemical",
      timeSpend: 240,
      inputs: [{ id: 1007, name: "Crude Oil", count: 2, isRaw: true }],
      outputs: [
        { id: 1114, name: "Refined Oil", count: 2 },
        { id: 1120, name: "Hydrogen", count: 1 },
      ],
      explicit: true,
      gridIndex: "5001",
    }),
};
