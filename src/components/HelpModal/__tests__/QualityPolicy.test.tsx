import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QualityPolicy } from "../QualityPolicy";

// Mock react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      if (key === "designPhilosophy") return "設計思想";
      if (key === "designPhilosophyDescription")
        return "このアプリケーションは、以下の設計思想に基づいて実装されています：\n\n• 型安全性を重視した実装\n• 関数型アプローチの採用\n• UIとビジネスロジックの分離\n• テスト容易性の確保";
      if (key === "qualityPolicy") return "品質保証ポリシー";
      if (key === "qualityPolicyDescription")
        return "このアプリケーションは、以下の品質保証ポリシーに基づいて開発されています：\n\n• 新規コードのテストカバレッジ目標: 85%以上\n• クリティカルパス（calculator, parser）: 90%以上\n• E2Eテストで主要なユーザーフローをカバー\n• 全てのPRで単体テストとE2Eテストが合格することを必須とする";
      return key;
    },
  }),
}));

describe("QualityPolicy", () => {
  it("設計思想セクションを表示する", () => {
    render(<QualityPolicy />);

    expect(screen.getByRole("heading", { name: /設計思想/ })).toBeInTheDocument();
    expect(screen.getByText(/型安全性を重視した実装/)).toBeInTheDocument();
  });

  it("品質保証ポリシーセクションを表示する", () => {
    render(<QualityPolicy />);

    expect(screen.getByRole("heading", { name: /品質保証ポリシー/ })).toBeInTheDocument();
    expect(screen.getByText(/テストカバレッジ目標: 85%以上/)).toBeInTheDocument();
  });
});
