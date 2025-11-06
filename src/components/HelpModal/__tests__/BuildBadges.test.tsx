import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BuildStatusBadge, TestCoverageBadge } from "../BuildBadges";

// Mock react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { percentage?: string }) => {
      if (key === "buildStatusSuccess") return "成功";
      if (key === "buildStatusFailure") return "失敗";
      if (key === "buildStatusUnknown") return "不明";
      if (key === "testCoveragePercentage" && opts?.percentage) {
        return `${opts.percentage}%`;
      }
      return key;
    },
  }),
}));

describe("BuildBadges", () => {
  describe("BuildStatusBadge", () => {
    it("成功ステータスを表示する", () => {
      render(<BuildStatusBadge status="success" />);

      expect(screen.getByText(/成功/)).toBeInTheDocument();
    });

    it("失敗ステータスを表示する", () => {
      render(<BuildStatusBadge status="failure" />);

      expect(screen.getByText(/失敗/)).toBeInTheDocument();
    });

    it("不明ステータスを表示する", () => {
      render(<BuildStatusBadge status="unknown" />);

      expect(screen.getByText(/不明/)).toBeInTheDocument();
    });

    it("ワークフローURLがある場合はリンクとして表示する", () => {
      const workflowUrl = "https://github.com/owner/repo/actions/runs/123";

      render(<BuildStatusBadge status="success" workflowUrl={workflowUrl} />);

      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("href", workflowUrl);
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });

    it("ワークフローURLがない場合はリンクではない", () => {
      render(<BuildStatusBadge status="success" />);

      expect(screen.queryByRole("link")).not.toBeInTheDocument();
    });
  });

  describe("TestCoverageBadge", () => {
    it("カバレッジ率85%以上は緑色で表示する", () => {
      render(<TestCoverageBadge percentage={85.5} />);

      const badge = screen.getByText(/85\.5%/);
      expect(badge).toBeInTheDocument();
      expect(badge.className).toContain("green");
    });

    it("カバレッジ率70-85%は黄色で表示する", () => {
      render(<TestCoverageBadge percentage={75.0} />);

      const badge = screen.getByText(/75\.0%/);
      expect(badge).toBeInTheDocument();
      expect(badge.className).toContain("yellow");
    });

    it("カバレッジ率70%未満は赤色で表示する", () => {
      render(<TestCoverageBadge percentage={65.0} />);

      const badge = screen.getByText(/65\.0%/);
      expect(badge).toBeInTheDocument();
      expect(badge.className).toContain("red");
    });

    it("レポートURLがある場合はリンクとして表示する", () => {
      const reportUrl = "https://example.com/coverage";

      render(<TestCoverageBadge percentage={85.5} reportUrl={reportUrl} />);

      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("href", reportUrl);
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });

    it("レポートURLがない場合はリンクではない", () => {
      render(<TestCoverageBadge percentage={85.5} />);

      expect(screen.queryByRole("link")).not.toBeInTheDocument();
    });
  });
});
