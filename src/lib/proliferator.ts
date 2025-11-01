import type { ProliferatorConfig } from "../types";

export interface ProliferatorMultipliers {
  production: number;
  speed: number;
}

export function getEffectiveBonuses(
  proliferator: ProliferatorConfig,
  multipliers: ProliferatorMultipliers
) {
  const prodMult = multipliers?.production ?? 1;
  const speedMult = multipliers?.speed ?? 1;
  return {
    effectiveProductionBonus: proliferator.productionBonus * prodMult,
    effectiveSpeedBonus: proliferator.speedBonus * speedMult,
    // 電力増加はMOD設定の倍率を適用しない（固定値として扱う）
    effectivePowerIncrease: proliferator.powerIncrease,
  };
}

export function getSpeedAndProductionMultipliers(
  proliferator: ProliferatorConfig,
  multipliers: ProliferatorMultipliers,
  isProductionAllowed: boolean
) {
  const { effectiveProductionBonus, effectiveSpeedBonus } = getEffectiveBonuses(
    proliferator,
    multipliers
  );
  const speedMultiplier = proliferator.mode === "speed" ? 1 + effectiveSpeedBonus : 1;
  const productionMultiplier =
    proliferator.mode === "production" && isProductionAllowed ? 1 + effectiveProductionBonus : 1;
  return { speedMultiplier, productionMultiplier };
}
