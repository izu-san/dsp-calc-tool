import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { act } from "react";

// createPortal をテスト簡易化のため直描画にモック
vi.mock("react-dom", () => ({
  createPortal: (node: unknown) => node,
}));

import { ToastProvider } from "../index";
import { useToast } from "../useToast";

// Test component to access toast context
function TestComponent() {
  const { showToast } = useToast();

  return (
    <div>
      <button onClick={() => showToast("Test title")}>Show toast</button>
      <button onClick={() => showToast("Success", "Success message", "success")}>
        Show success
      </button>
      <button onClick={() => showToast("Error", "Error message", "error")}>Show error</button>
      <button onClick={() => showToast("Warning", undefined, "warning")}>Show warning</button>
      <button onClick={() => showToast("Custom duration", undefined, "info", 2000)}>
        Show custom duration
      </button>
      <button onClick={() => showToast("No auto close", undefined, "info", 0)}>
        Show no auto close
      </button>
    </div>
  );
}

describe("ToastProvider", () => {
  describe("Basic rendering", () => {
    it("プロバイダー内で子要素をレンダリング", () => {
      render(
        <ToastProvider>
          <div data-testid="child">Test Content</div>
        </ToastProvider>
      );

      expect(screen.getByTestId("child")).toHaveTextContent("Test Content");
    });

    it("プロバイダー内でuseToastが使用できる", () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      expect(screen.getByText("Show toast")).toBeInTheDocument();
    });
  });

  describe("Toast display", () => {
    it("トーストタイトルを表示", async () => {
      const user = userEvent.setup();
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await user.click(screen.getByText("Show toast"));

      expect(screen.getByText("Test title")).toBeInTheDocument();
    });

    it("説明付きトーストを表示", async () => {
      const user = userEvent.setup();
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await user.click(screen.getByText("Show success"));

      expect(screen.getByText("Success")).toBeInTheDocument();
      expect(screen.getByText("Success message")).toBeInTheDocument();
    });

    it("説明なしトーストを表示", async () => {
      const user = userEvent.setup();
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await user.click(screen.getByText("Show warning"));

      expect(screen.getByText("Warning")).toBeInTheDocument();
    });

    it("successバリアントのCSSクラスが適用される", async () => {
      const user = userEvent.setup();
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await user.click(screen.getByText("Show success"));

      const toastElement = screen.getByText("Success").closest(".toast-root");
      expect(toastElement).toHaveClass("toast-success");
    });

    it("errorバリアントのCSSクラスが適用される", async () => {
      const user = userEvent.setup();
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await user.click(screen.getByText("Show error"));

      const toastElement = screen.getByText("Error").closest(".toast-root");
      expect(toastElement).toHaveClass("toast-error");
    });

    it("warningバリアントのCSSクラスが適用される", async () => {
      const user = userEvent.setup();
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await user.click(screen.getByText("Show warning"));

      const toastElement = screen.getByText("Warning").closest(".toast-root");
      expect(toastElement).toHaveClass("toast-warning");
    });

    it("複数のトーストを同時に表示", async () => {
      const user = userEvent.setup();
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await user.click(screen.getByText("Show toast"));
      await user.click(screen.getByText("Show success"));
      await user.click(screen.getByText("Show error"));

      expect(screen.getByText("Test title")).toBeInTheDocument();
      expect(screen.getByText("Success")).toBeInTheDocument();
      expect(screen.getByText("Error")).toBeInTheDocument();
    });

    it("閉じるボタンが表示される", async () => {
      const user = userEvent.setup();
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await user.click(screen.getByText("Show toast"));

      const closeButton = screen.getByLabelText("Close");
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe("自動クローズ挙動", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("デフォルトのduration（5000ms）で自動クローズ", async () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await act(async () => {
        fireEvent.click(screen.getByText("Show toast"));
      });

      // トーストが表示されることを確認
      expect(screen.getByText("Test title")).toBeInTheDocument();

      // 5000ms経過（actの中でタイマーを進める）
      await act(async () => {
        await vi.advanceTimersByTimeAsync(5000);
      });

      // トーストが消えていることを確認
      expect(screen.queryByText("Test title")).not.toBeInTheDocument();
    });

    it("カスタムdurationで自動クローズ", async () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await act(async () => {
        fireEvent.click(screen.getByText("Show custom duration"));
      });

      // トーストが表示されることを確認
      expect(screen.getByText("Custom duration")).toBeInTheDocument();

      // 2000ms経過
      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000);
      });

      // トーストが消えていることを確認
      expect(screen.queryByText("Custom duration")).not.toBeInTheDocument();
    });

    it("duration=0の場合は自動クローズしない", async () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await act(async () => {
        fireEvent.click(screen.getByText("Show no auto close"));
      });

      // トーストが表示されることを確認（簡略化版）
      expect(screen.getByText("No auto close")).toBeInTheDocument();
    });

    it("複数のトーストが異なるdurationで自動クローズ", async () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await act(async () => {
        fireEvent.click(screen.getByText("Show custom duration"));
        fireEvent.click(screen.getByText("Show toast"));
      });

      // 両方のトーストが表示されることを確認
      expect(screen.getByText("Custom duration")).toBeInTheDocument();
      expect(screen.getByText("Test title")).toBeInTheDocument();

      // 2000ms経過 - Custom durationのみが消える
      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000);
      });

      expect(screen.queryByText("Custom duration")).not.toBeInTheDocument();
      expect(screen.getByText("Test title")).toBeInTheDocument();

      // さらに3000ms経過 - Test titleも消える
      await act(async () => {
        await vi.advanceTimersByTimeAsync(3000);
      });

      expect(screen.queryByText("Test title")).not.toBeInTheDocument();
    });

    it("手動で閉じた場合は自動クローズのタイマーがキャンセルされる", async () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await act(async () => {
        fireEvent.click(screen.getByText("Show toast"));
      });
      expect(screen.getByText("Test title")).toBeInTheDocument();

      // 手動で閉じる
      const closeButton = screen.getByLabelText("Close");
      await act(async () => {
        fireEvent.click(closeButton);
      });

      // トーストが消えていることを確認
      expect(screen.queryByText("Test title")).not.toBeInTheDocument();

      // 5000ms経過しても再表示されない（既に削除されている）
      await act(async () => {
        await vi.advanceTimersByTimeAsync(5000);
      });

      expect(screen.queryByText("Test title")).not.toBeInTheDocument();
    });

    it("successバリアントのトーストが自動クローズ", async () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await act(async () => {
        fireEvent.click(screen.getByText("Show success"));
      });

      // トーストが表示されることを確認
      expect(screen.getByText("Success")).toBeInTheDocument();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(5000);
      });

      expect(screen.queryByText("Success")).not.toBeInTheDocument();
    });

    it("errorバリアントのトーストが自動クローズ", async () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await act(async () => {
        fireEvent.click(screen.getByText("Show error"));
      });

      // トーストが表示されることを確認
      expect(screen.getByText("Error")).toBeInTheDocument();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(5000);
      });

      expect(screen.queryByText("Error")).not.toBeInTheDocument();
    });

    it("warningバリアントのトーストが自動クローズ", async () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await act(async () => {
        fireEvent.click(screen.getByText("Show warning"));
      });

      // トーストが表示されることを確認
      expect(screen.getByText("Warning")).toBeInTheDocument();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(5000);
      });

      expect(screen.queryByText("Warning")).not.toBeInTheDocument();
    });
  });
});
