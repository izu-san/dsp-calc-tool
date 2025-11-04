import { describe, it, expect } from "vitest";
import {
  EXPORT_VERSION,
  parseVersion,
  isCompatibleVersion,
  needsMigration,
  type VersionInfo,
} from "../exportVersion";

describe("exportVersion", () => {
  describe("EXPORT_VERSION", () => {
    it("現在のバージョンが定義されている", () => {
      expect(EXPORT_VERSION).toBeDefined();
      expect(typeof EXPORT_VERSION).toBe("string");
      expect(EXPORT_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
    });
  });

  describe("parseVersion", () => {
    it("正常なバージョン文字列をパースできる", () => {
      const result = parseVersion("1.2.3");
      expect(result).toEqual({
        major: 1,
        minor: 2,
        patch: 3,
      });
    });

    it("メジャーバージョンのみの場合はminorとpatchが0になる", () => {
      const result = parseVersion("2");
      expect(result).toEqual({
        major: 2,
        minor: 0,
        patch: 0,
      });
    });

    it("メジャーとマイナーのみの場合はpatchが0になる", () => {
      const result = parseVersion("1.2");
      expect(result).toEqual({
        major: 1,
        minor: 2,
        patch: 0,
      });
    });

    it("空文字列の場合は全て0になる", () => {
      const result = parseVersion("");
      expect(result).toEqual({
        major: 0,
        minor: 0,
        patch: 0,
      });
    });

    it("不正な形式の場合はNaNになる", () => {
      const result = parseVersion("invalid");
      // parts[0]が"invalid"で、parseInt("invalid", 10)はNaNを返す
      // parts[0] || "0"により"invalid"が使用される（空文字列でないため）
      expect(Number.isNaN(result.major)).toBe(true);
      expect(result.minor).toBe(0); // parts[1]はundefinedなので、"0"が使用される
      expect(result.patch).toBe(0); // parts[2]はundefinedなので、"0"が使用される
    });

    it("大きなバージョン番号をパースできる", () => {
      const result = parseVersion("10.20.30");
      expect(result).toEqual({
        major: 10,
        minor: 20,
        patch: 30,
      });
    });
  });

  describe("isCompatibleVersion", () => {
    it("同じメジャー・マイナーバージョンは互換性あり", () => {
      expect(isCompatibleVersion("1.0.0", "1.0.0")).toBe(true);
      expect(isCompatibleVersion("1.2.0", "1.2.0")).toBe(true);
      expect(isCompatibleVersion("1.2.5", "1.2.10")).toBe(true);
    });

    it("メジャーバージョンが異なる場合は互換性なし", () => {
      expect(isCompatibleVersion("1.0.0", "2.0.0")).toBe(false);
      expect(isCompatibleVersion("2.0.0", "1.0.0")).toBe(false);
      expect(isCompatibleVersion("1.5.0", "2.0.0")).toBe(false);
    });

    it("マイナーバージョンが古い場合は互換性あり（後方互換性）", () => {
      expect(isCompatibleVersion("1.0.0", "1.1.0")).toBe(true);
      expect(isCompatibleVersion("1.2.0", "1.5.0")).toBe(true);
      expect(isCompatibleVersion("1.0.10", "1.5.0")).toBe(true);
    });

    it("マイナーバージョンが新しい場合は互換性なし", () => {
      expect(isCompatibleVersion("1.5.0", "1.0.0")).toBe(false);
      expect(isCompatibleVersion("1.2.0", "1.0.0")).toBe(false);
    });

    it("パッチバージョンは互換性に影響しない", () => {
      expect(isCompatibleVersion("1.0.0", "1.0.5")).toBe(true);
      // マイナーバージョンが同じなので、古いマイナーバージョンは新しいバージョンで読める
      // 1.0.10のマイナーバージョンは0、1.0.0のマイナーバージョンも0なので、0 <= 0でtrue
      expect(isCompatibleVersion("1.0.10", "1.0.0")).toBe(true);
      expect(isCompatibleVersion("1.0.0", "1.0.0")).toBe(true);
    });

    it("currentVersionが指定されない場合はEXPORT_VERSIONを使用", () => {
      const result = isCompatibleVersion(EXPORT_VERSION);
      expect(result).toBe(true);
    });

    it("エッジケース: マイナーバージョン0", () => {
      expect(isCompatibleVersion("1.0.0", "1.0.1")).toBe(true);
      // 1.0.5と1.0.0は同じマイナーバージョン（0）なので、0 <= 0でtrue
      expect(isCompatibleVersion("1.0.5", "1.0.0")).toBe(true);
    });
  });

  describe("needsMigration", () => {
    it("同じバージョンはマイグレーション不要", () => {
      expect(needsMigration("1.0.0", "1.0.0")).toBe(false);
      expect(needsMigration("1.2.3", "1.2.3")).toBe(false);
    });

    it("バージョンが異なり互換性がある場合はマイグレーション必要", () => {
      expect(needsMigration("1.0.0", "1.1.0")).toBe(true);
      expect(needsMigration("1.2.0", "1.3.0")).toBe(true);
      expect(needsMigration("1.0.5", "1.1.0")).toBe(true);
    });

    it("互換性がない場合はマイグレーション不要（エラー扱い）", () => {
      expect(needsMigration("1.0.0", "2.0.0")).toBe(false);
      expect(needsMigration("2.0.0", "1.0.0")).toBe(false);
      expect(needsMigration("1.5.0", "1.0.0")).toBe(false);
    });

    it("パッチバージョンのみ異なる場合はマイグレーション必要", () => {
      expect(needsMigration("1.0.0", "1.0.1")).toBe(true);
      expect(needsMigration("1.2.3", "1.2.10")).toBe(true);
    });

    it("currentVersionが指定されない場合はEXPORT_VERSIONを使用", () => {
      const result = needsMigration(EXPORT_VERSION);
      expect(result).toBe(false);
    });

    it("エッジケース: マイナーバージョンアップ", () => {
      expect(needsMigration("1.0.0", "1.1.0")).toBe(true);
      expect(needsMigration("1.0.10", "1.1.0")).toBe(true);
    });

    it("エッジケース: メジャーバージョンアップ", () => {
      expect(needsMigration("1.0.0", "2.0.0")).toBe(false);
      expect(needsMigration("1.5.0", "2.0.0")).toBe(false);
    });
  });
});
