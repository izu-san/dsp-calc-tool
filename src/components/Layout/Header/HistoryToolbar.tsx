import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { HOVER_CARD_GLOW } from "../../../constants/theme";
import { useHistoryStore } from "../../../stores/historyStore";
import { cn } from "../../../utils/classNames";
import { historyDebouncer } from "../../../utils/history/debouncer";
import { regenerateHistoryDescription } from "../../../utils/history/regenerator";
import { restoreStateFromHistory } from "../../../utils/history/restoration";
import { HistoryDialog } from "../../HistoryDialog";
import { useToast } from "../../ToastProvider/useToast";

/**
 * 履歴操作ツールバーコンポーネント
 * Undo/Redo/History操作を提供
 */
export function HistoryToolbar() {
  const { t } = useTranslation();
  const { undo, redo, canUndo, canRedo } = useHistoryStore();
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const { showToast } = useToast();

  const handleUndo = useCallback(() => {
    // First, flush any pending debounced entries to ensure they're in history
    const pushEntry = useHistoryStore.getState().pushEntry;
    historyDebouncer.flushAll(pushEntry);

    const { entries: currentEntries, currentIndex: currentIdx } = useHistoryStore.getState();

    if (!canUndo()) {
      return;
    }

    // The entry at currentIndex represents the state after that change was applied
    // To undo, we apply the "previousChanges" from the current entry, which restores the state before that change
    const currentEntry = currentEntries[currentIdx];

    if (!currentEntry) {
      return;
    }

    // Apply previousChanges to restore state before this entry
    restoreStateFromHistory(currentEntry, true); // true = isUndo

    // Move index AFTER restoring state
    undo();

    // Show toast notification
    const description = regenerateHistoryDescription(currentEntry);
    showToast(t("undone"), description, "success", 3000);
  }, [undo, canUndo, showToast, t]);

  const handleRedo = useCallback(() => {
    // First, flush any pending debounced entries to ensure they're in history
    const pushEntry = useHistoryStore.getState().pushEntry;
    historyDebouncer.flushAll(pushEntry);

    // Then cancel any remaining debounces
    historyDebouncer.cancelAll();

    const { entries: currentEntries, currentIndex: currentIdx } = useHistoryStore.getState();

    if (!canRedo()) {
      return;
    }

    // The next entry is at currentIndex + 1
    const nextEntry = currentEntries[currentIdx + 1];

    if (!nextEntry) {
      return;
    }

    // Apply changes to restore state after this entry
    restoreStateFromHistory(nextEntry, false); // false = isRedo

    // Move index AFTER restoring state
    redo();

    // Show toast notification
    const description = regenerateHistoryDescription(nextEntry);
    showToast(t("redone"), description, "success", 3000);
  }, [redo, canRedo, showToast, t]);

  // Global keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Handle Ctrl+Z (Undo) and Ctrl+Y (Redo)
      // Don't intercept if user is typing in an input field
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return;
      }

      if (e.ctrlKey || e.metaKey) {
        if (e.key === "z" && !e.shiftKey) {
          e.preventDefault();
          if (canUndo()) {
            handleUndo();
          }
        } else if (e.key === "y" || (e.key === "z" && e.shiftKey)) {
          e.preventDefault();
          if (canRedo()) {
            handleRedo();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [canUndo, canRedo, handleUndo, handleRedo]);

  return (
    <>
      <div className="flex gap-2">
        <button
          data-testid="undo-button"
          onClick={handleUndo}
          disabled={!canUndo()}
          className={cn(
            "px-3 py-2 bg-dark-700/80 border border-space-600/70 text-space-100 rounded-md hover:bg-dark-600 hover:border-space-500 disabled:bg-dark-700/50 disabled:border-space-700 disabled:text-space-500 disabled:cursor-not-allowed transition-colors",
            HOVER_CARD_GLOW.blue
          )}
          title={canUndo() ? t("undo") : t("cannotUndo")}
          aria-label={canUndo() ? t("undo") : t("cannotUndo")}
        >
          <span aria-hidden="true">↶</span> {t("undo")}
        </button>

        <button
          data-testid="redo-button"
          onClick={handleRedo}
          disabled={!canRedo()}
          className={cn(
            "px-3 py-2 bg-dark-700/80 border border-space-600/70 text-space-100 rounded-md hover:bg-dark-600 hover:border-space-500 disabled:bg-dark-700/50 disabled:border-space-700 disabled:text-space-500 disabled:cursor-not-allowed transition-colors",
            HOVER_CARD_GLOW.purple
          )}
          title={canRedo() ? t("redo") : t("cannotRedo")}
          aria-label={canRedo() ? t("redo") : t("cannotRedo")}
        >
          <span aria-hidden="true">↷</span> {t("redo")}
        </button>

        <button
          data-testid="history-dialog-button"
          onClick={() => setIsHistoryDialogOpen(true)}
          className={cn(
            "px-3 py-2 bg-dark-700/80 border border-space-600/70 text-space-100 rounded-md hover:bg-dark-600 hover:border-space-500 transition-colors",
            HOVER_CARD_GLOW.blue
          )}
          title={t("showHistory")}
          aria-label={t("showHistory")}
        >
          {t("history")}
        </button>
      </div>

      <HistoryDialog isOpen={isHistoryDialogOpen} onClose={() => setIsHistoryDialogOpen(false)} />
    </>
  );
}
