/**
 * Main import function tests
 */

import { describe, expect, it } from "vitest";
import { EXPORT_VERSION } from "../../../types/export";
import { importPlan } from "../index";

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

  it("should import Excel file", async () => {
    const file = new File([], "test.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const result = await importPlan(file);

    // Since we don't have a real Excel file, it will fail parsing
    // but it should attempt to use the Excel importer
    expect(result.success).toBe(false);
    if ("errors" in result) {
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });

  it("should handle Excel file read errors", async () => {
    const file = new File([], "test.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const result = await importPlan(file);

    expect(result.success).toBe(false);
    if ("errors" in result) {
      expect(result.errors.length).toBeGreaterThan(0);
      // Empty Excel file results in missing_data error
      expect(["parse", "missing_data"]).toContain(result.errors[0].type);
    }
  });

  it("should reject Markdown files", async () => {
    const file = new File([], "test.md", { type: "text/markdown" });
    const result = await importPlan(file);

    expect(result.success).toBe(false);
    if ("errors" in result) {
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].type).toBe("parse");
      expect(result.errors[0].message).toContain("Markdown");
    }
  });

  it("should reject .markdown extension", async () => {
    const file = new File([], "test.markdown", { type: "text/markdown" });
    const result = await importPlan(file);

    expect(result.success).toBe(false);
    if ("errors" in result) {
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].type).toBe("parse");
      expect(result.errors[0].message).toContain("Markdown");
    }
  });

  it("should handle files without extension", async () => {
    const file = new File([], "test", { type: "application/octet-stream" });
    const result = await importPlan(file);

    expect(result.success).toBe(false);
    if ("errors" in result) {
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].type).toBe("parse");
      expect(result.errors[0].message).toContain("Unsupported file format");
    }
  });

  it("should accept custom import options", async () => {
    const csv = `# Metadata
Version,${EXPORT_VERSION}

# Plan Info
PlanName,Test Plan
RecipeSID,123
RecipeName,Test Recipe
TargetQuantity,10.0

# Statistics
TotalMachines,10
TotalPower,1 kW
RawMaterialCount,0
ItemCount,0
`;

    const file = new File([csv], "test.csv", { type: "text/csv" });
    const result = await importPlan(file, {
      validateData: false,
      strictMode: false,
      allowPartialImport: true,
      autoFixErrors: false,
      checkVersion: false,
    });

    expect(result.success).toBe(true);
  });

  it("should use default options when not provided", async () => {
    const csv = `# Metadata
Version,${EXPORT_VERSION}

# Plan Info
PlanName,Test Plan
RecipeSID,123
RecipeName,Test Recipe
TargetQuantity,10.0

# Statistics
TotalMachines,10
TotalPower,1 kW
RawMaterialCount,0
ItemCount,0
`;

    const file = new File([csv], "test.csv", { type: "text/csv" });
    const result = await importPlan(file);

    expect(result.success).toBe(true);
  });

  it("should handle CSV with invalid data", async () => {
    const csv = `# Plan Info
PlanName,Test
RecipeSID,invalid
`;

    const file = new File([csv], "test.csv", { type: "text/csv" });
    const result = await importPlan(file);

    expect(result.success).toBe(false);
    if ("errors" in result) {
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });

  it("should handle case-insensitive file extensions", async () => {
    const csv = `# Metadata
Version,${EXPORT_VERSION}

# Plan Info
PlanName,Test Plan
RecipeSID,123
RecipeName,Test Recipe
TargetQuantity,10.0

# Statistics
TotalMachines,10
TotalPower,1 kW
RawMaterialCount,0
ItemCount,0
`;

    const file = new File([csv], "test.CSV", { type: "text/csv" });
    const result = await importPlan(file);

    expect(result.success).toBe(true);
  });

  it("should handle XLSX extension in uppercase", async () => {
    const file = new File([], "test.XLSX", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const result = await importPlan(file);

    // Will fail parsing but should recognize as Excel
    expect(result.success).toBe(false);
    if ("errors" in result) {
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });

  it("should provide detailed error message for unknown extensions", async () => {
    const file = new File([], "test.xyz", { type: "application/octet-stream" });
    const result = await importPlan(file);

    expect(result.success).toBe(false);
    if ("errors" in result) {
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].message).toContain("xyz");
    }
  });
});
