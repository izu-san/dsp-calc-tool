/**
 * Plan builder for import functionality
 *
 * インポート結果から SavedPlan を構築する
 */

import type { SavedPlan } from "../../types/saved-plan";
import type { PlanInfoForValidation } from "../../types/import";
import type { GameData } from "../../types/game-data";
import type { GlobalSettings } from "../../types/settings";

/**
 * インポートされたプラン情報からSavedPlanオブジェクトを構築する
 * @param planInfo 検証済みのプラン情報
 * @param gameData ゲームデータ
 * @param currentSettings 現在のグローバル設定（不足している設定のフォールバックとして使用）
 * @returns 構築されたSavedPlanオブジェクト、または構築できなかった場合はnull
 */
export function buildPlanFromImport(
  planInfo: PlanInfoForValidation,
  gameData: GameData,
  currentSettings: GlobalSettings
): SavedPlan | null {
  if (!planInfo.recipeSID) {
    return null;
  }

  const recipe = gameData.recipes.get(planInfo.recipeSID);
  if (!recipe) {
    return null;
  }

  // 不足している設定は現在の設定で補完
  const effectiveSettings: GlobalSettings = {
    ...currentSettings,
  };

  // SavedPlanオブジェクトを構築
  const savedPlan: SavedPlan = {
    name: planInfo.name,
    timestamp: planInfo.timestamp,
    recipeSID: planInfo.recipeSID,
    targetQuantity: planInfo.targetQuantity,
    settings: effectiveSettings,
    alternativeRecipes: {},
    nodeOverrides: {},
    description: `Imported from Markdown: ${planInfo.name}`,
  };

  return savedPlan;
}
