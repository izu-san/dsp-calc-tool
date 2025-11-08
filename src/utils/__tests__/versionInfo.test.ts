import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

// Setupファイルのloggerモックを解除して実際のloggerを使用
vi.unmock("../logger");
import { loadVersionInfo, type VersionInfo } from "../versionInfo";
import { getDataPath } from "../paths";

// Mock fetch globally
global.fetch = vi.fn();

describe("versionInfo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("loadVersionInfo", () => {
    it("正常なバージョン情報を読み込める", async () => {
      const mockVersionInfo: VersionInfo = {
        gameVersions: [
          {
            version: "0.10.33.27024",
            supported: true,
            dataLastUpdated: "2025-10-28T14:20:00+09:00",
          },
        ],
        primaryVersion: "0.10.33.27024",
        dataLastUpdated: "2025-10-28T14:20:00+09:00",
        appVersion: "0.0.3",
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockVersionInfo,
      } as Response);

      const result = await loadVersionInfo();

      expect(result).toEqual(mockVersionInfo);
      expect(global.fetch).toHaveBeenCalledWith(getDataPath("data/version-info.json"));
    });

    it("複数のゲームバージョンを含むバージョン情報を読み込める", async () => {
      const mockVersionInfo: VersionInfo = {
        gameVersions: [
          {
            version: "0.10.33.27024",
            supported: true,
            dataLastUpdated: "2025-10-28T14:20:00+09:00",
          },
          {
            version: "0.10.32.26000",
            supported: true,
            dataLastUpdated: "2025-10-15T12:00:00+09:00",
          },
          {
            version: "0.10.31.25000",
            supported: false,
            dataLastUpdated: "2025-09-30T10:00:00+09:00",
            note: "互換性が失われた可能性があります",
          },
        ],
        primaryVersion: "0.10.33.27024",
        dataLastUpdated: "2025-10-28T14:20:00+09:00",
        appVersion: "0.0.3",
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockVersionInfo,
      } as Response);

      const result = await loadVersionInfo();

      expect(result).toEqual(mockVersionInfo);
      expect(result.gameVersions).toHaveLength(3);
    });

    it("HTTPエラー時はデフォルト値を返す", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response);

      const result = await loadVersionInfo();

      expect(result).toEqual({
        gameVersions: [],
        primaryVersion: "",
        dataLastUpdated: "",
        appVersion: "0.0.0",
      });
    });

    it("ネットワークエラー時はデフォルト値を返す", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("Network error"));

      const result = await loadVersionInfo();

      expect(result).toEqual({
        gameVersions: [],
        primaryVersion: "",
        dataLastUpdated: "",
        appVersion: "0.0.0",
      });
    });

    it("無効なJSON構造時はデフォルト値を返す", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          invalid: "structure",
        }),
      } as Response);

      const result = await loadVersionInfo();

      expect(result).toEqual({
        gameVersions: [],
        primaryVersion: "",
        dataLastUpdated: "",
        appVersion: "0.0.0",
      });
    });

    it("gameVersionsが配列でない場合はデフォルト値を返す", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          gameVersions: "not an array",
          primaryVersion: "0.10.33.27024",
          dataLastUpdated: "2025-10-28T14:20:00+09:00",
          appVersion: "0.0.3",
        }),
      } as Response);

      const result = await loadVersionInfo();

      expect(result).toEqual({
        gameVersions: [],
        primaryVersion: "",
        dataLastUpdated: "",
        appVersion: "0.0.0",
      });
    });
  });
});
