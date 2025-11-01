import type { Recipe, Machine, ProliferatorConfig, PhotonGenerationSettings } from "../../types";
import { getEffectiveBonuses } from "../proliferator";

/**
 * Calculate production rate for a recipe with given settings
 *
 * Production mode: Increases output per craft (more items per recipe execution)
 * Speed mode: Reduces time per craft (faster recipe execution)
 * @internal - Exported for testing
 */
export function calculateProductionRate(
  recipe: Recipe,
  machine: Machine,
  proliferator: ProliferatorConfig,
  proliferatorMultiplier: { production: number; speed: number },
  photonSettings?: PhotonGenerationSettings
): number {
  // PhotonGeneration の特殊処理
  if (recipe.Type === "PhotonGeneration" && photonSettings) {
    const isHighReception = photonSettings.continuousReception >= 100;

    // 基礎生産速度
    let baseProductionRate: number;
    if (!photonSettings.useGravitonLens) {
      baseProductionRate = isHighReception ? 0.1 : 0.04; // 個/秒
    } else {
      baseProductionRate = isHighReception ? 0.2 : 0.08; // 個/秒
    }

    // 重力子レンズへの増産剤効果（速度上昇）
    const speedBonus = photonSettings.gravitonLensProliferator.speedBonus;
    const speedMultiplier = 1 + speedBonus;

    return baseProductionRate * speedMultiplier;
  }

  // 通常のレシピ計算
  const baseTime = recipe.TimeSpend / 60; // Convert ticks to seconds

  // Calculate machine speed multiplier (10000 = 100%)
  // Note: Some machines like Matrix Lab have assemblerSpeed = 10000 (1.0x),
  // while Self-evolution Lab has assemblerSpeed = 30000 (3.0x)
  let machineSpeedMultiplier = machine.assemblerSpeed / 10000; // 10000 = 100%
  if (machineSpeedMultiplier === 0) {
    machineSpeedMultiplier = 1.0; // Default to 100% for special machines (like turrets)
  }

  // Speed mode: reduces time per craft (apply effective speed bonus)
  const { effectiveProductionBonus, effectiveSpeedBonus } = getEffectiveBonuses(
    proliferator,
    proliferatorMultiplier
  );
  const speedBonus = proliferator.mode === "speed" ? 1 + effectiveSpeedBonus : 1;

  // Time per craft in seconds
  const timePerCraft = baseTime / machineSpeedMultiplier / speedBonus;

  // Production mode: increases output per craft
  const baseOutput = recipe.Results[0]?.count || 1;
  const productionBonus = proliferator.mode === "production" ? 1 + effectiveProductionBonus : 1;
  const outputPerCraft = baseOutput * productionBonus;

  return outputPerCraft / timePerCraft;
}
