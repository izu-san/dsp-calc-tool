import { describe, it, expect } from "vitest";
import { validatePlanInfo } from "../validation";
import type { GameData, Recipe, RecipeItem } from "../../../types/game-data";
import type { PlanInfoForValidation } from "../../../types/import";

describe("validation", () => {
  describe("validatePlanInfo", () => {
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

    it("有効なプラン情報の検証成功", () => {
      const planInfo: PlanInfoForValidation = {
        name: "Test Plan",
        timestamp: Date.now(),
        recipeSID: 1,
        recipeName: "Iron Ingot",
        targetQuantity: 60,
      };
      const gameData = createMockGameData();

      const result = validatePlanInfo(planInfo, gameData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("Recipe SIDが欠けている場合のエラー", () => {
      const planInfo: PlanInfoForValidation = {
        name: "Test Plan",
        timestamp: Date.now(),
        targetQuantity: 60,
      };
      const gameData = createMockGameData();

      const result = validatePlanInfo(planInfo, gameData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe("missing_data");
      expect(result.errors[0].message).toContain("Recipe SID is missing");
    });

    it("Recipe SIDがゲームデータに存在しない場合のエラー", () => {
      const planInfo: PlanInfoForValidation = {
        name: "Test Plan",
        timestamp: Date.now(),
        recipeSID: 999,
        recipeName: "Unknown Recipe",
        targetQuantity: 60,
      };
      const gameData = createMockGameData();

      const result = validatePlanInfo(planInfo, gameData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe("validation");
      expect(result.errors[0].message).toContain("Recipe with SID 999 not found");
    });

    it("Recipe名が一致しない場合の警告", () => {
      const planInfo: PlanInfoForValidation = {
        name: "Test Plan",
        timestamp: Date.now(),
        recipeSID: 1,
        recipeName: "Wrong Name",
        targetQuantity: 60,
      };
      const gameData = createMockGameData();

      const result = validatePlanInfo(planInfo, gameData);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].type).toBe("partial_data");
      expect(result.warnings[0].message).toContain("Recipe name mismatch");
      expect(result.warnings[0].message).toContain("Wrong Name");
      expect(result.warnings[0].message).toContain("Iron Ingot");
    });

    it("Target Quantityが0以下の場合の警告とデフォルト値", () => {
      const planInfo: PlanInfoForValidation = {
        name: "Test Plan",
        timestamp: Date.now(),
        recipeSID: 1,
        recipeName: "Iron Ingot",
        targetQuantity: 0,
      };
      const gameData = createMockGameData();

      const result = validatePlanInfo(planInfo, gameData);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].type).toBe("partial_data");
      expect(result.warnings[0].message).toContain("Target quantity is invalid");
      expect(planInfo.targetQuantity).toBe(1); // Updated to default
    });

    it("Target Quantityが負の場合の警告とデフォルト値", () => {
      const planInfo: PlanInfoForValidation = {
        name: "Test Plan",
        timestamp: Date.now(),
        recipeSID: 1,
        recipeName: "Iron Ingot",
        targetQuantity: -10,
      };
      const gameData = createMockGameData();

      const result = validatePlanInfo(planInfo, gameData);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(planInfo.targetQuantity).toBe(1);
    });

    it("Target Quantityがundefinedの場合の警告とデフォルト値", () => {
      const planInfo: PlanInfoForValidation = {
        name: "Test Plan",
        timestamp: Date.now(),
        recipeSID: 1,
        recipeName: "Iron Ingot",
        targetQuantity: undefined as any,
      };
      const gameData = createMockGameData();

      const result = validatePlanInfo(planInfo, gameData);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(planInfo.targetQuantity).toBe(1);
    });

    it("Recipe名が指定されていない場合でもSIDが正しければ成功", () => {
      const planInfo: PlanInfoForValidation = {
        name: "Test Plan",
        timestamp: Date.now(),
        recipeSID: 1,
        targetQuantity: 60,
      };
      const gameData = createMockGameData();

      const result = validatePlanInfo(planInfo, gameData);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it("複数のエラーが同時に発生する場合", () => {
      const planInfo: PlanInfoForValidation = {
        name: "Test Plan",
        timestamp: Date.now(),
        recipeSID: 999, // Doesn't exist
        recipeName: "Unknown",
        targetQuantity: -5, // Invalid
      };
      const gameData = createMockGameData();

      const result = validatePlanInfo(planInfo, gameData);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it("正しいRecipe SIDと一致するRecipe名", () => {
      const planInfo: PlanInfoForValidation = {
        name: "Test Plan",
        timestamp: Date.now(),
        recipeSID: 1,
        recipeName: "Iron Ingot",
        targetQuantity: 120,
      };
      const gameData = createMockGameData();

      const result = validatePlanInfo(planInfo, gameData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it("小数点のTarget Quantityは有効", () => {
      const planInfo: PlanInfoForValidation = {
        name: "Test Plan",
        timestamp: Date.now(),
        recipeSID: 1,
        recipeName: "Iron Ingot",
        targetQuantity: 45.5,
      };
      const gameData = createMockGameData();

      const result = validatePlanInfo(planInfo, gameData);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it("非常に大きなTarget Quantityも有効", () => {
      const planInfo: PlanInfoForValidation = {
        name: "Test Plan",
        timestamp: Date.now(),
        recipeSID: 1,
        recipeName: "Iron Ingot",
        targetQuantity: 1e6,
      };
      const gameData = createMockGameData();

      const result = validatePlanInfo(planInfo, gameData);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });
  });
});
