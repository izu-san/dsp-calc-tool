/**
 * 発電設備計算に関する型定義
 */

/**
 * 発電設備の種類
 */
export type PowerGeneratorType =
  | 'windTurbine' // 風力タービン (id: 2203)
  | 'thermalPlant' // 火力発電所 (id: 2204)
  | 'solarPanel' // ソーラーパネル (id: 2205)
  | 'geothermal' // 地熱発電所 (id: 2213)
  | 'miniFusion' // ミニ核融合発電所 (id: 2211)
  | 'artificialStar'; // 人工恒星 (id: 2210)

/**
 * 燃料の種類
 */
export type FuelType = 'chemical' | 'nuclear' | 'mass';

/**
 * 燃料アイテム情報
 */
export interface FuelItem {
  /** アイテムID */
  itemId: number;
  /** アイテム名 */
  itemName: string;
  /** 燃料タイプ */
  fuelType: FuelType;
  /** 熱量 (J) */
  heatValue: number;
  /** エネルギー量 (MJ) */
  energyPerItem: number;
}

/**
 * 発電設備情報
 */
export interface PowerGeneratorInfo {
  /** 施設ID */
  machineId: number;
  /** 施設名 */
  machineName: string;
  /** 発電設備タイプ */
  type: PowerGeneratorType;
  /** 基本出力 (kW) */
  baseOutput: number;
  /** 発電効率 (0-1, 1 = 100%) */
  efficiency: number;
  /** 受け入れ可能な燃料タイプ */
  acceptedFuelTypes: FuelType[];
  /** 出力が変動するか（風力・太陽光・地熱など） */
  isVariableOutput: boolean;
  /** 稼働率 (0-1, Solar Panelなど) */
  operatingRate: number;
  /** 燃料消費速度 (per tick) - XMLのuseFuelPerTick */
  useFuelPerTick: number;
}

/**
 * 発電計算結果
 */
export interface PowerGenerationResult {
  /** 必要電力 (kW) */
  requiredPower: number;
  /** 発電設備の割り当て（複数対応） */
  generators: GeneratorAllocation[];
  /** 総設備台数 */
  totalGenerators: number;
  /** 総燃料消費量 (itemId -> 個/秒) */
  totalFuelConsumption: Map<number, number>;
}

/**
 * 発電設備の割り当て
 */
export interface GeneratorAllocation {
  /** 発電設備情報 */
  generator: PowerGeneratorInfo;
  /** 使用燃料（燃料不要の場合はnull） */
  fuel: FuelItem | null;
  /** 必要台数 */
  count: number;
  /** 総出力 (kW) */
  totalOutput: number;
  /** 燃料消費速度 (個/秒) - 燃料不要の場合は0 */
  fuelConsumptionRate: number;
}

