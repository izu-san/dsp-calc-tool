import { describe, it, expect } from "vitest";
import {
  calculateRecipeDiff,
  calculateItemDiff,
  calculateMachineDiff,
  getNewRecipes,
  getRemovedRecipes,
} from "../patchDiff";
import {
  createMockGameData,
  createMockItem,
  createMockMachine,
  createMockRecipe,
} from "../../test/factories/testDataFactory";
import type { GameData } from "../../types/game-data";

describe("patchDiff", () => {
  describe("calculateRecipeDiff", () => {
    it("should detect added recipes", () => {
      const oldData = createMockGameData();
      const newData = createMockGameData();

      const newRecipe = createMockRecipe(3, "New Recipe");
      newRecipe.Items = [{ id: 1, name: "Item 1", count: 1, Type: "Item", isRaw: false }];
      newRecipe.Results = [{ id: 5, name: "Item 5", count: 1, Type: "Item", isRaw: false }];
      newData.recipes.set(3, newRecipe);

      const diffs = calculateRecipeDiff(oldData, newData);

      const addedDiff = diffs.find(d => d.changes.type === "added");
      expect(addedDiff).toBeDefined();
      expect(addedDiff?.recipeSID).toBe(3);
      expect(addedDiff?.recipeName).toBe("New Recipe");
    });

    it("should detect removed recipes", () => {
      const oldData = createMockGameData();
      const newData = createMockGameData();

      oldData.recipes.set(3, createMockRecipe(3, "Removed Recipe"));
      newData.recipes.delete(2);

      const diffs = calculateRecipeDiff(oldData, newData);

      const removedDiff = diffs.find(d => d.changes.type === "removed" && d.recipeSID === 2);
      expect(removedDiff).toBeDefined();
      expect(removedDiff?.recipeName).toBe("Smelt Copper Ingot");
    });

    it("should detect modified recipes with items diff", () => {
      const oldData = createMockGameData();
      const newData = createMockGameData();

      const recipe = newData.recipes.get(1)!;
      recipe.TimeSpend = 2;
      recipe.Items[0].count = 2;

      const diffs = calculateRecipeDiff(oldData, newData);

      const modifiedDiff = diffs.find(d => d.changes.type === "modified" && d.recipeSID === 1);
      expect(modifiedDiff).toBeDefined();
      expect(modifiedDiff?.changes.timeSpendDiff).toBeDefined();
      expect(modifiedDiff?.changes.timeSpendDiff?.old).toBe(1);
      expect(modifiedDiff?.changes.timeSpendDiff?.new).toBe(2);
      expect(modifiedDiff?.changes.itemsDiff).toBeDefined();
      expect(modifiedDiff?.changes.itemsDiff?.modified.length).toBeGreaterThan(0);
    });

    it("should detect modified recipes with added items", () => {
      const oldData = createMockGameData();
      const newData = createMockGameData();

      const recipe = newData.recipes.get(1)!;
      recipe.Items.push({ id: 100, name: "New Item", count: 1, Type: "Item", isRaw: false });

      const diffs = calculateRecipeDiff(oldData, newData);

      const modifiedDiff = diffs.find(d => d.changes.type === "modified" && d.recipeSID === 1);
      expect(modifiedDiff).toBeDefined();
      expect(modifiedDiff?.changes.itemsDiff?.added.length).toBeGreaterThan(0);
    });

    it("should detect modified recipes with removed items", () => {
      const oldData = createMockGameData();
      const newData = createMockGameData();

      const recipe = newData.recipes.get(1)!;
      recipe.Items = [];

      const diffs = calculateRecipeDiff(oldData, newData);

      const modifiedDiff = diffs.find(d => d.changes.type === "modified" && d.recipeSID === 1);
      expect(modifiedDiff).toBeDefined();
      expect(modifiedDiff?.changes.itemsDiff?.removed.length).toBeGreaterThan(0);
    });

    it("should detect no changes when recipes are identical", () => {
      const oldData = createMockGameData();
      const newData = createMockGameData();

      const diffs = calculateRecipeDiff(oldData, newData);

      const modifiedDiffs = diffs.filter(d => d.changes.type === "modified");
      expect(modifiedDiffs).toHaveLength(0);
    });
  });

  describe("calculateItemDiff", () => {
    it("should detect added items", () => {
      const oldData = createMockGameData();
      const newData = createMockGameData();

      const newItem = createMockItem(100, "New Item");
      newData.items.set(100, newItem);

      const diffs = calculateItemDiff(oldData, newData);

      const addedDiff = diffs.find(d => d.changes.type === "added" && d.itemId === 100);
      expect(addedDiff).toBeDefined();
      expect(addedDiff?.itemName).toBe("New Item");
    });

    it("should detect removed items", () => {
      const oldData = createMockGameData();
      const newData = createMockGameData();

      newData.items.delete(2);

      const diffs = calculateItemDiff(oldData, newData);

      const removedDiff = diffs.find(d => d.changes.type === "removed" && d.itemId === 2);
      expect(removedDiff).toBeDefined();
      expect(removedDiff?.itemName).toBe("Iron Ingot");
    });

    it("should detect modified items", () => {
      const oldData = createMockGameData();
      const newData = createMockGameData();

      const item = newData.items.get(1)!;
      item.name = "Updated Iron Ore";
      item.Type = "Updated";
      item.isRaw = false;

      const diffs = calculateItemDiff(oldData, newData);

      const modifiedDiff = diffs.find(d => d.changes.type === "modified" && d.itemId === 1);
      expect(modifiedDiff).toBeDefined();
      expect(modifiedDiff?.changes.attributeChanges?.name).toBeDefined();
      expect(modifiedDiff?.changes.attributeChanges?.name?.old).toBe("Iron Ore");
      expect(modifiedDiff?.changes.attributeChanges?.name?.new).toBe("Updated Iron Ore");
      expect(modifiedDiff?.changes.attributeChanges?.type).toBeDefined();
      expect(modifiedDiff?.changes.attributeChanges?.isRaw).toBeDefined();
    });

    it("should detect no changes when items are identical", () => {
      const oldData = createMockGameData();
      const newData = createMockGameData();

      const diffs = calculateItemDiff(oldData, newData);

      const modifiedDiffs = diffs.filter(d => d.changes.type === "modified");
      expect(modifiedDiffs).toHaveLength(0);
    });
  });

  describe("calculateMachineDiff", () => {
    it("should detect added machines", () => {
      const oldData = createMockGameData();
      const newData = createMockGameData();

      const newMachine = createMockMachine("2001", "New Machine");
      newData.machines.set(2001, newMachine);

      const diffs = calculateMachineDiff(oldData, newData);

      const addedDiff = diffs.find(d => d.changes.type === "added" && d.machineId === 2001);
      expect(addedDiff).toBeDefined();
      expect(addedDiff?.machineName).toBe("New Machine");
    });

    it("should detect removed machines", () => {
      const oldData = createMockGameData();
      const newData = createMockGameData();

      newData.machines.delete(2302);

      const diffs = calculateMachineDiff(oldData, newData);

      const removedDiff = diffs.find(d => d.changes.type === "removed" && d.machineId === 2302);
      expect(removedDiff).toBeDefined();
      expect(removedDiff?.machineName).toBe("Arc Smelter");
    });

    it("should detect modified machines", () => {
      const oldData = createMockGameData();
      const newData = createMockGameData();

      const machine = newData.machines.get(2302)!;
      machine.name = "Updated Arc Smelter";
      machine.assemblerSpeed = 20000;
      machine.workEnergyPerTick = 200;

      const diffs = calculateMachineDiff(oldData, newData);

      const modifiedDiff = diffs.find(d => d.changes.type === "modified" && d.machineId === 2302);
      expect(modifiedDiff).toBeDefined();
      expect(modifiedDiff?.changes.attributeChanges?.name).toBeDefined();
      expect(modifiedDiff?.changes.attributeChanges?.name?.old).toBe("Arc Smelter");
      expect(modifiedDiff?.changes.attributeChanges?.name?.new).toBe("Updated Arc Smelter");
      expect(modifiedDiff?.changes.attributeChanges?.assemblerSpeed).toBeDefined();
      expect(modifiedDiff?.changes.attributeChanges?.assemblerSpeed?.old).toBe(10000);
      expect(modifiedDiff?.changes.attributeChanges?.assemblerSpeed?.new).toBe(20000);
      expect(modifiedDiff?.changes.attributeChanges?.workEnergyPerTick).toBeDefined();
    });

    it("should detect no changes when machines are identical", () => {
      const oldData = createMockGameData();
      const newData = createMockGameData();

      const diffs = calculateMachineDiff(oldData, newData);

      const modifiedDiffs = diffs.filter(d => d.changes.type === "modified");
      expect(modifiedDiffs).toHaveLength(0);
    });
  });

  describe("getNewRecipes", () => {
    it("should return new recipes", () => {
      const oldData = createMockGameData();
      const newData = createMockGameData();

      const newRecipe = createMockRecipe(3, "New Recipe");
      newData.recipes.set(3, newRecipe);

      const newRecipes = getNewRecipes(oldData, newData);

      expect(newRecipes).toHaveLength(1);
      expect(newRecipes[0].SID).toBe(3);
      expect(newRecipes[0].name).toBe("New Recipe");
    });

    it("should return empty array when no new recipes", () => {
      const oldData = createMockGameData();
      const newData = createMockGameData();

      const newRecipes = getNewRecipes(oldData, newData);

      expect(newRecipes).toHaveLength(0);
    });
  });

  describe("getRemovedRecipes", () => {
    it("should return removed recipes", () => {
      const oldData = createMockGameData();
      const newData = createMockGameData();

      // oldDataにrecipe 2を追加（newDataにはない）
      const removedRecipe = createMockRecipe(2, "Smelt Copper Ingot");
      oldData.recipes.set(2, removedRecipe);
      // newDataからrecipe 2を削除
      newData.recipes.delete(2);

      const removedRecipes = getRemovedRecipes(oldData, newData);

      expect(removedRecipes).toHaveLength(1);
      expect(removedRecipes[0].SID).toBe(2);
      expect(removedRecipes[0].name).toBe("Smelt Copper Ingot");
    });

    it("should return empty array when no removed recipes", () => {
      const oldData = createMockGameData();
      const newData = createMockGameData();

      const removedRecipes = getRemovedRecipes(oldData, newData);

      expect(removedRecipes).toHaveLength(0);
    });
  });
});
