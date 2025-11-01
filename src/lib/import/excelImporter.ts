/**
 * Excel importer
 *
 * Excel形式のファイルをパースして ImportResult を返す
 */

import type {
  CSVImportResult,
  ExcelImportOptions,
  ImportError,
  ImportWarning,
} from "../../types/import";
import type {
  PlanInfo,
  ExportStatistics,
  ExportRawMaterial,
  ExportProduct,
  ExportMachine,
  ExportPowerConsumption,
  ExportConveyorBelts,
  ExportPowerGeneration,
} from "../../types/export";
import { EXPORT_VERSION } from "../../types/export";

const DEFAULT_SHEET_NAMES = {
  overview: "Overview",
  rawMaterials: "RawMaterials",
  products: "Products",
  machines: "Machines",
  powerConsumption: "PowerConsumption",
  conveyorBelts: "ConveyorBelts",
  powerGeneration: "PowerGeneration",
  powerGenerators: "PowerGenerators",
};

const DEFAULT_OPTIONS: Required<Omit<ExcelImportOptions, "sheetNames">> & {
  sheetNames: typeof DEFAULT_SHEET_NAMES;
} = {
  validateData: true,
  strictMode: false,
  allowPartialImport: true,
  autoFixErrors: true,
  checkVersion: true,
  sheetNames: DEFAULT_SHEET_NAMES,
};

/**
 * Excel形式のファイルをパースして CSVImportResult を返す
 * @param file Excelファイル
 * @param options インポートオプション
 * @returns インポート結果
 */
export async function importFromExcel(
  file: File,
  options: Partial<ExcelImportOptions> = {}
): Promise<CSVImportResult> {
  const opts = {
    ...DEFAULT_OPTIONS,
    ...options,
    sheetNames: { ...DEFAULT_SHEET_NAMES, ...options.sheetNames },
  };
  const errors: ImportError[] = [];
  const warnings: ImportWarning[] = [];

  try {
    // 動的インポート（bundle sizeを最適化）
    const XLSX = await import("xlsx");

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });

    // ワークブックからシートを抽出
    const sheets: Record<string, string[][]> = {};

    workbook.SheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: "",
      });
      sheets[sheetName] = jsonData as string[][];
    });

    // CSVインポーターと同じ処理を実行
    return processSheets(sheets, opts);
  } catch (error) {
    errors.push({
      type: "parse",
      message: error instanceof Error ? error.message : "Unknown parse error",
    });
    return {
      success: false,
      extractedData: {
        planInfo: {
          name: "",
          timestamp: 0,
          recipeSID: 0,
          recipeName: "",
          targetQuantity: 0,
        },
        statistics: {
          totalMachines: 0,
          totalPower: 0,
          rawMaterialCount: 0,
          itemCount: 0,
        },
        rawMaterials: [],
        products: [],
        machines: [],
        powerConsumption: {
          machines: 0,
          sorters: 0,
          dysonSphere: 0,
          total: 0,
          breakdown: [],
        },
        conveyorBelts: {
          totalBelts: 0,
          totalLength: 0,
          maxSaturation: 0,
        },
      },
      errors,
      warnings,
    };
  }
}

/**
 * シートデータを処理してインポート結果を返す
 */
function processSheets(
  sheets: Record<string, string[][]>,
  options: typeof DEFAULT_OPTIONS
): CSVImportResult {
  const errors: ImportError[] = [];
  const warnings: ImportWarning[] = [];

  try {
    // Overviewシートからメタデータとプラン情報を抽出
    const overviewSheet = sheets[options.sheetNames.overview];
    if (!overviewSheet || overviewSheet.length < 2) {
      errors.push({
        type: "missing_data",
        message: `Overview sheet "${options.sheetNames.overview}" not found or empty`,
      });
      return {
        success: false,
        extractedData: {
          planInfo: {
            name: "",
            timestamp: 0,
            recipeSID: 0,
            recipeName: "",
            targetQuantity: 0,
          },
          statistics: {
            totalMachines: 0,
            totalPower: 0,
            rawMaterialCount: 0,
            itemCount: 0,
          },
          rawMaterials: [],
          products: [],
          machines: [],
          powerConsumption: {
            machines: 0,
            sorters: 0,
            dysonSphere: 0,
            total: 0,
            breakdown: [],
          },
          conveyorBelts: {
            totalBelts: 0,
            totalLength: 0,
            maxSaturation: 0,
          },
        },
        errors,
        warnings,
      };
    }

    // メタデータを抽出
    const metadata = extractMetadataFromOverview(overviewSheet);
    if (options.checkVersion && metadata.version) {
      if (metadata.version !== EXPORT_VERSION) {
        warnings.push({
          type: "version_mismatch",
          message: `Version mismatch: Imported ${metadata.version}, Current ${EXPORT_VERSION}`,
        });
      }
    }

    // プラン情報を抽出
    const planInfo = extractPlanInfoFromOverview(overviewSheet);
    if (!planInfo) {
      errors.push({
        type: "missing_data",
        message: "Plan info not found in Overview sheet",
      });
      return {
        success: false,
        extractedData: {
          planInfo: {
            name: "",
            timestamp: 0,
            recipeSID: 0,
            recipeName: "",
            targetQuantity: 0,
          },
          statistics: {
            totalMachines: 0,
            totalPower: 0,
            rawMaterialCount: 0,
            itemCount: 0,
          },
          rawMaterials: [],
          products: [],
          machines: [],
          powerConsumption: {
            machines: 0,
            sorters: 0,
            dysonSphere: 0,
            total: 0,
            breakdown: [],
          },
          conveyorBelts: {
            totalBelts: 0,
            totalLength: 0,
            maxSaturation: 0,
          },
        },
        errors,
        warnings,
      };
    }

    // 統計情報を抽出
    const statistics = extractStatisticsFromOverview(overviewSheet);

    // 原材料を抽出
    const rawMaterials = extractRawMaterialsFromSheet(sheets[options.sheetNames.rawMaterials]);

    // 製品を抽出
    const products = extractProductsFromSheet(sheets[options.sheetNames.products]);

    // 機械を抽出
    const machines = extractMachinesFromSheet(sheets[options.sheetNames.machines]);

    // 電力消費を抽出
    const powerConsumption = extractPowerConsumptionFromSheet(
      sheets[options.sheetNames.powerConsumption],
      machines
    );

    // ベルト要件を抽出
    const conveyorBelts = extractConveyorBeltsFromSheet(sheets[options.sheetNames.conveyorBelts]);

    // 発電設備を抽出
    const powerGeneration = extractPowerGenerationFromSheets(
      sheets[options.sheetNames.powerGeneration],
      sheets[options.sheetNames.powerGenerators]
    );

    // データ検証
    if (options.validateData) {
      const validation = validateExtractedData({
        planInfo,
        statistics,
        rawMaterials,
        products,
        machines,
        powerConsumption,
        conveyorBelts,
        powerGeneration,
      });

      errors.push(...validation.errors);
      warnings.push(...validation.warnings);

      if (!validation.isValid && options.strictMode) {
        return {
          success: false,
          extractedData: {
            planInfo: {
              name: "",
              timestamp: 0,
              recipeSID: 0,
              recipeName: "",
              targetQuantity: 0,
            },
            statistics: {
              totalMachines: 0,
              totalPower: 0,
              rawMaterialCount: 0,
              itemCount: 0,
            },
            rawMaterials: [],
            products: [],
            machines: [],
            powerConsumption: {
              machines: 0,
              sorters: 0,
              dysonSphere: 0,
              total: 0,
              breakdown: [],
            },
            conveyorBelts: {
              totalBelts: 0,
              totalLength: 0,
              maxSaturation: 0,
            },
          },
          errors,
          warnings,
        };
      }
    }

    return {
      success: errors.length === 0 || options.allowPartialImport,
      extractedData: {
        planInfo: {
          name: planInfo.planName,
          timestamp: metadata.exportDate || Date.now(),
          recipeSID: planInfo.recipeSID,
          recipeName: planInfo.recipeName,
          targetQuantity: planInfo.targetQuantity,
        },
        statistics,
        rawMaterials,
        products,
        machines,
        powerConsumption,
        conveyorBelts,
        powerGeneration,
      },
      errors,
      warnings,
    };
  } catch (error) {
    errors.push({
      type: "parse",
      message: error instanceof Error ? error.message : "Unknown parse error",
    });
    return {
      success: false,
      extractedData: {
        planInfo: {
          name: "",
          timestamp: 0,
          recipeSID: 0,
          recipeName: "",
          targetQuantity: 0,
        },
        statistics: {
          totalMachines: 0,
          totalPower: 0,
          rawMaterialCount: 0,
          itemCount: 0,
        },
        rawMaterials: [],
        products: [],
        machines: [],
        powerConsumption: {
          machines: 0,
          sorters: 0,
          dysonSphere: 0,
          total: 0,
          breakdown: [],
        },
        conveyorBelts: {
          totalBelts: 0,
          totalLength: 0,
          maxSaturation: 0,
        },
      },
      errors,
      warnings,
    };
  }
}

/**
 * Overviewシートからメタデータを抽出
 */
function extractMetadataFromOverview(overviewSheet: string[][]): {
  version?: string;
  exportDate?: number;
} {
  const metadata: { version?: string; exportDate?: number } = {};

  for (const row of overviewSheet) {
    if (row.length < 2) continue;

    const metric = String(row[0]).trim();
    const value = String(row[1]).trim();

    if (metric === "Version") {
      metadata.version = value;
    } else if (metric === "Export Date") {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        metadata.exportDate = date.getTime();
      }
    }
  }

  return metadata;
}

/**
 * Overviewシートからプラン情報を抽出
 */
function extractPlanInfoFromOverview(overviewSheet: string[][]): PlanInfo | null {
  const planInfo: Partial<PlanInfo> = {};

  for (const row of overviewSheet) {
    if (row.length < 2) continue;

    const metric = String(row[0]).trim();
    const value = String(row[1]).trim();

    switch (metric) {
      case "Plan Name":
        planInfo.planName = value;
        break;
      case "Recipe SID":
        planInfo.recipeSID = parseInt(value, 10);
        if (isNaN(planInfo.recipeSID)) {
          return null;
        }
        break;
      case "Recipe Name":
        planInfo.recipeName = value;
        break;
      case "Target Quantity":
        planInfo.targetQuantity = parseFloat(value);
        if (isNaN(planInfo.targetQuantity)) {
          return null;
        }
        break;
    }
  }

  if (
    !planInfo.planName ||
    planInfo.recipeSID === undefined ||
    !planInfo.recipeName ||
    planInfo.targetQuantity === undefined
  ) {
    return null;
  }

  return planInfo as PlanInfo;
}

/**
 * Overviewシートから統計情報を抽出
 */
function extractStatisticsFromOverview(overviewSheet: string[][]): ExportStatistics {
  const statistics: Partial<ExportStatistics> = {
    totalMachines: 0,
    totalPower: 0,
    rawMaterialCount: 0,
    itemCount: 0,
  };

  for (const row of overviewSheet) {
    if (row.length < 2) continue;

    const metric = String(row[0]).trim();
    const value = String(row[1]).trim();

    switch (metric) {
      case "Total Machines":
        statistics.totalMachines = parseFloat(value) || 0;
        break;
      case "Total Power":
        // 電力形式（"12.5 MW"など）をパース
        statistics.totalPower = parsePower(value);
        break;
      case "Raw Materials":
        statistics.rawMaterialCount = parseInt(value, 10) || 0;
        break;
      case "Items":
        statistics.itemCount = parseInt(value, 10) || 0;
        break;
    }
  }

  return statistics as ExportStatistics;
}

/**
 * RawMaterialsシートから原材料を抽出
 */
function extractRawMaterialsFromSheet(sheet: string[][] | undefined): ExportRawMaterial[] {
  const rawMaterials: ExportRawMaterial[] = [];

  if (!sheet || sheet.length < 2) {
    return rawMaterials;
  }

  // ヘッダー行をスキップ
  for (let i = 1; i < sheet.length; i++) {
    const row = sheet[i];
    if (row.length < 4) continue;

    const itemId = parseInt(String(row[0]), 10);
    const itemName = String(row[1]).trim();
    const consumptionRate = parseFloat(String(row[2])) || 0;
    const unit = String(row[3]).trim();

    if (!isNaN(itemId) && itemName) {
      rawMaterials.push({
        itemId,
        itemName,
        consumptionRate,
        unit,
      });
    }
  }

  return rawMaterials;
}

/**
 * Productsシートから製品を抽出
 */
function extractProductsFromSheet(sheet: string[][] | undefined): ExportProduct[] {
  const products: ExportProduct[] = [];

  if (!sheet || sheet.length < 2) {
    return products;
  }

  // ヘッダー行をスキップ
  for (let i = 1; i < sheet.length; i++) {
    const row = sheet[i];
    if (row.length < 6) continue;

    const itemId = parseInt(String(row[0]), 10);
    const itemName = String(row[1]).trim();
    const productionRate = parseFloat(String(row[2])) || 0;
    const consumptionRate = parseFloat(String(row[3])) || 0;
    const netProduction = parseFloat(String(row[4])) || 0;
    const unit = String(row[5]).trim();

    if (!isNaN(itemId) && itemName) {
      products.push({
        itemId,
        itemName,
        productionRate,
        consumptionRate,
        netProduction,
        unit,
      });
    }
  }

  return products;
}

/**
 * Machinesシートから機械を抽出
 */
function extractMachinesFromSheet(sheet: string[][] | undefined): ExportMachine[] {
  const machines: ExportMachine[] = [];

  if (!sheet || sheet.length < 2) {
    return machines;
  }

  // ヘッダー行をスキップ
  for (let i = 1; i < sheet.length; i++) {
    const row = sheet[i];
    if (row.length < 5) continue;

    const machineId = parseInt(String(row[0]), 10);
    const machineName = String(row[1]).trim();
    const count = parseFloat(String(row[2])) || 0;
    const powerPerMachine = parseFloat(String(row[3])) || 0;
    const totalPower = parseFloat(String(row[4])) || 0;

    if (!isNaN(machineId) && machineName) {
      machines.push({
        machineId,
        machineName,
        count,
        powerPerMachine,
        totalPower,
      });
    }
  }

  return machines;
}

/**
 * PowerConsumptionシートから電力消費を抽出
 */
function extractPowerConsumptionFromSheet(
  sheet: string[][] | undefined,
  machines: ExportMachine[]
): ExportPowerConsumption {
  const powerConsumption: Partial<ExportPowerConsumption> = {
    machines: 0,
    sorters: 0,
    dysonSphere: 0,
    total: 0,
    breakdown: [],
  };

  if (!sheet || sheet.length < 2) {
    // breakdownはMachinesから構築
    powerConsumption.breakdown = machines.map(m => ({
      machineId: m.machineId,
      machineName: m.machineName,
      count: m.count,
      powerPerMachine: m.powerPerMachine,
      totalPower: m.totalPower,
    }));
    return powerConsumption as ExportPowerConsumption;
  }

  // ヘッダー行をスキップ
  for (let i = 1; i < sheet.length; i++) {
    const row = sheet[i];
    if (row.length < 2) continue;

    const category = String(row[0]).trim();
    const power = parseFloat(String(row[1])) || 0;

    switch (category) {
      case "Machines":
        powerConsumption.machines = power;
        break;
      case "Sorters":
        powerConsumption.sorters = power;
        break;
      case "DysonSphere":
        powerConsumption.dysonSphere = power;
        break;
      case "Total":
        powerConsumption.total = power;
        break;
    }
  }

  // breakdownはMachinesから構築
  powerConsumption.breakdown = machines.map(m => ({
    machineId: m.machineId,
    machineName: m.machineName,
    count: m.count,
    powerPerMachine: m.powerPerMachine,
    totalPower: m.totalPower,
  }));

  return powerConsumption as ExportPowerConsumption;
}

/**
 * ConveyorBeltsシートからベルト要件を抽出
 */
function extractConveyorBeltsFromSheet(sheet: string[][] | undefined): ExportConveyorBelts {
  const conveyorBelts: Partial<ExportConveyorBelts> = {
    totalBelts: 0,
    totalLength: 0,
    maxSaturation: 0,
  };

  if (!sheet || sheet.length < 2) {
    return conveyorBelts as ExportConveyorBelts;
  }

  // ヘッダー行をスキップ
  for (let i = 1; i < sheet.length; i++) {
    const row = sheet[i];
    if (row.length < 2) continue;

    const metric = String(row[0]).trim();
    const value = parseFloat(String(row[1])) || 0;

    switch (metric) {
      case "TotalBelts":
        conveyorBelts.totalBelts = value;
        break;
      case "MaxSaturation":
        conveyorBelts.maxSaturation = value;
        break;
      case "BottleneckType": {
        const type = String(row[1]).trim();
        if (type === "input" || type === "output") {
          conveyorBelts.bottleneckType = type;
        }
        break;
      }
    }
  }

  return conveyorBelts as ExportConveyorBelts;
}

/**
 * PowerGenerationシートとPowerGeneratorsシートから発電設備を抽出
 */
function extractPowerGenerationFromSheets(
  powerGenerationSheet: string[][] | undefined,
  powerGeneratorsSheet: string[][] | undefined
): ExportPowerGeneration | undefined {
  if (!powerGenerationSheet && !powerGeneratorsSheet) {
    return undefined;
  }

  const powerGeneration: Partial<ExportPowerGeneration> = {
    totalRequiredPower: 0,
    totalGeneratedPower: 0,
    generators: [],
  };

  // PowerGeneration シートから基本情報を抽出
  if (powerGenerationSheet && powerGenerationSheet.length > 1) {
    // ヘッダー行をスキップ
    for (let i = 1; i < powerGenerationSheet.length; i++) {
      const row = powerGenerationSheet[i];
      if (row.length < 2) continue;

      const metric = String(row[0]).trim();
      const value = String(row[1]).trim();

      switch (metric) {
        case "TotalRequiredPower":
          powerGeneration.totalRequiredPower = parseFloat(value) || 0;
          break;
        case "TotalGeneratedPower":
          powerGeneration.totalGeneratedPower = parseFloat(value) || 0;
          break;
      }
    }
  }

  // PowerGenerators シートから発電設備情報を抽出
  if (powerGeneratorsSheet && powerGeneratorsSheet.length > 1) {
    // ヘッダー行をスキップ
    for (let i = 1; i < powerGeneratorsSheet.length; i++) {
      const row = powerGeneratorsSheet[i];
      if (row.length < 6) continue;

      const generatorId = parseInt(String(row[0]), 10);
      const generatorName = String(row[1]).trim();
      const count = parseFloat(String(row[2])) || 0;
      const powerPerGenerator = parseFloat(String(row[3])) || 0;
      const totalPower = parseFloat(String(row[4])) || 0;
      const fuelInfo = String(row[5]).trim();

      if (!isNaN(generatorId) && generatorName) {
        // 燃料情報をパース（"0.5 石炭" 形式）
        const fuel: ExportPowerGeneration["generators"][0]["fuel"] = [];
        if (fuelInfo && fuelInfo !== "N/A") {
          const fuelParts = fuelInfo.split(";");
          for (const fuelPart of fuelParts) {
            const trimmed = fuelPart.trim();
            const match = trimmed.match(/^([\d.]+)\s+(.+)$/);
            if (match) {
              const consumptionRate = parseFloat(match[1]);
              const itemName = match[2].trim();
              if (!isNaN(consumptionRate) && itemName) {
                fuel.push({
                  itemId: 0, // Excelには含まれないためデフォルト値
                  itemName,
                  consumptionRate,
                  unit: "items/sec",
                });
              }
            }
          }
        }

        powerGeneration.generators!.push({
          generatorId,
          generatorName,
          count,
          powerPerGenerator,
          totalPower,
          fuel: fuel.length > 0 ? fuel : undefined,
        });
      }
    }
  }

  return powerGeneration.generators!.length > 0
    ? (powerGeneration as ExportPowerGeneration)
    : undefined;
}

/**
 * 電力形式の文字列をパース（"12.5 MW" → 12500 kW）
 */
function parsePower(powerStr: string): number {
  const trimmed = String(powerStr).trim();
  if (!trimmed) return 0;

  // 数値のみの場合
  const numMatch = trimmed.match(/^([\d.]+)$/);
  if (numMatch) {
    return parseFloat(numMatch[1]);
  }

  // 単位付きの場合（"12.5 MW"など）
  const unitMatch = trimmed.match(/^([\d.]+)\s*(kW|MW|GW)$/i);
  if (unitMatch) {
    const value = parseFloat(unitMatch[1]);
    const unit = unitMatch[2].toUpperCase();

    switch (unit) {
      case "GW":
        return value * 1_000_000; // GW → kW
      case "MW":
        return value * 1_000; // MW → kW
      case "KW":
        return value;
      default:
        return 0;
    }
  }

  return 0;
}

/**
 * 抽出されたデータを検証
 */
function validateExtractedData(data: {
  planInfo: PlanInfo | null;
  statistics: ExportStatistics;
  rawMaterials: ExportRawMaterial[];
  products: ExportProduct[];
  machines: ExportMachine[];
  powerConsumption: ExportPowerConsumption;
  conveyorBelts: ExportConveyorBelts;
  powerGeneration?: ExportPowerGeneration;
}): { isValid: boolean; errors: ImportError[]; warnings: ImportWarning[] } {
  const errors: ImportError[] = [];
  const warnings: ImportWarning[] = [];

  if (!data.planInfo) {
    errors.push({
      type: "missing_data",
      message: "Plan info is missing",
    });
  }

  if (data.statistics.totalMachines < 0) {
    warnings.push({
      type: "partial_data",
      message: "Total machines count is negative",
    });
  }

  if (data.statistics.totalPower < 0) {
    warnings.push({
      type: "partial_data",
      message: "Total power consumption is negative",
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
