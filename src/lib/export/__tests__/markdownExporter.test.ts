import { describe, it, expect } from "vitest";
import { exportToMarkdown } from "../markdownExporter";
import type { ExportData } from "../../../types/export";

describe("markdownExporter", () => {
  describe("exportToMarkdown", () => {
    const createMockExportData = (): ExportData => ({
      version: "1.0.0",
      exportDate: new Date("2025-01-15T12:34:56Z").getTime(),
      planInfo: {
        planName: "Test Production Plan",
        recipeSID: 1,
        recipeName: "Iron Ingot",
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
          itemName: "Iron Ore",
          consumptionRate: 120,
          unit: "/min",
        },
      ],
      products: [
        {
          itemId: 1101,
          itemName: "Iron Ingot",
          productionRate: 60,
          consumptionRate: 0,
          netProduction: 60,
          unit: "/min",
        },
      ],
      machines: [
        {
          machineId: 2301,
          machineName: "Arc Smelter",
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
            machineName: "Arc Smelter",
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
        bottleneckType: "input",
      },
      powerGeneration: {
        totalRequiredPower: 3690,
        totalGeneratedPower: 4000,
        generators: [
          {
            generatorId: 2201,
            generatorName: "Thermal Power Plant",
            count: 2,
            powerPerGenerator: 2000,
            totalPower: 4000,
            fuel: [
              {
                itemId: 1006,
                itemName: "Coal",
                consumptionRate: 1.2,
                unit: "/s",
              },
            ],
          },
        ],
      },
    });

    it("完全なMarkdownドキュメントを生成", () => {
      const data = createMockExportData();
      const markdown = exportToMarkdown(data);

      expect(markdown).toContain("# Test Production Plan");
      expect(markdown).toContain("**Export Version:** 1.0.0");
      expect(markdown).toContain("**Recipe:** Iron Ingot (SID: 1)");
      expect(markdown).toContain("**Target Quantity:** 60/min");
    });

    it("統計セクションの正しい出力", () => {
      const data = createMockExportData();
      const markdown = exportToMarkdown(data);

      expect(markdown).toContain("## Statistics");
      expect(markdown).toContain("- Total Machines: 10");
      expect(markdown).toContain("- Total Power Consumption:");
      expect(markdown).toContain("- Unique Raw Materials: 1");
      expect(markdown).toContain("- Unique Items: 2");
    });

    it("原材料テーブルの正しい出力", () => {
      const data = createMockExportData();
      const markdown = exportToMarkdown(data);

      expect(markdown).toContain("## Raw Materials");
      expect(markdown).toContain("| Item | Consumption Rate |");
      expect(markdown).toContain("| Iron Ore |");
      expect(markdown).toContain("120.0/s");
    });

    it("製品テーブルの正しい出力", () => {
      const data = createMockExportData();
      const markdown = exportToMarkdown(data);

      expect(markdown).toContain("## Products");
      expect(markdown).toContain("| Item | Production Rate | Consumption Rate | Net Production |");
      expect(markdown).toContain("| Iron Ingot |");
      expect(markdown).toContain("60.0/s");
    });

    it("機械テーブルの正しい出力", () => {
      const data = createMockExportData();
      const markdown = exportToMarkdown(data);

      expect(markdown).toContain("## Machines");
      expect(markdown).toContain("| Machine | Count | Power/Machine | Total Power |");
      expect(markdown).toContain("| Arc Smelter | 10 |");
    });

    it("電力消費セクションの正しい出力", () => {
      const data = createMockExportData();
      const markdown = exportToMarkdown(data);

      expect(markdown).toContain("## Power Consumption");
      expect(markdown).toContain("- Machines:");
      expect(markdown).toContain("- Sorters:");
      expect(markdown).toContain("- Dyson Sphere:");
      expect(markdown).toContain("- Total:");
    });

    it("コンベアベルトセクションの正しい出力", () => {
      const data = createMockExportData();
      const markdown = exportToMarkdown(data);

      expect(markdown).toContain("## Conveyor Belts");
      expect(markdown).toContain("- Total Belts: 5");
      expect(markdown).toContain("- Max Saturation: 75.50%");
      expect(markdown).toContain("- Bottleneck Type: input");
    });

    it("発電設備セクションの正しい出力", () => {
      const data = createMockExportData();
      const markdown = exportToMarkdown(data);

      expect(markdown).toContain("## Power Generation");
      expect(markdown).toContain("- Total Required Power:");
      expect(markdown).toContain("- Total Generated Power:");
      expect(markdown).toContain("### Generators");
      expect(markdown).toContain(
        "| Generator | Count | Power/Generator | Total Power | Fuel Consumption |"
      );
      expect(markdown).toContain("| Thermal Power Plant | 2 |");
      expect(markdown).toContain("Coal");
      expect(markdown).toContain("1.2/s");
    });

    it("原材料がない場合のメッセージ出力", () => {
      const data = createMockExportData();
      data.rawMaterials = [];
      const markdown = exportToMarkdown(data);

      expect(markdown).toContain("No raw materials required.");
    });

    it("発電設備がない場合のメッセージ出力", () => {
      const data = createMockExportData();
      data.powerGeneration.generators = [];
      const markdown = exportToMarkdown(data);

      expect(markdown).toContain("No power generators configured.");
    });

    it("ボトルネック情報がない場合", () => {
      const data = createMockExportData();
      data.conveyorBelts.bottleneckType = undefined;
      const markdown = exportToMarkdown(data);

      expect(markdown).toContain("## Conveyor Belts");
      expect(markdown).not.toContain("- Bottleneck Type:");
    });

    it("フッターの正しい出力", () => {
      const data = createMockExportData();
      const markdown = exportToMarkdown(data);

      expect(markdown).toContain("---");
      expect(markdown).toContain("*Generated by Dyson Sphere Program Calculator Tool*");
    });
  });
});
