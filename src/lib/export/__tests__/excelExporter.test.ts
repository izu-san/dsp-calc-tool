import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ExportData } from "../../../types/export";
import { exportToExcel } from "../excelExporter";

// XLSXモジュールのモック
vi.mock("xlsx", async () => {
  const mockWorkbook = {
    SheetNames: [],
    Sheets: {},
  };

  const utils = {
    book_new: vi.fn(() => ({
      SheetNames: [],
      Sheets: {},
    })),
    aoa_to_sheet: vi.fn((data: any[][]) => ({
      "!ref": "A1:D10",
      data,
    })),
    book_append_sheet: vi.fn((wb: any, ws: any, name: string) => {
      wb.SheetNames.push(name);
      wb.Sheets[name] = ws;
    }),
  };

  const write = vi.fn(() => new Uint8Array([0x50, 0x4b, 0x03, 0x04])); // ZIP header

  return {
    default: {
      utils,
      write,
    },
    utils,
    write,
  };
});

describe("excelExporter", () => {
  describe("exportToExcel", () => {
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

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("Excel Blobを生成する", async () => {
      const data = createMockExportData();
      const blob = await exportToExcel(data);

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    });

    it("デフォルトで全てのシートを含む", async () => {
      const data = createMockExportData();
      const XLSX = await import("xlsx");
      await exportToExcel(data);

      expect(XLSX.default.utils.book_append_sheet).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        "Overview"
      );
      expect(XLSX.default.utils.book_append_sheet).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        "RawMaterials"
      );
      expect(XLSX.default.utils.book_append_sheet).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        "Products"
      );
      expect(XLSX.default.utils.book_append_sheet).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        "Machines"
      );
    });

    it("オプションで原材料シートを除外できる", async () => {
      const data = createMockExportData();
      const XLSX = await import("xlsx");
      await exportToExcel(data, { includeRawMaterials: false });

      const calls = (XLSX.default.utils.book_append_sheet as any).mock.calls;
      const sheetNames = calls.map((call: any) => call[2]);

      expect(sheetNames).not.toContain("RawMaterials");
      expect(sheetNames).toContain("Overview");
    });

    it("オプションで製品シートを除外できる", async () => {
      const data = createMockExportData();
      const XLSX = await import("xlsx");
      await exportToExcel(data, { includeProducts: false });

      const calls = (XLSX.default.utils.book_append_sheet as any).mock.calls;
      const sheetNames = calls.map((call: any) => call[2]);

      expect(sheetNames).not.toContain("Products");
      expect(sheetNames).toContain("Overview");
    });

    it("オプションで機械シートを除外できる", async () => {
      const data = createMockExportData();
      const XLSX = await import("xlsx");
      await exportToExcel(data, { includeMachines: false });

      const calls = (XLSX.default.utils.book_append_sheet as any).mock.calls;
      const sheetNames = calls.map((call: any) => call[2]);

      expect(sheetNames).not.toContain("Machines");
      expect(sheetNames).toContain("Overview");
    });

    it("オプションで電力消費シートを除外できる", async () => {
      const data = createMockExportData();
      const XLSX = await import("xlsx");
      await exportToExcel(data, { includePowerConsumption: false });

      const calls = (XLSX.default.utils.book_append_sheet as any).mock.calls;
      const sheetNames = calls.map((call: any) => call[2]);

      expect(sheetNames).not.toContain("PowerConsumption");
      expect(sheetNames).toContain("Overview");
    });

    it("オプションでコンベアベルトシートを除外できる", async () => {
      const data = createMockExportData();
      const XLSX = await import("xlsx");
      await exportToExcel(data, { includeConveyorBelts: false });

      const calls = (XLSX.default.utils.book_append_sheet as any).mock.calls;
      const sheetNames = calls.map((call: any) => call[2]);

      expect(sheetNames).not.toContain("ConveyorBelts");
      expect(sheetNames).toContain("Overview");
    });

    it("オプションで発電シートを除外できる", async () => {
      const data = createMockExportData();
      const XLSX = await import("xlsx");
      await exportToExcel(data, { includePowerGeneration: false });

      const calls = (XLSX.default.utils.book_append_sheet as any).mock.calls;
      const sheetNames = calls.map((call: any) => call[2]);

      expect(sheetNames).not.toContain("PowerGeneration");
      expect(sheetNames).not.toContain("PowerGenerators");
      expect(sheetNames).toContain("Overview");
    });

    it("カスタムシート名を使用できる", async () => {
      const data = createMockExportData();
      const XLSX = await import("xlsx");
      await exportToExcel(data, {
        sheetNames: {
          overview: "概要",
          rawMaterials: "原材料",
          products: "製品",
        },
      });

      const calls = (XLSX.default.utils.book_append_sheet as any).mock.calls;
      const sheetNames = calls.map((call: any) => call[2]);

      expect(sheetNames).toContain("概要");
      expect(sheetNames).toContain("原材料");
      expect(sheetNames).toContain("製品");
    });

    it("発電機がある場合は発電機シートを含む", async () => {
      const data = createMockExportData();
      const XLSX = await import("xlsx");
      await exportToExcel(data);

      const calls = (XLSX.default.utils.book_append_sheet as any).mock.calls;
      const sheetNames = calls.map((call: any) => call[2]);

      expect(sheetNames).toContain("PowerGenerators");
    });

    it("発電機がない場合は発電機シートを含まない", async () => {
      const data = createMockExportData();
      data.powerGeneration.generators = [];
      const XLSX = await import("xlsx");
      await exportToExcel(data);

      const calls = (XLSX.default.utils.book_append_sheet as any).mock.calls;
      const sheetNames = calls.map((call: any) => call[2]);

      expect(sheetNames).not.toContain("PowerGenerators");
    });

    it("bottleneckTypeがない場合でもコンベアベルトシートを生成できる", async () => {
      const data = createMockExportData();
      data.conveyorBelts.bottleneckType = undefined;
      const XLSX = await import("xlsx");
      await exportToExcel(data);

      const calls = (XLSX.default.utils.book_append_sheet as any).mock.calls;
      const sheetNames = calls.map((call: any) => call[2]);

      expect(sheetNames).toContain("ConveyorBelts");
    });

    it("複数の燃料を持つ発電機を正しく処理", async () => {
      const data = createMockExportData();
      data.powerGeneration.generators[0].fuel = [
        {
          itemId: 1006,
          itemName: "Coal",
          consumptionRate: 1.2,
          unit: "/s",
        },
        {
          itemId: 1007,
          itemName: "Wood",
          consumptionRate: 2.4,
          unit: "/s",
        },
      ];

      const blob = await exportToExcel(data);
      expect(blob).toBeInstanceOf(Blob);
    });

    it("燃料がない発電機を正しく処理", async () => {
      const data = createMockExportData();
      data.powerGeneration.generators[0].fuel = [];

      const blob = await exportToExcel(data);
      expect(blob).toBeInstanceOf(Blob);
    });

    it("全てのオプションをfalseにしてもOverviewシートは含まれる", async () => {
      const data = createMockExportData();
      const XLSX = await import("xlsx");
      await exportToExcel(data, {
        includeRawMaterials: false,
        includeProducts: false,
        includeMachines: false,
        includePowerConsumption: false,
        includeConveyorBelts: false,
        includePowerGeneration: false,
      });

      const calls = (XLSX.default.utils.book_append_sheet as any).mock.calls;
      const sheetNames = calls.map((call: any) => call[2]);

      expect(sheetNames).toHaveLength(1);
      expect(sheetNames).toContain("Overview");
    });
  });
});
