/**
 * 発電設備と燃料に関する定数定義
 */

import type {
  PowerGeneratorInfo,
  PowerGeneratorType,
  FuelItem,
} from '@/types/power-generation';

/**
 * 発電設備の定義
 * XMLのgenEnergyPerTickとuseFuelPerTickから計算
 */
export const POWER_GENERATORS: Record<PowerGeneratorType, PowerGeneratorInfo> =
  {
    windTurbine: {
      machineId: 2203,
      machineName: '風力タービン',
      type: 'windTurbine',
      baseOutput: 300, // kW (5000 * 60 / 1000)
      efficiency: 1.0,
      acceptedFuelTypes: [],
      isVariableOutput: true,
      operatingRate: 1.0, // 注意書き: 惑星のWind energy ratioに依存
      useFuelPerTick: 0,
    },
    thermalPlant: {
      machineId: 2204,
      machineName: '火力発電所',
      type: 'thermalPlant',
      baseOutput: 2160, // kW (36000 * 60 / 1000)
      efficiency: 0.8, // 80% (36000 / 45000)
      acceptedFuelTypes: ['chemical'],
      isVariableOutput: false,
      operatingRate: 1.0,
      useFuelPerTick: 45000,
    },
    geothermal: {
      machineId: 2213,
      machineName: '地熱発電所',
      type: 'geothermal',
      baseOutput: 4800, // kW (80000 * 60 / 1000)
      efficiency: 1.0,
      acceptedFuelTypes: [],
      isVariableOutput: true,
      operatingRate: 1.0, // 注意書き: 周囲の溶岩量に依存
      useFuelPerTick: 0,
    },
    solarPanel: {
      machineId: 2205,
      machineName: 'ソーラーパネル',
      type: 'solarPanel',
      baseOutput: 360, // kW (6000 * 60 / 1000)
      efficiency: 1.0,
      acceptedFuelTypes: [],
      isVariableOutput: true,
      operatingRate: 0.703, // 70.3% (54.9% - 85.7%の中央値)
      useFuelPerTick: 0,
    },
    miniFusion: {
      machineId: 2211,
      machineName: 'ミニ核融合発電所',
      type: 'miniFusion',
      baseOutput: 15000, // kW (250000 * 60 / 1000)
      efficiency: 1.0, // 100% (250000 / 250000)
      acceptedFuelTypes: ['nuclear'],
      isVariableOutput: false,
      operatingRate: 1.0,
      useFuelPerTick: 250000,
    },
    artificialStar: {
      machineId: 2210,
      machineName: '人工恒星',
      type: 'artificialStar',
      baseOutput: 72000, // kW (1200000 * 60 / 1000) - Antimatter Fuel Rod使用時
      efficiency: 1.0, // 100% (1200000 / 1200000)
      acceptedFuelTypes: ['mass'],
      isVariableOutput: false,
      operatingRate: 1.0,
      useFuelPerTick: 1200000,
    },
  };

/**
 * 燃料アイテムの定義
 * XMLのHeatValueから取得
 */
export const FUEL_ITEMS: Record<string, FuelItem> = {
  // Chemical Fuels (序盤)
  coal: {
    itemId: 1006,
    itemName: '石炭',
    fuelType: 'chemical',
    heatValue: 2700000, // J
    energyPerItem: 2.7, // MJ
  },
  crudeOil: {
    itemId: 1007,
    itemName: '原油',
    fuelType: 'chemical',
    heatValue: 4050000,
    energyPerItem: 4.05,
  },
  refinedOil: {
    itemId: 1114,
    itemName: '精製油',
    fuelType: 'chemical',
    heatValue: 4500000,
    energyPerItem: 4.5,
  },
  energeticGraphite: {
    itemId: 1109,
    itemName: '高エネルギーグラファイト',
    fuelType: 'chemical',
    heatValue: 6750000,
    energyPerItem: 6.75,
  },
  hydrogen: {
    itemId: 1120,
    itemName: '水素',
    fuelType: 'chemical',
    heatValue: 9000000,
    energyPerItem: 9.0,
  },
  combustibleUnit: {
    itemId: 1128,
    itemName: '燃焼ユニット',
    fuelType: 'chemical',
    heatValue: 9720000,
    energyPerItem: 9.72,
  },
  // Chemical Fuels (中盤)
  explosiveUnit: {
    itemId: 1129,
    itemName: '爆発ユニット',
    fuelType: 'chemical',
    heatValue: 21600000,
    energyPerItem: 21.6,
  },
  hydrogenFuelRod: {
    itemId: 1801,
    itemName: '水素燃料棒',
    fuelType: 'chemical',
    heatValue: 54000000,
    energyPerItem: 54.0,
  },
  // Chemical Fuels (後半)
  crystalExplosiveUnit: {
    itemId: 1130,
    itemName: '結晶性爆発ユニット',
    fuelType: 'chemical',
    heatValue: 54000000,
    energyPerItem: 54.0,
  },
  // Nuclear Fuels (後半)
  deuteronFuelRod: {
    itemId: 1802,
    itemName: '重水素燃料棒',
    fuelType: 'nuclear',
    heatValue: 600000000,
    energyPerItem: 600,
  },
  // Mass Energy Fuels (終盤)
  antimatterFuelRod: {
    itemId: 1803,
    itemName: '反物質燃料棒',
    fuelType: 'mass',
    heatValue: 7200000000,
    energyPerItem: 7200,
  },
  strangeAnnihilationFuelRod: {
    itemId: 1804,
    itemName: 'ストレンジ物質対消滅燃料棒',
    fuelType: 'mass',
    heatValue: 72000000000,
    energyPerItem: 72000,
  },
};

/**
 * テンプレート別の使用可能な発電設備
 */
export const TEMPLATE_POWER_GENERATORS: Record<
  string,
  PowerGeneratorType[]
> = {
  earlyGame: ['windTurbine', 'thermalPlant', 'geothermal', 'solarPanel'],
  midGame: ['windTurbine', 'thermalPlant', 'geothermal', 'solarPanel'],
  lateGame: [
    'windTurbine',
    'thermalPlant',
    'geothermal',
    'solarPanel',
    'miniFusion',
  ],
  endGame: [
    'windTurbine',
    'thermalPlant',
    'geothermal',
    'solarPanel',
    'miniFusion',
    'artificialStar',
  ],
};

/**
 * テンプレート別の使用可能な燃料
 */
export const TEMPLATE_FUELS: Record<string, string[]> = {
  earlyGame: [
    'coal',
    'crudeOil',
    'refinedOil',
    'energeticGraphite',
    'hydrogen',
    'combustibleUnit',
  ],
  midGame: [
    'coal',
    'crudeOil',
    'refinedOil',
    'energeticGraphite',
    'hydrogen',
    'combustibleUnit',
    'explosiveUnit',
    'hydrogenFuelRod',
  ],
  lateGame: [
    'coal',
    'crudeOil',
    'refinedOil',
    'energeticGraphite',
    'hydrogen',
    'combustibleUnit',
    'explosiveUnit',
    'hydrogenFuelRod',
    'crystalExplosiveUnit',
    'deuteronFuelRod',
  ],
  endGame: [
    'coal',
    'crudeOil',
    'refinedOil',
    'energeticGraphite',
    'hydrogen',
    'combustibleUnit',
    'explosiveUnit',
    'hydrogenFuelRod',
    'crystalExplosiveUnit',
    'deuteronFuelRod',
    'antimatterFuelRod',
    'strangeAnnihilationFuelRod',
  ],
};

/**
 * Artificial Starの燃料別出力マップ (kW)
 */
export const ARTIFICIAL_STAR_OUTPUT_MAP: Record<number, number> = {
  1803: 72000, // Antimatter Fuel Rod: 72.0 MW
  1804: 144000, // Strange Annihilation Fuel Rod: 144.0 MW
};

