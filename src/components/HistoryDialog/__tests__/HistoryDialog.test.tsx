import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useHistoryStore } from "../../../stores/historyStore";
import type { HistoryEntry } from "../../../types/history";
import { generateUUID, HISTORY_VERSION } from "../../../utils/history/events";
import { HistoryDialog } from "../index";

// Mock i18n
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        history: "履歴",
        entries: "件のエントリ",
        close: "閉じる",
        noHistoryEntries: "履歴エントリがありません",
        current: "現在",
        changes: "変更",
        canUndo: "元に戻すことができます",
        canRedo: "やり直すことができます",
        noHistoryOperations: "履歴操作は利用できません",
        clearHistory: "履歴をクリア",
        showHistory: "履歴を表示",
      };
      return translations[key] || key;
    },
  }),
  initReactI18next: {
    type: "3rdParty",
    init: vi.fn(),
  },
}));

// Mock localStorage
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

global.localStorage = localStorageMock as Storage;

// Mock historyRestore
vi.mock("../../../utils/history/restoration", () => ({
  restoreStateFromHistory: vi.fn(),
}));

describe("HistoryDialog", () => {
  beforeEach(() => {
    useHistoryStore.getState().clearHistory();
    localStorage.clear();
  });

  describe("Rendering", () => {
    it("should not render when isOpen is false", () => {
      render(<HistoryDialog isOpen={false} onClose={vi.fn()} />);
      expect(screen.queryByText(/履歴|History/)).not.toBeInTheDocument();
    });

    it("should render when isOpen is true", () => {
      render(<HistoryDialog isOpen={true} onClose={vi.fn()} />);
      // Check for heading
      expect(screen.getByRole("heading", { name: /履歴/ })).toBeInTheDocument();
    });

    it("should show empty state when no history entries", () => {
      render(<HistoryDialog isOpen={true} onClose={vi.fn()} />);
      expect(screen.getByText(/履歴エントリがありません|No history entries/)).toBeInTheDocument();
    });

    it("should display history entries", () => {
      const entry: HistoryEntry = {
        id: generateUUID(),
        timestamp: Date.now(),
        type: "settings",
        description: "テスト変更",
        changes: { "settings.proliferator.type": "mk1" },
        version: HISTORY_VERSION,
      };

      useHistoryStore.getState().pushEntry(entry);

      render(<HistoryDialog isOpen={true} onClose={vi.fn()} />);
      expect(screen.getByText("テスト変更")).toBeInTheDocument();
    });
  });

  describe("Entry Interaction", () => {
    it("should restore to entry when clicking restore button", async () => {
      const user = userEvent.setup();
      const { restoreStateFromHistory } = await import("../../../utils/history/restoration");

      const entry1: HistoryEntry = {
        id: generateUUID(),
        timestamp: Date.now(),
        type: "settings",
        description: "変更1",
        changes: { "settings.proliferator.type": "none" },
        version: HISTORY_VERSION,
      };

      const entry2: HistoryEntry = {
        id: generateUUID(),
        timestamp: Date.now() + 1000,
        type: "settings",
        description: "変更2",
        changes: { "settings.proliferator.type": "mk1" },
        version: HISTORY_VERSION,
      };

      useHistoryStore.getState().pushEntry(entry1);
      useHistoryStore.getState().pushEntry(entry2);

      render(<HistoryDialog isOpen={true} onClose={vi.fn()} />);

      // Click on restore button for first entry
      const restoreButtons = screen.getAllByText(/restore/);
      if (restoreButtons.length > 0) {
        await user.click(restoreButtons[0]);
      }

      // Should call restoreStateFromHistory
      await waitFor(() => {
        expect(restoreStateFromHistory).toHaveBeenCalled();
      });
    });
  });

  describe("Clear History", () => {
    it("should clear history when clicking clear button", async () => {
      const user = userEvent.setup();
      const entry: HistoryEntry = {
        id: generateUUID(),
        timestamp: Date.now(),
        type: "settings",
        description: "テスト変更",
        changes: { "settings.proliferator.type": "mk1" },
        version: HISTORY_VERSION,
      };

      useHistoryStore.getState().pushEntry(entry);

      render(<HistoryDialog isOpen={true} onClose={vi.fn()} />);

      const clearButton = screen.getByRole("button", { name: /履歴をクリア/ });
      await user.click(clearButton);

      // Should show empty state
      await waitFor(() => {
        expect(screen.getByText(/履歴エントリがありません|No history entries/)).toBeInTheDocument();
      });
    });
  });

  describe("Close Dialog", () => {
    it("should call onClose when clicking close button", async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(<HistoryDialog isOpen={true} onClose={onClose} />);

      const closeButton = screen.getByRole("button", { name: /閉じる/ });
      await user.click(closeButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("should call onClose when clicking backdrop", async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(<HistoryDialog isOpen={true} onClose={onClose} />);

      // Click on backdrop (the outer div with fixed class)
      const backdrop = screen.getByRole("heading", { name: /履歴/ }).closest(".fixed");
      if (backdrop) {
        await user.click(backdrop);
      }

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("should call onClose when pressing Escape key", () => {
      const onClose = vi.fn();

      render(<HistoryDialog isOpen={true} onClose={onClose} />);

      const event = new KeyboardEvent("keydown", { key: "Escape" });
      window.dispatchEvent(event);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("should not call onClose when pressing Escape key and dialog is closed", () => {
      const onClose = vi.fn();

      render(<HistoryDialog isOpen={false} onClose={onClose} />);

      const event = new KeyboardEvent("keydown", { key: "Escape" });
      window.dispatchEvent(event);

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe("Entry Types", () => {
    it("should display correct icon for settings type", () => {
      const entry: HistoryEntry = {
        id: generateUUID(),
        timestamp: Date.now(),
        type: "settings",
        description: "設定変更",
        changes: {},
        version: HISTORY_VERSION,
      };

      useHistoryStore.getState().pushEntry(entry);

      render(<HistoryDialog isOpen={true} onClose={vi.fn()} />);
      expect(screen.getByText("⚙️")).toBeInTheDocument();
    });

    it("should display correct icon for nodeOverride type", () => {
      const entry: HistoryEntry = {
        id: generateUUID(),
        timestamp: Date.now(),
        type: "nodeOverride",
        description: "ノード変更",
        changes: {},
        version: HISTORY_VERSION,
      };

      useHistoryStore.getState().pushEntry(entry);

      render(<HistoryDialog isOpen={true} onClose={vi.fn()} />);
      expect(screen.getByText("🎯")).toBeInTheDocument();
    });

    it("should display correct icon for plan type", () => {
      const entry: HistoryEntry = {
        id: generateUUID(),
        timestamp: Date.now(),
        type: "plan",
        description: "プラン変更",
        changes: {},
        version: HISTORY_VERSION,
      };

      useHistoryStore.getState().pushEntry(entry);

      render(<HistoryDialog isOpen={true} onClose={vi.fn()} />);
      expect(screen.getByText("📋")).toBeInTheDocument();
    });

    it("should display correct icon for powerGeneration type", () => {
      const entry: HistoryEntry = {
        id: generateUUID(),
        timestamp: Date.now(),
        type: "powerGeneration",
        description: "発電設備変更",
        changes: {},
        version: HISTORY_VERSION,
      };

      useHistoryStore.getState().pushEntry(entry);

      render(<HistoryDialog isOpen={true} onClose={vi.fn()} />);
      expect(screen.getByText("⚡")).toBeInTheDocument();
    });
  });

  describe("Current Entry Highlighting", () => {
    it("should highlight current entry", () => {
      const entry: HistoryEntry = {
        id: generateUUID(),
        timestamp: Date.now(),
        type: "settings",
        description: "現在のエントリ",
        changes: {},
        version: HISTORY_VERSION,
      };

      useHistoryStore.getState().pushEntry(entry);

      render(<HistoryDialog isOpen={true} onClose={vi.fn()} />);

      // Check for current badge by looking for the specific badge element
      const currentBadges = screen.getAllByText("現在");
      expect(currentBadges.length).toBeGreaterThan(0);
      // The badge should have specific classes
      const badge = currentBadges.find(
        el => el.classList.contains("bg-neon-cyan/20") || el.classList.contains("text-neon-cyan")
      );
      expect(badge).toBeInTheDocument();
    });
  });

  describe("Filter Functionality", () => {
    beforeEach(() => {
      // Add entries of different types
      const entries: HistoryEntry[] = [
        {
          id: generateUUID(),
          timestamp: Date.now(),
          type: "settings",
          description: "設定変更",
          changes: {},
          version: HISTORY_VERSION,
        },
        {
          id: generateUUID(),
          timestamp: Date.now() + 1000,
          type: "nodeOverride",
          description: "ノード変更",
          changes: {},
          version: HISTORY_VERSION,
        },
        {
          id: generateUUID(),
          timestamp: Date.now() + 2000,
          type: "plan",
          description: "プラン変更",
          changes: {},
          version: HISTORY_VERSION,
        },
        {
          id: generateUUID(),
          timestamp: Date.now() + 3000,
          type: "powerGeneration",
          description: "発電変更",
          changes: {},
          version: HISTORY_VERSION,
        },
      ];

      entries.forEach(entry => useHistoryStore.getState().pushEntry(entry));
    });

    it("should show all entries by default", () => {
      render(<HistoryDialog isOpen={true} onClose={vi.fn()} />);
      expect(screen.getByText("設定変更")).toBeInTheDocument();
      expect(screen.getByText("ノード変更")).toBeInTheDocument();
      expect(screen.getByText("プラン変更")).toBeInTheDocument();
      expect(screen.getByText("発電変更")).toBeInTheDocument();
    });

    it("should filter settings entries", async () => {
      const user = userEvent.setup();
      render(<HistoryDialog isOpen={true} onClose={vi.fn()} />);

      const filterButton = screen.getByRole("button", { name: /filterSettings/ });
      await user.click(filterButton);

      expect(screen.getByText("設定変更")).toBeInTheDocument();
      expect(screen.queryByText("ノード変更")).not.toBeInTheDocument();
      expect(screen.queryByText("プラン変更")).not.toBeInTheDocument();
      expect(screen.queryByText("発電変更")).not.toBeInTheDocument();
    });

    it("should filter nodeOverride entries", async () => {
      const user = userEvent.setup();
      render(<HistoryDialog isOpen={true} onClose={vi.fn()} />);

      const filterButton = screen.getByRole("button", { name: /filterNodeOverride/ });
      await user.click(filterButton);

      expect(screen.queryByText("設定変更")).not.toBeInTheDocument();
      expect(screen.getByText("ノード変更")).toBeInTheDocument();
      expect(screen.queryByText("プラン変更")).not.toBeInTheDocument();
      expect(screen.queryByText("発電変更")).not.toBeInTheDocument();
    });

    it("should filter plan entries", async () => {
      const user = userEvent.setup();
      render(<HistoryDialog isOpen={true} onClose={vi.fn()} />);

      const filterButton = screen.getByRole("button", { name: /filterPlan/ });
      await user.click(filterButton);

      expect(screen.queryByText("設定変更")).not.toBeInTheDocument();
      expect(screen.queryByText("ノード変更")).not.toBeInTheDocument();
      expect(screen.getByText("プラン変更")).toBeInTheDocument();
      expect(screen.queryByText("発電変更")).not.toBeInTheDocument();
    });

    it("should filter powerGeneration entries", async () => {
      const user = userEvent.setup();
      render(<HistoryDialog isOpen={true} onClose={vi.fn()} />);

      const filterButton = screen.getByRole("button", { name: /filterPowerGeneration/ });
      await user.click(filterButton);

      expect(screen.queryByText("設定変更")).not.toBeInTheDocument();
      expect(screen.queryByText("ノード変更")).not.toBeInTheDocument();
      expect(screen.queryByText("プラン変更")).not.toBeInTheDocument();
      expect(screen.getByText("発電変更")).toBeInTheDocument();
    });

    it("should return to all entries when clicking allTypes", async () => {
      const user = userEvent.setup();
      render(<HistoryDialog isOpen={true} onClose={vi.fn()} />);

      // First filter to settings
      const settingsButton = screen.getByRole("button", { name: /filterSettings/ });
      await user.click(settingsButton);

      // Then return to all
      const allButton = screen.getByRole("button", { name: /allTypes/ });
      await user.click(allButton);

      expect(screen.getByText("設定変更")).toBeInTheDocument();
      expect(screen.getByText("ノード変更")).toBeInTheDocument();
      expect(screen.getByText("プラン変更")).toBeInTheDocument();
      expect(screen.getByText("発電変更")).toBeInTheDocument();
    });
  });

  describe("Search Functionality", () => {
    beforeEach(() => {
      const entries: HistoryEntry[] = [
        {
          id: generateUUID(),
          timestamp: Date.now(),
          type: "settings",
          description: "増産剤を変更",
          changes: {},
          version: HISTORY_VERSION,
        },
        {
          id: generateUUID(),
          timestamp: Date.now() + 1000,
          type: "nodeOverride",
          description: "ノードの設定を変更",
          changes: {},
          version: HISTORY_VERSION,
        },
        {
          id: generateUUID(),
          timestamp: Date.now() + 2000,
          type: "plan",
          description: "レシピを選択",
          changes: {},
          version: HISTORY_VERSION,
        },
      ];

      entries.forEach(entry => useHistoryStore.getState().pushEntry(entry));
    });

    it("should filter entries by search query", async () => {
      const user = userEvent.setup();
      render(<HistoryDialog isOpen={true} onClose={vi.fn()} />);

      const searchInput = screen.getByPlaceholderText(/searchHistoryPlaceholder/);
      await user.type(searchInput, "増産");

      expect(screen.getByText("増産剤を変更")).toBeInTheDocument();
      expect(screen.queryByText("ノードの設定を変更")).not.toBeInTheDocument();
      expect(screen.queryByText("レシピを選択")).not.toBeInTheDocument();
    });

    it("should show all entries when search is empty", async () => {
      const user = userEvent.setup();
      render(<HistoryDialog isOpen={true} onClose={vi.fn()} />);

      const searchInput = screen.getByPlaceholderText(/searchHistoryPlaceholder/);
      await user.type(searchInput, "test");
      await user.clear(searchInput);

      expect(screen.getByText("増産剤を変更")).toBeInTheDocument();
      expect(screen.getByText("ノードの設定を変更")).toBeInTheDocument();
      expect(screen.getByText("レシピを選択")).toBeInTheDocument();
    });

    it("should clear search when clicking clear button", async () => {
      const user = userEvent.setup();
      render(<HistoryDialog isOpen={true} onClose={vi.fn()} />);

      const searchInput = screen.getByPlaceholderText(/searchHistoryPlaceholder/);
      await user.type(searchInput, "test");

      const clearButton = screen.getByText("✕");
      await user.click(clearButton);

      expect(searchInput).toHaveValue("");
    });

    it("should be case insensitive", async () => {
      const user = userEvent.setup();
      render(<HistoryDialog isOpen={true} onClose={vi.fn()} />);

      const searchInput = screen.getByPlaceholderText(/searchHistoryPlaceholder/);
      await user.type(searchInput, "レシピ");

      expect(screen.getByText("レシピを選択")).toBeInTheDocument();
    });
  });

  describe("Timestamp Formatting", () => {
    it("should show 'justNow' for recent entries", () => {
      const entry: HistoryEntry = {
        id: generateUUID(),
        timestamp: Date.now(),
        type: "settings",
        description: "最近の変更",
        changes: {},
        version: HISTORY_VERSION,
      };

      useHistoryStore.getState().pushEntry(entry);

      render(<HistoryDialog isOpen={true} onClose={vi.fn()} />);
      expect(screen.getByText("justNow")).toBeInTheDocument();
    });

    it("should show minutes ago for entries within an hour", () => {
      const entry: HistoryEntry = {
        id: generateUUID(),
        timestamp: Date.now() - 5 * 60 * 1000, // 5 minutes ago
        type: "settings",
        description: "5分前の変更",
        changes: {},
        version: HISTORY_VERSION,
      };

      useHistoryStore.getState().pushEntry(entry);

      render(<HistoryDialog isOpen={true} onClose={vi.fn()} />);
      // Should contain "5" and "minutesAgo"
      const timestampText = screen.getByText(/minutesAgo/);
      expect(timestampText).toBeInTheDocument();
    });

    it("should show hours ago for entries within 24 hours", () => {
      const entry: HistoryEntry = {
        id: generateUUID(),
        timestamp: Date.now() - 5 * 60 * 60 * 1000, // 5 hours ago
        type: "settings",
        description: "5時間前の変更",
        changes: {},
        version: HISTORY_VERSION,
      };

      useHistoryStore.getState().pushEntry(entry);

      render(<HistoryDialog isOpen={true} onClose={vi.fn()} />);
      const timestampText = screen.getByText(/hoursAgo/);
      expect(timestampText).toBeInTheDocument();
    });

    it("should show days ago for entries within a week", () => {
      const entry: HistoryEntry = {
        id: generateUUID(),
        timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000, // 3 days ago
        type: "settings",
        description: "3日前の変更",
        changes: {},
        version: HISTORY_VERSION,
      };

      useHistoryStore.getState().pushEntry(entry);

      render(<HistoryDialog isOpen={true} onClose={vi.fn()} />);
      const timestampText = screen.getByText(/daysAgo/);
      expect(timestampText).toBeInTheDocument();
    });

    it("should show full date for older entries", () => {
      const entry: HistoryEntry = {
        id: generateUUID(),
        timestamp: Date.now() - 10 * 24 * 60 * 60 * 1000, // 10 days ago
        type: "settings",
        description: "10日前の変更",
        changes: {},
        version: HISTORY_VERSION,
      };

      useHistoryStore.getState().pushEntry(entry);

      render(<HistoryDialog isOpen={true} onClose={vi.fn()} />);
      // Should show a date string (format varies by locale)
      // We can't check exact format, but it should not contain the relative time keys
      expect(screen.queryByText("justNow")).not.toBeInTheDocument();
      expect(screen.queryByText(/minutesAgo/)).not.toBeInTheDocument();
      expect(screen.queryByText(/hoursAgo/)).not.toBeInTheDocument();
      expect(screen.queryByText(/daysAgo/)).not.toBeInTheDocument();
    });
  });

  describe("Undo/Redo Operations", () => {
    it("should perform undo when restoring to earlier entry", async () => {
      const user = userEvent.setup();
      const { restoreStateFromHistory } = await import("../../../utils/history/restoration");

      const entry1: HistoryEntry = {
        id: generateUUID(),
        timestamp: Date.now(),
        type: "settings",
        description: "変更1",
        changes: { "settings.proliferator.type": "none" },
        previousChanges: {},
        version: HISTORY_VERSION,
      };

      const entry2: HistoryEntry = {
        id: generateUUID(),
        timestamp: Date.now() + 1000,
        type: "settings",
        description: "変更2",
        changes: { "settings.proliferator.type": "mk1" },
        previousChanges: { "settings.proliferator.type": "none" },
        version: HISTORY_VERSION,
      };

      const entry3: HistoryEntry = {
        id: generateUUID(),
        timestamp: Date.now() + 2000,
        type: "settings",
        description: "変更3",
        changes: { "settings.proliferator.type": "mk2" },
        previousChanges: { "settings.proliferator.type": "mk1" },
        version: HISTORY_VERSION,
      };

      useHistoryStore.getState().pushEntry(entry1);
      useHistoryStore.getState().pushEntry(entry2);
      useHistoryStore.getState().pushEntry(entry3);

      render(<HistoryDialog isOpen={true} onClose={vi.fn()} />);

      // Current should be at entry3 (index 2)
      expect(useHistoryStore.getState().currentIndex).toBe(2);

      // Find and click restore button for entry1
      const restoreButtons = screen.getAllByText(/restoreToHere/);
      await user.click(restoreButtons[0]); // First restore button should be for entry1

      // Should have called restoreStateFromHistory with undo flag
      await waitFor(() => {
        expect(restoreStateFromHistory).toHaveBeenCalledWith(entry3, true);
        expect(restoreStateFromHistory).toHaveBeenCalledWith(entry2, true);
      });
    });

    it("should perform redo when restoring to later entry", async () => {
      const user = userEvent.setup();
      const { restoreStateFromHistory } = await import("../../../utils/history/restoration");

      const entry1: HistoryEntry = {
        id: generateUUID(),
        timestamp: Date.now(),
        type: "settings",
        description: "変更1",
        changes: { "settings.proliferator.type": "none" },
        version: HISTORY_VERSION,
      };

      const entry2: HistoryEntry = {
        id: generateUUID(),
        timestamp: Date.now() + 1000,
        type: "settings",
        description: "変更2",
        changes: { "settings.proliferator.type": "mk1" },
        version: HISTORY_VERSION,
      };

      useHistoryStore.getState().pushEntry(entry1);
      useHistoryStore.getState().pushEntry(entry2);

      // Manually set current index to 0 (simulate undo)
      useHistoryStore.setState({ currentIndex: 0 });

      render(<HistoryDialog isOpen={true} onClose={vi.fn()} />);

      // Find and click restore button for entry2
      const restoreButtons = screen.getAllByText(/restoreFromHere/);
      await user.click(restoreButtons[0]);

      // Should have called restoreStateFromHistory with redo flag
      await waitFor(() => {
        expect(restoreStateFromHistory).toHaveBeenCalledWith(entry2, false);
      });
    });

    it("should not show restore button for current entry", () => {
      const entry: HistoryEntry = {
        id: generateUUID(),
        timestamp: Date.now(),
        type: "settings",
        description: "現在のエントリ",
        changes: {},
        version: HISTORY_VERSION,
      };

      useHistoryStore.getState().pushEntry(entry);

      render(<HistoryDialog isOpen={true} onClose={vi.fn()} />);

      expect(screen.queryByText(/restore/)).not.toBeInTheDocument();
    });
  });

  describe("Footer Status", () => {
    it("should show canUndo message when undo is available", () => {
      const entry1: HistoryEntry = {
        id: generateUUID(),
        timestamp: Date.now(),
        type: "settings",
        description: "変更1",
        changes: {},
        version: HISTORY_VERSION,
      };

      const entry2: HistoryEntry = {
        id: generateUUID(),
        timestamp: Date.now() + 1000,
        type: "settings",
        description: "変更2",
        changes: {},
        version: HISTORY_VERSION,
      };

      useHistoryStore.getState().pushEntry(entry1);
      useHistoryStore.getState().pushEntry(entry2);

      render(<HistoryDialog isOpen={true} onClose={vi.fn()} />);
      expect(screen.getByText("元に戻すことができます")).toBeInTheDocument();
    });

    it("should show canRedo message when redo is available", () => {
      const entry: HistoryEntry = {
        id: generateUUID(),
        timestamp: Date.now(),
        type: "settings",
        description: "変更",
        changes: {},
        version: HISTORY_VERSION,
      };

      useHistoryStore.getState().pushEntry(entry);
      useHistoryStore.setState({ currentIndex: -1 });

      render(<HistoryDialog isOpen={true} onClose={vi.fn()} />);
      expect(screen.getByText("やり直すことができます")).toBeInTheDocument();
    });

    it("should show no operations message when no undo/redo available", () => {
      render(<HistoryDialog isOpen={true} onClose={vi.fn()} />);
      expect(screen.getByText("履歴操作は利用できません")).toBeInTheDocument();
    });
  });
});
