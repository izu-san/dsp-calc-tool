import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { loadBuildInfo, type BuildInfo } from "../buildInfo";

// fetch をモック
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("buildInfo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("loadBuildInfo", () => {
    it("正常系: build-info.jsonを正しく読み込む", async () => {
      const mockBuildInfo: BuildInfo = {
        buildTime: "2025-01-15T10:30:00.000Z",
        appVersion: "0.0.3",
        buildStatus: {
          status: "success",
          workflowUrl: "https://github.com/owner/repo/actions/runs/123",
        },
        testCoverage: {
          percentage: 85.5,
          reportUrl: "https://example.com/coverage",
        },
        dataLastUpdated: "2025-01-15T09:00:00.000Z",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockBuildInfo,
      });

      const result = await loadBuildInfo();

      expect(result).toEqual(mockBuildInfo);
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("data/build-info.json"));
    });

    it("正常系: 最小限の情報のみでも読み込める", async () => {
      const mockBuildInfo: BuildInfo = {
        buildTime: "2025-01-15T10:30:00.000Z",
        appVersion: "0.0.3",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockBuildInfo,
      });

      const result = await loadBuildInfo();

      expect(result).toEqual(mockBuildInfo);
    });

    it("異常系: ファイルが存在しない場合はデフォルト値を返す", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const result = await loadBuildInfo();

      expect(result.buildTime).toBeDefined();
      expect(result.appVersion).toBeDefined();
      expect(mockFetch).toHaveBeenCalled();
    });

    it("異常系: ネットワークエラーの場合はデフォルト値を返す", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const result = await loadBuildInfo();

      expect(result.buildTime).toBeDefined();
      expect(result.appVersion).toBeDefined();
    });

    it("異常系: 不正なJSON構造の場合はデフォルト値を返す", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          invalid: "structure",
        }),
      });

      const result = await loadBuildInfo();

      expect(result.buildTime).toBeDefined();
      expect(result.appVersion).toBeDefined();
    });

    it("異常系: buildTimeがstringでない場合はデフォルト値を返す", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          buildTime: 123, // 数値（不正）
          appVersion: "0.0.3",
        }),
      });

      const result = await loadBuildInfo();

      expect(result.buildTime).toBeDefined();
      expect(result.appVersion).toBeDefined();
    });

    it("異常系: appVersionがstringでない場合はデフォルト値を返す", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          buildTime: "2025-01-15T10:30:00.000Z",
          appVersion: null, // null（不正）
        }),
      });

      const result = await loadBuildInfo();

      expect(result.buildTime).toBeDefined();
      expect(result.appVersion).toBeDefined();
    });
  });
});
