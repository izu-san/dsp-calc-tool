import { XMLParser } from 'fast-xml-parser';
import type { Item, Recipe, Machine, GameData } from '../types';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
});

export async function loadGameData(customRecipesXml?: string, locale: string = 'ja'): Promise<GameData> {
  // Build file paths based on locale
  const itemsPath = `/data/Items/Items_${locale}.xml`;
  const recipesPath = `/data/Recipes/Recipes_${locale}.xml`;
  const machinesPath = `/data/Machines/Machines_${locale}.xml`;
  
  const [itemsXml, recipesXml, machinesXml] = await Promise.all([
    fetch(itemsPath).then(r => r.text()).catch(() => {
      // Fallback to default if locale-specific file doesn't exist
      console.warn(`${itemsPath} not found, falling back to default`);
      return fetch('/data/Items/Items.xml').then(r => r.text());
    }),
    customRecipesXml ? Promise.resolve(customRecipesXml) : 
      fetch(recipesPath).then(r => r.text()).catch(() => {
        console.warn(`${recipesPath} not found, falling back to default`);
        return fetch('/data/Recipes/Recipes.xml').then(r => r.text());
      }),
    fetch(machinesPath).then(r => r.text()).catch(() => {
      console.warn(`${machinesPath} not found, falling back to default`);
      return fetch('/data/Machines/Machines.xml').then(r => r.text());
    }),
  ]);

  const itemsData = parser.parse(itemsXml);
  const recipesData = parser.parse(recipesXml);
  const machinesData = parser.parse(machinesXml);

  // Parse items
  const items = new Map<number, Item>();
  const itemArray = Array.isArray(itemsData.ArrayOfItem.Item)
    ? itemsData.ArrayOfItem.Item
    : [itemsData.ArrayOfItem.Item];
  
  itemArray.forEach((item: any) => {
    items.set(Number(item.id), {
      id: Number(item.id),
      name: item.name,
      count: item.count ? Number(item.count) : 0,
      Type: item.Type,
      miningFrom: item.miningFrom,
      produceFrom: item.produceFrom,
      isRaw: item.isRaw === 'true' || item.isRaw === true,
    });
  });

  // Parse recipes
  const recipes = new Map<number, Recipe>();
  const recipesByItemId = new Map<number, Recipe[]>();
  const recipeArray = Array.isArray(recipesData.ArrayOfRecipe.Recipe)
    ? recipesData.ArrayOfRecipe.Recipe
    : [recipesData.ArrayOfRecipe.Recipe];

  recipeArray.forEach((recipe: any) => {
    const recipeObj: Recipe = {
      SID: Number(recipe.SID),
      name: recipe.name,
      Type: recipe.Type,
      Explicit: recipe.Explicit === 'true' || recipe.Explicit === true,
      TimeSpend: Number(recipe.TimeSpend),
      Items: parseRecipeItems(recipe.Items?.Item),
      Results: parseRecipeItems(recipe.Results?.Item),
      GridIndex: String(recipe.GridIndex),
      productive: recipe.productive === 'true' || recipe.productive === true,
    };

    recipes.set(recipeObj.SID, recipeObj);

    // Index by output item ID
    recipeObj.Results.forEach(result => {
      const existing = recipesByItemId.get(result.id) || [];
      existing.push(recipeObj);
      recipesByItemId.set(result.id, existing);
    });
  });

  // Parse machines
  const machines = new Map<number, Machine>();
  const machineArray = Array.isArray(machinesData.ArrayOfMachine.Machine)
    ? machinesData.ArrayOfMachine.Machine
    : [machinesData.ArrayOfMachine.Machine];

  machineArray.forEach((machine: any) => {
    machines.set(Number(machine.id), {
      id: Number(machine.id),
      name: machine.name,
      count: machine.count ? Number(machine.count) : 0,
      Type: machine.Type,
      miningFrom: machine.miningFrom,
      produceFrom: machine.produceFrom,
      isRaw: machine.isRaw === 'true' || machine.isRaw === true,
      assemblerSpeed: Number(machine.assemblerSpeed),
      workEnergyPerTick: Number(machine.workEnergyPerTick),
      idleEnergyPerTick: Number(machine.idleEnergyPerTick),
      exchangeEnergyPerTick: Number(machine.exchangeEnergyPerTick),
      isPowerConsumer: machine.isPowerConsumer === 'true' || machine.isPowerConsumer === true,
      isPowerExchanger: machine.isPowerExchanger === 'true' || machine.isPowerExchanger === true,
    });
  });

  // Create combined map for recipe lookups (items + machines)
  const allItems = new Map<number, Item | Machine>();
  items.forEach((item, id) => allItems.set(id, item));
  machines.forEach((machine, id) => allItems.set(id, machine));

  return {
    items,
    recipes,
    machines,
    recipesByItemId,
    allItems,
  };
}

function parseRecipeItems(itemData: any): any[] {
  if (!itemData) return [];
  return Array.isArray(itemData) ? itemData.map(parseItem) : [parseItem(itemData)];
}

function parseItem(item: any) {
  return {
    id: Number(item.id),
    name: item.name,
    count: Number(item.count),
    Type: item.Type,
    isRaw: item.isRaw === 'true' || item.isRaw === true,
  };
}
