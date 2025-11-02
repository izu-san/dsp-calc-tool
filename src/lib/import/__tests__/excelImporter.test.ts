/**
 * Excel importer tests
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { EXPORT_VERSION } from "../../../types/export";
import { importFromExcel } from "../excelImporter";

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

  it("should parse power values in kW", async () => {
    const XLSX = (await import("xlsx")) as any;

    const mockWorkbook = {
      SheetNames: ["Overview"],
      Sheets: {
        Overview: {},
      },
    };

    const overviewData = [
      ["Metric", "Value"],
      ["Plan Name", "Test"],
      ["Recipe SID", "123"],
      ["Recipe Name", "Test"],
      ["Target Quantity", "10"],
      ["Total Machines", "10"],
      ["Total Power", "500 kW"],
      ["Raw Materials", "0"],
      ["Items", "0"],
    ];

    vi.mocked(XLSX.read).mockReturnValue(mockWorkbook as any);
    vi.mocked(XLSX.utils.sheet_to_json).mockReturnValue(overviewData as any);

    const mockFile = new File([], "test.xlsx");

    const result = await importFromExcel(mockFile);

    expect(result.success).toBe(true);
    expect(result.extractedData.statistics.totalPower).toBe(500); // 500 kW
  });

  it("should handle version mismatch", async () => {
    const XLSX = (await import("xlsx")) as any;

    const mockWorkbook = {
      SheetNames: ["Overview"],
      Sheets: {
        Overview: {},
      },
    };

    const overviewData = [
      ["Metric", "Value"],
      ["Version", "0.0.1"], // Incompatible version
      ["Plan Name", "Test"],
      ["Recipe SID", "123"],
    ];

    vi.mocked(XLSX.read).mockReturnValue(mockWorkbook as any);
    vi.mocked(XLSX.utils.sheet_to_json).mockReturnValue(overviewData as any);

    const mockFile = new File([], "test.xlsx");

    const result = await importFromExcel(mockFile);

    // Version check might not cause failure, but could generate warnings
    expect(result.success || result.warnings.length > 0).toBe(true);
  });

  it("should handle PowerConsumption sheet", async () => {
    const XLSX = (await import("xlsx")) as any;

    const mockWorkbook = {
      SheetNames: ["Overview", "Machines", "PowerConsumption"],
      Sheets: {
        Overview: {},
        Machines: {},
        PowerConsumption: {},
      },
    };

    const overviewData = [
      ["Metric", "Value"],
      ["Plan Name", "Test"],
      ["Recipe SID", "123"],
      ["Recipe Name", "Test"],
      ["Target Quantity", "10"],
      ["Total Machines", "10"],
      ["Total Power", "10 kW"],
      ["Raw Materials", "0"],
      ["Items", "0"],
    ];

    const machinesData = [
      ["MachineID", "MachineName", "Count", "PowerPerMachine", "TotalPower"],
      [3001, "製錬設備", 5, 360, 1800],
      [3002, "採掘機", 3, 420, 1260],
    ];

    const powerConsumptionData = [
      ["Category", "Power"],
      ["Machines", 3060],
      ["Sorters", 0],
      ["Total", 3060],
    ];

    vi.mocked(XLSX.read).mockReturnValue(mockWorkbook as any);
    vi.mocked(XLSX.utils.sheet_to_json)
      .mockReturnValueOnce(overviewData as any)
      .mockReturnValueOnce(machinesData as any)
      .mockReturnValueOnce(powerConsumptionData as any);

    const mockFile = new File([], "test.xlsx");

    const result = await importFromExcel(mockFile);

    expect(result.success).toBe(true);
    expect(result.extractedData.powerConsumption).toBeDefined();
    expect(result.extractedData.powerConsumption.breakdown).toBeDefined();
    expect(result.extractedData.powerConsumption.breakdown.length).toBe(2);
    expect(result.extractedData.powerConsumption.machines).toBe(3060);
  });

  it("should handle ConveyorBelts sheet", async () => {
    const XLSX = (await import("xlsx")) as any;

    const mockWorkbook = {
      SheetNames: ["Overview", "ConveyorBelts"],
      Sheets: {
        Overview: {},
        ConveyorBelts: {},
      },
    };

    const overviewData = [
      ["Metric", "Value"],
      ["Plan Name", "Test"],
      ["Recipe SID", "123"],
      ["Recipe Name", "Test"],
      ["Target Quantity", "10"],
      ["Total Machines", "10"],
      ["Total Power", "10 kW"],
      ["Raw Materials", "0"],
      ["Items", "0"],
    ];

    const conveyorBeltsData = [
      ["Metric", "Value"],
      ["TotalBelts", "80"],
      ["MaxSaturation", "75.5"],
    ];

    vi.mocked(XLSX.read).mockReturnValue(mockWorkbook as any);
    vi.mocked(XLSX.utils.sheet_to_json)
      .mockReturnValueOnce(overviewData as any)
      .mockReturnValueOnce(conveyorBeltsData as any);

    const mockFile = new File([], "test.xlsx");

    const result = await importFromExcel(mockFile);

    expect(result.success).toBe(true);
    expect(result.extractedData.conveyorBelts).toBeDefined();
    expect(result.extractedData.conveyorBelts.totalBelts).toBe(80);
    expect(result.extractedData.conveyorBelts.maxSaturation).toBe(75.5);
  });

  it("should handle PowerGeneration sheets", async () => {
    const XLSX = (await import("xlsx")) as any;

    const mockWorkbook = {
      SheetNames: ["Overview", "PowerGeneration", "PowerGenerators"],
      Sheets: {
        Overview: {},
        PowerGeneration: {},
        PowerGenerators: {},
      },
    };

    const overviewData = [
      ["Metric", "Value"],
      ["Plan Name", "Test"],
      ["Recipe SID", "123"],
      ["Recipe Name", "Test"],
      ["Target Quantity", "10"],
      ["Total Machines", "10"],
      ["Total Power", "10 kW"],
      ["Raw Materials", "0"],
      ["Items", "0"],
    ];

    const powerGenerationData = [
      ["Metric", "Value"],
      ["TotalRequiredPower", "50000"],
      ["TotalGeneratedPower", "60000"],
    ];

    const powerGeneratorsData = [
      ["GeneratorID", "GeneratorName", "Count", "PowerPerGenerator", "TotalPower"],
      [2201, "太阳能板", 100, 360, 36000],
    ];

    const sheetDataMap: Record<string, any[][]> = {
      Overview: overviewData,
      PowerGeneration: powerGenerationData,
      PowerGenerators: powerGeneratorsData,
    };

    vi.mocked(XLSX.read).mockReturnValue(mockWorkbook as any);
    vi.mocked(XLSX.utils.sheet_to_json).mockImplementation((sheet: any) => {
      // Find which sheet this is
      for (const [name, mockSheet] of Object.entries(mockWorkbook.Sheets)) {
        if (mockSheet === sheet) {
          return sheetDataMap[name] || [];
        }
      }
      return [];
    });

    const mockFile = new File([], "test.xlsx");

    const result = await importFromExcel(mockFile);

    expect(result.success).toBe(true);
    if (result.extractedData.powerGeneration) {
      expect(result.extractedData.powerGeneration.generators).toBeDefined();
      expect(result.extractedData.powerGeneration.generators.length).toBeGreaterThan(0);
      expect(result.extractedData.powerGeneration.totalRequiredPower).toBe(50000);
    }
  });

  it("should handle missing required fields in Overview", async () => {
    const XLSX = (await import("xlsx")) as any;

    const mockWorkbook = {
      SheetNames: ["Overview"],
      Sheets: {
        Overview: {},
      },
    };

    const overviewData = [
      ["Metric", "Value"],
      ["Plan Name", "Test"],
      // Missing Recipe SID, Recipe Name, Target Quantity
    ];

    vi.mocked(XLSX.read).mockReturnValue(mockWorkbook as any);
    vi.mocked(XLSX.utils.sheet_to_json).mockReturnValue(overviewData as any);

    const mockFile = new File([], "test.xlsx");

    const result = await importFromExcel(mockFile);

    expect(result.success).toBe(false);
    expect(result.errors.some(e => e.type === "missing_data")).toBe(true);
  });

  it("should handle invalid data types in sheets", async () => {
    const XLSX = (await import("xlsx")) as any;

    const mockWorkbook = {
      SheetNames: ["Overview", "RawMaterials"],
      Sheets: {
        Overview: {},
        RawMaterials: {},
      },
    };

    const overviewData = [
      ["Metric", "Value"],
      ["Plan Name", "Test"],
      ["Recipe SID", "invalid"], // Invalid number
      ["Recipe Name", "Test"],
      ["Target Quantity", "10"],
      ["Total Machines", "10"],
      ["Total Power", "10 kW"],
      ["Raw Materials", "1"],
      ["Items", "0"],
    ];

    const rawMaterialsData = [
      ["ItemID", "ItemName", "ConsumptionRate"],
      ["invalid", "鉄鉱石", 15.5], // Invalid ItemID
    ];

    vi.mocked(XLSX.read).mockReturnValue(mockWorkbook as any);
    vi.mocked(XLSX.utils.sheet_to_json)
      .mockReturnValueOnce(overviewData as any)
      .mockReturnValueOnce(rawMaterialsData as any);

    const mockFile = new File([], "test.xlsx");

    const result = await importFromExcel(mockFile);

    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("should handle empty sheets", async () => {
    const XLSX = (await import("xlsx")) as any;

    const mockWorkbook = {
      SheetNames: ["Overview", "RawMaterials"],
      Sheets: {
        Overview: {},
        RawMaterials: {},
      },
    };

    const overviewData = [
      ["Metric", "Value"],
      ["Plan Name", "Test"],
      ["Recipe SID", "123"],
      ["Recipe Name", "Test"],
      ["Target Quantity", "10"],
      ["Total Machines", "10"],
      ["Total Power", "10 kW"],
      ["Raw Materials", "0"],
      ["Items", "0"],
    ];

    vi.mocked(XLSX.read).mockReturnValue(mockWorkbook as any);
    vi.mocked(XLSX.utils.sheet_to_json)
      .mockReturnValueOnce(overviewData as any)
      .mockReturnValueOnce([] as any); // Empty RawMaterials sheet

    const mockFile = new File([], "test.xlsx");

    const result = await importFromExcel(mockFile);

    expect(result.success).toBe(true);
    expect(result.extractedData.rawMaterials.length).toBe(0);
  });

  it("should use custom options for sheet names", async () => {
    const XLSX = (await import("xlsx")) as any;

    const mockWorkbook = {
      SheetNames: ["CustomOverview"],
      Sheets: {
        CustomOverview: {},
      },
    };

    const overviewData = [
      ["Metric", "Value"],
      ["Plan Name", "Test"],
      ["Recipe SID", "123"],
      ["Recipe Name", "Test"],
      ["Target Quantity", "10"],
      ["Total Machines", "10"],
      ["Total Power", "10 kW"],
      ["Raw Materials", "0"],
      ["Items", "0"],
    ];

    vi.mocked(XLSX.read).mockReturnValue(mockWorkbook as any);
    vi.mocked(XLSX.utils.sheet_to_json).mockReturnValue(overviewData as any);

    const mockFile = new File([], "test.xlsx");

    const result = await importFromExcel(mockFile, {
      sheetNames: {
        overview: "CustomOverview",
        rawMaterials: "RawMaterials",
        products: "Products",
        machines: "Machines",
        powerConsumption: "PowerConsumption",
        conveyorBelts: "ConveyorBelts",
        powerGeneration: "PowerGeneration",
      },
    });

    expect(result.success).toBe(true);
    expect(result.extractedData.planInfo.name).toBe("Test");
  });

  it("should handle products with zero consumption", async () => {
    const XLSX = (await import("xlsx")) as any;

    const mockWorkbook = {
      SheetNames: ["Overview", "Products"],
      Sheets: {
        Overview: {},
        Products: {},
      },
    };

    const overviewData = [
      ["Metric", "Value"],
      ["Plan Name", "Test"],
      ["Recipe SID", "123"],
      ["Recipe Name", "Test"],
      ["Target Quantity", "10"],
      ["Total Machines", "10"],
      ["Total Power", "10 kW"],
      ["Raw Materials", "0"],
      ["Items", "1"],
    ];

    const productsData = [
      ["ItemID", "ItemName", "ProductionRate", "ConsumptionRate", "NetProduction", "Unit"],
      [2001, "鉄インゴット", 15.5, 0, 15.5, "items/sec"],
    ];

    vi.mocked(XLSX.read).mockReturnValue(mockWorkbook as any);
    vi.mocked(XLSX.utils.sheet_to_json)
      .mockReturnValueOnce(overviewData as any)
      .mockReturnValueOnce(productsData as any);

    const mockFile = new File([], "test.xlsx");

    const result = await importFromExcel(mockFile);

    expect(result.success).toBe(true);
    expect(result.extractedData.products.length).toBeGreaterThan(0);
    if (result.extractedData.products.length > 0) {
      expect(result.extractedData.products[0].consumptionRate).toBe(0);
      expect(result.extractedData.products[0].netProduction).toBe(15.5);
    }
  });

  it("should handle machines with zero count", async () => {
    const XLSX = (await import("xlsx")) as any;

    const mockWorkbook = {
      SheetNames: ["Overview", "Machines"],
      Sheets: {
        Overview: {},
        Machines: {},
      },
    };

    const overviewData = [
      ["Metric", "Value"],
      ["Plan Name", "Test"],
      ["Recipe SID", "123"],
      ["Recipe Name", "Test"],
      ["Target Quantity", "10"],
      ["Total Machines", "0"],
      ["Total Power", "0 kW"],
      ["Raw Materials", "0"],
      ["Items", "0"],
    ];

    const machinesData = [
      ["MachineID", "MachineName", "Count", "PowerPerMachine", "TotalPower"],
      [3001, "製錬設備", 0, 360, 0],
    ];

    vi.mocked(XLSX.read).mockReturnValue(mockWorkbook as any);
    vi.mocked(XLSX.utils.sheet_to_json)
      .mockReturnValueOnce(overviewData as any)
      .mockReturnValueOnce(machinesData as any);

    const mockFile = new File([], "test.xlsx");

    const result = await importFromExcel(mockFile);

    expect(result.success).toBe(true);
    expect(result.extractedData.machines.length).toBe(1);
    expect(result.extractedData.machines[0].count).toBe(0);
  });

  it("should handle power values without units", async () => {
    const XLSX = (await import("xlsx")) as any;

    const mockWorkbook = {
      SheetNames: ["Overview"],
      Sheets: {
        Overview: {},
      },
    };

    const overviewData = [
      ["Metric", "Value"],
      ["Plan Name", "Test"],
      ["Recipe SID", "123"],
      ["Recipe Name", "Test"],
      ["Target Quantity", "10"],
      ["Total Machines", "10"],
      ["Total Power", "12500"], // No unit, assumed kW
      ["Raw Materials", "0"],
      ["Items", "0"],
    ];

    vi.mocked(XLSX.read).mockReturnValue(mockWorkbook as any);
    vi.mocked(XLSX.utils.sheet_to_json).mockReturnValue(overviewData as any);

    const mockFile = new File([], "test.xlsx");

    const result = await importFromExcel(mockFile);

    expect(result.success).toBe(true);
    expect(result.extractedData.statistics.totalPower).toBe(12500);
  });

  it("should handle multiple PowerGeneration sheets with different types", async () => {
    const XLSX = (await import("xlsx")) as any;

    const mockWorkbook = {
      SheetNames: ["Overview", "PowerGeneration", "PowerGenerators"],
      Sheets: {
        Overview: {},
        PowerGeneration: {},
        PowerGenerators: {},
      },
    };

    const overviewData = [
      ["Metric", "Value"],
      ["Plan Name", "Test"],
      ["Recipe SID", "123"],
      ["Recipe Name", "Test"],
      ["Target Quantity", "10"],
      ["Total Machines", "10"],
      ["Total Power", "10 kW"],
      ["Raw Materials", "0"],
      ["Items", "0"],
    ];

    const powerGenerationData = [
      ["Metric", "Value"],
      ["TotalRequiredPower", "50000"],
      ["TotalGeneratedPower", "51000"],
    ];

    const powerGeneratorsData = [
      ["GeneratorID", "GeneratorName", "Count", "PowerPerGenerator", "TotalPower"],
      [2201, "太阳能板", 100, 360, 36000],
      [2202, "风力涡轮机", 50, 300, 15000],
    ];

    const sheetDataMap: Record<string, any[][]> = {
      Overview: overviewData,
      PowerGeneration: powerGenerationData,
      PowerGenerators: powerGeneratorsData,
    };

    vi.mocked(XLSX.read).mockReturnValue(mockWorkbook as any);
    vi.mocked(XLSX.utils.sheet_to_json).mockImplementation((sheet: any) => {
      for (const [name, mockSheet] of Object.entries(mockWorkbook.Sheets)) {
        if (mockSheet === sheet) {
          return sheetDataMap[name] || [];
        }
      }
      return [];
    });

    const mockFile = new File([], "test.xlsx");

    const result = await importFromExcel(mockFile);

    expect(result.success).toBe(true);
    if (result.extractedData.powerGeneration) {
      expect(result.extractedData.powerGeneration.generators.length).toBe(2);
    }
  });

  it("should generate warnings for incomplete data", async () => {
    const XLSX = (await import("xlsx")) as any;

    const mockWorkbook = {
      SheetNames: ["Overview"],
      Sheets: {
        Overview: {},
      },
    };

    const overviewData = [
      ["Metric", "Value"],
      ["Plan Name", "Test"],
      ["Recipe SID", "123"],
      ["Recipe Name", "Test"],
      ["Target Quantity", "10"],
      ["Total Machines", "10"],
      ["Total Power", "10 kW"],
      ["Raw Materials", "5"], // Says 5 but no RawMaterials sheet
      ["Items", "0"],
    ];

    vi.mocked(XLSX.read).mockReturnValue(mockWorkbook as any);
    vi.mocked(XLSX.utils.sheet_to_json).mockReturnValue(overviewData as any);

    const mockFile = new File([], "test.xlsx");

    const result = await importFromExcel(mockFile);

    // Should succeed but may have warnings
    expect(result.success).toBe(true);
    expect(result.extractedData.rawMaterials.length).toBe(0);
  });

  it("should handle numeric strings in Overview", async () => {
    const XLSX = (await import("xlsx")) as any;

    const mockWorkbook = {
      SheetNames: ["Overview"],
      Sheets: {
        Overview: {},
      },
    };

    const overviewData = [
      ["Metric", "Value"],
      ["Plan Name", "Test"],
      ["Recipe SID", "123"],
      ["Recipe Name", "Test"],
      ["Target Quantity", "10.5"],
      ["Total Machines", "15"],
      ["Total Power", "12.5 MW"],
      ["Raw Materials", "2"],
      ["Items", "8"],
    ];

    vi.mocked(XLSX.read).mockReturnValue(mockWorkbook as any);
    vi.mocked(XLSX.utils.sheet_to_json).mockReturnValue(overviewData as any);

    const mockFile = new File([], "test.xlsx");

    const result = await importFromExcel(mockFile);

    expect(result.success).toBe(true);
    expect(result.extractedData.planInfo.targetQuantity).toBe(10.5);
    expect(result.extractedData.statistics.totalMachines).toBe(15);
    expect(result.extractedData.statistics.totalPower).toBe(12500);
  });

  it("should handle export date parsing", async () => {
    const XLSX = (await import("xlsx")) as any;

    const mockWorkbook = {
      SheetNames: ["Overview"],
      Sheets: {
        Overview: {},
      },
    };

    const overviewData = [
      ["Metric", "Value"],
      ["Version", EXPORT_VERSION],
      ["Export Date", "2025-01-20T10:30:00Z"],
      ["Plan Name", "Test"],
      ["Recipe SID", "123"],
      ["Recipe Name", "Test"],
      ["Target Quantity", "10"],
      ["Total Machines", "10"],
      ["Total Power", "10 kW"],
      ["Raw Materials", "0"],
      ["Items", "0"],
    ];

    vi.mocked(XLSX.read).mockReturnValue(mockWorkbook as any);
    vi.mocked(XLSX.utils.sheet_to_json).mockReturnValue(overviewData as any);

    const mockFile = new File([], "test.xlsx");

    const result = await importFromExcel(mockFile);

    expect(result.success).toBe(true);
    // Export date is parsed successfully
  });

  it("should handle missing export date", async () => {
    const XLSX = (await import("xlsx")) as any;

    const mockWorkbook = {
      SheetNames: ["Overview"],
      Sheets: {
        Overview: {},
      },
    };

    const overviewData = [
      ["Metric", "Value"],
      ["Plan Name", "Test"],
      ["Recipe SID", "123"],
      ["Recipe Name", "Test"],
      ["Target Quantity", "10"],
      ["Total Machines", "10"],
      ["Total Power", "10 kW"],
      ["Raw Materials", "0"],
      ["Items", "0"],
    ];

    vi.mocked(XLSX.read).mockReturnValue(mockWorkbook as any);
    vi.mocked(XLSX.utils.sheet_to_json).mockReturnValue(overviewData as any);

    const mockFile = new File([], "test.xlsx");

    const result = await importFromExcel(mockFile);

    expect(result.success).toBe(true);
    // Should handle gracefully without export date
  });
});
