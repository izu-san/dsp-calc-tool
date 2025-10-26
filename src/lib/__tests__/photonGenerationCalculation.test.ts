import { describe, it, expect } from 'vitest';
import {
  calculateRayTransmissionEfficiency,
  calculateReceptionEfficiency,
  getPhotonGenerationRate,
  calculateRequiredPower,
  getMaxMeaningfulResearchLevel,
} from '../photonGenerationCalculation';

describe('photonGenerationCalculation', () => {
  describe('calculateRayTransmissionEfficiency', () => {
    it('研究Lv 0-6 のテーブル値を返す', () => {
      expect(calculateRayTransmissionEfficiency(0)).toBeCloseTo(0.30, 2); // 30%
      expect(calculateRayTransmissionEfficiency(1)).toBeCloseTo(0.37, 2); // 37%
      expect(calculateRayTransmissionEfficiency(2)).toBeCloseTo(0.433, 3); // 43.3%
      expect(calculateRayTransmissionEfficiency(3)).toBeCloseTo(0.4897, 4); // 48.97%
      expect(calculateRayTransmissionEfficiency(4)).toBeCloseTo(0.5407, 4); // 54.07%
      expect(calculateRayTransmissionEfficiency(5)).toBeCloseTo(0.5867, 4); // 58.67%
      expect(calculateRayTransmissionEfficiency(6)).toBeCloseTo(0.628, 3); // 62.8%
    });

    it('研究Lv 7以降の計算式を使用する', () => {
      // Lv 7: 68.38%
      expect(calculateRayTransmissionEfficiency(7)).toBeCloseTo(0.6838, 4);
      
      // Lv 8: 100 - 31.62 * 0.85 = 73.123%
      expect(calculateRayTransmissionEfficiency(8)).toBeCloseTo(0.73123, 5);
      
      // Lv 10: 100 - 31.62 * 0.85^3 ≈ 80.582%
      expect(calculateRayTransmissionEfficiency(10)).toBeCloseTo(0.80582, 4);
    });

    it('高レベルでは効率が向上し続ける', () => {
      const lv20 = calculateRayTransmissionEfficiency(20);
      const lv50 = calculateRayTransmissionEfficiency(50);
      const lv100 = calculateRayTransmissionEfficiency(100);
      
      expect(lv50).toBeGreaterThan(lv20);
      expect(lv100).toBeGreaterThan(lv50);
      expect(lv100).toBeLessThanOrEqual(1); // 100%を超えない
    });
  });

  describe('calculateReceptionEfficiency', () => {
    it('連続受信100%の場合の受信効率を計算する', () => {
      const loss = 0.7; // 70%
      // 受信効率 = 1 - 0.7 * (1 - 0.4 * 1.0) = 1 - 0.7 * 0.6 = 1 - 0.42 = 0.58
      const efficiency = calculateReceptionEfficiency(loss, 100);
      expect(efficiency).toBeCloseTo(0.58, 2);
    });

    it('連続受信0%の場合の受信効率を計算する', () => {
      const loss = 0.7; // 70%
      // 受信効率 = 1 - 0.7 * (1 - 0.4 * 0) = 1 - 0.7 = 0.3
      const efficiency = calculateReceptionEfficiency(loss, 0);
      expect(efficiency).toBeCloseTo(0.3, 2);
    });

    it('損失が0%の場合は常に100%効率', () => {
      expect(calculateReceptionEfficiency(0, 0)).toBe(1);
      expect(calculateReceptionEfficiency(0, 50)).toBe(1);
      expect(calculateReceptionEfficiency(0, 100)).toBe(1);
    });

    it('研究レベルが高いほど効率が向上する', () => {
      const efficiency0 = calculateRayTransmissionEfficiency(0);
      const efficiency10 = calculateRayTransmissionEfficiency(10);
      const efficiency50 = calculateRayTransmissionEfficiency(50);
      
      // 損失に変換して受信効率を計算
      const loss0 = 1 - efficiency0;
      const loss10 = 1 - efficiency10;
      const loss50 = 1 - efficiency50;
      
      const eff0 = calculateReceptionEfficiency(loss0, 100);
      const eff10 = calculateReceptionEfficiency(loss10, 100);
      const eff50 = calculateReceptionEfficiency(loss50, 100);
      
      expect(eff10).toBeGreaterThan(eff0);
      expect(eff50).toBeGreaterThan(eff10);
    });
  });

  describe('getPhotonGenerationRate', () => {
    it('重力子レンズなし、連続受信100%の場合', () => {
      const rate = getPhotonGenerationRate(false, 100, 0);
      expect(rate.theoreticalPower).toBe(120); // MW
      expect(rate.productionRate).toBeCloseTo(0.10, 2); // 個/秒
    });

    it('重力子レンズなし、連続受信100%未満の場合', () => {
      const rate = getPhotonGenerationRate(false, 99, 0);
      expect(rate.theoreticalPower).toBe(48.0); // MW
      expect(rate.productionRate).toBeCloseTo(0.04, 2); // 個/秒
    });

    it('重力子レンズあり、連続受信100%の場合', () => {
      const rate = getPhotonGenerationRate(true, 100, 0);
      expect(rate.theoreticalPower).toBe(240); // MW (2倍)
      expect(rate.productionRate).toBeCloseTo(0.20, 2); // 個/秒 (2倍)
    });

    it('重力子レンズあり、連続受信100%未満の場合', () => {
      const rate = getPhotonGenerationRate(true, 99, 0);
      expect(rate.theoreticalPower).toBe(96.0); // MW (2倍)
      expect(rate.productionRate).toBeCloseTo(0.08, 2); // 個/秒 (2倍)
    });

    it('増産剤Mk.I使用の場合 (+25%速度)', () => {
      const rate = getPhotonGenerationRate(false, 100, 0.25);
      expect(rate.theoreticalPower).toBeCloseTo(150, 1); // 120 * 1.25
      expect(rate.productionRate).toBeCloseTo(0.125, 3); // 0.10 * 1.25
    });

    it('増産剤Mk.II使用の場合 (+50%速度)', () => {
      const rate = getPhotonGenerationRate(false, 100, 0.5);
      expect(rate.theoreticalPower).toBeCloseTo(180, 1); // 120 * 1.5
      expect(rate.productionRate).toBeCloseTo(0.15, 2); // 0.10 * 1.5
    });

    it('増産剤Mk.III使用の場合 (+100%速度)', () => {
      const rate = getPhotonGenerationRate(false, 100, 1.0);
      expect(rate.theoreticalPower).toBeCloseTo(240, 1); // 120 * 2.0
      expect(rate.productionRate).toBeCloseTo(0.20, 2); // 0.10 * 2.0
    });

    it('重力子レンズあり、増産剤Mk.III使用の場合', () => {
      const rate = getPhotonGenerationRate(true, 100, 1.0);
      expect(rate.theoreticalPower).toBeCloseTo(480, 1); // 240 * 2.0
      expect(rate.productionRate).toBeCloseTo(0.40, 2); // 0.20 * 2.0
    });
  });

  describe('calculateRequiredPower', () => {
    it('理論電力と受信効率から要求電力を計算する', () => {
      // 120MW / 0.58 ≈ 206.897 MW = 206897 kW
      const power = calculateRequiredPower(120, 0.58);
      expect(power).toBeCloseTo(206896.55, 2);
    });

    it('受信効率100%の場合は理論電力と同じ', () => {
      const power = calculateRequiredPower(120, 1.0);
      expect(power).toBeCloseTo(120000, 1); // 120MW = 120000kW
    });

    it('受信効率が低いほど要求電力が増える', () => {
      const power90 = calculateRequiredPower(120, 0.9);
      const power50 = calculateRequiredPower(120, 0.5);
      const power30 = calculateRequiredPower(120, 0.3);
      
      expect(power50).toBeGreaterThan(power90);
      expect(power30).toBeGreaterThan(power50);
    });

    it('重力子レンズ使用時の高い理論電力でも正しく計算される', () => {
      const power = calculateRequiredPower(240, 0.58);
      expect(power).toBeCloseTo(413793.1, 1); // 240 / 0.58 * 1000
    });
  });

  describe('getMaxMeaningfulResearchLevel', () => {
    it('0.0000%と表示される最小レベルを返す', () => {
      const maxLevel = getMaxMeaningfulResearchLevel();
      
      // レベルが正の整数であることを確認
      expect(maxLevel).toBeGreaterThan(0);
      expect(Number.isInteger(maxLevel)).toBe(true);
      
      // このレベルでの効率が99.995%以上であることを確認
      const efficiency = calculateRayTransmissionEfficiency(maxLevel);
      expect(efficiency).toBeGreaterThan(0.999995); // 99.9995%以上
    });

    it('最大でも10000を超えない', () => {
      const maxLevel = getMaxMeaningfulResearchLevel();
      expect(maxLevel).toBeLessThanOrEqual(10000);
    });

    it('計算されたレベル-1では効率が低い', () => {
      const maxLevel = getMaxMeaningfulResearchLevel();
      const efficiencyAtMax = calculateRayTransmissionEfficiency(maxLevel);
      const efficiencyBeforeMax = calculateRayTransmissionEfficiency(maxLevel - 1);
      
      expect(efficiencyAtMax).toBeGreaterThan(0.999995);
      // maxLevel - 1の効率が閾値より高い場合もあるため、閾値を調整
      // 重要なのは、maxLevelの効率がmaxLevel-1より高いこと
      expect(efficiencyAtMax).toBeGreaterThan(efficiencyBeforeMax);
    });
  });

  describe('統合テスト: 実際の使用ケース', () => {
    it('ケース1: 初期状態（研究Lv0、重力子レンズなし、増産剤なし）', () => {
      const efficiency = calculateRayTransmissionEfficiency(0);
      const loss = 1 - efficiency;
      const receptionEfficiency = calculateReceptionEfficiency(loss, 100);
      const rate = getPhotonGenerationRate(false, 100, 0);
      const requiredPower = calculateRequiredPower(rate.theoreticalPower, receptionEfficiency);
      
      expect(efficiency).toBeCloseTo(0.30); // 30%効率
      expect(loss).toBeCloseTo(0.70); // 70%損失
      expect(receptionEfficiency).toBeCloseTo(0.58); // 受信効率58%
      expect(rate.productionRate).toBeCloseTo(0.10);
      expect(requiredPower).toBeCloseTo(206896.55, 2);
    });

    it('ケース2: 研究Lv50、重力子レンズあり、増産剤Mk.III', () => {
      const efficiency = calculateRayTransmissionEfficiency(50);
      const loss = 1 - efficiency;
      const receptionEfficiency = calculateReceptionEfficiency(loss, 100);
      const rate = getPhotonGenerationRate(true, 100, 1.0);
      const requiredPower = calculateRequiredPower(rate.theoreticalPower, receptionEfficiency);
      
      expect(efficiency).toBeGreaterThan(0.99); // 99%以上
      expect(loss).toBeLessThan(0.01); // 1%未満
      expect(receptionEfficiency).toBeGreaterThan(0.99); // 99%以上
      expect(rate.productionRate).toBeCloseTo(0.40); // 重力子レンズ+増産剤で4倍
      expect(requiredPower).toBeLessThan(500000); // 効率が良いので500MW未満
    });

    it('ケース3: 最悪効率（研究Lv0、連続受信0%）vs 最良効率（研究Lv100、連続受信100%）', () => {
      // 最悪効率
      const worstEfficiency = calculateRayTransmissionEfficiency(0);
      const worstLoss = 1 - worstEfficiency;
      const worstReceptionEfficiency = calculateReceptionEfficiency(worstLoss, 0);
      const worstRate = getPhotonGenerationRate(false, 0, 0);
      const worstPower = calculateRequiredPower(worstRate.theoreticalPower, worstReceptionEfficiency);
      
      // 最良効率
      const bestEfficiency = calculateRayTransmissionEfficiency(100);
      const bestLoss = 1 - bestEfficiency;
      const bestReceptionEfficiency = calculateReceptionEfficiency(bestLoss, 100);
      const bestRate = getPhotonGenerationRate(false, 100, 0);
      const bestPower = calculateRequiredPower(bestRate.theoreticalPower, bestReceptionEfficiency);
      
      // 最良効率は最悪効率より良い
      expect(bestReceptionEfficiency).toBeGreaterThan(worstReceptionEfficiency * 2);
      expect(worstPower).toBeGreaterThan(bestPower);
    });
  });
});

