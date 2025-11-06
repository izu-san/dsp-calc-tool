// Patch diff types for version comparison

import type { RecipeItem } from "./game-data";

export interface RecipeDiff {
  recipeSID: number;
  recipeName: string;
  changes: {
    type: "added" | "removed" | "modified";
    itemsDiff?: {
      added: RecipeItem[];
      removed: RecipeItem[];
      modified: {
        item: RecipeItem;
        oldCount: number;
        newCount: number;
      }[];
    };
    resultsDiff?: {
      added: RecipeItem[];
      removed: RecipeItem[];
      modified: {
        item: RecipeItem;
        oldCount: number;
        newCount: number;
      }[];
    };
    timeSpendDiff?: {
      old: number;
      new: number;
    };
  };
}

export interface ItemDiff {
  itemId: number;
  itemName: string;
  changes: {
    type: "added" | "removed" | "modified";
    attributeChanges?: {
      name?: { old: string; new: string };
      type?: { old: string; new: string };
      miningFrom?: { old?: string; new?: string };
      produceFrom?: { old?: string; new?: string };
      isRaw?: { old: boolean; new: boolean };
    };
  };
}

export interface MachineDiff {
  machineId: number;
  machineName: string;
  changes: {
    type: "added" | "removed" | "modified";
    attributeChanges?: {
      name?: { old: string; new: string };
      type?: { old: string; new: string };
      assemblerSpeed?: { old: number; new: number };
      workEnergyPerTick?: { old: number; new: number };
      idleEnergyPerTick?: { old: number; new: number };
      exchangeEnergyPerTick?: { old: number; new: number };
      isPowerConsumer?: { old: boolean; new: boolean };
      isPowerExchanger?: { old: boolean; new: boolean };
    };
  };
}
