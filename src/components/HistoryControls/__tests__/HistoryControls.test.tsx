import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useHistoryStore } from "../../../stores/historyStore";
import { historyDebouncer } from "../../../utils/historyDebouncer";
import { HistoryControls } from "../index";

// Mock dependencies
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("../../../stores/historyStore", () => ({
  useHistoryStore: vi.fn(),
}));

vi.mock("../../../utils/historyRestore", () => ({
  restoreStateFromHistory: vi.fn(),
}));

vi.mock("../../../utils/historyDebouncer", () => ({
  historyDebouncer: {
    flushAll: vi.fn(),
    cancelAll: vi.fn(),
  },
}));

vi.mock("../../ToastProvider/useToast", () => ({
  useToast: () => ({
    showToast: vi.fn(),
  }),
}));

vi.mock("../../HistoryDialog", () => ({
  HistoryDialog: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) =>
    isOpen ? <div data-testid="history-dialog">History Dialog</div> : null,
}));

vi.mock("../../../utils/historyDescriptionRegenerator", () => ({
  regenerateHistoryDescription: vi.fn(() => "Test description"),
}));

describe("HistoryControls", () => {
  const mockUndo = vi.fn();
  const mockRedo = vi.fn();
  const mockCanUndo = vi.fn();
  const mockCanRedo = vi.fn();
  const mockGetState = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementation
    vi.mocked(useHistoryStore).mockReturnValue({
      undo: mockUndo,
      redo: mockRedo,
      canUndo: mockCanUndo,
      canRedo: mockCanRedo,
    } as any);

    // Mock getState for historyDebouncer
    mockGetState.mockReturnValue({
      pushEntry: vi.fn(),
      entries: [],
      currentIndex: -1,
    });
    vi.mocked(useHistoryStore).getState = mockGetState;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Rendering", () => {
    it("Undo/Redoボタンをレンダリング", () => {
      mockCanUndo.mockReturnValue(false);
      mockCanRedo.mockReturnValue(false);

      render(<HistoryControls />);

      expect(screen.getByTestId("undo-button")).toBeInTheDocument();
      expect(screen.getByTestId("redo-button")).toBeInTheDocument();
      expect(screen.getByTestId("history-dialog-button")).toBeInTheDocument();
    });

    it("履歴がない場合はボタンが無効化される", () => {
      mockCanUndo.mockReturnValue(false);
      mockCanRedo.mockReturnValue(false);

      render(<HistoryControls />);

      expect(screen.getByTestId("undo-button")).toBeDisabled();
      expect(screen.getByTestId("redo-button")).toBeDisabled();
    });

    it("履歴がある場合はUndoボタンが有効化される", () => {
      mockCanUndo.mockReturnValue(true);
      mockCanRedo.mockReturnValue(false);

      render(<HistoryControls />);

      expect(screen.getByTestId("undo-button")).not.toBeDisabled();
      expect(screen.getByTestId("redo-button")).toBeDisabled();
    });

    it("Redoが可能な場合はRedoボタンが有効化される", () => {
      mockCanUndo.mockReturnValue(false);
      mockCanRedo.mockReturnValue(true);

      render(<HistoryControls />);

      expect(screen.getByTestId("undo-button")).toBeDisabled();
      expect(screen.getByTestId("redo-button")).not.toBeDisabled();
    });
  });

  describe("Undo functionality", () => {
    it("Undoボタンクリックで処理が実行される", async () => {
      mockCanUndo.mockReturnValue(true);
      mockCanRedo.mockReturnValue(false);

      const mockEntry = {
        id: "test-1",
        timestamp: Date.now(),
        type: "settings" as const,
        description: "Test change",
        changes: {},
      };

      mockGetState.mockReturnValue({
        pushEntry: vi.fn(),
        entries: [mockEntry],
        currentIndex: 0,
      });

      const user = userEvent.setup();
      render(<HistoryControls />);

      const undoButton = screen.getByTestId("undo-button");
      await user.click(undoButton);

      expect(historyDebouncer.flushAll).toHaveBeenCalled();
      expect(mockUndo).toHaveBeenCalled();
    });

    it("履歴がない場合はUndoが実行されない", async () => {
      mockCanUndo.mockReturnValue(false);
      mockCanRedo.mockReturnValue(false);

      const user = userEvent.setup();
      render(<HistoryControls />);

      const undoButton = screen.getByTestId("undo-button");
      // ボタンが無効なのでクリックできないが、試す
      expect(undoButton).toBeDisabled();
    });
  });

  describe("Redo functionality", () => {
    it("Redoボタンクリックで処理が実行される", async () => {
      mockCanUndo.mockReturnValue(true);
      mockCanRedo.mockReturnValue(true);

      const mockEntries = [
        {
          id: "test-1",
          timestamp: Date.now(),
          type: "settings" as const,
          description: "Test change 1",
          changes: {},
        },
        {
          id: "test-2",
          timestamp: Date.now(),
          type: "settings" as const,
          description: "Test change 2",
          changes: {},
        },
      ];

      mockGetState.mockReturnValue({
        pushEntry: vi.fn(),
        entries: mockEntries,
        currentIndex: 0,
      });

      const user = userEvent.setup();
      render(<HistoryControls />);

      const redoButton = screen.getByTestId("redo-button");
      await user.click(redoButton);

      expect(historyDebouncer.flushAll).toHaveBeenCalled();
      expect(historyDebouncer.cancelAll).toHaveBeenCalled();
      expect(mockRedo).toHaveBeenCalled();
    });

    it("履歴がない場合はRedoが実行されない", async () => {
      mockCanUndo.mockReturnValue(false);
      mockCanRedo.mockReturnValue(false);

      const user = userEvent.setup();
      render(<HistoryControls />);

      const redoButton = screen.getByTestId("redo-button");
      expect(redoButton).toBeDisabled();
    });
  });

  describe("History Dialog", () => {
    it("履歴ボタンクリックでダイアログが開く", async () => {
      mockCanUndo.mockReturnValue(false);
      mockCanRedo.mockReturnValue(false);

      const user = userEvent.setup();
      render(<HistoryControls />);

      expect(screen.queryByTestId("history-dialog")).not.toBeInTheDocument();

      const historyButton = screen.getByTestId("history-dialog-button");
      await user.click(historyButton);

      expect(screen.getByTestId("history-dialog")).toBeInTheDocument();
    });
  });

  describe("Keyboard shortcuts", () => {
    it("Ctrl+Zでundoが実行される", () => {
      mockCanUndo.mockReturnValue(true);
      mockCanRedo.mockReturnValue(false);

      const mockEntry = {
        id: "test-1",
        timestamp: Date.now(),
        type: "settings" as const,
        description: "Test change",
        changes: {},
      };

      mockGetState.mockReturnValue({
        pushEntry: vi.fn(),
        entries: [mockEntry],
        currentIndex: 0,
      });

      render(<HistoryControls />);

      fireEvent.keyDown(window, { key: "z", ctrlKey: true });

      expect(historyDebouncer.flushAll).toHaveBeenCalled();
      expect(mockUndo).toHaveBeenCalled();
    });

    it("Ctrl+Yでredoが実行される", () => {
      mockCanUndo.mockReturnValue(true);
      mockCanRedo.mockReturnValue(true);

      const mockEntries = [
        {
          id: "test-1",
          timestamp: Date.now(),
          type: "settings" as const,
          description: "Test change 1",
          changes: {},
        },
        {
          id: "test-2",
          timestamp: Date.now(),
          type: "settings" as const,
          description: "Test change 2",
          changes: {},
        },
      ];

      mockGetState.mockReturnValue({
        pushEntry: vi.fn(),
        entries: mockEntries,
        currentIndex: 0,
      });

      render(<HistoryControls />);

      fireEvent.keyDown(window, { key: "y", ctrlKey: true });

      expect(historyDebouncer.flushAll).toHaveBeenCalled();
      expect(mockRedo).toHaveBeenCalled();
    });

    it("Ctrl+Shift+Zでredoが実行される", () => {
      mockCanUndo.mockReturnValue(true);
      mockCanRedo.mockReturnValue(true);

      const mockEntries = [
        {
          id: "test-1",
          timestamp: Date.now(),
          type: "settings" as const,
          description: "Test change 1",
          changes: {},
        },
        {
          id: "test-2",
          timestamp: Date.now(),
          type: "settings" as const,
          description: "Test change 2",
          changes: {},
        },
      ];

      mockGetState.mockReturnValue({
        pushEntry: vi.fn(),
        entries: mockEntries,
        currentIndex: 0,
      });

      render(<HistoryControls />);

      fireEvent.keyDown(window, { key: "z", ctrlKey: true, shiftKey: true });

      expect(historyDebouncer.flushAll).toHaveBeenCalled();
      expect(mockRedo).toHaveBeenCalled();
    });

    it("入力フィールド内ではショートカットが無視される", () => {
      mockCanUndo.mockReturnValue(true);
      mockCanRedo.mockReturnValue(false);

      render(
        <div>
          <HistoryControls />
          <input data-testid="test-input" />
        </div>
      );

      const input = screen.getByTestId("test-input");
      fireEvent.keyDown(input, { key: "z", ctrlKey: true });

      // Undoは実行されない
      expect(mockUndo).not.toHaveBeenCalled();
    });

    it("テキストエリア内ではショートカットが無視される", () => {
      mockCanUndo.mockReturnValue(true);
      mockCanRedo.mockReturnValue(false);

      render(
        <div>
          <HistoryControls />
          <textarea data-testid="test-textarea" />
        </div>
      );

      const textarea = screen.getByTestId("test-textarea");
      fireEvent.keyDown(textarea, { key: "z", ctrlKey: true });

      // Undoは実行されない
      expect(mockUndo).not.toHaveBeenCalled();
    });

    it("履歴がない場合はショートカットが無視される", () => {
      mockCanUndo.mockReturnValue(false);
      mockCanRedo.mockReturnValue(false);

      render(<HistoryControls />);

      fireEvent.keyDown(window, { key: "z", ctrlKey: true });
      fireEvent.keyDown(window, { key: "y", ctrlKey: true });

      expect(mockUndo).not.toHaveBeenCalled();
      expect(mockRedo).not.toHaveBeenCalled();
    });
  });
});
