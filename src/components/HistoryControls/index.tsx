import { useEffect, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useHistoryStore } from "../../stores/historyStore";
import { restoreStateFromHistory } from "../../utils/historyRestore";
import { historyDebouncer } from "../../utils/historyDebouncer";
import { HistoryDialog } from "../HistoryDialog";
import { useToast } from "../ToastProvider/useToast";
import { regenerateHistoryDescription } from "../../utils/historyDescriptionRegenerator";

/**
 * Undo/Redo controls component
 */
export function HistoryControls() {
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
          className="px-4 py-2 bg-neon-blue/30 border border-neon-blue/50 text-white rounded-lg hover:bg-neon-blue/40 hover:border-neon-blue hover:shadow-[0_0_15px_rgba(0,136,255,0.4)] disabled:bg-dark-600 disabled:border-neon-blue/20 disabled:text-space-400 disabled:cursor-not-allowed transition-all ripple-effect"
          title={canUndo() ? t("undo") : t("cannotUndo")}
        >
          ↶ {t("undo")}
        </button>

        <button
          data-testid="redo-button"
          onClick={handleRedo}
          disabled={!canRedo()}
          className="px-4 py-2 bg-neon-purple/30 border border-neon-purple/50 text-white rounded-lg hover:bg-neon-purple/40 hover:border-neon-purple hover:shadow-[0_0_15px_rgba(168,85,247,0.4)] disabled:bg-dark-600 disabled:border-neon-purple/20 disabled:text-space-400 disabled:cursor-not-allowed transition-all ripple-effect"
          title={canRedo() ? t("redo") : t("cannotRedo")}
        >
          ↷ {t("redo")}
        </button>

        <button
          data-testid="history-dialog-button"
          onClick={() => setIsHistoryDialogOpen(true)}
          className="px-4 py-2 bg-dark-600/50 border border-neon-blue/30 text-white rounded-lg hover:bg-dark-600/70 hover:border-neon-blue/50 hover:shadow-[0_0_15px_rgba(0,136,255,0.3)] transition-all ripple-effect"
          title={t("showHistory")}
        >
          📜 {t("history")}
        </button>
      </div>

      <HistoryDialog isOpen={isHistoryDialogOpen} onClose={() => setIsHistoryDialogOpen(false)} />
    </>
  );
}
