import { describe, it, expect } from "vitest";
import { buildPlanFromImport } from "../planBuilder";
import type { GameData } from "../../../types/game-data";
import type { PlanInfoForValidation } from "../../../types/import";
import type { GlobalSettings } from "../../../types/settings";
import {
  createMockGameData,
  createSingleOutputRecipe,
  createMockSettings,
} from "../../../test/factories/testDataFactory";

describe("planBuilder", () => {
  describe("buildPlanFromImport", () => {
    const createTestGameData = (): GameData => {
      const gameData = createMockGameData();
      gameData.recipes.set(
        1,
        createSingleOutputRecipe({
          SID: 1,
          name: "Iron Ingot",
          type: "Smelt",
          inputId: 1001,
          inputName: "Iron Ore",
          inputCount: 2,
          outputId: 1101,
          outputName: "Iron Ingot",
          outputCount: 1,
        })
      );
      gameData.recipes.set(
        2,
        createSingleOutputRecipe({
          SID: 2,
          name: "Steel",
          type: "Smelt",
          inputId: 1101,
          inputName: "Iron Ingot",
          inputCount: 1,
          outputId: 1102,
          outputName: "Steel",
          outputCount: 1,
        })
      );
      return gameData;
    };

    it("有効なプラン情報からSavedPlanを構築", () => {
      const planInfo: PlanInfoForValidation = {
        name: "Test Plan",
        timestamp: 1705320896000,
        recipeSID: 1,
        recipeName: "Iron Ingot",
        targetQuantity: 60,
      };
      const gameData = createTestGameData();
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
      const gameData = createTestGameData();
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
      const gameData = createTestGameData();
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
      const gameData = createTestGameData();
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
      const gameData = createTestGameData();
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
      const gameData = createTestGameData();
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
      const gameData = createTestGameData();
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
      const gameData = createTestGameData();
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
      const gameData = createTestGameData();
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
      const gameData = createTestGameData();
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
      const gameData = createTestGameData();
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
      const gameData = createTestGameData();
      const currentSettings = createMockSettings();

      const result = buildPlanFromImport(planInfo, gameData, currentSettings);

      expect(result).not.toBeNull();
      expect(result!.name).toBe("Plan #1 (2025)");
    });
  });
});
