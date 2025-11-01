/**
 * Main import function tests
 */

import { describe, it, expect } from "vitest";
import { importPlan } from "../index";
import { EXPORT_VERSION } from "../../../types/export";

describe("importPlan", () => {
  it("should import CSV file", async () => {
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
`;

    const file = new File([csv], "test.csv", { type: "text/csv" });
    const result = await importPlan(file);

    expect(result.success).toBe(true);
    if ("extractedData" in result) {
      expect(result.extractedData.planInfo.name).toBe("Test Plan");
      expect(result.extractedData.planInfo.recipeSID).toBe(123);
    }
  });

  it("should reject unsupported file format", async () => {
    const file = new File([], "test.txt", { type: "text/plain" });
    const result = await importPlan(file);

    expect(result.success).toBe(false);
    if ("errors" in result) {
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].type).toBe("parse");
    }
  });

  it("should handle file read errors", async () => {
    // Create a file that will fail to read
    const file = new File([], "test.csv", { type: "text/csv" });
    // Mock File.text() to throw an error
    Object.defineProperty(file, "text", {
      value: () => Promise.reject(new Error("Failed to read file")),
    });

    const result = await importPlan(file);

    expect(result.success).toBe(false);
    if ("errors" in result) {
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].type).toBe("parse");
    }
  });
});
