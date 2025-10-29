import { describe, expect, it } from "vitest";
import type { ProliferatorConfig } from "../../types/settings";
import { PROLIFERATOR_DATA } from "../../types/settings";
import {
  getEffectiveBonuses,
  getSpeedAndProductionMultipliers,
  type ProliferatorMultipliers,
} from "../proliferator";

describe("proliferator", () => {
  const defaultMultipliers: ProliferatorMultipliers = {
    production: 1,
    speed: 1,
  };

  describe("getEffectiveBonuses", () => {
    it("増産剤なしの場合、すべてのボーナスが0になる", () => {
      const proliferator: ProliferatorConfig = {
        ...PROLIFERATOR_DATA.none,
        mode: "speed",
      };

      const result = getEffectiveBonuses(proliferator, defaultMultipliers);

      expect(result.effectiveProductionBonus).toBe(0);
      expect(result.effectiveSpeedBonus).toBe(0);
      expect(result.effectivePowerIncrease).toBe(0);
    });

    it("増産剤Mk.I（speed mode）のボーナスを計算する", () => {
      const proliferator: ProliferatorConfig = {
        ...PROLIFERATOR_DATA.mk1,
        mode: "speed",
      };

      const result = getEffectiveBonuses(proliferator, defaultMultipliers);

      // Mk.I: productionBonus=0.125, speedBonus=0.25, powerIncrease=0.30
      expect(result.effectiveProductionBonus).toBe(0.125);
      expect(result.effectiveSpeedBonus).toBe(0.25);
      expect(result.effectivePowerIncrease).toBe(0.3); // 倍率適用なし、固定値
    });

    it("増産剤Mk.III（production mode）のボーナスを計算する", () => {
      const proliferator: ProliferatorConfig = {
        ...PROLIFERATOR_DATA.mk3,
        mode: "production",
      };

      const result = getEffectiveBonuses(proliferator, defaultMultipliers);

      // Mk.III: productionBonus=0.25, speedBonus=1.00, powerIncrease=1.50
      expect(result.effectiveProductionBonus).toBe(0.25);
      expect(result.effectiveSpeedBonus).toBe(1.0);
      expect(result.effectivePowerIncrease).toBe(1.5); // 倍率適用なし、固定値
    });

    it("乗数が適用される（production: 2x, speed: 2x）", () => {
      const proliferator: ProliferatorConfig = {
        ...PROLIFERATOR_DATA.mk2,
        mode: "speed",
      };

      const multipliers: ProliferatorMultipliers = {
        production: 2,
        speed: 2,
      };

      const result = getEffectiveBonuses(proliferator, multipliers);

      // Mk.II: productionBonus=0.20, speedBonus=0.50, powerIncrease=0.70
      // effectiveProductionBonus = 0.20 * 2 = 0.40
      // effectiveSpeedBonus = 0.50 * 2 = 1.00
      // effectivePowerIncrease = 0.70 (倍率適用なし、固定値)
      expect(result.effectiveProductionBonus).toBe(0.4);
      expect(result.effectiveSpeedBonus).toBe(1.0);
      expect(result.effectivePowerIncrease).toBe(0.7);
    });

    it("nullish乗数がデフォルト1として扱われる", () => {
      const proliferator: ProliferatorConfig = {
        ...PROLIFERATOR_DATA.mk1,
        mode: "speed",
      };

      const multipliers = {} as ProliferatorMultipliers; // production/speed未定義

      const result = getEffectiveBonuses(proliferator, multipliers);

      // デフォルト値1が使用される
      expect(result.effectiveProductionBonus).toBe(0.125);
      expect(result.effectiveSpeedBonus).toBe(0.25);
      expect(result.effectivePowerIncrease).toBe(0.3);
    });
  });

  describe("getSpeedAndProductionMultipliers", () => {
    it("speed modeの場合、speedMultiplierが適用される", () => {
      const proliferator: ProliferatorConfig = {
        ...PROLIFERATOR_DATA.mk2,
        mode: "speed",
      };

      const result = getSpeedAndProductionMultipliers(proliferator, defaultMultipliers, true);

      // speedMultiplier = 1 + effectiveSpeedBonus = 1 + 0.50 = 1.50
      // productionMultiplier = 1 (speed mode)
      expect(result.speedMultiplier).toBe(1.5);
      expect(result.productionMultiplier).toBe(1);
    });

    it("production modeかつproduction許可の場合、productionMultiplierが適用される", () => {
      const proliferator: ProliferatorConfig = {
        ...PROLIFERATOR_DATA.mk3,
        mode: "production",
      };

      const result = getSpeedAndProductionMultipliers(proliferator, defaultMultipliers, true);

      // speedMultiplier = 1 (production mode)
      // productionMultiplier = 1 + effectiveProductionBonus = 1 + 0.25 = 1.25
      expect(result.speedMultiplier).toBe(1);
      expect(result.productionMultiplier).toBe(1.25);
    });

    it("production modeだがproduction不許可の場合、productionMultiplierが1になる", () => {
      const proliferator: ProliferatorConfig = {
        ...PROLIFERATOR_DATA.mk3,
        mode: "production",
      };

      const result = getSpeedAndProductionMultipliers(proliferator, defaultMultipliers, false);

      // speedMultiplier = 1 (production mode)
      // productionMultiplier = 1 (not allowed)
      expect(result.speedMultiplier).toBe(1);
      expect(result.productionMultiplier).toBe(1);
    });

    it("増産剤なしの場合、両方のmultiplierが1になる", () => {
      const proliferator: ProliferatorConfig = {
        ...PROLIFERATOR_DATA.none,
        mode: "speed",
      };

      const result = getSpeedAndProductionMultipliers(proliferator, defaultMultipliers, true);

      expect(result.speedMultiplier).toBe(1);
      expect(result.productionMultiplier).toBe(1);
    });

    it("カスタム乗数が適用される", () => {
      const proliferator: ProliferatorConfig = {
        ...PROLIFERATOR_DATA.mk2,
        mode: "speed",
      };

      const multipliers: ProliferatorMultipliers = {
        production: 1.5,
        speed: 2.0,
      };

      const result = getSpeedAndProductionMultipliers(proliferator, multipliers, true);

      // effectiveSpeedBonus = 0.50 * 2.0 = 1.00
      // speedMultiplier = 1 + 1.00 = 2.00
      expect(result.speedMultiplier).toBe(2.0);
      expect(result.productionMultiplier).toBe(1);
    });

    it("production mode + カスタム乗数", () => {
      const proliferator: ProliferatorConfig = {
        ...PROLIFERATOR_DATA.mk1,
        mode: "production",
      };

      const multipliers: ProliferatorMultipliers = {
        production: 3.0,
        speed: 1.0,
      };

      const result = getSpeedAndProductionMultipliers(proliferator, multipliers, true);

      // effectiveProductionBonus = 0.125 * 3.0 = 0.375
      // productionMultiplier = 1 + 0.375 = 1.375
      expect(result.speedMultiplier).toBe(1);
      expect(result.productionMultiplier).toBe(1.375);
    });
  });
});
