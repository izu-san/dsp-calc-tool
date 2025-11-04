/**
 * Validation functions for imported data
 *
 * インポートされたデータの検証を行う
 */

import type { GameData } from "../../types/game-data";
import type {
  PlanInfoForValidation,
  ValidationResult,
  ImportError,
  ImportWarning,
} from "../../types/import";

/**
 * インポートされたプラン情報を検証する
 * @param planInfo 検証するプラン情報
 * @param gameData ゲームデータ
 * @returns 検証結果
 */
export function validatePlanInfo(
  planInfo: PlanInfoForValidation,
  gameData: GameData
): ValidationResult {
  const errors: ImportError[] = [];
  const warnings: ImportWarning[] = [];

  if (!planInfo.recipeSID) {
    errors.push({ type: "missing_data", message: "Recipe SID is missing." });
  } else {
    const recipe = gameData.recipes.get(planInfo.recipeSID);
    if (!recipe) {
      errors.push({
        type: "validation",
        message: `Recipe with SID ${planInfo.recipeSID} not found in game data.`,
      });
    } else if (planInfo.recipeName && recipe.name !== planInfo.recipeName) {
      warnings.push({
        type: "partial_data",
        message: `Recipe name mismatch for SID ${planInfo.recipeSID}. Imported: "${planInfo.recipeName}", Actual: "${recipe.name}". Using actual name.`,
      });
    }
  }

  if (planInfo.targetQuantity === undefined || planInfo.targetQuantity <= 0) {
    warnings.push({
      type: "partial_data",
      message: "Target quantity is invalid or missing, defaulting to 1.",
    });
    planInfo.targetQuantity = 1; // デフォルト値を設定
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
