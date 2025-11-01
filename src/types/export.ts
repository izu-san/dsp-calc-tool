import type { GlobalSettings } from "./settings";

export const EXPORT_VERSION = "1.0.0";

export interface ExportData {
  version: string;
  exportDate: number;
  planInfo: PlanInfo;
  settings: GlobalSettings;
  statistics: ExportStatistics;
  rawMaterials: ExportRawMaterial[];
  products: ExportProduct[];
  machines: ExportMachine[];
  powerConsumption: ExportPowerConsumption;
  conveyorBelts: ExportConveyorBelts;
  powerGeneration: ExportPowerGeneration;
}

export interface PlanInfo {
  planName: string;
  recipeSID: number;
  recipeName: string;
  targetQuantity: number;
}

export interface ExportStatistics {
  totalMachines: number;
  totalPower: number; // kW
  rawMaterialCount: number;
  itemCount: number;
}

export interface ExportRawMaterial {
  itemId: number;
  itemName: string;
  consumptionRate: number; // /s
  unit: string;
}

export interface ExportProduct {
  itemId: number;
  itemName: string;
  productionRate: number; // /s
  consumptionRate: number; // /s
  netProduction: number; // /s
  unit: string;
}

export interface ExportMachine {
  machineId: number;
  machineName: string;
  count: number;
  powerPerMachine: number; // kW
  totalPower: number; // kW
}

export interface ExportPowerConsumption {
  machines: number; // kW
  sorters: number; // kW
  dysonSphere: number; // kW
  total: number; // kW
  breakdown: {
    machineId: number;
    machineName: string;
    count: number;
    powerPerMachine: number;
    totalPower: number;
  }[];
}

export interface ExportConveyorBelts {
  totalBelts: number;
  totalLength: number; // meters
  maxSaturation: number; // %
  bottleneckType?: "input" | "output";
}

export interface ExportPowerGeneration {
  totalRequiredPower: number; // kW
  totalGeneratedPower: number; // kW
  generators: {
    generatorId: number;
    generatorName: string;
    count: number;
    powerPerGenerator: number; // kW
    totalPower: number; // kW
    fuel?: {
      itemId: number;
      itemName: string;
      consumptionRate: number; // /s
      unit: string;
    }[];
  }[];
}

/**
 * 画像エクスポートのオプション
 */
export interface ImageExportOptions {
  resolution: "1x" | "2x" | "4x";
  format: "png" | "jpeg" | "webp";
  quality: number; // 0-100
  includeViews: {
    statistics: boolean;
    powerGraph: boolean;
    buildingCost: boolean;
    powerGeneration: boolean;
  };
  customLayout: boolean;
  backgroundColor: string;
  padding: number;
}

/**
 * 画像エクスポートのためのDOM要素情報
 */
export interface ViewElementInfo {
  selector: string;
  name: string;
}
