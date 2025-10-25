import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useProductionCalculation } from '../useProductionCalculation';
import * as calculator from '../../lib/calculator';
import type { Recipe, GameData, GlobalSettings, NodeOverrideSettings } from '../../types';

// calculateProductionChainをモック
vi.mock('../../lib/calculator', () => ({
  calculateProductionChain: vi.fn(),
}));

describe('useProductionCalculation', () => {
  const mockRecipe: Recipe = {
    SID: 1,
    name: 'Iron Ingot',
    Type: 'Smelt',
    Explicit: false,
    TimeSpend: 60,
    Items: [{ id: 1001, name: 'Iron Ore', count: 1 }],
    Results: [{ id: 1101, name: 'Iron Ingot', count: 1 }],
    GridIndex: '0101',
    iconPath: '/path/to/icon.png',
    productive: false,
  };

  const mockGameData: GameData = {
    items: new Map(),
    recipes: new Map([[1, mockRecipe]]),
    machines: new Map(),
    recipesByItemId: new Map(),
    allItems: new Map(),
  };

  const mockSettings: GlobalSettings = {
    proliferator: { type: 'none', mode: 'speed' },
    conveyorBelt: { tier: 'mk3', speed: 30, stackCount: 1 },
    machineRanks: {
      smelt: 'arc',
      assemble: 'mk1',
      chemical: 'standard',
      research: 'standard',
      refine: 'standard',
      particle: 'standard',
    },
    alternativeRecipes: new Map(),
  };

  const mockNodeOverrides = new Map<string, NodeOverrideSettings>();
  const mockSetCalculationResult = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('selectedRecipeとdataとtargetQuantityが全て存在する場合、計算を実行する', () => {
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
        mockSetCalculationResult
      )
    );

    expect(calculator.calculateProductionChain).toHaveBeenCalledWith(
      mockRecipe,
      10,
      mockGameData,
      mockSettings,
      mockNodeOverrides
    );
    expect(mockSetCalculationResult).toHaveBeenCalledWith(mockResult);
  });

  it('selectedRecipeがnullの場合、計算を実行せずnullをセットする', () => {
    renderHook(() =>
      useProductionCalculation(
        null,
        10,
        mockGameData,
        mockSettings,
        mockNodeOverrides,
        1,
        mockSetCalculationResult
      )
    );

    expect(calculator.calculateProductionChain).not.toHaveBeenCalled();
    expect(mockSetCalculationResult).toHaveBeenCalledWith(null);
  });

  it('dataがnullの場合、計算を実行せずnullをセットする', () => {
    renderHook(() =>
      useProductionCalculation(
        mockRecipe,
        10,
        null,
        mockSettings,
        mockNodeOverrides,
        1,
        mockSetCalculationResult
      )
    );

    expect(calculator.calculateProductionChain).not.toHaveBeenCalled();
    expect(mockSetCalculationResult).toHaveBeenCalledWith(null);
  });

  it('targetQuantityが0以下の場合、計算を実行せずnullをセットする', () => {
    renderHook(() =>
      useProductionCalculation(
        mockRecipe,
        0,
        mockGameData,
        mockSettings,
        mockNodeOverrides,
        1,
        mockSetCalculationResult
      )
    );

    expect(calculator.calculateProductionChain).not.toHaveBeenCalled();
    expect(mockSetCalculationResult).toHaveBeenCalledWith(null);
  });

  it('計算でエラーが発生した場合、nullをセットしてコンソールエラーを出力する', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const error = new Error('Calculation failed');

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
        mockSetCalculationResult
      )
    );

    expect(calculator.calculateProductionChain).toHaveBeenCalled();
    expect(mockSetCalculationResult).toHaveBeenCalledWith(null);
    expect(consoleErrorSpy).toHaveBeenCalledWith('[ERROR] [DSP-Calc] Calculation error: Calculation failed', error);

    consoleErrorSpy.mockRestore();
  });

  it('依存配列の値が変更されると再計算される', () => {
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
      mockNodeOverrides
    );
  });

  it('nodeOverridesVersionが変更されると再計算される', () => {
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

