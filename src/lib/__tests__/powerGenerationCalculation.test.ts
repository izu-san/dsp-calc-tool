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

describe('増産剤の適用', () => {
  describe('人工恒星以外の発電設備', () => {
    it('増産剤の追加生産ボーナスが燃料エネルギーに適用される', () => {
      // ミニ核融合発電所 + Mk3増産剤（追加生産+25%）
      const result = calculatePowerGeneration(
        15000,
        'lateGame',
        'miniFusion',
        null,
        0, // 速度ボーナスなし
        0.25 // 追加生産ボーナス+25%
      );

      expect(result.generators[0].generator.type).toBe('miniFusion');
      // 燃料エネルギーが1.25倍になるため、燃料消費が減少
      expect(result.generators[0].actualFuelEnergy).toBeCloseTo(
        600 * 1.25,
        1
      );
    });

    it('増産剤の追加生産ボーナスが出力に適用される', () => {
      // ミニ核融合発電所 + Mk3増産剤（追加生産+25%）
      const result = calculatePowerGeneration(
        18750, // 15MW * 1.25 = 18.75MW
        'lateGame',
        'miniFusion',
        null,
        0, // 速度ボーナスなし
        0.25 // 追加生産ボーナス+25%
      );

      // 基本出力15MW * 追加生産倍率1.25 = 18.75MW
      expect(result.generators[0].actualOutputPerUnit).toBeCloseTo(18750, 1);
      // 18750kW必要 / 18750kW/台 = 1台
      expect(result.generators[0].count).toBe(1);
    });

    it('追加生産ボーナスは出力と燃料エネルギーの両方に適用される', () => {
      // ミニ核融合発電所 + Mk3増産剤（追加生産+25%）
      const result = calculatePowerGeneration(
        18750, // 15MW * 1.25 = 18.75MW → 1台必要
        'lateGame',
        'miniFusion',
        null,
        0, // 速度ボーナスは人工恒星以外には適用されない
        0.25 // 追加生産ボーナス+25%
      );

      // 出力: 15MW * 1.25 = 18.75MW
      expect(result.generators[0].actualOutputPerUnit).toBeCloseTo(18750, 1);
      // 燃料エネルギー: 600MJ * 1.25 = 750MJ
      expect(result.generators[0].actualFuelEnergy).toBeCloseTo(750, 1);
      // 1台必要
      expect(result.generators[0].count).toBe(1);
    });

    it('増産剤なしの場合は基本値が使われる', () => {
      const result = calculatePowerGeneration(
        15000,
        'lateGame',
        'miniFusion',
        null,
        0,
        0
      );

      // 基本出力
      expect(result.generators[0].actualOutputPerUnit).toBe(15000);
      // 基本燃料エネルギー
      expect(result.generators[0].actualFuelEnergy).toBe(600);
    });
  });

  describe('人工恒星の特殊な動作', () => {
    it('増産剤の速度ボーナスが出力に適用される', () => {
      // 人工恒星 + Mk3増産剤（速度+100%）
      const result = calculatePowerGeneration(
        200000,
        'endGame',
        'artificialStar',
        null,
        1.0, // 速度ボーナス+100%
        0 // 追加生産ボーナス（人工恒星では出力に適用されない）
      );

      // ストレンジ物質対消滅燃料棒: 基本144MW * 速度倍率2.0 = 288MW
      expect(result.generators[0].actualOutputPerUnit).toBeCloseTo(288000, 1);
      // 200000kW / 288000kW = 1台（切り上げ）
      expect(result.generators[0].count).toBe(1);
    });

    it('増産剤の追加生産ボーナスは出力と燃料エネルギーに適用されない', () => {
      // 人工恒星 + Mk3増産剤（追加生産+25%）
      const result = calculatePowerGeneration(
        144000,
        'endGame',
        'artificialStar',
        null,
        0, // 速度ボーナスなし
        0.25 // 追加生産ボーナス（人工恒星では適用されない）
      );

      // 出力は変わらない
      expect(result.generators[0].actualOutputPerUnit).toBe(144000);
      // 燃料エネルギーは変わらない
      expect(result.generators[0].actualFuelEnergy).toBe(72000);
      expect(result.generators[0].count).toBe(1);
    });

    it('増産剤の速度ボーナスが1台あたりの燃料消費速度を上昇させる', () => {
      // 人工恒星 + Mk3増産剤（速度+100%）
      // 同じ台数で比較する必要がある
      const resultWithProliferator = calculatePowerGeneration(
        72000, // 反物質燃料棒の基本出力(72MW)で1台分
        'endGame',
        'artificialStar',
        'antimatterFuelRod',
        1.0, // 速度ボーナス+100%
        0
      );

      const resultWithoutProliferator = calculatePowerGeneration(
        72000,
        'endGame',
        'artificialStar',
        'antimatterFuelRod',
        0, // 増産剤なし
        0
      );

      // 増産剤なしの場合: 72MW → 1台
      expect(resultWithoutProliferator.generators[0].count).toBe(1);
      
      // 増産剤ありの場合: 72MW * 2 = 144MW/台 → 1台で足りる
      expect(resultWithProliferator.generators[0].count).toBe(1);
      
      // 1台あたりの燃料消費速度が2倍になる
      // useFuelPerTick = 1200000, heatValue = 7200000000
      // 増産剤なし: (1200000 * 60) / 7200000000 = 0.01個/秒
      // 増産剤あり: (1200000 * 60 * 2) / 7200000000 = 0.02個/秒
      expect(resultWithProliferator.generators[0].fuelConsumptionRate).toBeCloseTo(
        resultWithoutProliferator.generators[0].fuelConsumptionRate * 2,
        5
      );
    });
  });

  describe('増産剤の結果への記録', () => {
    it('増産剤のボーナスが結果に記録される', () => {
      const result = calculatePowerGeneration(
        15000,
        'lateGame',
        'miniFusion',
        null,
        1.0, // 速度ボーナス+100%
        0.25 // 追加生産ボーナス+25%
      );

      expect(result.proliferatorSpeedBonus).toBe(1.0);
      expect(result.proliferatorProductionBonus).toBe(0.25);
    });

    it('増産剤なしの場合は0が記録される', () => {
      const result = calculatePowerGeneration(
        15000,
        'lateGame',
        'miniFusion',
        null,
        0,
        0
      );

      expect(result.proliferatorSpeedBonus).toBe(0);
      expect(result.proliferatorProductionBonus).toBe(0);
    });
  });
});

describe('手動選択ロジック', () => {
  describe('発電設備の手動選択', () => {
    it('手動で人工恒星を選択すると、テンプレートに関係なく人工恒星が使用される', () => {
      // 序盤テンプレートでも人工恒星を手動選択
      const result = calculatePowerGeneration(
        100000,
        'earlyGame',
        'artificialStar'
      );

      expect(result.generators[0].generator.type).toBe('artificialStar');
      expect(result.generators[0].count).toBe(1);
    });

    it('手動でミニ核融合発電所を選択すると使用される', () => {
      const result = calculatePowerGeneration(
        15000,
        'earlyGame',
        'miniFusion'
      );

      expect(result.generators[0].generator.type).toBe('miniFusion');
      expect(result.generators[0].fuel?.itemId).toBe(1802); // Deuteron fuel rod
    });

    it('手動で火力発電所を選択すると使用される', () => {
      const result = calculatePowerGeneration(
        5000,
        'endGame',
        'thermalPlant'
      );

      expect(result.generators[0].generator.type).toBe('thermalPlant');
      // 火力発電所は複数の燃料を使用可能だが、最もエネルギー効率が良い燃料が選択される
      expect(result.generators[0].fuel).not.toBeNull();
    });
  });

  describe('燃料の手動選択', () => {
    it('手動で燃料を選択すると、指定した燃料が使用される', () => {
      // 人工恒星に反物質燃料棒を手動指定
      const result = calculatePowerGeneration(
        100000,
        'endGame',
        'artificialStar',
        'antimatterFuelRod'
      );

      expect(result.generators[0].fuel?.itemId).toBe(1803); // Antimatter fuel rod
      // 反物質燃料棒使用時は72MW
      expect(result.generators[0].count).toBe(2); // Math.ceil(100000 / 72000) = 2台
    });

    it('手動で発電設備を選択し、燃料を自動にすると全燃料から選択される', () => {
      // 序盤テンプレート + 人工恒星（手動） + 燃料自動
      const result = calculatePowerGeneration(
        100000,
        'earlyGame',
        'artificialStar',
        null
      );

      expect(result.generators[0].generator.type).toBe('artificialStar');
      // 全燃料から最もエネルギー効率が良い燃料（ストレンジ物質対消滅燃料棒）が選択される
      expect(result.generators[0].fuel?.itemId).toBe(1804);
    });
  });

  describe('自動選択（手動選択なし）', () => {
    it('発電設備も燃料も自動の場合、テンプレートに基づいて選択される', () => {
      const result = calculatePowerGeneration(
        100000,
        'earlyGame',
        null,
        null
      );

      // 序盤テンプレートでは地熱発電所が選択される
      expect(result.generators[0].generator.type).toBe('geothermal');
    });

    it('発電設備が自動で燃料を手動選択しても、テンプレートの発電設備が使用される', () => {
      // 後半テンプレート + 発電設備自動 + 重水素燃料棒（手動）
      const result = calculatePowerGeneration(
        15000,
        'lateGame',
        null,
        'deuteronFuelRod'
      );

      // テンプレートからミニ核融合発電所が選択される
      expect(result.generators[0].generator.type).toBe('miniFusion');
      // 手動指定した燃料が使用される
      expect(result.generators[0].fuel?.itemId).toBe(1802);
    });
  });

  describe('燃料が1種類しかない場合', () => {
    it('ミニ核融合発電所は重水素燃料棒のみ使用可能', () => {
      const result = calculatePowerGeneration(
        15000,
        'lateGame',
        'miniFusion'
      );

      expect(result.generators[0].fuel?.itemId).toBe(1802);
      expect(result.generators[0].generator.acceptedFuelTypes).toHaveLength(1);
    });
  });
});

