import type { ExportData } from '../../types/export';
import { formatRate, formatPower } from '../../utils/format';

export interface ExcelExportOptions {
  includeRawMaterials?: boolean;
  includeProducts?: boolean;
  includeMachines?: boolean;
  includePowerConsumption?: boolean;
  includeConveyorBelts?: boolean;
  includePowerGeneration?: boolean;
  decimalPlaces?: number;
  sheetNames?: {
    overview?: string;
    rawMaterials?: string;
    products?: string;
    machines?: string;
    powerConsumption?: string;
    conveyorBelts?: string;
    powerGeneration?: string;
    powerGenerators?: string;
  };
}

const DEFAULT_SHEET_NAMES = {
  overview: 'Overview',
  rawMaterials: 'RawMaterials',
  products: 'Products',
  machines: 'Machines',
  powerConsumption: 'PowerConsumption',
  conveyorBelts: 'ConveyorBelts',
  powerGeneration: 'PowerGeneration',
  powerGenerators: 'PowerGenerators',
};

/**
 * ExportDataをExcel形式のBlobに変換する
 * @param data ExportDataオブジェクト
 * @param options Excel出力オプション
 * @returns Excel形式のBlob
 */
export async function exportToExcel(
  data: ExportData,
  options: ExcelExportOptions = {}
): Promise<Blob> {
  // 動的インポート（bundle sizeを最適化）
  const XLSX = await import('xlsx');

  const sheetNames = { ...DEFAULT_SHEET_NAMES, ...options.sheetNames };
  const workbook = XLSX.utils.book_new();

  // Overviewシート
  const overviewData = [
    ['Metric', 'Value', 'Unit', 'Description'],
    ['Version', data.version, '', 'エクスポートバージョン'],
    ['Export Date', new Date(data.exportDate).toISOString(), 'timestamp', 'エクスポート日時'],
    ['Plan Name', data.planInfo.planName, '', 'プラン名'],
    ['Recipe SID', data.planInfo.recipeSID, '', 'レシピシステムID'],
    ['Recipe Name', data.planInfo.recipeName, '', 'レシピ名'],
    ['Target Quantity', data.planInfo.targetQuantity, 'items/sec', '目標生産量'],
    ['Total Machines', data.statistics.totalMachines, 'units', '総機械数'],
    ['Total Power', formatPower(data.statistics.totalPower), '', '総電力消費'],
    ['Raw Materials', data.statistics.rawMaterialCount, 'types', '原材料種類数'],
    ['Items', data.statistics.itemCount, 'types', 'アイテム種類数'],
  ];
  const overviewSheet = XLSX.utils.aoa_to_sheet(overviewData);
  XLSX.utils.book_append_sheet(workbook, overviewSheet, sheetNames.overview);

  // RawMaterialsシート
  if (options.includeRawMaterials !== false) {
    const rawMaterialsData = [
      ['ItemID', 'ItemName', 'ConsumptionRate', 'Unit'],
      ...data.rawMaterials.map(material => [
        material.itemId,
        material.itemName,
        material.consumptionRate,
        material.unit,
      ]),
    ];
    const rawMaterialsSheet = XLSX.utils.aoa_to_sheet(rawMaterialsData);
    XLSX.utils.book_append_sheet(workbook, rawMaterialsSheet, sheetNames.rawMaterials);
  }

  // Productsシート
  if (options.includeProducts !== false) {
    const productsData = [
      ['ItemID', 'ItemName', 'ProductionRate', 'ConsumptionRate', 'NetProduction', 'Unit'],
      ...data.products.map(product => [
        product.itemId,
        product.itemName,
        product.productionRate,
        product.consumptionRate,
        product.netProduction,
        product.unit,
      ]),
    ];
    const productsSheet = XLSX.utils.aoa_to_sheet(productsData);
    XLSX.utils.book_append_sheet(workbook, productsSheet, sheetNames.products);
  }

  // Machinesシート
  if (options.includeMachines !== false) {
    const machinesData = [
      ['MachineID', 'MachineName', 'Count', 'PowerPerMachine', 'TotalPower'],
      ...data.machines.map(machine => [
        machine.machineId,
        machine.machineName,
        machine.count,
        machine.powerPerMachine,
        machine.totalPower,
      ]),
    ];
    const machinesSheet = XLSX.utils.aoa_to_sheet(machinesData);
    XLSX.utils.book_append_sheet(workbook, machinesSheet, sheetNames.machines);
  }

  // PowerConsumptionシート
  if (options.includePowerConsumption !== false) {
    const total = data.powerConsumption.total;
    const powerConsumptionData = [
      ['Category', 'Power', 'Percentage'],
      ['Machines', data.powerConsumption.machines, (data.powerConsumption.machines / total) * 100],
      ['Sorters', data.powerConsumption.sorters, (data.powerConsumption.sorters / total) * 100],
      ['DysonSphere', data.powerConsumption.dysonSphere, (data.powerConsumption.dysonSphere / total) * 100],
      ['Total', total, 100],
    ];
    const powerConsumptionSheet = XLSX.utils.aoa_to_sheet(powerConsumptionData);
    XLSX.utils.book_append_sheet(workbook, powerConsumptionSheet, sheetNames.powerConsumption);
  }

  // ConveyorBeltsシート
  if (options.includeConveyorBelts !== false) {
    const conveyorBeltsData = [
      ['Metric', 'Value'],
      ['TotalBelts', data.conveyorBelts.totalBelts],
      ['MaxSaturation', data.conveyorBelts.maxSaturation],
      ...(data.conveyorBelts.bottleneckType ? [['BottleneckType', data.conveyorBelts.bottleneckType]] : []),
    ];
    const conveyorBeltsSheet = XLSX.utils.aoa_to_sheet(conveyorBeltsData);
    XLSX.utils.book_append_sheet(workbook, conveyorBeltsSheet, sheetNames.conveyorBelts);
  }

  // PowerGenerationシート
  if (options.includePowerGeneration !== false) {
    const powerGenerationData = [
      ['Metric', 'Value'],
      ['TotalRequiredPower', data.powerGeneration.totalRequiredPower],
      ['TotalGeneratedPower', data.powerGeneration.totalGeneratedPower],
    ];
    const powerGenerationSheet = XLSX.utils.aoa_to_sheet(powerGenerationData);
    XLSX.utils.book_append_sheet(workbook, powerGenerationSheet, sheetNames.powerGeneration);
  }

  // PowerGeneratorsシート
  if (options.includePowerGeneration !== false && data.powerGeneration.generators && data.powerGeneration.generators.length > 0) {
    const powerGeneratorsData = [
      ['GeneratorID', 'GeneratorName', 'Count', 'PowerPerGenerator', 'TotalPower', 'Fuel'],
      ...data.powerGeneration.generators.map(generator => {
        const fuelInfo = generator.fuel && generator.fuel.length > 0
          ? generator.fuel.map(f => `${formatRate(f.consumptionRate)} ${f.itemName}`).join('; ')
          : 'N/A';
        return [
          generator.generatorId,
          generator.generatorName,
          generator.count,
          generator.powerPerGenerator,
          generator.totalPower,
          fuelInfo,
        ];
      }),
    ];
    const powerGeneratorsSheet = XLSX.utils.aoa_to_sheet(powerGeneratorsData);
    XLSX.utils.book_append_sheet(workbook, powerGeneratorsSheet, sheetNames.powerGenerators);
  }

  // Blobとして返す
  const wbout = XLSX.write(workbook, {
    type: 'array',
    bookType: 'xlsx',
  });
  
  return new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}
