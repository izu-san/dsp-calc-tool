import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ErrorBoundary } from "../ErrorBoundary";

// i18n のモック
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

// エラーを投げるダミー子コンポーネント
function Boom() {
  throw new Error("boom");
}

describe("ErrorBoundary", () => {
  const originalError = console.error;
  const originalConfirm = window.confirm;
  const originalReload = window.location.reload;
  let clearSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // noisy な React のエラーログを抑制しつつ、呼び出し自体は検証
    console.error = vi.fn();
    // confirm / reload / localStorage をモック
    window.confirm = vi.fn(() => true);
    window.location.reload = vi.fn() as unknown as typeof window.location.reload;
    clearSpy = vi.spyOn(Storage.prototype, "clear").mockImplementation(() => {});
  });

  afterEach(() => {
    console.error = originalError;
    window.confirm = originalConfirm;
    window.location.reload = originalReload;
    clearSpy.mockRestore();
    vi.restoreAllMocks();
  });

  it("エラーが発生しない場合は子要素をそのまま描画する", () => {
    render(
      <ErrorBoundary>
        <div data-testid="ok">ok</div>
      </ErrorBoundary>
    );
    expect(screen.getByTestId("ok")).toBeInTheDocument();
  });

  it("子でエラーが発生した場合、フォールバックUIを表示し、console.error が呼ばれる", () => {
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    );

    // フォールバックの見出しキーが表示される（i18n はキーをそのまま返すモック）
    expect(screen.getByText("errorOccurred")).toBeInTheDocument();
    // 詳細セクションのキーの存在確認
    expect(screen.getByText("errorDetails")).toBeInTheDocument();
    // console.error が呼ばれている（componentDidCatch）
    expect(console.error).toHaveBeenCalled();
  });

  it("reloadPage ボタンで window.location.reload が呼ばれる", () => {
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    );
    const reloadBtn = screen.getByText("reloadPage");
    fireEvent.click(reloadBtn);
    expect(window.location.reload).toHaveBeenCalled();
  });

  it("clearDataRestart ボタンで confirm 後に localStorage.clear と reload が呼ばれる", () => {
    (window.confirm as unknown as ReturnType<typeof vi.fn>).mockReturnValue(true);

    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    );
    const clearBtn = screen.getByText("clearDataRestart");
    fireEvent.click(clearBtn);
    expect(window.confirm).toHaveBeenCalled();
    expect(clearSpy).toHaveBeenCalled();
    expect(window.location.reload).toHaveBeenCalled();
  });

  it("confirm がキャンセルの場合は localStorage.clear せず reload も呼ばない", () => {
    (window.confirm as unknown as ReturnType<typeof vi.fn>).mockReturnValue(false);

    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    );
    const clearBtn = screen.getByText("clearDataRestart");
    fireEvent.click(clearBtn);
    expect(window.confirm).toHaveBeenCalled();
    expect(clearSpy).not.toHaveBeenCalled();
    expect(window.location.reload).not.toHaveBeenCalled();
  });
});
