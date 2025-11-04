import { describe, it, expect } from "vitest";
import {
  DSPCalculatorError,
  DataLoadError,
  CalculationError,
  ValidationError,
  ParseError,
  StorageError,
} from "../errors";

describe("errors", () => {
  describe("DSPCalculatorError", () => {
    it("should create error with message, code, and details", () => {
      const error = new DSPCalculatorError("Test error", "TEST_ERROR", { foo: "bar" });

      expect(error.message).toBe("Test error");
      expect(error.code).toBe("TEST_ERROR");
      expect(error.details).toEqual({ foo: "bar" });
      expect(error.name).toBe("DSPCalculatorError");
    });

    it("should be instance of Error", () => {
      const error = new DSPCalculatorError("Test error", "TEST_ERROR");

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(DSPCalculatorError);
    });

    it("should work without details", () => {
      const error = new DSPCalculatorError("Test error", "TEST_ERROR");

      expect(error.details).toBeUndefined();
    });
  });

  describe("DataLoadError", () => {
    it("should create data load error", () => {
      const error = new DataLoadError("Failed to load data", { url: "/api/data" });

      expect(error.message).toBe("Failed to load data");
      expect(error.code).toBe("DATA_LOAD_ERROR");
      expect(error.name).toBe("DataLoadError");
      expect(error.details).toEqual({ url: "/api/data" });
    });

    it("should be instance of DSPCalculatorError", () => {
      const error = new DataLoadError("Test");

      expect(error).toBeInstanceOf(DSPCalculatorError);
      expect(error).toBeInstanceOf(DataLoadError);
    });
  });

  describe("CalculationError", () => {
    it("should create calculation error", () => {
      const error = new CalculationError("Calculation failed", { recipe: 1001 });

      expect(error.message).toBe("Calculation failed");
      expect(error.code).toBe("CALCULATION_ERROR");
      expect(error.name).toBe("CalculationError");
    });
  });

  describe("ValidationError", () => {
    it("should create validation error", () => {
      const error = new ValidationError("Invalid input", { field: "quantity" });

      expect(error.message).toBe("Invalid input");
      expect(error.code).toBe("VALIDATION_ERROR");
      expect(error.name).toBe("ValidationError");
    });
  });

  describe("ParseError", () => {
    it("should create parse error", () => {
      const error = new ParseError("Failed to parse XML", { line: 42 });

      expect(error.message).toBe("Failed to parse XML");
      expect(error.code).toBe("PARSE_ERROR");
      expect(error.name).toBe("ParseError");
    });
  });

  describe("StorageError", () => {
    it("should create storage error", () => {
      const error = new StorageError("localStorage quota exceeded");

      expect(error.message).toBe("localStorage quota exceeded");
      expect(error.code).toBe("STORAGE_ERROR");
      expect(error.name).toBe("StorageError");
    });
  });
});
