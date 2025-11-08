import { describe, it, expect } from "vitest";
import { ok, err, wrapResult, unwrapResult, type Result } from "../result";

describe("result.ts", () => {
  describe("ok", () => {
    it("成功結果を作成する", () => {
      const result = ok(42);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(42);
      }
    });

    it("任意の型の値をラップできる", () => {
      const stringResult = ok("test");
      expect(stringResult.ok).toBe(true);
      if (stringResult.ok) {
        expect(stringResult.value).toBe("test");
      }

      const objectResult = ok({ key: "value" });
      expect(objectResult.ok).toBe(true);
      if (objectResult.ok) {
        expect(objectResult.value).toEqual({ key: "value" });
      }
    });
  });

  describe("err", () => {
    it("エラー結果を作成する", () => {
      const error = new Error("Test error");
      const result = err(error);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe(error);
      }
    });

    it("任意の型のエラーをラップできる", () => {
      const stringError = err("string error");
      expect(stringError.ok).toBe(false);
      if (!stringError.ok) {
        expect(stringError.error).toBe("string error");
      }

      const numberError = err(404);
      expect(numberError.ok).toBe(false);
      if (!numberError.ok) {
        expect(numberError.error).toBe(404);
      }
    });
  });

  describe("wrapResult", () => {
    it("成功する関数をラップする", () => {
      const factory = () => 42;
      const result = wrapResult(factory);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(42);
      }
    });

    it("Errorを投げる関数をラップする", () => {
      const factory = () => {
        throw new Error("Test error");
      };
      const result = wrapResult(factory);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(Error);
        expect(result.error.message).toBe("Test error");
      }
    });

    it("Error以外の値を投げる関数をラップする", () => {
      const factory = () => {
        throw "string error";
      };
      const result = wrapResult(factory);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(Error);
        expect(result.error.message).toBe("string error");
      }
    });

    it("数値を投げる関数をラップする", () => {
      const factory = () => {
        throw 404;
      };
      const result = wrapResult(factory);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(Error);
        expect(result.error.message).toBe("404");
      }
    });
  });

  describe("unwrapResult", () => {
    it("成功結果から値を取得する", () => {
      const result = ok(42);
      const value = unwrapResult(result);
      expect(value).toBe(42);
    });

    it("エラー結果からエラーを投げる", () => {
      const error = new Error("Test error");
      const result = err(error);
      expect(() => unwrapResult(result)).toThrow("Test error");
    });

    it("Error以外のエラーを投げる", () => {
      const result = err("string error");
      expect(() => unwrapResult(result)).toThrow("string error");
    });

    it("数値エラーを投げる", () => {
      const result = err(404);
      expect(() => unwrapResult(result)).toThrow("404");
    });
  });

  describe("Result型の型安全性", () => {
    it("成功結果はvalueプロパティを持つ", () => {
      const result: Result<number> = ok(42);
      if (result.ok) {
        // TypeScriptの型チェック: result.valueが存在することを確認
        expect(typeof result.value).toBe("number");
      }
    });

    it("エラー結果はerrorプロパティを持つ", () => {
      const result: Result<number> = err(new Error("Test"));
      if (!result.ok) {
        // TypeScriptの型チェック: result.errorが存在することを確認
        expect(result.error).toBeInstanceOf(Error);
      }
    });

    it("成功結果ではerrorプロパティにアクセスできない", () => {
      const result: Result<number> = ok(42);
      if (result.ok) {
        // @ts-expect-error - errorプロパティは存在しない
        expect(result.error).toBeUndefined();
      }
    });

    it("エラー結果ではvalueプロパティにアクセスできない", () => {
      const result: Result<number> = err(new Error("Test"));
      if (!result.ok) {
        // @ts-expect-error - valueプロパティは存在しない
        expect(result.value).toBeUndefined();
      }
    });
  });
});
