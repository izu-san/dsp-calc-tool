/**
 * localStorage用のシリアライズ・デシリアライズユーティリティ
 *
 * Map型のシリアライズに特化した型安全な実装
 */

import type { GlobalSettings } from "../types";
import { CONVEYOR_BELT_DATA, DEFAULT_PHOTON_GENERATION_SETTINGS } from "../types/settings";
import { ok, err, type Result } from "../lib/calculator/result";
import { logger } from "./logger";

/**
 * localStorage に保存される settings の中間形式
 * Map は配列として保存される
 */
interface SerializedSettings {
  proliferator: GlobalSettings["proliferator"];
  machineRank: GlobalSettings["machineRank"];
  conveyorBelt: GlobalSettings["conveyorBelt"];
  sorter: GlobalSettings["sorter"];
  alternativeRecipes: Array<[number, number]>; // Map → Array
  miningSpeedResearch: GlobalSettings["miningSpeedResearch"];
  photonGeneration?: GlobalSettings["photonGeneration"]; // オプショナル (既存データとの互換性)
  proliferatorMultiplier: GlobalSettings["proliferatorMultiplier"];
}

/**
 * GlobalSettings を localStorage 保存用にシリアライズ
 */
export function serializeSettings(settings: GlobalSettings): SerializedSettings {
  return {
    proliferator: settings.proliferator,
    machineRank: settings.machineRank,
    conveyorBelt: settings.conveyorBelt,
    sorter: settings.sorter,
    alternativeRecipes: Array.from(settings.alternativeRecipes.entries()),
    miningSpeedResearch: settings.miningSpeedResearch,
    proliferatorMultiplier: settings.proliferatorMultiplier,
    photonGeneration: settings.photonGeneration,
  };
}

/**
 * GlobalSettings を localStorage 保存用にシリアライズ（Result型）
 */
export function trySerializeSettings(settings: GlobalSettings): Result<SerializedSettings> {
  try {
    return ok(serializeSettings(settings));
  } catch (error) {
    logger.error("Failed to serialize settings:", error);
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * localStorage から読み込んだデータを GlobalSettings にデシリアライズ
 */
export function deserializeSettings(serialized: unknown): GlobalSettings | null {
  // 型ガード: 基本構造の検証
  if (!isSerializedSettings(serialized)) {
    logger.warn("Invalid serialized settings format:", serialized);
    return null;
  }

  // alternativeRecipes: 配列 → Map 変換
  const alternativeRecipes = new Map<number, number>(
    Array.isArray(serialized.alternativeRecipes) ? serialized.alternativeRecipes : []
  );

  // conveyorBelt: stackCount のフォールバック処理
  let conveyorBelt = serialized.conveyorBelt;
  if (typeof conveyorBelt?.stackCount !== "number") {
    const tier = (conveyorBelt?.tier || "mk3") as keyof typeof CONVEYOR_BELT_DATA;
    conveyorBelt = {
      ...CONVEYOR_BELT_DATA[tier],
      ...conveyorBelt,
      stackCount: 1, // デフォルト値
    };
    logger.debug("Applied fallback for conveyorBelt.stackCount");
  }

  return {
    proliferator: serialized.proliferator,
    machineRank: serialized.machineRank,
    conveyorBelt,
    sorter: serialized.sorter,
    alternativeRecipes,
    miningSpeedResearch: serialized.miningSpeedResearch,
    proliferatorMultiplier: serialized.proliferatorMultiplier,
    photonGeneration: serialized.photonGeneration || DEFAULT_PHOTON_GENERATION_SETTINGS,
  };
}

/**
 * localStorage から読み込んだデータを GlobalSettings にデシリアライズ（Result型）
 */
export function tryDeserializeSettings(serialized: unknown): Result<GlobalSettings> {
  try {
    const result = deserializeSettings(serialized);
    if (result === null) {
      return err(new Error("Failed to deserialize settings: invalid format"));
    }
    return ok(result);
  } catch (error) {
    logger.error("Failed to deserialize settings:", error);
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * 型ガード: SerializedSettings かどうかを判定
 */
function isSerializedSettings(data: unknown): data is SerializedSettings {
  if (typeof data !== "object" || data === null) {
    return false;
  }

  const obj = data as Record<string, unknown>;

  // 必須フィールドの存在チェック（最小限）
  return (
    typeof obj.proliferator === "object" &&
    typeof obj.machineRank === "object" &&
    typeof obj.conveyorBelt === "object" &&
    typeof obj.sorter === "object" &&
    typeof obj.miningSpeedResearch === "number" &&
    typeof obj.proliferatorMultiplier === "object"
    // alternativeRecipes は配列 or undefined でもOK（デフォルト値を使う）
  );
}
