/**
 * 発電設備計算のユニットテスト
 */

import { describe, it, expect } from 'vitest';
import {
  calculatePowerGeneration,
  getActualOutput,
} from '../powerGenerationCalculation';
import { POWER_GENERATORS, FUEL_ITEMS } from '@/constants/powerGeneration';

describe('calculatePowerGeneration', () => {
  describe('序盤テンプレート', () => {
    it('1000kW必要な場合、地熱発電所を1台提案する', () => {
      const result = calculatePowerGeneration(1000, 'earlyGame');

      expect(result.requiredPower).toBe(1000);
      expect(result.generators).toHaveLength(1);
      expect(result.generators[0].generator.type).toBe('geothermal');
      expect(result.generators[0].count).toBe(1); // 4800kW / 1000kW = 1台
      expect(result.totalGenerators).toBe(1);
    });

    it('10000kW必要な場合、地熱発電所を3台提案する', () => {
      const result = calculatePowerGeneration(10000, 'earlyGame');

      expect(result.requiredPower).toBe(10000);
      expect(result.generators[0].generator.type).toBe('geothermal');
      expect(result.generators[0].count).toBe(3); // Math.ceil(10000 / 4800) = 3台
      expect(result.totalGenerators).toBe(3);
    });

    it('燃料不要の発電設備は燃料消費が0', () => {
      const result = calculatePowerGeneration(1000, 'earlyGame');

      expect(result.generators[0].fuel).toBeNull();
      expect(result.generators[0].fuelConsumptionRate).toBe(0);
      expect(result.totalFuelConsumption.size).toBe(0);
    });
  });

  describe('後半テンプレート', () => {
    it('20000kW必要な場合、ミニ核融合発電所を提案する', () => {
      const result = calculatePowerGeneration(20000, 'lateGame');

      expect(result.generators[0].generator.type).toBe('miniFusion');
      expect(result.generators[0].count).toBe(2); // Math.ceil(20000 / 15000) = 2台
      expect(result.totalGenerators).toBe(2);
    });

    it('重水素燃料棒を燃料として使用する', () => {
      const result = calculatePowerGeneration(20000, 'lateGame');

      expect(result.generators[0].fuel).not.toBeNull();
      expect(result.generators[0].fuel?.itemId).toBe(1802); // Deuteron fuel rod
      expect(result.generators[0].fuelConsumptionRate).toBeGreaterThan(0);
    });

    it('燃料消費量が正しく計算される', () => {
      const result = calculatePowerGeneration(15000, 'lateGame');

      // 1台のミニ核融合発電所
      expect(result.generators[0].count).toBe(1);

      // useFuelPerTick = 250000, heatValue = 600000000
      // (250000 * 60) / 600000000 = 0.025個/秒
      const expectedConsumption = (250000 * 60) / 600000000;
      expect(result.generators[0].fuelConsumptionRate).toBeCloseTo(
        expectedConsumption,
        5
      );
    });
  });

  describe('終盤テンプレート', () => {
    it('100000kW必要な場合、人工恒星を提案する', () => {
      const result = calculatePowerGeneration(100000, 'endGame');

      expect(result.generators[0].generator.type).toBe('artificialStar');
      // Strange Annihilation Fuel Rodを使用すると144MW
      // Math.ceil(100000 / 144000) = 1台
      expect(result.generators[0].count).toBe(1);
      expect(result.totalGenerators).toBe(1);
    });

    it('ストレンジ物質対消滅燃料棒を使用する', () => {
      const result = calculatePowerGeneration(100000, 'endGame');

      expect(result.generators[0].fuel?.itemId).toBe(1804); // Strange Annihilation Fuel Rod
    });
  });

  describe('Solar Panelの稼働率', () => {
    it('稼働率70.3%が考慮される', () => {
      // ソーラーパネルの基本出力: 360kW
      // 稼働率: 70.3%
      // 実効出力: 360 * 0.703 = 253.08kW

      const solarPanel = POWER_GENERATORS.solarPanel;
      expect(solarPanel.operatingRate).toBe(0.703);

      const actualOutput = getActualOutput(solarPanel, null);
      expect(actualOutput).toBeCloseTo(360 * 0.703, 1);
    });
  });

  describe('Artificial Starの燃料別出力', () => {
    it('反物質燃料棒使用時は72.0MW', () => {
      const artificialStar = POWER_GENERATORS.artificialStar;
      const antimatterFuelRod = FUEL_ITEMS.antimatterFuelRod;

      const output = getActualOutput(artificialStar, antimatterFuelRod);
      expect(output).toBe(72000); // kW
    });

    it('ストレンジ物質対消滅燃料棒使用時は144MW', () => {
      const artificialStar = POWER_GENERATORS.artificialStar;
      const strangeAnnihilationFuelRod =
        FUEL_ITEMS.strangeAnnihilationFuelRod;

      const output = getActualOutput(
        artificialStar,
        strangeAnnihilationFuelRod
      );
      expect(output).toBe(144000); // kW
    });
  });

  describe('エッジケース', () => {
    it('必要電力が0の場合は空の結果を返す', () => {
      const result = calculatePowerGeneration(0, 'earlyGame');

      expect(result.requiredPower).toBe(0);
      expect(result.generators).toHaveLength(0);
      expect(result.totalGenerators).toBe(0);
      expect(result.totalFuelConsumption.size).toBe(0);
    });

    it('必要電力が負の場合は空の結果を返す', () => {
      const result = calculatePowerGeneration(-1000, 'earlyGame');

      expect(result.requiredPower).toBe(0);
      expect(result.generators).toHaveLength(0);
    });

    it('非常に小さい電力要求でも正しく計算される', () => {
      const result = calculatePowerGeneration(1, 'earlyGame');

      expect(result.generators).toHaveLength(1);
      expect(result.generators[0].count).toBe(1);
    });

    it('非常に大きい電力要求でも正しく計算される', () => {
      const result = calculatePowerGeneration(1000000, 'endGame');

      expect(result.generators).toHaveLength(1);
      expect(result.generators[0].generator.type).toBe('artificialStar');
      // 1000000 kW / 144000 kW = 7台 (Strange Annihilation Fuel Rod使用)
      expect(result.generators[0].count).toBeGreaterThan(0);
    });
  });

  describe('燃料効率', () => {
    it('最もエネルギー効率が良い燃料が選択される', () => {
      const result = calculatePowerGeneration(5000, 'midGame');

      // 中盤で使用可能な発電設備の中で最も高出力なのは地熱発電所（4800kW、燃料不要）
      expect(result.generators[0].generator.type).toBe('geothermal');
      expect(result.generators[0].fuel).toBeNull();
    });

    it('終盤では最高効率の燃料が選択される', () => {
      const result = calculatePowerGeneration(100000, 'endGame');

      // 質量エネルギー燃料の中で最も効率が良いのはストレンジ物質対消滅燃料棒
      expect(result.generators[0].fuel?.itemId).toBe(1804);
    });
  });
});

describe('getActualOutput', () => {
  it('通常の発電設備は基本出力 * 稼働率を返す', () => {
    const geothermal = POWER_GENERATORS.geothermal;
    const output = getActualOutput(geothermal, null);

    expect(output).toBe(4800); // 4800kW * 1.0
  });

  it('Solar Panelは稼働率が考慮される', () => {
    const solarPanel = POWER_GENERATORS.solarPanel;
    const output = getActualOutput(solarPanel, null);

    expect(output).toBeCloseTo(360 * 0.703, 1);
  });

  it('Artificial Starは燃料によって出力が変わる', () => {
    const artificialStar = POWER_GENERATORS.artificialStar;

    const antimatterOutput = getActualOutput(
      artificialStar,
      FUEL_ITEMS.antimatterFuelRod
    );
    expect(antimatterOutput).toBe(72000);

    const strangeOutput = getActualOutput(
      artificialStar,
      FUEL_ITEMS.strangeAnnihilationFuelRod
    );
    expect(strangeOutput).toBe(144000);
  });
});

