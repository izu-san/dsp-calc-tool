import type { ExportData } from '../../types/export';
import { formatRate, formatPower } from '../../utils/format';

export interface CSVExportOptions {
  includeRawMaterials?: boolean;
  includeProducts?: boolean;
  includeMachines?: boolean;
  includePowerConsumption?: boolean;
  includeConveyorBelts?: boolean;
  includePowerGeneration?: boolean;
  decimalPlaces?: number;
  separator?: ',' | ';' | '\t';
  encoding?: 'utf-8' | 'utf-8-bom';
}

const DEFAULT_OPTIONS: Required<CSVExportOptions> = {
  includeRawMaterials: true,
  includeProducts: true,
  includeMachines: true,
  includePowerConsumption: true,
  includeConveyorBelts: true,
  includePowerGeneration: true,
  decimalPlaces: 2,
  separator: ',',
  encoding: 'utf-8',
};

/**
 * ExportDataをCSV形式の文字列に変換する
 * @param data ExportDataオブジェクト
 * @param options CSV出力オプション
 * @returns CSV形式の文字列
 */
export function exportToCSV(
  data: ExportData,
  options: CSVExportOptions = {}
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const lines: string[] = [];

  // UTF-8 BOMを追加（Excel互換性のため）
  if (opts.encoding === 'utf-8-bom') {
    lines.push('\ufeff');
  }

  // メタデータ
  lines.push('# Metadata');
  lines.push(`Version,${data.version}`);
  lines.push(`ExportDate,${new Date(data.exportDate).toISOString()}`);
  lines.push('');

  // プラン情報
  lines.push('# Plan Info');
  lines.push(`PlanName,${escapeCSVValue(data.planInfo.planName)}`);
  lines.push(`RecipeSID,${data.planInfo.recipeSID}`);
  lines.push(`RecipeName,${escapeCSVValue(data.planInfo.recipeName)}`);
  lines.push(`TargetQuantity,${data.planInfo.targetQuantity}`);
  lines.push('');

  // 統計情報
  lines.push('# Statistics');
  lines.push(`TotalMachines,${data.statistics.totalMachines}`);
  lines.push(`TotalPower,${formatPower(data.statistics.totalPower)}`);
  lines.push(`RawMaterialCount,${data.statistics.rawMaterialCount}`);
  lines.push(`ItemCount,${data.statistics.itemCount}`);
  lines.push('');

  // 原材料
  if (opts.includeRawMaterials) {
    lines.push('# RawMaterials');
    lines.push('ItemID,ItemName,ConsumptionRate,Unit');
    for (const material of data.rawMaterials) {
      lines.push(
        `${material.itemId},${escapeCSVValue(material.itemName)},${formatRate(material.consumptionRate)},${material.unit}`
      );
    }
    lines.push('');
  }

  // 製品
  if (opts.includeProducts) {
    lines.push('# Products');
    lines.push('ItemID,ItemName,ProductionRate,ConsumptionRate,NetProduction,Unit');
    for (const product of data.products) {
      lines.push(
        `${product.itemId},${escapeCSVValue(product.itemName)},${formatRate(product.productionRate)},${formatRate(product.consumptionRate)},${formatRate(product.netProduction)},${product.unit}`
      );
    }
    lines.push('');
  }

  // 機械
  if (opts.includeMachines) {
    lines.push('# Machines');
    lines.push('MachineID,MachineName,Count,PowerPerMachine,TotalPower');
    for (const machine of data.machines) {
      lines.push(
        `${machine.machineId},${escapeCSVValue(machine.machineName)},${machine.count},${formatPower(machine.powerPerMachine)},${formatPower(machine.totalPower)}`
      );
    }
    lines.push('');
  }

  // 電力消費
  if (opts.includePowerConsumption) {
    lines.push('# PowerConsumption');
    lines.push('Category,Power,Percentage');
    const total = data.powerConsumption.total;
    lines.push(`Machines,${formatPower(data.powerConsumption.machines)},${((data.powerConsumption.machines / total) * 100).toFixed(2)}`);
    lines.push(`Sorters,${formatPower(data.powerConsumption.sorters)},${((data.powerConsumption.sorters / total) * 100).toFixed(2)}`);
    lines.push(`DysonSphere,${formatPower(data.powerConsumption.dysonSphere)},${((data.powerConsumption.dysonSphere / total) * 100).toFixed(2)}`);
    lines.push(`Total,${formatPower(total)},100.00`);
    lines.push('');
  }

  // コンベアベルト
  if (opts.includeConveyorBelts) {
    lines.push('# ConveyorBelts');
    lines.push('Metric,Value');
    lines.push(`TotalBelts,${data.conveyorBelts.totalBelts}`);
    lines.push(`MaxSaturation,${data.conveyorBelts.maxSaturation.toFixed(opts.decimalPlaces)}`);
    if (data.conveyorBelts.bottleneckType) {
      lines.push(`BottleneckType,${data.conveyorBelts.bottleneckType}`);
    }
    lines.push('');
  }

  // 発電設備
  if (opts.includePowerGeneration) {
    lines.push('# PowerGeneration');
    lines.push('Metric,Value');
    lines.push(`TotalRequiredPower,${formatPower(data.powerGeneration.totalRequiredPower)}`);
    lines.push(`TotalGeneratedPower,${formatPower(data.powerGeneration.totalGeneratedPower)}`);
    lines.push('');

    if (data.powerGeneration.generators && data.powerGeneration.generators.length > 0) {
      lines.push('# PowerGenerators');
      lines.push('GeneratorID,GeneratorName,Count,PowerPerGenerator,TotalPower,Fuel');
      for (const generator of data.powerGeneration.generators) {
        const fuelInfo = generator.fuel && generator.fuel.length > 0
          ? generator.fuel.map(f => `${formatRate(f.consumptionRate)} ${f.itemName}`).join('; ')
          : 'N/A';
        lines.push(
          `${generator.generatorId},${escapeCSVValue(generator.generatorName)},${generator.count},${formatPower(generator.powerPerGenerator)},${formatPower(generator.totalPower)},${escapeCSVValue(fuelInfo)}`
        );
      }
      lines.push('');
    }
  }

  // 区切り文字を置換
  return lines.join('\n').replace(/,/g, opts.separator);
}

/**
 * CSV値のエスケープ処理
 * カンマ、引用符、改行を含む値は引用符で囲む
 * @param value エスケープする値
 * @returns エスケープ済みの値
 */
function escapeCSVValue(value: string | number): string {
  const str = String(value);
  
  // カンマ、引用符、改行を含む場合は引用符で囲む
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    // 内部的の引用符はエスケープ
    return `"${str.replace(/"/g, '""')}"`;
  }
  
  return str;
}
