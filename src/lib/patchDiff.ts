import type { GameData, Recipe, RecipeItem } from "../types/game-data";
import type { RecipeDiff, ItemDiff, MachineDiff } from "../types/patch-diff";

/**
 * 新規レシピを取得する
 */
export function getNewRecipes(oldData: GameData, newData: GameData): Recipe[] {
  const newRecipes: Recipe[] = [];
  for (const [sid, recipe] of newData.recipes) {
    if (!oldData.recipes.has(sid)) {
      newRecipes.push(recipe);
    }
  }
  return newRecipes;
}

/**
 * 削除されたレシピを取得する
 */
export function getRemovedRecipes(oldData: GameData, newData: GameData): Recipe[] {
  const removedRecipes: Recipe[] = [];
  for (const [sid, recipe] of oldData.recipes) {
    if (!newData.recipes.has(sid)) {
      removedRecipes.push(recipe);
    }
  }
  return removedRecipes;
}

/**
 * レシピアイテムの差分を比較する
 */
function compareRecipeItems(
  oldItems: RecipeItem[],
  newItems: RecipeItem[]
): {
  added: RecipeItem[];
  removed: RecipeItem[];
  modified: Array<{ item: RecipeItem; oldCount: number; newCount: number }>;
} {
  const added: RecipeItem[] = [];
  const removed: RecipeItem[] = [];
  const modified: Array<{ item: RecipeItem; oldCount: number; newCount: number }> = [];

  // 旧アイテムをマップに変換（IDをキーとする）
  const oldItemsMap = new Map<number, RecipeItem>();
  oldItems.forEach(item => {
    oldItemsMap.set(item.id, item);
  });

  // 新アイテムをマップに変換（IDをキーとする）
  const newItemsMap = new Map<number, RecipeItem>();
  newItems.forEach(item => {
    newItemsMap.set(item.id, item);
  });

  // 新規追加されたアイテム
  for (const [id, item] of newItemsMap) {
    if (!oldItemsMap.has(id)) {
      added.push(item);
    }
  }

  // 削除されたアイテム
  for (const [id, item] of oldItemsMap) {
    if (!newItemsMap.has(id)) {
      removed.push(item);
    }
  }

  // 変更されたアイテム（数量が変わった）
  for (const [id, newItem] of newItemsMap) {
    const oldItem = oldItemsMap.get(id);
    if (oldItem && oldItem.count !== newItem.count) {
      modified.push({
        item: newItem,
        oldCount: oldItem.count,
        newCount: newItem.count,
      });
    }
  }

  return { added, removed, modified };
}

/**
 * レシピ差分を計算する
 */
export function calculateRecipeDiff(oldData: GameData, newData: GameData): RecipeDiff[] {
  const diffs: RecipeDiff[] = [];

  // 新規レシピ
  const newRecipes = getNewRecipes(oldData, newData);
  for (const recipe of newRecipes) {
    diffs.push({
      recipeSID: recipe.SID,
      recipeName: recipe.name,
      changes: {
        type: "added",
      },
    });
  }

  // 削除されたレシピ
  const removedRecipes = getRemovedRecipes(oldData, newData);
  for (const recipe of removedRecipes) {
    diffs.push({
      recipeSID: recipe.SID,
      recipeName: recipe.name,
      changes: {
        type: "removed",
      },
    });
  }

  // 変更されたレシピ
  for (const [sid, newRecipe] of newData.recipes) {
    const oldRecipe = oldData.recipes.get(sid);
    if (!oldRecipe) continue;

    const itemsDiff = compareRecipeItems(oldRecipe.Items, newRecipe.Items);
    const resultsDiff = compareRecipeItems(oldRecipe.Results, newRecipe.Results);

    const hasItemsDiff =
      itemsDiff.added.length > 0 || itemsDiff.removed.length > 0 || itemsDiff.modified.length > 0;
    const hasResultsDiff =
      resultsDiff.added.length > 0 ||
      resultsDiff.removed.length > 0 ||
      resultsDiff.modified.length > 0;
    const hasTimeDiff = oldRecipe.TimeSpend !== newRecipe.TimeSpend;

    if (hasItemsDiff || hasResultsDiff || hasTimeDiff) {
      diffs.push({
        recipeSID: newRecipe.SID,
        recipeName: newRecipe.name,
        changes: {
          type: "modified",
          itemsDiff: hasItemsDiff ? itemsDiff : undefined,
          resultsDiff: hasResultsDiff ? resultsDiff : undefined,
          timeSpendDiff: hasTimeDiff
            ? {
                old: oldRecipe.TimeSpend,
                new: newRecipe.TimeSpend,
              }
            : undefined,
        },
      });
    }
  }

  return diffs;
}

/**
 * アイテム差分を計算する
 */
export function calculateItemDiff(oldData: GameData, newData: GameData): ItemDiff[] {
  const diffs: ItemDiff[] = [];

  // 新規アイテム
  for (const [id, item] of newData.items) {
    if (!oldData.items.has(id)) {
      diffs.push({
        itemId: id,
        itemName: item.name,
        changes: {
          type: "added",
        },
      });
    }
  }

  // 削除されたアイテム
  for (const [id, item] of oldData.items) {
    if (!newData.items.has(id)) {
      diffs.push({
        itemId: id,
        itemName: item.name,
        changes: {
          type: "removed",
        },
      });
    }
  }

  // 変更されたアイテム
  for (const [id, newItem] of newData.items) {
    const oldItem = oldData.items.get(id);
    if (!oldItem) continue;

    const attributeChanges: ItemDiff["changes"]["attributeChanges"] = {};

    if (oldItem.name !== newItem.name) {
      attributeChanges.name = { old: oldItem.name, new: newItem.name };
    }
    if (oldItem.Type !== newItem.Type) {
      attributeChanges.type = { old: oldItem.Type, new: newItem.Type };
    }
    if (oldItem.miningFrom !== newItem.miningFrom) {
      attributeChanges.miningFrom = { old: oldItem.miningFrom, new: newItem.miningFrom };
    }
    if (oldItem.produceFrom !== newItem.produceFrom) {
      attributeChanges.produceFrom = { old: oldItem.produceFrom, new: newItem.produceFrom };
    }
    if (oldItem.isRaw !== newItem.isRaw) {
      attributeChanges.isRaw = { old: oldItem.isRaw, new: newItem.isRaw };
    }

    if (Object.keys(attributeChanges).length > 0) {
      diffs.push({
        itemId: id,
        itemName: newItem.name,
        changes: {
          type: "modified",
          attributeChanges,
        },
      });
    }
  }

  return diffs;
}

/**
 * 機械差分を計算する
 */
export function calculateMachineDiff(oldData: GameData, newData: GameData): MachineDiff[] {
  const diffs: MachineDiff[] = [];

  // 新規機械
  for (const [id, machine] of newData.machines) {
    if (!oldData.machines.has(id)) {
      diffs.push({
        machineId: id,
        machineName: machine.name,
        changes: {
          type: "added",
        },
      });
    }
  }

  // 削除された機械
  for (const [id, machine] of oldData.machines) {
    if (!newData.machines.has(id)) {
      diffs.push({
        machineId: id,
        machineName: machine.name,
        changes: {
          type: "removed",
        },
      });
    }
  }

  // 変更された機械
  for (const [id, newMachine] of newData.machines) {
    const oldMachine = oldData.machines.get(id);
    if (!oldMachine) continue;

    const attributeChanges: MachineDiff["changes"]["attributeChanges"] = {};

    if (oldMachine.name !== newMachine.name) {
      attributeChanges.name = { old: oldMachine.name, new: newMachine.name };
    }
    if (oldMachine.Type !== newMachine.Type) {
      attributeChanges.type = { old: oldMachine.Type, new: newMachine.Type };
    }
    if (oldMachine.assemblerSpeed !== newMachine.assemblerSpeed) {
      attributeChanges.assemblerSpeed = {
        old: oldMachine.assemblerSpeed,
        new: newMachine.assemblerSpeed,
      };
    }
    if (oldMachine.workEnergyPerTick !== newMachine.workEnergyPerTick) {
      attributeChanges.workEnergyPerTick = {
        old: oldMachine.workEnergyPerTick,
        new: newMachine.workEnergyPerTick,
      };
    }
    if (oldMachine.idleEnergyPerTick !== newMachine.idleEnergyPerTick) {
      attributeChanges.idleEnergyPerTick = {
        old: oldMachine.idleEnergyPerTick,
        new: newMachine.idleEnergyPerTick,
      };
    }
    if (oldMachine.exchangeEnergyPerTick !== newMachine.exchangeEnergyPerTick) {
      attributeChanges.exchangeEnergyPerTick = {
        old: oldMachine.exchangeEnergyPerTick,
        new: newMachine.exchangeEnergyPerTick,
      };
    }
    if (oldMachine.isPowerConsumer !== newMachine.isPowerConsumer) {
      attributeChanges.isPowerConsumer = {
        old: oldMachine.isPowerConsumer,
        new: newMachine.isPowerConsumer,
      };
    }
    if (oldMachine.isPowerExchanger !== newMachine.isPowerExchanger) {
      attributeChanges.isPowerExchanger = {
        old: oldMachine.isPowerExchanger,
        new: newMachine.isPowerExchanger,
      };
    }

    if (Object.keys(attributeChanges).length > 0) {
      diffs.push({
        machineId: id,
        machineName: newMachine.name,
        changes: {
          type: "modified",
          attributeChanges,
        },
      });
    }
  }

  return diffs;
}
