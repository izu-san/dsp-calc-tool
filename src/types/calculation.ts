// Calculation result types

import type { Recipe, Machine } from './game-data';
import type { ProliferatorConfig } from './settings';

export interface NodeOverrideSettings {
  proliferator?: ProliferatorConfig; // Override proliferator settings
  machineRank?: string; // Override machine rank (e.g., 'mk2', 'quantum')
}

export interface RecipeTreeNode {
  recipe?: Recipe; // Optional for raw material leaf nodes
  targetOutputRate: number; // items per second
  machineCount: number;
  proliferator: ProliferatorConfig;
  machine?: Machine; // Optional for raw material leaf nodes
  power: PowerConsumption;
  inputs: RecipeInput[];
  children: RecipeTreeNode[]; // Child nodes for input materials
  conveyorBelts: ConveyorBeltRequirement; // Required conveyor belts
  nodeId: string; // Unique identifier for this node
  overrideSettings?: NodeOverrideSettings; // Node-specific settings override
  
  // For raw material leaf nodes
  isRawMaterial?: boolean;
  itemId?: number;
  itemName?: string;
  miningFrom?: string; // Source of the raw material (e.g., "Iron Veins")
  
  // For circular dependency nodes
  isCircularDependency?: boolean; // True if this node represents a circular dependency
  sourceRecipe?: Recipe; // The recipe that requires this circular input
}

export interface RecipeInput {
  itemId: number;
  itemName: string;
  requiredRate: number; // items per second
}

export interface PowerConsumption {
  machines: number; // kW from production machines
  sorters: number; // kW from sorters
  total: number; // kW total
}

export interface ConveyorBeltRequirement {
  inputs: number; // Number of belts for inputs (sum of all input items)
  outputs: number; // Number of belts for outputs (sum of all output items)
  total: number; // Total number of belts
  saturation?: number; // Maximum saturation percentage (0-100) - bottleneck indicator
  bottleneckType?: 'input' | 'output'; // Which side is the bottleneck
}

export interface CalculationResult {
  rootNode: RecipeTreeNode;
  totalPower: PowerConsumption;
  totalMachines: number; // Total machine count across all nodes
  rawMaterials: Map<number, number>; // itemId -> rate (items/s)
}

export interface GridPosition {
  x: number; // 0-13
  y: number; // 0-7
  z: number; // 1=Item tab, 2=Building tab
}
