import { describe, it, expect, vi, beforeEach } from "vitest";

// Setupファイルのloggerモックを解除して実際のloggerを使用
vi.unmock("../../utils/logger");
import { renderHook } from "@testing-library/react";
import { useProductionCalculation } from "../useProductionCalculation";
import * as calculator from "../../lib/calculator";
import type { Recipe, GlobalSettings, NodeOverrideSettings } from "../../types";
import { createMockGameData, createSingleOutputRecipe } from "../../test/factories/testDataFactory";

// calculateProductionChainをモック
vi.mock("../../lib/calculator", () => ({
  calculateProductionChain: vi.fn(),
}));

describe("useProductionCalculation", () => {
  const mockRecipe = createSingleOutputRecipe({
    SID: 1,
    name: "Iron Ingot",
    type: "Smelt",
    timeSpend: 60,
    inputId: 1001,
    inputName: "Iron Ore",
    inputCount: 1,
    outputId: 1101,
    outputName: "Iron Ingot",
    outputCount: 1,
    isRawInput: true,
    gridIndex: "0101",
  });

  const mockGameData = createMockGameData();
  mockGameData.recipes.set(1, mockRecipe);

  const mockSettings: GlobalSettings = {
    proliferator: { type: "none", mode: "speed" },
    conveyorBelt: { tier: "mk3", speed: 30, stackCount: 1 },
    machineRanks: {
      smelt: "arc",
      assemble: "mk1",
      chemical: "standard",
      research: "standard",
      refine: "standard",
      particle: "standard",
    },
    alternativeRecipes: new Map(),
  };

  const mockNodeOverrides = new Map<string, NodeOverrideSettings>();
  const mockMiningSettings = {
    machineType: "Advanced Mining Machine" as const,
    workSpeedMultiplier: 100,
  };
  const mockSetCalculationResult = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("selectedRecipeとdataとtargetQuantityが全て存在する場合、計算を実行する", () => {
    const mockResult = {
      rootNode: {} as any,
      totalMachines: new Map(),
      totalPower: 0,
      rawMaterials: [],
    };

    vi.mocked(calculator.calculateProductionChain).mockReturnValue(mockResult);

    renderHook(() =>
      useProductionCalculation(
        mockRecipe,
        10,
        mockGameData,
        mockSettings,
        mockNodeOverrides,
        1,
        mockMiningSettings,
        mockSetCalculationResult
      )
    );

    expect(calculator.calculateProductionChain).toHaveBeenCalledWith(
      mockRecipe,
      10,
      mockGameData,
      mockSettings,
      mockNodeOverrides,
      mockMiningSettings
    );
    expect(mockSetCalculationResult).toHaveBeenCalledWith(mockResult);
  });

  it("selectedRecipeがnullの場合、計算を実行せずnullをセットする", () => {
    renderHook(() =>
      useProductionCalculation(
        null,
        10,
        mockGameData,
        mockSettings,
        mockNodeOverrides,
        1,
        mockMiningSettings,
        mockSetCalculationResult
      )
    );

    expect(calculator.calculateProductionChain).not.toHaveBeenCalled();
    expect(mockSetCalculationResult).toHaveBeenCalledWith(null);
  });

  it("dataがnullの場合、計算を実行せずnullをセットする", () => {
    renderHook(() =>
      useProductionCalculation(
        mockRecipe,
        10,
        null,
        mockSettings,
        mockNodeOverrides,
        1,
        mockMiningSettings,
        mockSetCalculationResult
      )
    );

    expect(calculator.calculateProductionChain).not.toHaveBeenCalled();
    expect(mockSetCalculationResult).toHaveBeenCalledWith(null);
  });

  it("targetQuantityが0以下の場合、計算を実行せずnullをセットする", () => {
    renderHook(() =>
      useProductionCalculation(
        mockRecipe,
        0,
        mockGameData,
        mockSettings,
        mockNodeOverrides,
        1,
        mockMiningSettings,
        mockSetCalculationResult
      )
    );

    expect(calculator.calculateProductionChain).not.toHaveBeenCalled();
    expect(mockSetCalculationResult).toHaveBeenCalledWith(null);
  });

  it("計算でエラーが発生した場合、nullをセットしてコンソールエラーを出力する", () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const error = new Error("Calculation failed");

    vi.mocked(calculator.calculateProductionChain).mockImplementation(() => {
      throw error;
    });

    renderHook(() =>
      useProductionCalculation(
        mockRecipe,
        10,
        mockGameData,
        mockSettings,
        mockNodeOverrides,
        1,
        mockMiningSettings,
        mockSetCalculationResult
      )
    );

    expect(calculator.calculateProductionChain).toHaveBeenCalled();
    expect(mockSetCalculationResult).toHaveBeenCalledWith(null);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "[ERROR] [DSP-Calc] Calculation error: Calculation failed",
      error
    );

    consoleErrorSpy.mockRestore();
  });

  it("依存配列の値が変更されると再計算される", () => {
    const mockResult = {
      rootNode: {} as any,
      totalMachines: new Map(),
      totalPower: 0,
      rawMaterials: [],
    };

    vi.mocked(calculator.calculateProductionChain).mockReturnValue(mockResult);

    const { rerender } = renderHook(
      ({ quantity }) =>
        useProductionCalculation(
          mockRecipe,
          quantity,
          mockGameData,
          mockSettings,
          mockNodeOverrides,
          1,
          mockMiningSettings,
          mockSetCalculationResult
        ),
      { initialProps: { quantity: 10 } }
    );

    expect(calculator.calculateProductionChain).toHaveBeenCalledTimes(1);

    // targetQuantityを変更
    rerender({ quantity: 20 });

    expect(calculator.calculateProductionChain).toHaveBeenCalledTimes(2);
    expect(calculator.calculateProductionChain).toHaveBeenLastCalledWith(
      mockRecipe,
      20,
      mockGameData,
      mockSettings,
      mockNodeOverrides,
      mockMiningSettings
    );
  });

  it("nodeOverridesVersionが変更されると再計算される", () => {
    const mockResult = {
      rootNode: {} as any,
      totalMachines: new Map(),
      totalPower: 0,
      rawMaterials: [],
    };

    vi.mocked(calculator.calculateProductionChain).mockReturnValue(mockResult);

    const { rerender } = renderHook(
      ({ version }) =>
        useProductionCalculation(
          mockRecipe,
          10,
          mockGameData,
          mockSettings,
          mockNodeOverrides,
          version,
          mockMiningSettings,
          mockSetCalculationResult
        ),
      { initialProps: { version: 1 } }
    );

    expect(calculator.calculateProductionChain).toHaveBeenCalledTimes(1);

    // バージョンを変更
    rerender({ version: 2 });

    expect(calculator.calculateProductionChain).toHaveBeenCalledTimes(2);
  });
});
