import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
// createPortal をテスト簡易化のため直描画にモック
vi.mock("react-dom", () => ({
  createPortal: (node: unknown) => node,
}));

import { WelcomeModal } from "../WelcomeModal";

// i18n のモック（キーをそのまま返す）
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string, _opts?: unknown) => key }),
}));

describe("WelcomeModal", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });

  it("初回（キー未設定）ではモーダルが表示される", () => {
    render(<WelcomeModal />);
    // タイトルキー or スキップボタンキーが表示される
    expect(screen.getByText("welcomeToCalculator")).toBeInTheDocument();
    expect(screen.getByText("skip")).toBeInTheDocument();
  });

  it("既に閲覧済み（キー=true）なら表示されない", () => {
    window.localStorage.setItem("dsp_calc_tutorial_seen", "true");
    render(<WelcomeModal />);
    expect(screen.queryByText("welcomeToCalculator")).not.toBeInTheDocument();
    expect(screen.queryByText("skip")).not.toBeInTheDocument();
  });

  it("skip クリックで閉じる", () => {
    render(<WelcomeModal />);
    fireEvent.click(screen.getByText("skip"));
    // 非表示になること（タイトルが消える）
    expect(screen.queryByText("welcomeToCalculator")).not.toBeInTheDocument();
  });

  it("next/back でステップが遷移する", () => {
    render(<WelcomeModal />);
    // 初期は step0: welcomeToCalculator
    expect(screen.getByText("welcomeToCalculator")).toBeInTheDocument();
    fireEvent.click(screen.getByText("next"));
    // step1: basicUsage
    expect(screen.getByText("basicUsage")).toBeInTheDocument();
    fireEvent.click(screen.getByText("back"));
    expect(screen.getByText("welcomeToCalculator")).toBeInTheDocument();
  });

  it("最後のステップで getStarted を押すと閉じる", () => {
    render(<WelcomeModal />);
    // ステップを最後まで進める（steps は3つ）
    fireEvent.click(screen.getByText("next")); // -> basicUsage
    fireEvent.click(screen.getByText("next")); // -> convenientFeatures (last)
    expect(screen.getByText("convenientFeatures")).toBeInTheDocument();
    fireEvent.click(screen.getByText("getStarted"));
    expect(screen.queryByText("convenientFeatures")).not.toBeInTheDocument();
  });
});
