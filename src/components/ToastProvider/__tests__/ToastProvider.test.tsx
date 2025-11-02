import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

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
});
