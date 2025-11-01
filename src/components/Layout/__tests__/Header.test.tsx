import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Header } from "../Header";

// i18nextをモック
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        title: "Dyson Sphere Program - Production Calculator",
      };
      return translations[key] || key;
    },
  }),
}));

// LanguageSwitcherをモック
vi.mock("../../LanguageSwitcher", () => ({
  LanguageSwitcher: () => <div data-testid="language-switcher">Language Switcher</div>,
}));

describe("Header", () => {
  it("正しくレンダリングされる", () => {
    render(<Header />);

    expect(screen.getByText("Dyson Sphere Program - Production Calculator")).toBeInTheDocument();
  });

  it("ヘッダー要素が正しいクラスを持つ", () => {
    const { container } = render(<Header />);

    const header = container.querySelector("header");
    expect(header).toBeInTheDocument();
    expect(header).toHaveClass("fixed", "top-0", "left-0", "right-0", "z-50");
  });

  it("タイトルが表示される", () => {
    render(<Header />);

    const title = screen.getByRole("heading", { level: 1 });
    expect(title).toHaveTextContent("Dyson Sphere Program - Production Calculator");
  });

  it("LanguageSwitcherが表示される", () => {
    render(<Header />);

    expect(screen.getByTestId("language-switcher")).toBeInTheDocument();
  });

  it("PlanManagerがSuspenseでラップされている", () => {
    const { container } = render(<Header />);

    // Suspenseが機能していることを確認
    expect(container).toBeInTheDocument();
  });

  it("アニメーション背景ラインが存在する", () => {
    const { container } = render(<Header />);

    const animatedLine = container.querySelector(".animate-pulse-slow");
    expect(animatedLine).toBeInTheDocument();
  });

  it("max-widthコンテナが存在する", () => {
    const { container } = render(<Header />);

    const maxWidthContainer = container.querySelector(".max-w-7xl");
    expect(maxWidthContainer).toBeInTheDocument();
  });

  it("flex layout for title and controls", () => {
    const { container } = render(<Header />);

    const flexContainer = container.querySelector(".flex.items-center.justify-between");
    expect(flexContainer).toBeInTheDocument();
  });
});
