/**
 * テストデータファクトリー
 * テスト用のモックデータを一元的に管理し、重複を削減
 */

import type { GameData, Recipe, Machine, Item } from '../../types/game-data';

// 基本テストデータ
export const createMockItem = (id: number, name: string): Item => ({
  id,
  name,
  iconPath: `/icons/item_${id}.png`,
  stackSize: 100,
  canBeMined: false,
  miningSpeedBonus: 0
});

export const createMockMachine = (id: string, name: string): Machine => ({
  id,
  name,
  iconPath: `/icons/machine_${id}.png`,
  type: 'Assemble',
  workEnergyPerTick: 100,
  workSpeedMultiplier: 1,
  powerMultiplier: 1
});

export const createMockRecipe = (id: number, name: string): Recipe => ({
  id,
  name,
  type: 'Assemble',
  timeSpand: 1,
  inputs: [{ id: 1, count: 1 }],
  results: [{ id: 2, count: 1 }],
  explicit: false,
  firstResultId: 2
});

// 完全なゲームデータセット
export const createMockGameData = (): GameData => ({
  items: new Map([
    [1, createMockItem(1, 'Iron Ore')],
    [2, createMockItem(2, 'Iron Ingot')],
    [3, createMockItem(3, 'Copper Ore')],
    [4, createMockItem(4, 'Copper Ingot')]
  ]),
  recipes: new Map([
    [1, createMockRecipe(1, 'Smelt Iron Ingot')],
    [2, createMockRecipe(2, 'Smelt Copper Ingot')]
  ]),
  machines: new Map([
    ['arc', createMockMachine('arc', 'Arc Smelter')],
    ['mk1', createMockMachine('mk1', 'Assembling Machine Mk.I')]
  ])
});

// 計算結果用のモックデータ
export const createMockCalculationResult = () => ({
  rootNode: {
    nodeId: 'root',
    itemName: 'Test Item',
    itemId: 1,
    targetCount: 60,
    productionRate: 60,
    consumptionRate: 0,
    netRate: 60,
    machineCount: 1,
    machineId: 'mk1',
    powerConsumption: 100,
    children: []
  },
  totalPower: 100,
  totalMachines: 1,
  rawMaterials: new Map([
    [1, { production: 0, consumption: 60, net: -60 }]
  ])
});

// 設定用のモックデータ
export const createMockSettings = () => ({
  proliferator: { type: 'none', mode: 'speed' },
  conveyorBelt: { tier: 'mk1', stackCount: 1 },
  machineRank: { 
    Smelt: 'arc', 
    Assemble: 'mk1', 
    Chemical: 'standard',
    Research: 'standard',
    Refine: 'standard',
    Particle: 'standard'
  },
  alternativeRecipes: new Map<number, number>(),
  miningSpeedResearch: 0,
  proliferatorMultiplier: { production: 1, speed: 1 }
});

// ノードオーバーライド用のモックデータ
export const createMockNodeOverride = () => ({
  proliferator: { type: 'mk1', mode: 'speed' },
  machineRank: 'mk2'
});

// ストア用のモックデータ
export const createMockStoreStates = () => ({
  gameDataStore: {
    data: createMockGameData(),
    isLoading: false,
    error: null,
    locale: 'ja'
  },
  settingsStore: {
    settings: createMockSettings()
  },
  nodeOverrideStore: {
    nodeOverrides: new Map(),
    version: 0
  },
  recipeSelectionStore: {
    selectedRecipe: null,
    targetCount: 60
  }
});

// テスト用のユーティリティ関数
export const createMockFile = (name: string, content: string): File => {
  const blob = new Blob([content], { type: 'text/xml' });
  return new File([blob], name, { type: 'text/xml' });
};

export const createMockURL = (planData: string): string => {
  return `https://example.com?plan=${encodeURIComponent(planData)}`;
};

// パフォーマンステスト用の大量データ
export const createLargeMockGameData = (): GameData => {
  const items = new Map<number, Item>();
  const recipes = new Map<number, Recipe>();
  const machines = new Map<string, Machine>();

  // 1000個のアイテム
  for (let i = 1; i <= 1000; i++) {
    items.set(i, createMockItem(i, `Item ${i}`));
  }

  // 500個のレシピ
  for (let i = 1; i <= 500; i++) {
    recipes.set(i, createMockRecipe(i, `Recipe ${i}`));
  }

  // 50個の機械
  const machineTypes = ['mk1', 'mk2', 'mk3', 'arc', 'plane'];
  for (let i = 0; i < 50; i++) {
    const type = machineTypes[i % machineTypes.length];
    machines.set(`${type}_${i}`, createMockMachine(`${type}_${i}`, `Machine ${i}`));
  }

  return { items, recipes, machines };
};
