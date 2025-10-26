/**
 * 発電設備計算ロジック
 *
 * 生産統計の総電力から必要な発電設備の台数と燃料消費量を算出する。
 */

import {
  POWER_GENERATORS,
  FUEL_ITEMS,
  TEMPLATE_POWER_GENERATORS,
  TEMPLATE_FUELS,
  ARTIFICIAL_STAR_OUTPUT_MAP,
} from '@/constants/powerGeneration';
import type {
  PowerGenerationResult,
  GeneratorAllocation,
  PowerGeneratorInfo,
  FuelItem,
  PowerGeneratorType,
} from '@/types/power-generation';
import type { GameTemplate } from '@/types/settings/templates';

/**
 * 発電設備計算のメイン関数
 *
 * @param requiredPower - 必要電力 (kW)
 * @param template - ゲームテンプレート
 * @param manualGenerator - 手動選択された発電設備（nullの場合は自動選択）
 * @param manualFuel - 手動選択された燃料（nullの場合は自動選択）
 * @returns 発電計算結果
 */
export function calculatePowerGeneration(
  requiredPower: number,
  template: GameTemplate,
  manualGenerator?: PowerGeneratorType | null,
  manualFuel?: string | null
): PowerGenerationResult {
  // 必要電力が0以下の場合は空の結果を返す
  if (requiredPower <= 0) {
    return {
      requiredPower: 0,
      generators: [],
      totalGenerators: 0,
      totalFuelConsumption: new Map(),
    };
  }

  // 発電設備の選択: 手動選択があればそれを優先、なければ自動選択
  let bestGenerator: PowerGeneratorInfo | null = null;
  if (manualGenerator) {
    // 手動選択された発電設備を使用
    bestGenerator = POWER_GENERATORS[manualGenerator];
  } else {
    // テンプレートで使用可能な発電設備から自動選択
    const availableGeneratorTypes =
      TEMPLATE_POWER_GENERATORS[template] || TEMPLATE_POWER_GENERATORS.endGame;
    bestGenerator = selectBestGenerator(availableGeneratorTypes);
  }

  if (!bestGenerator) {
    // 発電設備が見つからない場合（通常はありえない）
    return {
      requiredPower,
      generators: [],
      totalGenerators: 0,
      totalFuelConsumption: new Map(),
    };
  }

  // 燃料の選択: 手動選択があればそれを優先、なければ自動選択
  let bestFuel: FuelItem | null = null;
  if (bestGenerator.acceptedFuelTypes.length > 0) {
    if (manualFuel) {
      // 手動選択された燃料を使用
      bestFuel = FUEL_ITEMS[manualFuel] || null;
    } else {
      // 自動選択の場合
      if (manualGenerator) {
        // 手動で発電設備を選択している場合は、全燃料から最適な燃料を選択
        const allFuelKeys = Object.keys(FUEL_ITEMS);
        bestFuel = selectBestFuel(
          bestGenerator.acceptedFuelTypes[0],
          allFuelKeys
        );
      } else {
        // テンプレートで使用可能な燃料から自動選択
        const availableFuels = TEMPLATE_FUELS[template] || TEMPLATE_FUELS.endGame;
        bestFuel = selectBestFuel(
          bestGenerator.acceptedFuelTypes[0],
          availableFuels
        );
      }
    }
  }

  // 実際の出力を計算（稼働率を考慮）
  let actualOutput = bestGenerator.baseOutput * bestGenerator.operatingRate;

  // Artificial Starの場合、燃料によって出力が変わる
  if (
    bestGenerator.type === 'artificialStar' &&
    bestFuel &&
    ARTIFICIAL_STAR_OUTPUT_MAP[bestFuel.itemId]
  ) {
    actualOutput = ARTIFICIAL_STAR_OUTPUT_MAP[bestFuel.itemId];
  }

  // 必要台数を計算（切り上げ）
  const count = Math.ceil(requiredPower / actualOutput);

  // 総出力を計算
  const totalOutput = actualOutput * count;

  // 燃料消費速度を計算
  const fuelConsumptionRate = bestFuel
    ? calculateFuelConsumption(bestGenerator, bestFuel, count)
    : 0;

  // 発電設備の割り当て
  const allocation: GeneratorAllocation = {
    generator: bestGenerator,
    fuel: bestFuel,
    count,
    totalOutput,
    fuelConsumptionRate,
  };

  // 総燃料消費量マップを作成
  const totalFuelConsumption = new Map<number, number>();
  if (bestFuel && fuelConsumptionRate > 0) {
    totalFuelConsumption.set(bestFuel.itemId, fuelConsumptionRate);
  }

  return {
    requiredPower,
    generators: [allocation],
    totalGenerators: count,
    totalFuelConsumption,
  };
}

/**
 * 最も高出力の発電設備を選択
 *
 * @param availableTypes - 使用可能な発電設備タイプ
 * @returns 最も高出力の発電設備
 */
function selectBestGenerator(
  availableTypes: PowerGeneratorType[]
): PowerGeneratorInfo | null {
  if (availableTypes.length === 0) {
    return null;
  }

  let bestGenerator: PowerGeneratorInfo | null = null;
  let maxOutput = 0;

  for (const type of availableTypes) {
    const generator = POWER_GENERATORS[type];
    const effectiveOutput = generator.baseOutput * generator.operatingRate;

    if (effectiveOutput > maxOutput) {
      maxOutput = effectiveOutput;
      bestGenerator = generator;
    }
  }

  return bestGenerator;
}

/**
 * 最もエネルギー効率が良い燃料を選択
 *
 * @param fuelType - 燃料タイプ
 * @param availableFuelKeys - 使用可能な燃料キー
 * @returns 最もエネルギー効率が良い燃料
 */
function selectBestFuel(
  fuelType: string,
  availableFuelKeys: string[]
): FuelItem | null {
  const matchingFuels = availableFuelKeys
    .map((key) => FUEL_ITEMS[key])
    .filter((fuel) => fuel && fuel.fuelType === fuelType);

  if (matchingFuels.length === 0) {
    return null;
  }

  // エネルギー量が最も高い燃料を選択
  return matchingFuels.reduce((best, current) =>
    current.energyPerItem > best.energyPerItem ? current : best
  );
}

/**
 * 燃料消費速度を計算
 *
 * 計算式: (useFuelPerTick * 60) / heatValue * count
 *
 * @param generator - 発電設備
 * @param fuel - 燃料
 * @param count - 発電設備の台数
 * @returns 燃料消費速度 (個/秒)
 */
function calculateFuelConsumption(
  generator: PowerGeneratorInfo,
  fuel: FuelItem,
  count: number
): number {
  if (generator.useFuelPerTick === 0 || fuel.heatValue === 0) {
    return 0;
  }

  // 1台あたりの燃料消費速度 (個/秒)
  const consumptionPerGenerator =
    (generator.useFuelPerTick * 60) / fuel.heatValue;

  // 総燃料消費速度
  return consumptionPerGenerator * count;
}

/**
 * 発電設備の実際の出力を取得（Artificial Star対応）
 *
 * @param generator - 発電設備
 * @param fuel - 燃料（nullの場合は基本出力を返す）
 * @returns 実際の出力 (kW)
 */
export function getActualOutput(
  generator: PowerGeneratorInfo,
  fuel: FuelItem | null
): number {
  // Artificial Starで燃料が指定されている場合
  if (
    generator.type === 'artificialStar' &&
    fuel &&
    ARTIFICIAL_STAR_OUTPUT_MAP[fuel.itemId]
  ) {
    return ARTIFICIAL_STAR_OUTPUT_MAP[fuel.itemId];
  }

  // 通常の場合は基本出力 * 稼働率
  return generator.baseOutput * generator.operatingRate;
}

