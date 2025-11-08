import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { ReliabilityIndicator } from "../ReliabilityIndicator";
import { loadBuildInfo } from "../../../utils/buildInfo";

// buildInfoをモック
vi.mock("../../../utils/buildInfo");

// Mock react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      if (key === "reliabilityIndicator") return "信頼性インジケータ";
      if (key === "buildStatus") return "ビルドステータス";
      if (key === "testCoverage") return "テストカバレッジ";
      if (key === "buildTime") return "ビルド日時";
      if (key === "dataLastUpdated") return "データ最終更新日";
      return key;
    },
  }),
}));

// Mock i18n
vi.mock("../../../i18n", () => ({
  default: {
    language: "ja",
    changeLanguage: vi.fn(),
  },
}));

describe("ReliabilityIndicator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("ローディング中はスピナーを表示する", () => {
    vi.mocked(loadBuildInfo).mockImplementation(
      () => new Promise(() => {}) // 解決しないPromise
    );

    render(<ReliabilityIndicator />);

    // スピナーはdiv要素として表示される
    const spinner = document.querySelector(".animate-spin");
    expect(spinner).toBeInTheDocument();
  });

  it("ビルド情報が読み込めた場合は表示する", async () => {
    const mockBuildInfo = {
      buildTime: "2025-01-15T10:30:00.000Z",
      appVersion: "0.0.3",
      buildStatus: {
        status: "success" as const,
        workflowUrl: "https://github.com/owner/repo/actions/runs/123",
      },
      testCoverage: {
        percentage: 85.5,
        reportUrl: "https://example.com/coverage",
      },
      dataLastUpdated: "2025-01-15T09:00:00.000Z",
    };

    vi.mocked(loadBuildInfo).mockResolvedValueOnce(mockBuildInfo);

    render(<ReliabilityIndicator />);

    await waitFor(() => {
      expect(screen.getByText(/信頼性インジケータ/)).toBeInTheDocument();
    });

    expect(screen.getByText(/ビルドステータス/)).toBeInTheDocument();
    expect(screen.getByText(/テストカバレッジ/)).toBeInTheDocument();
    expect(screen.getByText(/ビルド日時/)).toBeInTheDocument();
    expect(screen.getByText(/データ最終更新日/)).toBeInTheDocument();
  });

  it("ビルド情報が読み込めない場合は何も表示しない", async () => {
    vi.mocked(loadBuildInfo).mockResolvedValueOnce(null);

    const { container } = render(<ReliabilityIndicator />);

    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  it("ビルドステータスがない場合は表示しない", async () => {
    const mockBuildInfo = {
      buildTime: "2025-01-15T10:30:00.000Z",
      appVersion: "0.0.3",
    };

    vi.mocked(loadBuildInfo).mockResolvedValueOnce(mockBuildInfo);

    render(<ReliabilityIndicator />);

    await waitFor(() => {
      expect(screen.getByText(/信頼性インジケータ/)).toBeInTheDocument();
    });

    expect(screen.queryByText(/ビルドステータス/)).not.toBeInTheDocument();
    expect(screen.queryByText(/テストカバレッジ/)).not.toBeInTheDocument();
    expect(screen.getByText(/ビルド日時/)).toBeInTheDocument();
  });

  it("エラーが発生した場合は何も表示しない", async () => {
    vi.mocked(loadBuildInfo).mockRejectedValueOnce(new Error("Network error"));

    const { container } = render(<ReliabilityIndicator />);

    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });
});
