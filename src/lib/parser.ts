import { XMLParser } from "fast-xml-parser";
import type { Item, Recipe, Machine, GameData } from "../types";
import { getDataPath } from "../utils/paths";
import { createLogger } from "../utils/logger";
import {
  CRITICAL_PHOTON_ITEM,
  GRAVITON_LENS_ITEM,
  RAY_RECEIVER_MACHINE,
  CRITICAL_PHOTON_RECIPE,
} from "../constants/photonGeneration";

const logger = createLogger("Parser");
export { logger };
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
});

export async function loadGameData(
  customRecipesXml?: string,
  locale: string = "ja"
): Promise<GameData> {
  // Build file paths based on locale
  const itemsPath = getDataPath(`data/Items/Items_${locale}.xml`);
  const recipesPath = getDataPath(`data/Recipes/Recipes_${locale}.xml`);
  const machinesPath = getDataPath(`data/Machines/Machines_${locale}.xml`);

  const [itemsXml, recipesXml, machinesXml] = await Promise.all([
    fetch(itemsPath)
      .then(r => r.text())
      .catch(() => {
        // Fallback to default if locale-specific file doesn't exist
        logger.warn(`${itemsPath} not found, falling back to default`);
        return fetch(getDataPath("data/Items/Items.xml")).then(r => r.text());
      }),
    customRecipesXml
      ? Promise.resolve(customRecipesXml)
      : fetch(recipesPath)
          .then(r => r.text())
          .catch(() => {
            logger.warn(`${recipesPath} not found, falling back to default`);
            return fetch(getDataPath("data/Recipes/Recipes.xml")).then(r => r.text());
          }),
    fetch(machinesPath)
      .then(r => r.text())
      .catch(() => {
        logger.warn(`${machinesPath} not found, falling back to default`);
        return fetch(getDataPath("data/Machines/Machines.xml")).then(r => r.text());
      }),
  ]);

  return parseGameDataFromXml(itemsXml, recipesXml, machinesXml, locale, true);
}

/**
 * 指定されたバージョンのゲームデータを読み込む
 * @param version - バージョン番号（例: "0.10.33.27024"）
 * @param locale - ロケール（デフォルト: "ja"）
 * @returns ゲームデータ
 */
export async function loadGameDataVersion(
  version: string,
  locale: string = "ja"
): Promise<GameData> {
  // バージョン固有のファイルパス
  const versionPath = `data/versions/${version}`;
  const itemsPath = getDataPath(`${versionPath}/Items.xml`);
  const recipesPath = getDataPath(`${versionPath}/Recipes.xml`);
  const machinesPath = getDataPath(`${versionPath}/Machines.xml`);

  const [itemsXml, recipesXml, machinesXml] = await Promise.all([
    fetch(itemsPath)
      .then(r => {
        if (!r.ok) {
          throw new Error(`Failed to load Items.xml for version ${version}: ${r.status}`);
        }
        return r.text();
      })
      .catch(error => {
        logger.warn(`Failed to load Items.xml for version ${version}: ${error}`);
        throw error;
      }),
    fetch(recipesPath)
      .then(r => {
        if (!r.ok) {
          throw new Error(`Failed to load Recipes.xml for version ${version}: ${r.status}`);
        }
        return r.text();
      })
      .catch(error => {
        logger.warn(`Failed to load Recipes.xml for version ${version}: ${error}`);
        throw error;
      }),
    fetch(machinesPath)
      .then(r => {
        if (!r.ok) {
          throw new Error(`Failed to load Machines.xml for version ${version}: ${r.status}`);
        }
        return r.text();
      })
      .catch(error => {
        logger.warn(`Failed to load Machines.xml for version ${version}: ${error}`);
        throw error;
      }),
  ]);

  return parseGameDataFromXml(itemsXml, recipesXml, machinesXml, locale, false);
}

/**
 * XML文字列からGameDataをパースする共通関数
 * @param alwaysAddCriticalPhoton - 臨界光子を常に追加するか（既存データは上書き）
 */
function parseGameDataFromXml(
  itemsXml: string,
  recipesXml: string,
  machinesXml: string,
  locale: string,
  alwaysAddCriticalPhoton: boolean = false
): GameData {
  const itemsData = parser.parse(itemsXml);
  const recipesData = parser.parse(recipesXml);
  const machinesData = parser.parse(machinesXml);

  // Parse items
  const items = new Map<number, Item>();
  const itemArray = Array.isArray(itemsData.ArrayOfItem.Item)
    ? itemsData.ArrayOfItem.Item
    : [itemsData.ArrayOfItem.Item];

  itemArray.forEach(
    (item: {
      id: number;
      name: string;
      count?: number;
      Type: string;
      miningFrom?: string;
      produceFrom?: string;
      isRaw?: boolean | string;
    }) => {
      items.set(Number(item.id), {
        id: Number(item.id),
        name: item.name,
        count: item.count ? Number(item.count) : 0,
        Type: item.Type as "Smelt" | "Assemble" | "Chemical" | "Research" | "Refine" | "Particle",
        miningFrom: item.miningFrom,
        produceFrom: item.produceFrom,
        isRaw: item.isRaw === "true" || item.isRaw === true,
      });
    }
  );

  // Parse recipes
  const recipes = new Map<number, Recipe>();
  const recipesByItemId = new Map<number, Recipe[]>();
  const recipeArray = Array.isArray(recipesData.ArrayOfRecipe.Recipe)
    ? recipesData.ArrayOfRecipe.Recipe
    : [recipesData.ArrayOfRecipe.Recipe];

  recipeArray.forEach(
    (recipe: {
      SID: number;
      name: string;
      Type: string;
      Explicit?: boolean | string;
      TimeSpend: number;
      Items?: { Item: unknown };
      Results?: { Item: unknown };
      GridIndex: string;
      productive?: boolean | string;
    }) => {
      const recipeObj: Recipe = {
        SID: Number(recipe.SID),
        name: recipe.name,
        Type: recipe.Type as "Smelt" | "Assemble" | "Chemical" | "Research" | "Refine" | "Particle",
        Explicit: recipe.Explicit === "true" || recipe.Explicit === true,
        TimeSpend: Number(recipe.TimeSpend),
        Items: parseRecipeItems(recipe.Items?.Item, items),
        Results: parseRecipeItems(recipe.Results?.Item, items),
        GridIndex: String(recipe.GridIndex),
        productive: recipe.productive === "true" || recipe.productive === true,
      };

      recipes.set(recipeObj.SID, recipeObj);

      // Index by output item ID
      recipeObj.Results.forEach(result => {
        const existing = recipesByItemId.get(result.id) || [];
        existing.push(recipeObj);
        recipesByItemId.set(result.id, existing);
      });
    }
  );

  // Parse machines
  const machines = new Map<number, Machine>();
  const machineArray = Array.isArray(machinesData.ArrayOfMachine.Machine)
    ? machinesData.ArrayOfMachine.Machine
    : [machinesData.ArrayOfMachine.Machine];

  machineArray.forEach(
    (machine: {
      id: number;
      name: string;
      count?: number;
      Type: string;
      miningFrom?: string;
      produceFrom?: string;
      isRaw?: boolean | string;
      assemblerSpeed: number;
      workEnergyPerTick: number;
      idleEnergyPerTick: number;
      exchangeEnergyPerTick: number;
      isPowerConsumer?: boolean | string;
      isPowerExchanger?: boolean | string;
    }) => {
      // Special handling for Matrix Lab and Self-evolution Lab
      let assemblerSpeed = Number(machine.assemblerSpeed);
      if (machine.id === 2901) {
        // Matrix Lab: 1.0x speed (10000)
        assemblerSpeed = 10000;
      } else if (machine.id === 2902) {
        // Self-evolution Lab: 3.0x speed (30000)
        assemblerSpeed = 30000;
      }

      machines.set(Number(machine.id), {
        id: Number(machine.id),
        name: machine.name,
        count: machine.count ? Number(machine.count) : 0,
        Type: machine.Type as
          "Smelt" | "Assemble" | "Chemical" | "Research" | "Refine" | "Particle",
        miningFrom: machine.miningFrom,
        produceFrom: machine.produceFrom,
        isRaw: machine.isRaw === "true" || machine.isRaw === true,
        assemblerSpeed: assemblerSpeed,
        workEnergyPerTick: Number(machine.workEnergyPerTick),
        idleEnergyPerTick: Number(machine.idleEnergyPerTick),
        exchangeEnergyPerTick: Number(machine.exchangeEnergyPerTick),
        isPowerConsumer: machine.isPowerConsumer === "true" || machine.isPowerConsumer === true,
        isPowerExchanger: machine.isPowerExchanger === "true" || machine.isPowerExchanger === true,
      });
    }
  );

  // 臨界光子関連のデータを追加
  const criticalPhotonName = locale === "ja" ? "臨界光子" : "Critical Photon";
  const gravitonLensName = locale === "ja" ? "重力子レンズ" : "Graviton Lens";
  const rayReceiverName = locale === "ja" ? "γ線レシーバー" : "Ray Receiver";

  if (alwaysAddCriticalPhoton || !items.has(CRITICAL_PHOTON_ITEM.id)) {
    items.set(CRITICAL_PHOTON_ITEM.id, {
      ...CRITICAL_PHOTON_ITEM,
      name: criticalPhotonName,
    });
  }
  if (alwaysAddCriticalPhoton || !items.has(GRAVITON_LENS_ITEM.id)) {
    items.set(GRAVITON_LENS_ITEM.id, {
      ...GRAVITON_LENS_ITEM,
      name: gravitonLensName,
    });
  }
  if (alwaysAddCriticalPhoton || !machines.has(RAY_RECEIVER_MACHINE.id)) {
    machines.set(RAY_RECEIVER_MACHINE.id, {
      ...RAY_RECEIVER_MACHINE,
      name: rayReceiverName,
    });
  }

  const photonRecipe: Recipe = {
    ...CRITICAL_PHOTON_RECIPE,
    name:
      locale === "ja" ? `臨界光子 (${rayReceiverName})` : `Critical Photon (${rayReceiverName})`,
    Results: [
      {
        id: 1208,
        name: criticalPhotonName,
        count: 1,
        Type: "Material",
        isRaw: false,
      },
    ],
  };
  if (alwaysAddCriticalPhoton || !recipes.has(CRITICAL_PHOTON_RECIPE.SID)) {
    recipes.set(CRITICAL_PHOTON_RECIPE.SID, photonRecipe);

    // 臨界光子レシピを recipesByItemId に登録
    const criticalPhotonRecipes = recipesByItemId.get(CRITICAL_PHOTON_ITEM.id) || [];
    const existingRecipe = criticalPhotonRecipes.find(r => r.SID === CRITICAL_PHOTON_RECIPE.SID);
    if (!existingRecipe) {
      criticalPhotonRecipes.push(photonRecipe);
      recipesByItemId.set(CRITICAL_PHOTON_ITEM.id, criticalPhotonRecipes);
    }
  }

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

function parseRecipeItems(
  itemData: unknown,
  itemsMap: Map<number, Item>
): Array<{ id: number; name: string; count: number; Type: string; isRaw: boolean }> {
  if (!itemData) return [];
  return Array.isArray(itemData)
    ? itemData.map(item => parseItem(item, itemsMap))
    : [
        parseItem(
          itemData as {
            id: number;
            name: string;
            count: number;
            Type: string;
            isRaw?: boolean | string;
          },
          itemsMap
        ),
      ];
}

function parseItem(
  item: { id: number; name: string; count: number; Type: string; isRaw?: boolean | string },
  itemsMap: Map<number, Item>
) {
  const itemId = Number(item.id);
  // アイテムマスタから正しい名前を取得（レシピ内の名前は古い可能性がある）
  const masterItem = itemsMap.get(itemId);
  const correctName = masterItem?.name || item.name;

  return {
    id: itemId,
    name: correctName,
    count: Number(item.count),
    Type: item.Type,
    isRaw: item.isRaw === "true" || item.isRaw === true,
  };
}
