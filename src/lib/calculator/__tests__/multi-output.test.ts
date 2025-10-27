import { describe, it, expect } from 'vitest';
import { calculateProductionChain } from '../index';
import { createMockGameData, createMockSettings } from '../../../test/factories/testDataFactory';
import type { Recipe } from '../../../types';

describe('Multi-output recipes', () => {
  const gameData = createMockGameData();
  const settings = createMockSettings();

  it('should calculate multi-output results for recipes with multiple outputs', () => {
    // プラズマ精製レシピ（水素×1 + 精製油×2）
    const plasmaRefiningRecipe: Recipe = {
      SID: 1107,
      name: 'プラズマ精製',
      Type: 'Refine',
      Explicit: true,
      TimeSpend: 240,
      Items: [
        { id: 1007, name: '原油', count: 2, Type: 'Unknown', isRaw: true }
      ],
      Results: [
        { id: 1120, name: '水素', count: 1, Type: 'Unknown', isRaw: true },
        { id: 1114, name: '精製油', count: 2, Type: 'Unknown', isRaw: true }
      ],
      GridIndex: '1107',
      productive: true,
    };

    const result = calculateProductionChain(plasmaRefiningRecipe, 1, gameData, settings);

    // 複数出力結果が計算されていることを確認
    expect(result.multiOutputResults).toBeDefined();
    expect(result.multiOutputResults).toHaveLength(2);

    // 水素の生産速度（メイン出力）
    const hydrogenResult = result.multiOutputResults!.find(r => r.itemId === 1120);
    expect(hydrogenResult).toBeDefined();
    expect(hydrogenResult!.productionRate).toBe(1); // 目標速度
    expect(hydrogenResult!.count).toBe(1);

    // 精製油の生産速度（副産物）
    const refinedOilResult = result.multiOutputResults!.find(r => r.itemId === 1114);
    expect(refinedOilResult).toBeDefined();
    expect(refinedOilResult!.productionRate).toBe(2); // 水素の2倍
    expect(refinedOilResult!.count).toBe(2);
  });

  it('should not include multiOutputResults for single-output recipes', () => {
    // 単一出力レシピ
    const singleOutputRecipe: Recipe = {
      SID: 1,
      name: '鉄インゴット',
      Type: 'Smelt',
      Explicit: false,
      TimeSpend: 60,
      Items: [
        { id: 1001, name: '鉄鉱石', count: 1, Type: 'Unknown', isRaw: true }
      ],
      Results: [
        { id: 1101, name: '鉄インゴット', count: 1, Type: 'Unknown', isRaw: false }
      ],
      GridIndex: '1101',
      productive: false,
    };

    const result = calculateProductionChain(singleOutputRecipe, 1, gameData, settings);

    // 単一出力レシピでは multiOutputResults が undefined であることを確認
    expect(result.multiOutputResults).toBeUndefined();
  });

  it('should calculate correct production rates for X-ray cracking recipe', () => {
    // X線クラッキングレシピ（水素×3 + 高エネルギーグラファイト×1）
    const xrayCrackingRecipe: Recipe = {
      SID: 1207,
      name: 'X線クラッキング',
      Type: 'Refine',
      Explicit: true,
      TimeSpend: 240,
      Items: [
        { id: 1114, name: '精製油', count: 1, Type: 'Unknown', isRaw: true },
        { id: 1120, name: '水素', count: 2, Type: 'Unknown', isRaw: true }
      ],
      Results: [
        { id: 1120, name: '水素', count: 3, Type: 'Unknown', isRaw: true },
        { id: 1109, name: '高エネルギーグラファイト', count: 1, Type: 'Unknown', isRaw: false }
      ],
      GridIndex: '1207',
      productive: false,
    };

    const result = calculateProductionChain(xrayCrackingRecipe, 3, gameData, settings);

    expect(result.multiOutputResults).toBeDefined();
    expect(result.multiOutputResults).toHaveLength(2);

    // 水素の生産速度（メイン出力）
    const hydrogenResult = result.multiOutputResults!.find(r => r.itemId === 1120);
    expect(hydrogenResult).toBeDefined();
    expect(hydrogenResult!.productionRate).toBe(3); // 目標速度
    expect(hydrogenResult!.count).toBe(3);

    // 高エネルギーグラファイトの生産速度（副産物）
    const graphiteResult = result.multiOutputResults!.find(r => r.itemId === 1109);
    expect(graphiteResult).toBeDefined();
    expect(graphiteResult!.productionRate).toBe(1); // 水素の1/3
    expect(graphiteResult!.count).toBe(1);
  });

  it('should handle recipes with different output ratios correctly', () => {
    // グラフェン（高度）レシピ（グラフェン×2 + 水素×1）
    const grapheneRecipe: Recipe = {
      SID: 1208,
      name: 'グラフェン（高度）',
      Type: 'Chemical',
      Explicit: true,
      TimeSpend: 120,
      Items: [
        { id: 1011, name: 'メタンハイドレート', count: 2, Type: 'Unknown', isRaw: true }
      ],
      Results: [
        { id: 1123, name: 'グラフェン', count: 2, Type: 'Unknown', isRaw: true },
        { id: 1120, name: '水素', count: 1, Type: 'Unknown', isRaw: true }
      ],
      GridIndex: '1208',
      productive: true,
    };

    const result = calculateProductionChain(grapheneRecipe, 4, gameData, settings);

    expect(result.multiOutputResults).toBeDefined();
    expect(result.multiOutputResults).toHaveLength(2);

    // グラフェンの生産速度（メイン出力）
    const grapheneResult = result.multiOutputResults!.find(r => r.itemId === 1123);
    expect(grapheneResult).toBeDefined();
    expect(grapheneResult!.productionRate).toBe(4); // 目標速度
    expect(grapheneResult!.count).toBe(2);

    // 水素の生産速度（副産物）
    const hydrogenResult = result.multiOutputResults!.find(r => r.itemId === 1120);
    expect(hydrogenResult).toBeDefined();
    expect(hydrogenResult!.productionRate).toBe(2); // グラフェンの1/2
    expect(hydrogenResult!.count).toBe(1);
  });
});
