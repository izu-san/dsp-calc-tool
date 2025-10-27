/**
 * テストデータファクトリー
 * テスト用のモックデータを一元的に管理し、重複を削減
 */

import type { GameData, Recipe, Machine, Item } from '../../types/game-data';

// 基本テストデータ
export const createMockItem = (id: number, name: string): Item => ({
  id,
  name,
  Type: 'Item',
  isRaw: id <= 10, // 最初の10個を原材料とする
  count: 0
});

export const createMockMachine = (id: string, name: string): Machine => ({
  id: parseInt(id.replace(/\D/g, '') || '1'),
  name,
  Type: 'Assemble',
  isRaw: false,
  count: 0,
  assemblerSpeed: 10000,
  workEnergyPerTick: 100,
  idleEnergyPerTick: 10,
  exchangeEnergyPerTick: 0,
  isPowerConsumer: true,
  isPowerExchanger: false
});

export const createMockRecipe = (id: number, name: string): Recipe => ({
  SID: id,
  name,
  Type: 'Assemble',
  Explicit: false,
  TimeSpend: 1,
  Items: [{ id: 1, name: 'Iron Ore', count: 1, Type: 'Item', isRaw: true }],
  Results: [{ id: 2, name: 'Iron Ingot', count: 1, Type: 'Item', isRaw: false }],
  GridIndex: '1101',
  productive: true
});

// 完全なゲームデータセット
export const createMockGameData = (): GameData => {
  const items = new Map([
    [1, createMockItem(1, 'Iron Ore')],
    [2, createMockItem(2, 'Iron Ingot')],
    [3, createMockItem(3, 'Copper Ore')],
    [4, createMockItem(4, 'Copper Ingot')],
    [1007, createMockItem(1007, 'Crude Oil')],
    [1120, createMockItem(1120, 'Hydrogen')],
    [1114, createMockItem(1114, 'Refined Oil')],
    [1109, createMockItem(1109, 'High-Energy Graphite')],
    [1208, createMockItem(1208, 'Graphene')],
    [1123, createMockItem(1123, 'Graphene')],
    [1122, createMockItem(1122, 'Antimatter')],
    [1209, createMockItem(1209, 'Graviton Lens')],
  ]);
  
  const recipes = new Map([
    [1, createMockRecipe(1, 'Smelt Iron Ingot')],
    [2, createMockRecipe(2, 'Smelt Copper Ingot')]
  ]);
  
  // recipesByItemIdプロパティを追加
  const recipesByItemId = new Map<number, Recipe[]>();
  recipes.forEach(recipe => {
    recipe.Results.forEach(result => {
      if (!recipesByItemId.has(result.id)) {
        recipesByItemId.set(result.id, []);
      }
      recipesByItemId.get(result.id)!.push(recipe);
    });
  });
  
  return {
    items,
    allItems: items,
    recipes,
    recipesByItemId,
    machines: new Map([
      ['arc', createMockMachine('arc', 'Arc Smelter')],
      ['mk1', createMockMachine('mk1', 'Assembling Machine Mk.I')]
    ])
  };
};

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
  proliferatorMultiplier: { production: 1, speed: 1 },
  machineRank: { 
    Smelt: 'arc', 
    Assemble: 'mk1', 
    Chemical: 'standard',
    Research: 'standard',
    Refine: 'standard',
    Particle: 'standard'
  },
  conveyorBelt: { tier: 'mk1', speed: 6, stackCount: 4 },
  sorter: { tier: 'mk1', powerConsumption: 0.27 },
  photonGeneration: { useGravitonLens: false, energyLoss: 0 },
  mining: { miningSpeed: 1, veinUtilization: 1 },
  alternativeRecipes: new Map<number, number>(),
  locale: 'en',
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
