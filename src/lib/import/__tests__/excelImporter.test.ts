/**
 * Excel importer tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { importFromExcel } from "../excelImporter";
import { EXPORT_VERSION } from "../../../types/export";

// Mock xlsx module
vi.mock("xlsx", async () => {
  const actual = await vi.importActual<typeof import("xlsx")>("xlsx");
  return {
    ...actual,
    read: vi.fn(),
    utils: {
      ...actual.utils,
      sheet_to_json: vi.fn(),
    },
  };
});

describe("importFromExcel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should parse valid Excel file with all sheets", async () => {
    const XLSX = (await import("xlsx")) as any;

    // Mock workbook structure
    const mockWorkbook = {
      SheetNames: ["Overview", "RawMaterials", "Products", "Machines"],
      Sheets: {
        Overview: {},
        RawMaterials: {},
        Products: {},
        Machines: {},
      },
    };

    // Mock sheet data
    const overviewData = [
      ["Metric", "Value", "Unit", "Description"],
      ["Version", EXPORT_VERSION, "", "エクスポートバージョン"],
      ["Export Date", "2025-01-15T12:00:00Z", "timestamp", "エクスポート日時"],
      ["Plan Name", "Test Plan", "", "プラン名"],
      ["Recipe SID", "123", "", "レシピシステムID"],
      ["Recipe Name", "Test Recipe", "", "レシピ名"],
      ["Target Quantity", "10.0", "items/sec", "目標生産量"],
      ["Total Machines", "45", "units", "総機械数"],
      ["Total Power", "12.5 MW", "", "総電力消費"],
      ["Raw Materials", "3", "types", "原材料種類数"],
      ["Items", "15", "types", "アイテム種類数"],
    ];

    const rawMaterialsData = [
      ["ItemID", "ItemName", "ConsumptionRate", "Unit"],
      [1001, "鉄鉱石", 15.5, "items/sec"],
      [1002, "銅鉱石", 10.0, "items/sec"],
    ];

    const productsData = [
      ["ItemID", "ItemName", "ProductionRate", "ConsumptionRate", "NetProduction", "Unit"],
      [2001, "鉄インゴット", 15.5, 10.0, 5.5, "items/sec"],
    ];

    const machinesData = [
      ["MachineID", "MachineName", "Count", "PowerPerMachine", "TotalPower"],
      [3001, "製錬設備 Mk.II", 10, 360, 3600],
    ];

    vi.mocked(XLSX.read).mockReturnValue(mockWorkbook as any);
    vi.mocked(XLSX.utils.sheet_to_json)
      .mockReturnValueOnce(overviewData as any)
      .mockReturnValueOnce(rawMaterialsData as any)
      .mockReturnValueOnce(productsData as any)
      .mockReturnValueOnce(machinesData as any);

    const mockFile = new File([], "test.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const result = await importFromExcel(mockFile);

    expect(result.success).toBe(true);
    expect(result.extractedData.planInfo.name).toBe("Test Plan");
    expect(result.extractedData.planInfo.recipeSID).toBe(123);
    expect(result.extractedData.planInfo.recipeName).toBe("Test Recipe");
    expect(result.extractedData.planInfo.targetQuantity).toBe(10.0);
    expect(result.extractedData.statistics.totalMachines).toBe(45);
    expect(result.extractedData.statistics.totalPower).toBe(12500); // 12.5 MW → 12500 kW
    expect(result.extractedData.rawMaterials.length).toBe(2);
    expect(result.extractedData.products.length).toBe(1);
    expect(result.extractedData.machines.length).toBe(1);
  });

  it("should handle missing Overview sheet", async () => {
    const XLSX = (await import("xlsx")) as any;

    const mockWorkbook = {
      SheetNames: ["OtherSheet"],
      Sheets: {
        OtherSheet: {},
      },
    };

    vi.mocked(XLSX.read).mockReturnValue(mockWorkbook as any);
    vi.mocked(XLSX.utils.sheet_to_json).mockReturnValue([]);

    const mockFile = new File([], "test.xlsx");

    const result = await importFromExcel(mockFile);

    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].type).toBe("missing_data");
  });

  it("should handle parse errors", async () => {
    const XLSX = (await import("xlsx")) as any;

    vi.mocked(XLSX.read).mockImplementation(() => {
      throw new Error("Failed to read Excel file");
    });

    const mockFile = new File([], "test.xlsx");

    const result = await importFromExcel(mockFile);

    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].type).toBe("parse");
  });

  it("should parse power values with different units", async () => {
    const XLSX = (await import("xlsx")) as any;

    const mockWorkbook = {
      SheetNames: ["Overview"],
      Sheets: {
        Overview: {},
      },
    };

    const overviewData = [
      ["Metric", "Value", "Unit", "Description"],
      ["Plan Name", "Test", "", ""],
      ["Recipe SID", "123", "", ""],
      ["Recipe Name", "Test", "", ""],
      ["Target Quantity", "10", "", ""],
      ["Total Machines", "10", "", ""],
      ["Total Power", "1.5 GW", "", ""],
      ["Raw Materials", "0", "", ""],
      ["Items", "0", "", ""],
    ];

    vi.mocked(XLSX.read).mockReturnValue(mockWorkbook as any);
    vi.mocked(XLSX.utils.sheet_to_json).mockReturnValue(overviewData as any);

    const mockFile = new File([], "test.xlsx");

    const result = await importFromExcel(mockFile);

    expect(result.success).toBe(true);
    expect(result.extractedData.statistics.totalPower).toBe(1500000); // 1.5 GW → 1500000 kW
  });
});
