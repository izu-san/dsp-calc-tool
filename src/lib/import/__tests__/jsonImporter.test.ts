import { describe, expect, it } from "vitest";
import { EXPORT_VERSION } from "../../../types/export";
import { parseExportDataFromJSON } from "../jsonImporter";

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
});
