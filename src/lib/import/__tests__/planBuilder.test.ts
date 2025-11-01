import { describe, it, expect } from "vitest";
import { buildPlanFromImport } from "../planBuilder";
import type { GameData, Recipe, RecipeItem } from "../../../types/game-data";
import type { PlanInfoForValidation } from "../../../types/import";
import type { GlobalSettings } from "../../../types/settings";

describe("planBuilder", () => {
  describe("buildPlanFromImport", () => {
    const createMockRecipeItem = (id: number, name: string, count: number = 1): RecipeItem => ({
      id,
      name,
      count,
    });

    const createMockRecipe = (sid: number, name: string): Recipe => ({
      SID: sid,
      id: sid,
      name,
      Type: 1,
      Handcraft: false,
      Explicit: true,
      TimeSpend: 60,
      Items: [createMockRecipeItem(1001, "Iron Ore", 2)],
      Results: [createMockRecipeItem(1101, "Iron Ingot", 1)],
      GridIndex: 0,
      IconPath: "",
      Description: "",
    });

    const createMockGameData = (): GameData => ({
      items: new Map(),
      recipes: new Map([
        [1, createMockRecipe(1, "Iron Ingot")],
        [2, createMockRecipe(2, "Steel")],
      ]),
      machines: new Map(),
    });

    const createMockSettings = (): GlobalSettings => ({
      gameData: createMockGameData(),
      language: "en",
      proliferator: { type: "none", mode: "speed", speedBonus: 1, productionBonus: 1 },
      alternativeRecipes: new Map(),
      beltType: "mk3",
      sorterType: "mk3",
      miningSpeed: 1.0,
      proliferatorForMining: { type: "none", mode: "speed", speedBonus: 1, productionBonus: 1 },
      powerGeneration: {
        template: "auto",
        totalPowerGenerated: 0,
        generators: [],
      },
    });

    it("有効なプラン情報からSavedPlanを構築", () => {
      const planInfo: PlanInfoForValidation = {
        name: "Test Plan",
        timestamp: 1705320896000,
        recipeSID: 1,
        recipeName: "Iron Ingot",
        targetQuantity: 60,
      };
      const gameData = createMockGameData();
      const currentSettings = createMockSettings();

      const result = buildPlanFromImport(planInfo, gameData, currentSettings);

      expect(result).not.toBeNull();
      expect(result!.name).toBe("Test Plan");
      expect(result!.timestamp).toBe(1705320896000);
      expect(result!.recipeSID).toBe(1);
      expect(result!.targetQuantity).toBe(60);
      expect(result!.settings).toBeDefined();
      expect(result!.alternativeRecipes).toEqual({});
      expect(result!.nodeOverrides).toEqual({});
    });

    it("Recipe SIDが欠けている場合はnullを返す", () => {
      const planInfo: PlanInfoForValidation = {
        name: "Test Plan",
        timestamp: Date.now(),
        targetQuantity: 60,
      };
      const gameData = createMockGameData();
      const currentSettings = createMockSettings();

      const result = buildPlanFromImport(planInfo, gameData, currentSettings);

      expect(result).toBeNull();
    });

    it("Recipe SIDがゲームデータに存在しない場合はnullを返す", () => {
      const planInfo: PlanInfoForValidation = {
        name: "Test Plan",
        timestamp: Date.now(),
        recipeSID: 999,
        recipeName: "Unknown Recipe",
        targetQuantity: 60,
      };
      const gameData = createMockGameData();
      const currentSettings = createMockSettings();

      const result = buildPlanFromImport(planInfo, gameData, currentSettings);

      expect(result).toBeNull();
    });

    it("現在の設定がフォールバックとして使用される", () => {
      const planInfo: PlanInfoForValidation = {
        name: "Test Plan",
        timestamp: Date.now(),
        recipeSID: 1,
        targetQuantity: 60,
      };
      const gameData = createMockGameData();
      const currentSettings = createMockSettings();
      currentSettings.beltType = "mk2";
      currentSettings.sorterType = "mk1";

      const result = buildPlanFromImport(planInfo, gameData, currentSettings);

      expect(result).not.toBeNull();
      expect(result!.settings.beltType).toBe("mk2");
      expect(result!.settings.sorterType).toBe("mk1");
    });

    it("descriptionフィールドが適切に設定される", () => {
      const planInfo: PlanInfoForValidation = {
        name: "Imported Plan",
        timestamp: Date.now(),
        recipeSID: 1,
        targetQuantity: 120,
      };
      const gameData = createMockGameData();
      const currentSettings = createMockSettings();

      const result = buildPlanFromImport(planInfo, gameData, currentSettings);

      expect(result).not.toBeNull();
      expect(result!.description).toContain("Imported from Markdown");
      expect(result!.description).toContain("Imported Plan");
    });

    it("alternativeRecipesは空のオブジェクトとして初期化される", () => {
      const planInfo: PlanInfoForValidation = {
        name: "Test Plan",
        timestamp: Date.now(),
        recipeSID: 1,
        targetQuantity: 60,
      };
      const gameData = createMockGameData();
      const currentSettings = createMockSettings();

      const result = buildPlanFromImport(planInfo, gameData, currentSettings);

      expect(result).not.toBeNull();
      expect(result!.alternativeRecipes).toEqual({});
    });

    it("nodeOverridesは空のオブジェクトとして初期化される", () => {
      const planInfo: PlanInfoForValidation = {
        name: "Test Plan",
        timestamp: Date.now(),
        recipeSID: 1,
        targetQuantity: 60,
      };
      const gameData = createMockGameData();
      const currentSettings = createMockSettings();

      const result = buildPlanFromImport(planInfo, gameData, currentSettings);

      expect(result).not.toBeNull();
      expect(result!.nodeOverrides).toEqual({});
    });

    it("最小限の情報でもプランを構築可能", () => {
      const planInfo: PlanInfoForValidation = {
        name: "Minimal",
        timestamp: 0,
        recipeSID: 2,
        targetQuantity: 1,
      };
      const gameData = createMockGameData();
      const currentSettings = createMockSettings();

      const result = buildPlanFromImport(planInfo, gameData, currentSettings);

      expect(result).not.toBeNull();
      expect(result!.name).toBe("Minimal");
      expect(result!.recipeSID).toBe(2);
      expect(result!.targetQuantity).toBe(1);
    });

    it("powerGenerationSettingsは現在の設定から引き継がれる", () => {
      const planInfo: PlanInfoForValidation = {
        name: "Test Plan",
        timestamp: Date.now(),
        recipeSID: 1,
        targetQuantity: 60,
      };
      const gameData = createMockGameData();
      const currentSettings = createMockSettings();
      currentSettings.powerGeneration = {
        template: "manual",
        totalPowerGenerated: 5000,
        generators: [],
      };

      const result = buildPlanFromImport(planInfo, gameData, currentSettings);

      expect(result).not.toBeNull();
      expect(result!.settings.powerGeneration.template).toBe("manual");
      expect(result!.settings.powerGeneration.totalPowerGenerated).toBe(5000);
    });

    it("小数点のtargetQuantityを正しく処理", () => {
      const planInfo: PlanInfoForValidation = {
        name: "Test Plan",
        timestamp: Date.now(),
        recipeSID: 1,
        targetQuantity: 45.7,
      };
      const gameData = createMockGameData();
      const currentSettings = createMockSettings();

      const result = buildPlanFromImport(planInfo, gameData, currentSettings);

      expect(result).not.toBeNull();
      expect(result!.targetQuantity).toBe(45.7);
    });

    it("タイムスタンプが0でも正常に処理", () => {
      const planInfo: PlanInfoForValidation = {
        name: "Test Plan",
        timestamp: 0,
        recipeSID: 1,
        targetQuantity: 60,
      };
      const gameData = createMockGameData();
      const currentSettings = createMockSettings();

      const result = buildPlanFromImport(planInfo, gameData, currentSettings);

      expect(result).not.toBeNull();
      expect(result!.timestamp).toBe(0);
    });

    it("プラン名に特殊文字が含まれていても正常に処理", () => {
      const planInfo: PlanInfoForValidation = {
        name: "Plan #1 (2025)",
        timestamp: Date.now(),
        recipeSID: 1,
        targetQuantity: 60,
      };
      const gameData = createMockGameData();
      const currentSettings = createMockSettings();

      const result = buildPlanFromImport(planInfo, gameData, currentSettings);

      expect(result).not.toBeNull();
      expect(result!.name).toBe("Plan #1 (2025)");
    });
  });
});
