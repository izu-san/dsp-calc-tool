import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

// Setupファイルのloggerモックを解除して実際のloggerを使用
vi.unmock("../logger");
import { loadChangelog } from "../changelog";
import { getDataPath } from "../paths";

// Mock fetch globally
global.fetch = vi.fn();

describe("changelog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("loadChangelog", () => {
    const mockChangelogJa = `# チェンジログ

## [0.0.3] - 2025-10-28

### 追加
- ヘルプ/アバウトページ機能を追加
`;

    const mockChangelogEn = `# Changelog

## [0.0.3] - 2025-10-28

### Added
- Added Help/About page feature
`;

    it("日本語のチェンジログを読み込める", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        text: async () => mockChangelogJa,
      } as Response);

      const result = await loadChangelog("ja");

      expect(result).toBe(mockChangelogJa);
      expect(global.fetch).toHaveBeenCalledWith(getDataPath("CHANGELOG_ja.md"));
    });

    it("英語のチェンジログを読み込める", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        text: async () => mockChangelogEn,
      } as Response);

      const result = await loadChangelog("en");

      expect(result).toBe(mockChangelogEn);
      expect(global.fetch).toHaveBeenCalledWith(getDataPath("CHANGELOG_en.md"));
    });

    it("デフォルトで日本語のチェンジログを読み込む", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        text: async () => mockChangelogJa,
      } as Response);

      const result = await loadChangelog();

      expect(result).toBe(mockChangelogJa);
      expect(global.fetch).toHaveBeenCalledWith(getDataPath("CHANGELOG_ja.md"));
    });

    it("HTTPエラー時はnullを返す", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response);

      const result = await loadChangelog("ja");

      expect(result).toBeNull();
    });

    it("ネットワークエラー時はnullを返す", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("Network error"));

      const result = await loadChangelog("ja");

      expect(result).toBeNull();
    });

    it("空のチェンジログも読み込める", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        text: async () => "",
      } as Response);

      const result = await loadChangelog("ja");

      expect(result).toBe("");
    });
  });
});
