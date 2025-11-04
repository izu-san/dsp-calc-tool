import { describe, expect, it, vi, beforeEach } from "vitest";
import { EXPORT_VERSION } from "../../../types/export";
import { parseExportDataFromJSON, buildSavedPlanFromExportData } from "../jsonImporter";
import { createMockGameData } from "../../../test/factories/testDataFactory";

// Mock validation and planBuilder
const mockValidatePlanInfo = vi.fn();
const mockBuildPlanFromImport = vi.fn();

vi.mock("../validation", () => ({
  validatePlanInfo: (...args: unknown[]) => mockValidatePlanInfo(...args),
}));

vi.mock("../planBuilder", () => ({
  buildPlanFromImport: (...args: unknown[]) => mockBuildPlanFromImport(...args),
}));

describe("jsonImporter", () => {
  describe("parseExportDataFromJSON", () => {
    it("should parse valid JSON", () => {
      const validJSON = JSON.stringify({
        version: EXPORT_VERSION,
        planInfo: {
          planName: "Test Plan",
          recipeSID: 1,
          recipeName: "Iron Ingot",
          targetQuantity: 10,
        },
        settings: {
          locale: "en",
          defaultBeltTier: 3,
          defaultProliferator: "none",
          defaultMiningProductivity: 0,
        },
        exportDate: Date.now(),
        statistics: {
          totalMachines: 5,
          totalPower: 2000,
          rawMaterialCount: 1,
          itemCount: 2,
        },
        rawMaterials: [],
        products: [],
        machines: [],
        powerConsumption: {
          machines: 2000,
          sorters: 0,
          dysonSphere: 0,
          total: 2000,
          breakdown: [],
        },
        conveyorBelts: {
          totalBelts: 0,
          totalLength: 0,
          maxSaturation: 0,
        },
      });

      const result = parseExportDataFromJSON(validJSON);

      expect(result).toBeDefined();
      expect(result.version).toBe(EXPORT_VERSION);
      expect(result.planInfo.planName).toBe("Test Plan");
      expect(result.planInfo.recipeSID).toBe(1);
      expect(result.planInfo.targetQuantity).toBe(10);
    });

    it("should throw error for invalid JSON syntax", () => {
      const invalidJSON = '{"version": EXPORT_VERSION, "planInfo":';

      expect(() => {
        parseExportDataFromJSON(invalidJSON);
      }).toThrow(/Failed to parse JSON/);
    });

    it("should throw error for missing required fields", () => {
      const incompleteJSON = JSON.stringify({
        version: EXPORT_VERSION,
        // Missing planInfo
      });

      expect(() => {
        parseExportDataFromJSON(incompleteJSON);
      }).toThrow(/Invalid ExportData format/);
    });

    it("should throw error for invalid version", () => {
      const invalidVersionJSON = JSON.stringify({
        version: "0.0.1",
        planInfo: {
          planName: "Test Plan",
          recipeSID: 1,
          recipeName: "Iron Ingot",
          targetQuantity: 10,
        },
        settings: {},
        exportDate: Date.now(),
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
      });

      // parseExportDataFromJSON does not validate version, it just parses
      // Version validation would be done elsewhere
      const result = parseExportDataFromJSON(invalidVersionJSON);
      expect(result.version).toBe("0.0.1");
    });

    it("should handle empty string", () => {
      expect(() => {
        parseExportDataFromJSON("");
      }).toThrow(/Failed to parse JSON/);
    });

    it("should handle null input", () => {
      expect(() => {
        parseExportDataFromJSON(null as any);
      }).toThrow(/Failed to parse JSON/);
    });

    it("should handle undefined input", () => {
      expect(() => {
        parseExportDataFromJSON(undefined as any);
      }).toThrow(/Failed to parse JSON/);
    });

    it("should handle non-object JSON", () => {
      expect(() => {
        parseExportDataFromJSON("123");
      }).toThrow(/Invalid ExportData format/);

      expect(() => {
        parseExportDataFromJSON('"string"');
      }).toThrow(/Invalid ExportData format/);

      expect(() => {
        parseExportDataFromJSON("true");
      }).toThrow(/Invalid ExportData format/);
    });

    it("should handle large valid JSON", () => {
      const largeJSON = JSON.stringify({
        version: EXPORT_VERSION,
        planInfo: {
          planName: "Large Plan",
          recipeSID: 100,
          recipeName: "Complex Recipe",
          targetQuantity: 1000,
        },
        settings: {
          locale: "en",
          defaultBeltTier: 3,
          defaultProliferator: "proliferator_mk3",
          defaultMiningProductivity: 100,
        },
        exportDate: Date.now(),
        statistics: {
          totalMachines: 500,
          totalPower: 100000,
          rawMaterialCount: 10,
          itemCount: 50,
        },
        rawMaterials: Array(100).fill({
          itemSID: 1,
          itemName: "Iron Ore",
          quantity: 10,
        }),
        products: Array(50).fill({
          itemSID: 2,
          itemName: "Iron Ingot",
          quantity: 5,
        }),
        machines: Array(500).fill({
          machineSID: 1,
          machineName: "Smelter",
          count: 1,
          powerConsumption: 200,
        }),
        powerConsumption: {
          machines: 100000,
          sorters: 5000,
          dysonSphere: 0,
          total: 105000,
          breakdown: [],
        },
        conveyorBelts: {
          totalBelts: 200,
          totalLength: 5000,
          maxSaturation: 0.75,
        },
      });

      const result = parseExportDataFromJSON(largeJSON);

      expect(result).toBeDefined();
      expect(result.rawMaterials).toHaveLength(100);
      expect(result.products).toHaveLength(50);
      expect(result.machines).toHaveLength(500);
    });

    it("should handle JSON with special characters", () => {
      const specialCharsJSON = JSON.stringify({
        version: EXPORT_VERSION,
        planInfo: {
          planName: "日本語プラン名 🚀",
          recipeSID: 1,
          recipeName: "特殊文字 & symbols </>",
          targetQuantity: 10,
        },
        settings: {
          locale: "ja",
          defaultBeltTier: 3,
          defaultProliferator: "none",
          defaultMiningProductivity: 0,
        },
        exportDate: Date.now(),
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
      });

      const result = parseExportDataFromJSON(specialCharsJSON);

      expect(result.planInfo.planName).toBe("日本語プラン名 🚀");
    });

    it("should handle optional powerGeneration field", () => {
      const jsonWithPowerGen = JSON.stringify({
        version: EXPORT_VERSION,
        planInfo: {
          planName: "Test Plan",
          recipeSID: 1,
          recipeName: "Iron Ingot",
          targetQuantity: 10,
        },
        settings: {
          locale: "en",
          defaultBeltTier: 3,
          defaultProliferator: "none",
          defaultMiningProductivity: 0,
        },
        exportDate: Date.now(),
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
        powerGeneration: {
          totalRequiredPower: 0,
          totalGeneratedPower: 0,
          generators: [],
        },
      });

      const result = parseExportDataFromJSON(jsonWithPowerGen);

      expect(result).toBeDefined();
      expect(result.powerGeneration).toBeDefined();
      expect(result.powerGeneration?.totalGeneratedPower).toBe(0);
    });

    it("should handle JSON without powerGeneration field", () => {
      const jsonWithoutPowerGen = JSON.stringify({
        version: EXPORT_VERSION,
        planInfo: {
          planName: "Test Plan",
          recipeSID: 1,
          recipeName: "Iron Ingot",
          targetQuantity: 10,
        },
        settings: {
          locale: "en",
          defaultBeltTier: 3,
          defaultProliferator: "none",
          defaultMiningProductivity: 0,
        },
        exportDate: Date.now(),
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
      });

      const result = parseExportDataFromJSON(jsonWithoutPowerGen);

      expect(result).toBeDefined();
      expect(result.powerGeneration).toBeUndefined();
    });
  });

  // buildSavedPlanFromExportData tests are complex due to GameData and GlobalSettings mock requirements
  // Coverage for this function is tested through integration tests
  describe("buildSavedPlanFromExportData", () => {
    beforeEach(() => {
      vi.clearAllMocks();
      vi.spyOn(console, "warn").mockImplementation(() => {});
    });

    const createMockExportData = () => ({
      version: EXPORT_VERSION,
      planInfo: {
        planName: "Test Plan",
        recipeSID: 2001,
        recipeName: "Test Recipe",
        targetQuantity: 60,
      },
      settings: {
        machineRank: {
          Smelt: "arc",
          Assemble: "mk1",
          Chemical: "standard",
          Research: "standard",
          Refine: "standard",
          Particle: "standard",
        },
        proliferator: { type: "none", mode: "speed" },
        proliferatorMultiplier: { production: 1, speed: 1 },
        alternativeRecipes: {},
      },
      exportDate: Date.now(),
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
    });

    const mockGameData = createMockGameData();
    const mockCurrentSettings = {
      machineRank: {
        Smelt: "arc",
        Assemble: "mk1",
        Chemical: "standard",
        Research: "standard",
        Refine: "standard",
        Particle: "standard",
      },
      proliferator: { type: "none", mode: "speed" },
      proliferatorMultiplier: { production: 1, speed: 1 },
      alternativeRecipes: new Map(),
      conveyorBelt: { tier: "mk3", speed: 45, stackCount: 1 },
      sorter: { tier: "pile", speed: 30 },
      miningSpeedResearch: 100,
      photonGeneration: {
        useGravitonLens: false,
        rayTransmissionEfficiency: 0,
        gravitonLensProliferator: {
          type: "none" as const,
          mode: "speed" as const,
          speedBonus: 0,
          productionBonus: 0,
          powerIncrease: 0,
        },
      },
    };

    it("正常系: ExportDataからSavedPlanを構築", () => {
      const exportData = createMockExportData();
      mockValidatePlanInfo.mockReturnValue({
        isValid: true,
        errors: [],
        warnings: [],
      });
      mockBuildPlanFromImport.mockReturnValue({
        name: "Test Plan",
        timestamp: Date.now(),
        recipeSID: 2001,
        targetQuantity: 60,
        settings: mockCurrentSettings,
        alternativeRecipes: {},
        nodeOverrides: {},
      });

      const result = buildSavedPlanFromExportData(exportData, mockGameData, mockCurrentSettings);

      expect(result).toBeDefined();
      expect(result.recipeSID).toBe(2001);
      expect(result.targetQuantity).toBe(60);
      expect(mockValidatePlanInfo).toHaveBeenCalled();
      expect(mockBuildPlanFromImport).toHaveBeenCalled();
    });

    it("異常系: validatePlanInfoが失敗した場合はエラーを投げる", () => {
      const exportData = createMockExportData();
      mockValidatePlanInfo.mockReturnValue({
        isValid: false,
        errors: [{ type: "validation", message: "Recipe not found" }],
        warnings: [],
      });

      expect(() => {
        buildSavedPlanFromExportData(exportData, mockGameData, mockCurrentSettings);
      }).toThrow(/Validation failed/);
      expect(mockBuildPlanFromImport).not.toHaveBeenCalled();
    });

    it("異常系: buildPlanFromImportがnullを返した場合はエラーを投げる", () => {
      const exportData = createMockExportData();
      mockValidatePlanInfo.mockReturnValue({
        isValid: true,
        errors: [],
        warnings: [],
      });
      mockBuildPlanFromImport.mockReturnValue(null);

      expect(() => {
        buildSavedPlanFromExportData(exportData, mockGameData, mockCurrentSettings);
      }).toThrow(/Failed to build SavedPlan/);
    });

    it("警告がある場合はconsole.warnが呼ばれる", () => {
      const exportData = createMockExportData();
      mockValidatePlanInfo.mockReturnValue({
        isValid: true,
        errors: [],
        warnings: [{ type: "partial_data", message: "Warning message" }],
      });
      mockBuildPlanFromImport.mockReturnValue({
        name: "Test Plan",
        timestamp: Date.now(),
        recipeSID: 2001,
        targetQuantity: 60,
        settings: mockCurrentSettings,
        alternativeRecipes: {},
        nodeOverrides: {},
      });

      buildSavedPlanFromExportData(exportData, mockGameData, mockCurrentSettings);

      expect(console.warn).toHaveBeenCalledWith("Import warnings:", ["Warning message"]);
    });

    it("警告がない場合はconsole.warnが呼ばれない", () => {
      const exportData = createMockExportData();
      mockValidatePlanInfo.mockReturnValue({
        isValid: true,
        errors: [],
        warnings: [],
      });
      mockBuildPlanFromImport.mockReturnValue({
        name: "Test Plan",
        timestamp: Date.now(),
        recipeSID: 2001,
        targetQuantity: 60,
        settings: mockCurrentSettings,
        alternativeRecipes: {},
        nodeOverrides: {},
      });

      buildSavedPlanFromExportData(exportData, mockGameData, mockCurrentSettings);

      expect(console.warn).not.toHaveBeenCalled();
    });

    it("ExportDataの設定が現在の設定にマージされる", () => {
      const exportData = createMockExportData();
      exportData.settings = {
        ...exportData.settings,
        machineRank: {
          ...exportData.settings.machineRank,
          Smelt: "plane",
        },
      };
      mockValidatePlanInfo.mockReturnValue({
        isValid: true,
        errors: [],
        warnings: [],
      });
      const savedPlan = {
        name: "Test Plan",
        timestamp: Date.now(),
        recipeSID: 2001,
        targetQuantity: 60,
        settings: mockCurrentSettings,
        alternativeRecipes: {},
        nodeOverrides: {},
      };
      mockBuildPlanFromImport.mockReturnValue(savedPlan);

      const result = buildSavedPlanFromExportData(exportData, mockGameData, mockCurrentSettings);

      expect(result.settings.machineRank.Smelt).toBe("plane");
    });
  });
});
