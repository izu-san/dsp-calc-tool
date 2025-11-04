/**
 * RecipeTreeNode ビルダー
 * テスト用の RecipeTreeNode を簡単に作成するためのファクトリ関数
 */

import type {
  ConveyorBeltRequirement,
  PowerConsumption,
  RecipeInput,
  RecipeTreeNode,
} from "../../types/calculation";
import type { Machine, Recipe } from "../../types/game-data";
import type { ProliferatorConfig } from "../../types/settings";
import { PROLIFERATOR_DATA } from "../../types/settings";

/**
 * デフォルトの電力消費データを作成
 */
export function createDefaultPowerConsumption(
  overrides?: Partial<PowerConsumption>
): PowerConsumption {
  return {
    machines: 0,
    sorters: 0,
    dysonSphere: 0,
    total: 0,
    ...overrides,
  };
}

/**
 * デフォルトのコンベアベルト要件を作成
 */
export function createDefaultConveyorBelts(
  overrides?: Partial<ConveyorBeltRequirement>
): ConveyorBeltRequirement {
  return {
    inputs: 0,
    outputs: 0,
    total: 0,
    ...overrides,
  };
}

/**
 * RecipeTreeNode を作成
 */
export function createRecipeTreeNode(overrides?: Partial<RecipeTreeNode>): RecipeTreeNode {
  const defaultProliferator: ProliferatorConfig = {
    ...PROLIFERATOR_DATA.none,
    mode: "production",
  };

  return {
    recipe: undefined,
    targetOutputRate: 1,
    machineCount: 1,
    proliferator: defaultProliferator,
    machine: undefined,
    power: createDefaultPowerConsumption(),
    inputs: [],
    children: [],
    conveyorBelts: createDefaultConveyorBelts(),
    nodeId: "test-node-1",
    ...overrides,
  };
}

/**
 * レシピノードを作成（レシピと機械を含む）
 */
export function createRecipeNode(params: {
  recipe: Recipe;
  machine: Machine;
  targetOutputRate?: number;
  machineCount?: number;
  proliferator?: ProliferatorConfig;
  power?: Partial<PowerConsumption>;
  inputs?: RecipeInput[];
  children?: RecipeTreeNode[];
  conveyorBelts?: Partial<ConveyorBeltRequirement>;
  nodeId?: string;
  overrideSettings?: RecipeTreeNode["overrideSettings"];
  targetItemId?: number;
  depth?: number;
  isRawMaterial?: boolean;
  itemId?: number;
  itemName?: string;
}): RecipeTreeNode {
  return createRecipeTreeNode({
    recipe: params.recipe,
    machine: params.machine,
    targetOutputRate: params.targetOutputRate ?? 1,
    machineCount: params.machineCount ?? 1,
    proliferator: params.proliferator ?? { ...PROLIFERATOR_DATA.none, mode: "production" },
    power: params.power
      ? createDefaultPowerConsumption(params.power)
      : createDefaultPowerConsumption(),
    inputs: params.inputs ?? [],
    children: params.children ?? [],
    conveyorBelts: params.conveyorBelts
      ? createDefaultConveyorBelts(params.conveyorBelts)
      : createDefaultConveyorBelts(),
    nodeId: params.nodeId ?? "test-node-1",
    overrideSettings: params.overrideSettings,
    targetItemId: params.targetItemId,
    depth: params.depth,
    isRawMaterial: params.isRawMaterial,
    itemId: params.itemId,
    itemName: params.itemName,
  });
}

/**
 * 原材料ノードを作成
 */
export function createRawMaterialNode(params: {
  itemId: number;
  itemName: string;
  targetOutputRate: number;
  nodeId?: string;
  miningFrom?: string;
  miningEquipment?: RecipeTreeNode["miningEquipment"];
  depth?: number;
  power?: Partial<PowerConsumption>;
  conveyorBelts?: Partial<ConveyorBeltRequirement>;
  machine?: Machine;
  proliferator?: ProliferatorConfig;
}): RecipeTreeNode {
  return createRecipeTreeNode({
    recipe: undefined,
    machine: params.machine,
    targetOutputRate: params.targetOutputRate,
    machineCount: 0,
    isRawMaterial: true,
    itemId: params.itemId,
    itemName: params.itemName,
    nodeId: params.nodeId ?? `raw-${params.itemId}`,
    miningFrom: params.miningFrom,
    miningEquipment: params.miningEquipment,
    depth: params.depth,
    proliferator: params.proliferator ?? { ...PROLIFERATOR_DATA.none, mode: "production" },
    power: params.power
      ? createDefaultPowerConsumption(params.power)
      : createDefaultPowerConsumption({ total: 0 }),
    conveyorBelts: params.conveyorBelts
      ? createDefaultConveyorBelts(params.conveyorBelts)
      : createDefaultConveyorBelts({ total: 0 }),
  });
}

/**
 * 循環依存ノードを作成
 */
export function createCircularDependencyNode(params: {
  itemId: number;
  itemName: string;
  targetOutputRate: number;
  sourceRecipe: Recipe;
  nodeId?: string;
}): RecipeTreeNode {
  return createRecipeTreeNode({
    recipe: undefined,
    machine: undefined,
    targetOutputRate: params.targetOutputRate,
    machineCount: 0,
    isCircularDependency: true,
    itemId: params.itemId,
    itemName: params.itemName,
    sourceRecipe: params.sourceRecipe,
    nodeId: params.nodeId ?? `circular-${params.itemId}`,
    power: createDefaultPowerConsumption({ total: 0 }),
    conveyorBelts: createDefaultConveyorBelts({ total: 0 }),
  });
}
