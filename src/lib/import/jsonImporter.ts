import type { ExportData } from '../../types/export';
import type { SavedPlan, GlobalSettings } from '../../types';
import type { GameData } from '../../types/game-data';
import { validatePlanInfo } from './validation';
import { buildPlanFromImport } from './planBuilder';

/**
 * JSONファイルからExportDataを読み込む
 * @param jsonContent JSON文字列
 * @returns ExportDataオブジェクト
 */
export function parseExportDataFromJSON(jsonContent: string): ExportData {
  try {
    const data = JSON.parse(jsonContent);
    
    // ExportDataの基本的な構造をチェック
    if (!data.version || !data.planInfo || !data.settings) {
      throw new Error('Invalid ExportData format');
    }
    
    return data as ExportData;
  } catch (error) {
    throw new Error(`Failed to parse JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * ExportDataからSavedPlanを構築する
 * @param exportData ExportDataオブジェクト
 * @param gameData ゲームデータ
 * @param currentSettings 現在のグローバル設定（フォールバック用）
 * @returns SavedPlanオブジェクト
 */
export function buildSavedPlanFromExportData(
  exportData: ExportData,
  gameData: GameData,
  currentSettings: GlobalSettings
): SavedPlan {
  // プラン情報を検証用の形式に変換
  const planInfo = {
    name: exportData.planInfo.planName,
    timestamp: exportData.exportDate,
    recipeSID: exportData.planInfo.recipeSID,
    recipeName: exportData.planInfo.recipeName,
    targetQuantity: exportData.planInfo.targetQuantity,
  };

  // 検証
  const validation = validatePlanInfo(planInfo, gameData);
  if (!validation.isValid) {
    throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
  }

  // SavedPlanを構築
  const savedPlan = buildPlanFromImport(planInfo, gameData, currentSettings);
  if (!savedPlan) {
    throw new Error('Failed to build SavedPlan from ExportData');
  }

  // ExportDataの設定をマージ（より詳細な設定が含まれている場合）
  savedPlan.settings = {
    ...currentSettings,
    ...exportData.settings,
  };

  // 警告があればログ出力
  if (validation.warnings.length > 0) {
    console.warn('Import warnings:', validation.warnings.map(w => w.message));
  }

  return savedPlan;
}
