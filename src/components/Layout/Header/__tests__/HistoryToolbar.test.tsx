import { cleanup, render, screen, fireEvent, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HistoryToolbar } from "../HistoryToolbar";
import userEvent from "@testing-library/user-event";

// i18n モック
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

// HistoryDialog モック
vi.mock("../../../HistoryDialog", () => ({
  HistoryDialog: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) =>
    isOpen ? <div data-testid="history-dialog">History Dialog</div> : null,
}));

// useToast モック
const showToastMock = vi.fn();
vi.mock("../../../ToastProvider/useToast", () => ({
  useToast: () => ({ showToast: showToastMock }),
}));

// stores モック - 実際のストアを使用（localStorageをモック）
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  writable: true,
});

// ユーティリティ関数のモック
vi.mock("../../../../utils/history/restoration", () => ({
  restoreStateFromHistory: vi.fn(),
}));

vi.mock("../../../../utils/history/debouncer", () => ({
  historyDebouncer: {
    flushAll: vi.fn(),
    cancelAll: vi.fn(),
  },
}));

vi.mock("../../../../utils/history/regenerator", () => ({
  regenerateHistoryDescription: vi.fn(() => "Test description"),
}));

describe("HistoryToolbar", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    localStorage.clear();

    // ストアをリセット
    const { useHistoryStore } = await import("../../../../stores/historyStore");
    useHistoryStore.getState().clearHistory();

    // テスト用のエントリを追加
    useHistoryStore.getState().pushEntry({
      id: "test-1",
      timestamp: Date.now(),
      type: "plan",
      description: "Test entry",
      changes: {},
      previousChanges: {},
      version: 1,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("コンポーネントがレンダリングされる", () => {
    render(<HistoryToolbar />);
    expect(screen.getByTestId("undo-button")).toBeInTheDocument();
    expect(screen.getByTestId("redo-button")).toBeInTheDocument();
    expect(screen.getByTestId("history-dialog-button")).toBeInTheDocument();
  });

  it("Undoボタンがクリックできる", async () => {
    const user = userEvent.setup();
    const { useHistoryStore } = await import("../../../../stores/historyStore");

    render(<HistoryToolbar />);

    const undoButton = screen.getByTestId("undo-button");
    const initialIndex = useHistoryStore.getState().currentIndex;

    await user.click(undoButton);

    await waitFor(() => {
      const newIndex = useHistoryStore.getState().currentIndex;
      expect(newIndex).toBeLessThan(initialIndex);
    });
  });

  it("Redoボタンがクリックできる", async () => {
    const user = userEvent.setup();
    const { useHistoryStore } = await import("../../../../stores/historyStore");

    // まずUndoしてからRedoをテスト
    useHistoryStore.getState().undo();

    render(<HistoryToolbar />);

    const redoButton = screen.getByTestId("redo-button");
    const initialIndex = useHistoryStore.getState().currentIndex;

    await user.click(redoButton);

    await waitFor(() => {
      const newIndex = useHistoryStore.getState().currentIndex;
      expect(newIndex).toBeGreaterThan(initialIndex);
    });
  });

  it("canUndoがfalseの場合、Undoボタンが無効化される", async () => {
    const { useHistoryStore } = await import("../../../../stores/historyStore");
    useHistoryStore.getState().clearHistory();

    render(<HistoryToolbar />);

    const undoButton = screen.getByTestId("undo-button");
    expect(undoButton).toBeDisabled();
  });

  it("canRedoがfalseの場合、Redoボタンが無効化される", async () => {
    const { useHistoryStore } = await import("../../../../stores/historyStore");
    // 履歴をクリアして、Redoできない状態にする
    useHistoryStore.getState().clearHistory();

    render(<HistoryToolbar />);

    const redoButton = screen.getByTestId("redo-button");
    expect(redoButton).toBeDisabled();
  });

  it("History Dialogボタンをクリックするとダイアログが開く", async () => {
    const user = userEvent.setup();
    render(<HistoryToolbar />);

    const historyButton = screen.getByTestId("history-dialog-button");
    await user.click(historyButton);

    await waitFor(() => {
      expect(screen.getByTestId("history-dialog")).toBeInTheDocument();
    });
  });

  it("Ctrl+ZでUndoが実行される", async () => {
    const { useHistoryStore } = await import("../../../../stores/historyStore");
    render(<HistoryToolbar />);

    const initialIndex = useHistoryStore.getState().currentIndex;
    const event = new KeyboardEvent("keydown", {
      key: "z",
      ctrlKey: true,
      bubbles: true,
    });

    window.dispatchEvent(event);

    await waitFor(() => {
      const newIndex = useHistoryStore.getState().currentIndex;
      expect(newIndex).toBeLessThan(initialIndex);
    });
  });

  it("Ctrl+YでRedoが実行される", async () => {
    const { useHistoryStore } = await import("../../../../stores/historyStore");
    // まずUndoしてからRedoをテスト
    useHistoryStore.getState().undo();

    render(<HistoryToolbar />);

    const initialIndex = useHistoryStore.getState().currentIndex;
    const event = new KeyboardEvent("keydown", {
      key: "y",
      ctrlKey: true,
      bubbles: true,
    });

    window.dispatchEvent(event);

    await waitFor(() => {
      const newIndex = useHistoryStore.getState().currentIndex;
      expect(newIndex).toBeGreaterThan(initialIndex);
    });
  });

  it("入力フィールド内ではキーボードショートカットが無効", async () => {
    const { useHistoryStore } = await import("../../../../stores/historyStore");
    const initialIndex = useHistoryStore.getState().currentIndex;

    render(
      <div>
        <HistoryToolbar />
        <input data-testid="test-input" />
      </div>
    );

    const input = screen.getByTestId("test-input");
    input.focus();

    const event = new KeyboardEvent("keydown", {
      key: "z",
      ctrlKey: true,
      bubbles: true,
    });

    // input要素をtargetとして設定
    Object.defineProperty(event, "target", {
      value: input,
      writable: false,
    });

    window.dispatchEvent(event);

    // Undoが実行されないことを確認（currentIndexが変わらない）
    await new Promise(resolve => setTimeout(resolve, 100));
    const newIndex = useHistoryStore.getState().currentIndex;
    expect(newIndex).toBe(initialIndex);
  });
});
