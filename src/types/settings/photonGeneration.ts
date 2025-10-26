import type { ProliferatorConfig } from './proliferator';

/**
 * 光子生成設定
 * Ray Receiver（γ線レシーバー）による臨界光子生成に関する設定
 */
export interface PhotonGenerationSettings {
  useGravitonLens: boolean; // 重力子レンズを使用するか
  gravitonLensProliferator: ProliferatorConfig; // 重力子レンズへの増産剤
  rayTransmissionEfficiency: number; // 放射線伝送効率の研究レベル (0-10000)
  continuousReception: number; // 連続受信率（固定100%）
}

/**
 * デフォルト光子生成設定
 */
export const DEFAULT_PHOTON_GENERATION_SETTINGS: PhotonGenerationSettings = {
  useGravitonLens: false,
  gravitonLensProliferator: {
    type: 'none',
    mode: 'speed',
    speedBonus: 0,
    productionBonus: 0,
    powerIncrease: 0,
  },
  rayTransmissionEfficiency: 0,
  continuousReception: 100, // 固定100%
};

