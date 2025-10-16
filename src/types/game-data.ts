// Game data types from XML files

export interface Item {
  id: number;
  name: string;
  count?: number;
  Type: string;
  miningFrom?: string;
  produceFrom?: string;
  isRaw: boolean;
}

export interface RecipeItem {
  id: number;
  name: string;
  count: number;
  Type: string;
  isRaw: boolean;
}

export interface Recipe {
  SID: number;
  name: string;
  Type: 'Smelt' | 'Assemble' | 'Chemical' | 'Research' | 'Refine' | 'Particle';
  Explicit: boolean;
  TimeSpend: number; // in game ticks (divide by 60 for seconds)
  Items: RecipeItem[]; // Input items
  Results: RecipeItem[]; // Output items
  GridIndex: string; // Format: ZYXX (e.g., "1101")
  productive: boolean; // true = can use production boost, false = speed boost only
}

export interface Machine {
  id: number;
  name: string;
  count?: number;
  Type: string;
  miningFrom?: string;
  produceFrom?: string;
  isRaw: boolean;
  assemblerSpeed: number; // 10000 = 100%, 7500 = 75%, etc.
  workEnergyPerTick: number; // Multiply by 60 to get kW
  idleEnergyPerTick: number;
  exchangeEnergyPerTick: number;
  isPowerConsumer: boolean;
  isPowerExchanger: boolean;
}

// Parsed collections
export interface GameData {
  items: Map<number, Item>;
  recipes: Map<number, Recipe>;
  machines: Map<number, Machine>;
  recipesByItemId: Map<number, Recipe[]>; // Map item ID to recipes that produce it
  allItems: Map<number, Item | Machine>; // Combined items and machines for recipe lookups
}
