import type { Recipe, Machine, Item } from '../types/game-data';

/**
 * 臨界光子のアイテムデータ
 * ID: 1208
 */
export const CRITICAL_PHOTON_ITEM: Item = {
  id: 1208,
  name: 'Critical Photon',
  Type: 'Material',
  isRaw: false,
};

/**
 * 重力子レンズのアイテムデータ
 * ID: 1209
 */
export const GRAVITON_LENS_ITEM: Item = {
  id: 1209,
  name: 'Graviton Lens',
  Type: 'Material',
  isRaw: false,
};

/**
 * Ray Receiver（γ線レシーバー）の機械データ
 * ID: 2208
 */
export const RAY_RECEIVER_MACHINE: Machine = {
  id: 2208,
  name: 'Ray Receiver',
  Type: 'PhotonGenerator',
  isRaw: false,
  assemblerSpeed: 10000, // 100% base speed
  workEnergyPerTick: 0, // ダイソンスフィア電力を別計算するため0
  idleEnergyPerTick: 0,
  exchangeEnergyPerTick: 0,
  isPowerConsumer: false, // 通常電力は消費しない
  isPowerExchanger: true, // ダイソンスフィアと電力交換
};

/**
 * 臨界光子生成レシピ（Ray Receiver 光子生成モード）
 * SID: -1（特殊レシピを示す）
 */
export const CRITICAL_PHOTON_RECIPE: Recipe = {
  SID: -1,
  name: 'Critical Photon (Ray Receiver)',
  Type: 'PhotonGeneration',
  Explicit: true,
  TimeSpend: 60, // 1秒 = 60 ticks
  Items: [], // 重力子レンズは動的に追加される
  Results: [
    {
      id: 1208,
      name: 'Critical Photon',
      count: 1,
      Type: 'Material',
      isRaw: false,
    },
  ],
  GridIndex: '0000', // 特殊レシピなのでグリッド位置なし
  productive: false, // Ray Receiver本体には増産剤を適用できない
};

/**
 * 重力子レンズの消費速度（Ray Receiver 1機あたり）
 * 0.1個/分 = 0.1/60 個/秒
 */
export const GRAVITON_LENS_CONSUMPTION_RATE = 0.1 / 60;

