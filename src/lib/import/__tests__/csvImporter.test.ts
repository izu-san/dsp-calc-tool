/**
 * CSV importer tests
 */

import { describe, it, expect } from "vitest";
import { importFromCSV } from "../csvImporter";
import { EXPORT_VERSION } from "../../../types/export";

describe("importFromCSV", () => {
  it("should parse valid CSV with all sections", () => {
    const csv = `# Metadata
Version,${EXPORT_VERSION}
ExportDate,2025-01-15T12:00:00Z

# Plan Info
PlanName,Test Plan
RecipeSID,123
RecipeName,Test Recipe
TargetQuantity,10.0

# Statistics
TotalMachines,45
TotalPower,12.5 MW
RawMaterialCount,3
ItemCount,15

# RawMaterials
ItemID,ItemName,ConsumptionRate,Unit
1001,鉄鉱石,15.5,items/sec
1002,銅鉱石,10.0,items/sec

# Products
ItemID,ItemName,ProductionRate,ConsumptionRate,NetProduction,Unit
2001,鉄インゴット,15.5,10.0,5.5,items/sec

# Machines
MachineID,MachineName,Count,PowerPerMachine,TotalPower
3001,製錬設備 Mk.II,10,360 kW,3600 kW

# PowerConsumption
Category,Power,Percentage
Machines,10500 kW,85.5
Sorters,1780 kW,14.5
Total,12280 kW,100

# ConveyorBelts
Metric,Value
TotalBelts,25
MaxSaturation,67.8
`;

    const result = importFromCSV(csv);

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
    expect(result.extractedData.conveyorBelts.totalBelts).toBe(25);
  });

  it("should handle missing Plan Info section", () => {
    const csv = `# Metadata
Version,${EXPORT_VERSION}
`;

    const result = importFromCSV(csv);

    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].type).toBe("missing_data");
  });

  it("should parse power values with different units", () => {
    const csv = `# Plan Info
PlanName,Test
RecipeSID,123
RecipeName,Test
TargetQuantity,10

# Statistics
TotalMachines,10
TotalPower,1.5 GW
RawMaterialCount,0
ItemCount,0

# Machines
MachineID,MachineName,Count,PowerPerMachine,TotalPower
3001,Test,1,100 kW,100 kW
`;

    const result = importFromCSV(csv);

    expect(result.success).toBe(true);
    expect(result.extractedData.statistics.totalPower).toBe(1500000); // 1.5 GW → 1500000 kW
  });

  it("should parse rate values with different units", () => {
    const csv = `# Plan Info
PlanName,Test
RecipeSID,123
RecipeName,Test
TargetQuantity,10

# Statistics
TotalMachines,0
TotalPower,0 kW
RawMaterialCount,0
ItemCount,0

# RawMaterials
ItemID,ItemName,ConsumptionRate,Unit
1001,Test,0.1/min,items/min
`;

    const result = importFromCSV(csv);

    expect(result.success).toBe(true);
    expect(result.extractedData.rawMaterials[0].consumptionRate).toBeCloseTo(0.1 / 60, 5);
  });

  it("should handle UTF-8 BOM encoding", () => {
    const csv = `\ufeff# Plan Info
PlanName,Test
RecipeSID,123
RecipeName,Test
TargetQuantity,10

# Statistics
TotalMachines,0
TotalPower,0 kW
RawMaterialCount,0
ItemCount,0
`;

    const result = importFromCSV(csv);

    expect(result.success).toBe(true);
    expect(result.extractedData.planInfo.name).toBe("Test");
  });

  it("should handle quoted CSV values", () => {
    const csv = `# Plan Info
PlanName,"Test, Plan"
RecipeSID,123
RecipeName,"Test, Recipe"
TargetQuantity,10

# Statistics
TotalMachines,0
TotalPower,0 kW
RawMaterialCount,0
ItemCount,0
`;

    const result = importFromCSV(csv);

    expect(result.success).toBe(true);
    expect(result.extractedData.planInfo.name).toBe("Test, Plan");
    expect(result.extractedData.planInfo.recipeName).toBe("Test, Recipe");
  });

  it("should handle empty sections", () => {
    const csv = `# Plan Info
PlanName,Test
RecipeSID,123
RecipeName,Test
TargetQuantity,10

# Statistics
TotalMachines,0
TotalPower,0 kW
RawMaterialCount,0
ItemCount,0

# RawMaterials
ItemID,ItemName,ConsumptionRate,Unit
`;

    const result = importFromCSV(csv);

    expect(result.success).toBe(true);
    expect(result.extractedData.rawMaterials.length).toBe(0);
  });

  it("should parse power generation section", () => {
    const csv = `# Plan Info
PlanName,Test
RecipeSID,123
RecipeName,Test
TargetQuantity,10

# Statistics
TotalMachines,0
TotalPower,0 kW
RawMaterialCount,0
ItemCount,0

# PowerGeneration
Metric,Value
TotalRequiredPower,12.5 MW
TotalGeneratedPower,15.0 MW

# PowerGenerators
GeneratorID,GeneratorName,Count,PowerPerGenerator,TotalPower,Fuel
4001,火力発電所,3,2.16 MW,6.48 MW,0.5 石炭
`;

    const result = importFromCSV(csv);

    expect(result.success).toBe(true);
    expect(result.extractedData.powerGeneration).toBeDefined();
    expect(result.extractedData.powerGeneration?.totalRequiredPower).toBe(12500); // 12.5 MW → 12500 kW
    expect(result.extractedData.powerGeneration?.generators?.length).toBe(1);
    expect(result.extractedData.powerGeneration?.generators?.[0].fuel?.length).toBe(1);
  });
});
