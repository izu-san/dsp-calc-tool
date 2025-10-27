import { describe, it, expect } from 'vitest';
import { exportToCSV } from '../csvExporter';
import type { ExportData } from '../../../types/export';

describe('csvExporter', () => {
  describe('exportToCSV', () => {
    const createMockExportData = (): ExportData => ({
      version: '1.0.0',
      exportDate: new Date('2025-01-15T12:34:56Z').getTime(),
      planInfo: {
        planName: 'Test Production Plan',
        recipeSID: 1,
        recipeName: 'Iron Ingot',
        targetQuantity: 60,
      },
      settings: {} as any,
      statistics: {
        totalMachines: 10,
        totalPower: 3600,
        rawMaterialCount: 1,
        itemCount: 2,
      },
      rawMaterials: [
        {
          itemId: 1001,
          itemName: 'Iron Ore',
          consumptionRate: 120,
          unit: '/min',
        },
      ],
      products: [
        {
          itemId: 1101,
          itemName: 'Iron Ingot',
          productionRate: 60,
          consumptionRate: 0,
          netProduction: 60,
          unit: '/min',
        },
      ],
      machines: [
        {
          machineId: 2301,
          machineName: 'Arc Smelter',
          count: 10,
          powerPerMachine: 360,
          totalPower: 3600,
        },
      ],
      powerConsumption: {
        machines: 3600,
        sorters: 90,
        dysonSphere: 0,
        total: 3690,
        breakdown: [
          {
            machineId: 2301,
            machineName: 'Arc Smelter',
            count: 10,
            powerPerMachine: 360,
            totalPower: 3600,
          },
        ],
      },
      conveyorBelts: {
        totalBelts: 5,
        totalLength: 50,
        maxSaturation: 75.5,
        bottleneckType: 'input',
      },
      powerGeneration: {
        totalRequiredPower: 3690,
        totalGeneratedPower: 4000,
        generators: [
          {
            generatorId: 2201,
            generatorName: 'Thermal Power Plant',
            count: 2,
            powerPerGenerator: 2000,
            totalPower: 4000,
            fuel: [
              {
                itemId: 1006,
                itemName: 'Coal',
                consumptionRate: 1.2,
                unit: '/s',
              },
            ],
          },
        ],
      },
    });

    it('完全なCSVドキュメントを生成', () => {
      const data = createMockExportData();
      const csv = exportToCSV(data);

      expect(csv).toContain('# Metadata');
      expect(csv).toContain('Version,1.0.0');
      expect(csv).toContain('# Plan Info');
      expect(csv).toContain('PlanName,Test Production Plan');
      expect(csv).toContain('RecipeSID,1');
      expect(csv).toContain('RecipeName,Iron Ingot');
      expect(csv).toContain('TargetQuantity,60');
    });

    it('統計情報を含む', () => {
      const data = createMockExportData();
      const csv = exportToCSV(data);

      expect(csv).toContain('# Statistics');
      expect(csv).toContain('TotalMachines,10');
      expect(csv).toContain('TotalPower,3.6 MW');
      expect(csv).toContain('RawMaterialCount,1');
      expect(csv).toContain('ItemCount,2');
    });

    it('原材料を含む', () => {
      const data = createMockExportData();
      const csv = exportToCSV(data);

      expect(csv).toContain('# RawMaterials');
      expect(csv).toContain('ItemID,ItemName,ConsumptionRate,Unit');
      expect(csv).toContain('1001,Iron Ore,120.0/s,/min');
    });

    it('製品を含む', () => {
      const data = createMockExportData();
      const csv = exportToCSV(data);

      expect(csv).toContain('# Products');
      expect(csv).toContain('ItemID,ItemName,ProductionRate,ConsumptionRate,NetProduction,Unit');
      expect(csv).toContain('1101,Iron Ingot,60.0/s,0.0/s,60.0/s,/min');
    });

    it('機械を含む', () => {
      const data = createMockExportData();
      const csv = exportToCSV(data);

      expect(csv).toContain('# Machines');
      expect(csv).toContain('MachineID,MachineName,Count,PowerPerMachine,TotalPower');
      expect(csv).toContain('2301,Arc Smelter,10,360.0 kW,3.6 MW');
    });

    it('電力消費を含む', () => {
      const data = createMockExportData();
      const csv = exportToCSV(data);

      expect(csv).toContain('# PowerConsumption');
      expect(csv).toContain('Category,Power,Percentage');
      expect(csv).toContain('Machines,3.6 MW');
    });

    it('コンベアベルトを含む', () => {
      const data = createMockExportData();
      const csv = exportToCSV(data);

      expect(csv).toContain('# ConveyorBelts');
      expect(csv).toContain('Metric,Value');
      expect(csv).toContain('TotalBelts,5');
      expect(csv).toContain('MaxSaturation,75.50');
    });

    it('発電設備を含む', () => {
      const data = createMockExportData();
      const csv = exportToCSV(data);

      expect(csv).toContain('# PowerGeneration');
      expect(csv).toContain('Metric,Value');
      expect(csv).toContain('TotalRequiredPower,3.7 MW');
      expect(csv).toContain('TotalGeneratedPower,4.0 MW');
      expect(csv).toContain('# PowerGenerators');
    });

    it('オプションで特定のセクションを除外できる', () => {
      const data = createMockExportData();
      const csv = exportToCSV(data, {
        includeRawMaterials: false,
        includePowerGeneration: false,
      });

      expect(csv).not.toContain('# RawMaterials');
      expect(csv).not.toContain('# PowerGeneration');
      expect(csv).toContain('# Products');
      expect(csv).toContain('# Machines');
    });

    it('セミコロン区切りで出力できる', () => {
      const data = createMockExportData();
      const csv = exportToCSV(data, {
        separator: ';',
      });

      expect(csv).toContain('Version;1.0.0');
      expect(csv).not.toContain('Version,1.0.0');
    });

    it('UTF-8 BOMを含むことができる', () => {
      const data = createMockExportData();
      const csv = exportToCSV(data, {
        encoding: 'utf-8-bom',
      });

      expect(csv.charCodeAt(0)).toBe(0xfeff); // UTF-8 BOM
    });

    it('特殊文字を含む値を適切にエスケープ', () => {
      const data = createMockExportData();
      data.planInfo.planName = 'Test, "Plan" with Special\'s';
      const csv = exportToCSV(data);

      expect(csv).toContain('"Test, ""Plan"" with Special\'s"');
    });
  });
});
