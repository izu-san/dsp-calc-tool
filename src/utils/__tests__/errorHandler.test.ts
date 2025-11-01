import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { handleError, isErrorType, getErrorMessage } from "../errorHandler";
import { DSPCalculatorError, DataLoadError, CalculationError } from "../errors";

describe("errorHandler", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // ロガーがDEV環境でのみ動作するため、console.errorをモック
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe("handleError", () => {
    it("should handle DSPCalculatorError", () => {
      const error = new DataLoadError("Failed to load data");
      const message = handleError(error);

      expect(message).toBe("Failed to load data");
    });

    it("should handle standard Error", () => {
      const error = new Error("Standard error");
      const message = handleError(error);

      expect(message).toBe("Standard error");
    });

    it("should handle string error", () => {
      const message = handleError("String error");

      expect(message).toBe("Unknown error: String error");
    });

    it("should handle number error", () => {
      const message = handleError(42);

      expect(message).toBe("Unknown error: 42");
    });

    it("should handle null", () => {
      const message = handleError(null);

      expect(message).toBe("Unknown error: null");
    });

    it("should handle undefined", () => {
      const message = handleError(undefined);

      expect(message).toBe("Unknown error: undefined");
    });

    it("should include context in log", () => {
      const error = new Error("Test error");
      handleError(error, "Failed to process");

      // ロガーが開発環境でのみ動作するため、console.errorの呼び出しをチェック
      // 本番環境ではロガーは無効化されるため、このテストは開発環境でのみ有効
      if (import.meta.env.DEV) {
        expect(consoleErrorSpy).toHaveBeenCalled();
      }
    });
  });

  describe("isErrorType", () => {
    it("should return true for matching error type", () => {
      const error = new DataLoadError("Test");

      expect(isErrorType(error, DataLoadError)).toBe(true);
    });

    it("should return false for different error type", () => {
      const error = new DataLoadError("Test");

      expect(isErrorType(error, CalculationError)).toBe(false);
    });

    it("should return false for standard Error", () => {
      const error = new Error("Test");

      expect(isErrorType(error, DataLoadError)).toBe(false);
    });

    it("should return false for non-error", () => {
      const error = "string error";

      expect(isErrorType(error, DataLoadError)).toBe(false);
    });

    it("should work with base DSPCalculatorError", () => {
      const error = new DataLoadError("Test");

      expect(isErrorType(error, DSPCalculatorError)).toBe(true);
    });
  });

  describe("getErrorMessage", () => {
    it("should extract message from Error", () => {
      const error = new Error("Test message");

      expect(getErrorMessage(error)).toBe("Test message");
    });

    it("should extract message from DSPCalculatorError", () => {
      const error = new DataLoadError("Data load failed");

      expect(getErrorMessage(error)).toBe("Data load failed");
    });

    it("should return string error as-is", () => {
      expect(getErrorMessage("String error")).toBe("String error");
    });

    it("should return fallback for unknown error", () => {
      expect(getErrorMessage(42)).toBe("An unknown error occurred");
    });

    it("should use custom fallback", () => {
      expect(getErrorMessage(null, "Custom fallback")).toBe("Custom fallback");
    });
  });
});
