/**
 * 臨界光子生成の電力計算ロジック
 * Ray Receiver（γ線レシーバー）による光子生成に関する計算を行う
 */

/**
 * 光子生成の理論電力と生成量
 */
export interface PhotonGenerationRate {
  theoreticalPower: number; // MW (理論値)
  productionRate: number; // 個/秒
}

/**
 * 放射線伝送効率を計算する
 * @param researchLevel 研究レベル (0-10000)
 * @returns 伝送効率 (0-1の範囲、100%が最大)
 */
export function calculateRayTransmissionEfficiency(researchLevel: number): number {
  // 効率テーブル（%）
  const EFFICIENCY_TABLE = [
    30.0, // Lv 0
    37.0, // Lv 1
    43.3, // Lv 2
    48.97, // Lv 3
    54.07, // Lv 4
    58.67, // Lv 5
    62.8, // Lv 6
    68.38, // Lv 7
  ];

  if (researchLevel <= 6) {
    return EFFICIENCY_TABLE[researchLevel] / 100;
  }

  // Lv 7以降: 100 - (31.62 * 0.85^(Lv-7)) %
  const loss = 31.62 * Math.pow(0.85, researchLevel - 7);
  const efficiency = 100 - loss;
  return efficiency / 100;
}

/**
 * 放射線伝送効率が表示上100.00%になる最小レベルを計算
 * 99.995%以上（損失が0.00005%未満）になるレベルを求める
 */
export function getMaxMeaningfulResearchLevel(): number {
  // 損失: 31.62 * 0.85^(level-7) < 0.00005
  // 0.85^(level-7) < 0.00005 / 31.62
  // (level-7) * log(0.85) < log(0.00005 / 31.62)
  // level < 7 + log(0.00005 / 31.62) / log(0.85)
  
  const threshold = 0.00005; // 0.00%と表示される閾値
  const baseLoss = 31.62;
  const decayRate = 0.85;
  
  const maxLevel = Math.ceil(7 + Math.log(threshold / baseLoss) / Math.log(decayRate));
  
  // 最大10000を超えないようにする
  return Math.min(maxLevel, 10000);
}

/**
 * 受信効率を計算する
 * @param solarEnergyLoss 太陽光線エネルギー損失(基礎) (0-1)
 * @param continuousReception 連続受信率 (0-100)
 * @returns 受信効率 (0-1の範囲)
 */
export function calculateReceptionEfficiency(
  solarEnergyLoss: number,
  continuousReception: number
): number {
  // 受信効率 = 100% - 太陽光線エネルギー損失(基礎) × (1 - 0.4 × 連続受信)
  return 1 - solarEnergyLoss * (1 - 0.4 * (continuousReception / 100));
}

/**
 * 臨界光子生成の理論電力と生成量を取得する
 * @param useGravitonLens 重力子レンズを使用するか
 * @param continuousReception 連続受信率 (0-100)
 * @param proliferatorSpeedBonus 増産剤の速度ボーナス (0-1)
 * @returns 理論電力と生成量
 */
export function getPhotonGenerationRate(
  useGravitonLens: boolean,
  continuousReception: number,
  proliferatorSpeedBonus: number
): PhotonGenerationRate {
  const isHighReception = continuousReception >= 100;

  let theoreticalPower: number;
  let baseProductionRate: number;

  if (!useGravitonLens) {
    theoreticalPower = isHighReception ? 120 : 48.0; // MW
    baseProductionRate = isHighReception ? 0.1 : 0.04; // 個/秒
  } else {
    theoreticalPower = isHighReception ? 240 : 96.0; // MW
    baseProductionRate = isHighReception ? 0.2 : 0.08; // 個/秒
  }

  // 増産剤の効果を適用（速度上昇）
  const speedMultiplier = 1 + proliferatorSpeedBonus;
  theoreticalPower *= speedMultiplier;
  baseProductionRate *= speedMultiplier;

  return { theoreticalPower, productionRate: baseProductionRate };
}

/**
 * ダイソンスフィアから必要な電力を計算する
 * @param theoreticalPower 理論電力 (MW)
 * @param receptionEfficiency 受信効率 (0-1)
 * @returns 要求電力 (kW)
 */
export function calculateRequiredPower(
  theoreticalPower: number,
  receptionEfficiency: number
): number {
  // 要求電力 = 理論電力 / 受信効率
  const requiredPowerMW = theoreticalPower / receptionEfficiency;
  return requiredPowerMW * 1000; // MW -> kW
}

