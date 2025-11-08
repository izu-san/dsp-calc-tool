import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as calculator from "../../lib/calculator";
import { createMockGameData, createSingleOutputRecipe } from "../../test/factories/testDataFactory";
import type { GlobalSettings, NodeOverrideSettings } from "../../types";
import { useProductionCalculation } from "../useProductionCalculation";

// Setupファイルのloggerモックを解除して実際のloggerを使用
vi.unmock("../../utils/logger");

// tryCalculateProductionChainをモック
vi.mock("../../lib/calculator", () => ({
  tryCalculateProductionChain: vi.fn(),
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
    proliferator: {
      type: "none",
      mode: "speed",
      productionBonus: 0,
      speedBonus: 0,
      powerIncrease: 0,
    },
    conveyorBelt: { tier: "mk3", speed: 30, stackCount: 1 },
    sorter: { tier: "mk3", powerConsumption: 72 },
    machineRank: {
      Smelt: "arc",
      Assemble: "mk1",
      Chemical: "standard",
      Research: "standard",
      Refine: "standard",
      Particle: "standard",
    },
    alternativeRecipes: new Map(),
    miningSpeedResearch: 100,
    proliferatorMultiplier: {
      production: 1,
      speed: 1,
    },
    photonGeneration: {
      useGravitonLens: false,
      gravitonLensProliferator: {
        type: "none",
        mode: "speed",
        speedBonus: 0,
        productionBonus: 0,
        powerIncrease: 0,
      },
      rayTransmissionEfficiency: 0,
      continuousReception: 100,
    },
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
      totalMachines: 0,
      totalPower: { machines: 0, sorters: 0, dysonSphere: 0, total: 0 },
      rawMaterials: new Map(),
    };

    vi.mocked(calculator.tryCalculateProductionChain).mockReturnValue({
      ok: true,
      value: mockResult,
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

    expect(calculator.tryCalculateProductionChain).toHaveBeenCalledWith(
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

    expect(calculator.tryCalculateProductionChain).not.toHaveBeenCalled();
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

    expect(calculator.tryCalculateProductionChain).not.toHaveBeenCalled();
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

    expect(calculator.tryCalculateProductionChain).not.toHaveBeenCalled();
    expect(mockSetCalculationResult).toHaveBeenCalledWith(null);
  });

  it("計算でエラーが発生した場合、nullをセットしてコンソールエラーを出力する", () => {
    const error = new Error("Calculation failed");

    vi.mocked(calculator.tryCalculateProductionChain).mockReturnValue({
      ok: false,
      error: error,
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

    expect(calculator.tryCalculateProductionChain).toHaveBeenCalled();
    expect(mockSetCalculationResult).toHaveBeenCalledWith(null);
  });

  it("依存配列の値が変更されると再計算される", () => {
    const mockResult = {
      rootNode: {} as any,
      totalMachines: 0,
      totalPower: { machines: 0, sorters: 0, dysonSphere: 0, total: 0 },
      rawMaterials: new Map(),
    };

    vi.mocked(calculator.tryCalculateProductionChain).mockReturnValue({
      ok: true,
      value: mockResult,
    });

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

    expect(calculator.tryCalculateProductionChain).toHaveBeenCalledTimes(1);

    // targetQuantityを変更
    rerender({ quantity: 20 });

    expect(calculator.tryCalculateProductionChain).toHaveBeenCalledTimes(2);
    expect(calculator.tryCalculateProductionChain).toHaveBeenLastCalledWith(
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
      totalMachines: 0,
      totalPower: { machines: 0, sorters: 0, dysonSphere: 0, total: 0 },
      rawMaterials: new Map(),
    };

    vi.mocked(calculator.tryCalculateProductionChain).mockReturnValue({
      ok: true,
      value: mockResult,
    });

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

    expect(calculator.tryCalculateProductionChain).toHaveBeenCalledTimes(1);

    // バージョンを変更
    rerender({ version: 2 });

    expect(calculator.tryCalculateProductionChain).toHaveBeenCalledTimes(2);
  });
});
