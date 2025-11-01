/**
 * CSV importer
 *
 * CSV形式のファイルをパースして ImportResult を返す
 */

import type {
  CSVImportResult,
  CSVImportOptions,
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

const DEFAULT_OPTIONS: Required<CSVImportOptions> = {
  validateData: true,
  strictMode: false,
  allowPartialImport: true,
  autoFixErrors: true,
  checkVersion: true,
};

/**
 * CSV形式のテキストをパースして CSVImportResult を返す
 * @param csvText CSV形式のテキスト
 * @param options インポートオプション
 * @returns インポート結果
 */
export function importFromCSV(
  csvText: string,
  options: Partial<CSVImportOptions> = {}
): CSVImportResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const errors: ImportError[] = [];
  const warnings: ImportWarning[] = [];

  try {
    // CSVをセクションに分割
    const sections = parseCSVSections(csvText);

    // メタデータを抽出
    const metadata = extractMetadata(sections);
    if (opts.checkVersion && metadata.version) {
      if (metadata.version !== EXPORT_VERSION) {
        warnings.push({
          type: "version_mismatch",
          message: `Version mismatch: Imported ${metadata.version}, Current ${EXPORT_VERSION}`,
        });
      }
    }

    // プラン情報を抽出
    const planInfo = extractPlanInfo(sections);
    if (!planInfo) {
      errors.push({
        type: "missing_data",
        message: "Plan info section not found or invalid",
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
    const statistics = extractStatistics(sections);

    // 原材料を抽出
    const rawMaterials = extractRawMaterials(sections);

    // 製品を抽出
    const products = extractProducts(sections);

    // 機械を抽出
    const machines = extractMachines(sections);

    // 電力消費を抽出
    const powerConsumption = extractPowerConsumption(sections);

    // ベルト要件を抽出
    const conveyorBelts = extractConveyorBelts(sections);

    // 発電設備を抽出
    const powerGeneration = extractPowerGeneration(sections);

    // データ検証
    if (opts.validateData) {
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

      if (!validation.isValid && opts.strictMode) {
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
      success: errors.length === 0 || opts.allowPartialImport,
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
 * CSVテキストをセクションごとに分割する
 */
function parseCSVSections(csvText: string): Record<string, string[][]> {
  const sections: Record<string, string[][]> = {};
  const lines = csvText.split(/\r?\n/);
  let currentSection = "";
  let currentSectionData: string[][] = [];

  for (const line of lines) {
    const trimmedLine = line.trim();

    // 空行をスキップ
    if (!trimmedLine) {
      continue;
    }

    // セクションヘッダー（# で始まる）の検出
    if (trimmedLine.startsWith("# ")) {
      // 前のセクションを保存
      if (currentSection && currentSectionData.length > 0) {
        sections[currentSection] = currentSectionData;
      }

      // 新しいセクションの開始
      currentSection = trimmedLine.substring(2).trim();
      currentSectionData = [];
      continue;
    }

    // データ行の処理
    const row = parseCSVRow(trimmedLine);
    if (row.length > 0) {
      currentSectionData.push(row);
    }
  }

  // 最後のセクションを保存
  if (currentSection && currentSectionData.length > 0) {
    sections[currentSection] = currentSectionData;
  }

  return sections;
}

/**
 * CSV行をパースする（カンマ区切り、引用符対応）
 */
function parseCSVRow(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // エスケープされた引用符
        current += '"';
        i++;
      } else {
        // 引用符の開始/終了
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      // カンマで区切る（引用符外）
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  // 最後のフィールド
  result.push(current.trim());

  return result;
}

/**
 * メタデータを抽出
 */
function extractMetadata(sections: Record<string, string[][]>): {
  version?: string;
  exportDate?: number;
} {
  const metadata: { version?: string; exportDate?: number } = {};

  if (sections.Metadata) {
    for (const row of sections.Metadata) {
      if (row.length < 2) continue;

      const key = row[0].trim();
      const value = row[1].trim();

      if (key === "Version") {
        metadata.version = value;
      } else if (key === "ExportDate") {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          metadata.exportDate = date.getTime();
        }
      }
    }
  }

  return metadata;
}

/**
 * プラン情報を抽出
 */
function extractPlanInfo(sections: Record<string, string[][]>): PlanInfo | null {
  if (!sections["Plan Info"]) {
    return null;
  }

  const planInfo: Partial<PlanInfo> = {};

  for (const row of sections["Plan Info"]) {
    if (row.length < 2) continue;

    const key = row[0].trim();
    const value = row[1].trim();

    switch (key) {
      case "PlanName":
        planInfo.planName = value;
        break;
      case "RecipeSID":
        planInfo.recipeSID = parseInt(value, 10);
        if (isNaN(planInfo.recipeSID)) {
          return null;
        }
        break;
      case "RecipeName":
        planInfo.recipeName = value;
        break;
      case "TargetQuantity":
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
 * 統計情報を抽出
 */
function extractStatistics(sections: Record<string, string[][]>): ExportStatistics {
  const statistics: Partial<ExportStatistics> = {
    totalMachines: 0,
    totalPower: 0,
    rawMaterialCount: 0,
    itemCount: 0,
  };

  if (sections.Statistics) {
    for (const row of sections.Statistics) {
      if (row.length < 2) continue;

      const key = row[0].trim();
      const value = row[1].trim();

      switch (key) {
        case "TotalMachines":
          statistics.totalMachines = parseFloat(value) || 0;
          break;
        case "TotalPower":
          // 電力形式（"12.5 MW"など）をパース
          statistics.totalPower = parsePower(value);
          break;
        case "RawMaterialCount":
          statistics.rawMaterialCount = parseInt(value, 10) || 0;
          break;
        case "ItemCount":
          statistics.itemCount = parseInt(value, 10) || 0;
          break;
      }
    }
  }

  return statistics as ExportStatistics;
}

/**
 * 原材料を抽出
 */
function extractRawMaterials(sections: Record<string, string[][]>): ExportRawMaterial[] {
  const rawMaterials: ExportRawMaterial[] = [];

  if (sections.RawMaterials && sections.RawMaterials.length > 1) {
    // ヘッダー行をスキップ
    for (let i = 1; i < sections.RawMaterials.length; i++) {
      const row = sections.RawMaterials[i];
      if (row.length < 4) continue;

      const itemId = parseInt(row[0], 10);
      const itemName = row[1].trim();
      const consumptionRate = parseRate(row[2].trim());
      const unit = row[3].trim();

      if (!isNaN(itemId) && itemName && !isNaN(consumptionRate)) {
        rawMaterials.push({
          itemId,
          itemName,
          consumptionRate,
          unit,
        });
      }
    }
  }

  return rawMaterials;
}

/**
 * 製品を抽出
 */
function extractProducts(sections: Record<string, string[][]>): ExportProduct[] {
  const products: ExportProduct[] = [];

  if (sections.Products && sections.Products.length > 1) {
    // ヘッダー行をスキップ
    for (let i = 1; i < sections.Products.length; i++) {
      const row = sections.Products[i];
      if (row.length < 6) continue;

      const itemId = parseInt(row[0], 10);
      const itemName = row[1].trim();
      const productionRate = parseRate(row[2].trim());
      const consumptionRate = parseRate(row[3].trim());
      const netProduction = parseRate(row[4].trim());
      const unit = row[5].trim();

      if (!isNaN(itemId) && itemName && !isNaN(productionRate)) {
        products.push({
          itemId,
          itemName,
          productionRate,
          consumptionRate: isNaN(consumptionRate) ? 0 : consumptionRate,
          netProduction: isNaN(netProduction) ? 0 : netProduction,
          unit,
        });
      }
    }
  }

  return products;
}

/**
 * 機械を抽出
 */
function extractMachines(sections: Record<string, string[][]>): ExportMachine[] {
  const machines: ExportMachine[] = [];

  if (sections.Machines && sections.Machines.length > 1) {
    // ヘッダー行をスキップ
    for (let i = 1; i < sections.Machines.length; i++) {
      const row = sections.Machines[i];
      if (row.length < 5) continue;

      const machineId = parseInt(row[0], 10);
      const machineName = row[1].trim();
      const count = parseFloat(row[2].trim());
      const powerPerMachine = parsePower(row[3].trim());
      const totalPower = parsePower(row[4].trim());

      if (!isNaN(machineId) && machineName && !isNaN(count)) {
        machines.push({
          machineId,
          machineName,
          count,
          powerPerMachine: isNaN(powerPerMachine) ? 0 : powerPerMachine,
          totalPower: isNaN(totalPower) ? 0 : totalPower,
        });
      }
    }
  }

  return machines;
}

/**
 * 電力消費を抽出
 */
function extractPowerConsumption(sections: Record<string, string[][]>): ExportPowerConsumption {
  const powerConsumption: Partial<ExportPowerConsumption> = {
    machines: 0,
    sorters: 0,
    dysonSphere: 0,
    total: 0,
    breakdown: [],
  };

  if (sections.PowerConsumption && sections.PowerConsumption.length > 1) {
    // ヘッダー行をスキップ
    for (let i = 1; i < sections.PowerConsumption.length; i++) {
      const row = sections.PowerConsumption[i];
      if (row.length < 2) continue;

      const category = row[0].trim();
      const power = parsePower(row[1].trim());

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
  }

  // breakdownはMachinesセクションから構築
  if (sections.Machines && sections.Machines.length > 1) {
    powerConsumption.breakdown = [];
    for (let i = 1; i < sections.Machines.length; i++) {
      const row = sections.Machines[i];
      if (row.length < 5) continue;

      const machineId = parseInt(row[0], 10);
      const machineName = row[1].trim();
      const count = parseFloat(row[2].trim());
      const powerPerMachine = parsePower(row[3].trim());
      const totalPower = parsePower(row[4].trim());

      if (!isNaN(machineId) && machineName && !isNaN(count)) {
        powerConsumption.breakdown.push({
          machineId,
          machineName,
          count,
          powerPerMachine: isNaN(powerPerMachine) ? 0 : powerPerMachine,
          totalPower: isNaN(totalPower) ? 0 : totalPower,
        });
      }
    }
  }

  return powerConsumption as ExportPowerConsumption;
}

/**
 * ベルト要件を抽出
 */
function extractConveyorBelts(sections: Record<string, string[][]>): ExportConveyorBelts {
  const conveyorBelts: Partial<ExportConveyorBelts> = {
    totalBelts: 0,
    totalLength: 0,
    maxSaturation: 0,
  };

  if (sections.ConveyorBelts) {
    for (const row of sections.ConveyorBelts) {
      if (row.length < 2) continue;

      const metric = row[0].trim();
      const value = parseFloat(row[1].trim());

      switch (metric) {
        case "TotalBelts":
          conveyorBelts.totalBelts = value || 0;
          break;
        case "MaxSaturation":
          conveyorBelts.maxSaturation = value || 0;
          break;
        case "BottleneckType": {
          const type = row[1].trim();
          if (type === "input" || type === "output") {
            conveyorBelts.bottleneckType = type;
          }
          break;
        }
      }
    }
  }

  return conveyorBelts as ExportConveyorBelts;
}

/**
 * 発電設備を抽出
 */
function extractPowerGeneration(
  sections: Record<string, string[][]>
): ExportPowerGeneration | undefined {
  if (!sections.PowerGeneration && !sections.PowerGenerators) {
    return undefined;
  }

  const powerGeneration: Partial<ExportPowerGeneration> = {
    totalRequiredPower: 0,
    totalGeneratedPower: 0,
    generators: [],
  };

  // PowerGeneration セクションから基本情報を抽出
  if (sections.PowerGeneration) {
    for (const row of sections.PowerGeneration) {
      if (row.length < 2) continue;

      const metric = row[0].trim();
      const value = row[1].trim();

      switch (metric) {
        case "TotalRequiredPower":
          powerGeneration.totalRequiredPower = parsePower(value);
          break;
        case "TotalGeneratedPower":
          powerGeneration.totalGeneratedPower = parsePower(value);
          break;
      }
    }
  }

  // PowerGenerators セクションから発電設備情報を抽出
  if (sections.PowerGenerators && sections.PowerGenerators.length > 1) {
    // ヘッダー行をスキップ
    for (let i = 1; i < sections.PowerGenerators.length; i++) {
      const row = sections.PowerGenerators[i];
      if (row.length < 6) continue;

      const generatorId = parseInt(row[0], 10);
      const generatorName = row[1].trim();
      const count = parseFloat(row[2].trim());
      const powerPerGenerator = parsePower(row[3].trim());
      const totalPower = parsePower(row[4].trim());
      const fuelInfo = row[5].trim();

      if (!isNaN(generatorId) && generatorName && !isNaN(count)) {
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
                  itemId: 0, // CSVには含まれないためデフォルト値
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
          powerPerGenerator: isNaN(powerPerGenerator) ? 0 : powerPerGenerator,
          totalPower: isNaN(totalPower) ? 0 : totalPower,
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
  const trimmed = powerStr.trim();
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
 * レート形式の文字列をパース（"10.5/s" → 10.5）
 */
function parseRate(rateStr: string): number {
  const trimmed = rateStr.trim();
  if (!trimmed) return 0;

  // 数値のみの場合
  const numMatch = trimmed.match(/^([\d.]+)$/);
  if (numMatch) {
    return parseFloat(numMatch[1]);
  }

  // 単位付きの場合（"10.5/s"など）
  const unitMatch = trimmed.match(/^([\d.]+)\/(s|min|h)$/i);
  if (unitMatch) {
    const value = parseFloat(unitMatch[1]);
    const unit = unitMatch[2].toLowerCase();

    switch (unit) {
      case "s":
        return value;
      case "min":
        return value / 60;
      case "h":
        return value / 3600;
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
