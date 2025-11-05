import { useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import i18n from "../../i18n";
import { useHistoryStore } from "../../stores/historyStore";
import type { HistoryEntry } from "../../types/history";
import { historyDebouncer } from "../../utils/historyDebouncer";
import { regenerateHistoryDescription } from "../../utils/historyDescriptionRegenerator";
import { restoreStateFromHistory } from "../../utils/historyRestore";

interface HistoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

type FilterType = HistoryEntry["type"] | "all";

/**
 * Get icon for history entry type
 */
function getHistoryEntryIcon(type: HistoryEntry["type"]): string {
  const icons = {
    settings: "⚙️",
    nodeOverride: "🎯",
    plan: "📋",
    powerGeneration: "⚡",
  };
  return icons[type] || "📝";
}

/**
 * Format timestamp to readable string
 */
function formatTimestamp(timestamp: number, t: (key: string) => string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  const locale = i18n.language;
  const isJa = locale === "ja";

  if (diffMins < 1) {
    return t("justNow");
  } else if (diffMins < 60) {
    const template = t("minutesAgo");
    return template.replace("{{count}}", String(diffMins));
  } else if (diffHours < 24) {
    const template = t("hoursAgo");
    return template.replace("{{count}}", String(diffHours));
  } else if (diffDays < 7) {
    const template = t("daysAgo");
    return template.replace("{{count}}", String(diffDays));
  } else {
    return date.toLocaleDateString(isJa ? "ja-JP" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
}

/**
 * History Dialog Component
 * Displays history entries and allows navigation
 */
export function HistoryDialog({ isOpen, onClose }: HistoryDialogProps) {
  const { t } = useTranslation();
  const { entries, currentIndex, canUndo, canRedo } = useHistoryStore();
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const handleRestoreToEntry = (_entry: HistoryEntry, targetIndex: number) => {
    // Flush pending debounced entries
    const pushEntry = useHistoryStore.getState().pushEntry;
    historyDebouncer.flushAll(pushEntry);
    historyDebouncer.cancelAll();

    const { entries, currentIndex } = useHistoryStore.getState();

    if (targetIndex === currentIndex) {
      // Already at this entry, do nothing
      return;
    }

    if (targetIndex < currentIndex) {
      // Need to undo - apply previousChanges from entries between currentIndex and targetIndex
      // We need to go from currentIndex down to targetIndex (not including targetIndex)
      for (let i = currentIndex; i > targetIndex; i--) {
        const entry = entries[i];
        if (entry) {
          restoreStateFromHistory(entry, true); // true = isUndo
          // Update currentIndex after each undo
          useHistoryStore.setState({ currentIndex: i - 1 });
        }
      }
    } else {
      // Need to redo - apply changes from entries between currentIndex and targetIndex
      // We need to go from currentIndex + 1 to targetIndex (including targetIndex)
      for (let i = currentIndex + 1; i <= targetIndex; i++) {
        const entry = entries[i];
        if (entry) {
          restoreStateFromHistory(entry, false); // false = isRedo
          // Update currentIndex after each redo
          useHistoryStore.setState({ currentIndex: i });
        }
      }
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
      style={{ zIndex: 99999 }}
      onClick={e => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="bg-dark-700 border-2 border-neon-blue/40 rounded-lg shadow-[0_0_30px_rgba(0,136,255,0.3)] max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col relative animate-fadeInScale"
        style={{ zIndex: 100000 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-neon-blue/30 flex items-center justify-between bg-dark-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-neon-blue/20 border border-neon-blue/50 rounded-lg shadow-[0_0_15px_rgba(0,136,255,0.3)]">
              <span className="text-2xl">📜</span>
            </div>
            <div>
              <h2
                data-testid="history-dialog-title"
                className="text-2xl font-bold text-white drop-shadow-[0_0_8px_rgba(0,217,255,0.6)]"
              >
                {t("history")}
              </h2>
              <p className="text-sm text-space-200">
                {entries.length} {t("entries")}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-space-300 hover:text-neon-cyan transition-all hover:scale-110 ripple-effect p-2 rounded-lg hover:bg-neon-cyan/10"
            aria-label={t("close")}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Filter and Search Section */}
        <div className="px-6 py-3 border-b border-neon-blue/20 bg-dark-800/30 space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-neon-cyan">{t("filterHistory")}:</span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterType("all")}
                className={`px-3 py-1 text-xs font-medium rounded-lg border-2 transition-all ${
                  filterType === "all"
                    ? "bg-neon-blue/40 border-neon-blue text-white"
                    : "bg-dark-600/50 border-gray-600 text-gray-300 hover:bg-dark-600 hover:border-gray-500"
                }`}
              >
                {t("allTypes")}
              </button>
              <button
                onClick={() => setFilterType("settings")}
                className={`px-3 py-1 text-xs font-medium rounded-lg border-2 transition-all ${
                  filterType === "settings"
                    ? "bg-neon-blue/40 border-neon-blue text-white"
                    : "bg-dark-600/50 border-gray-600 text-gray-300 hover:bg-dark-600 hover:border-gray-500"
                }`}
              >
                ⚙️ {t("filterSettings")}
              </button>
              <button
                onClick={() => setFilterType("nodeOverride")}
                className={`px-3 py-1 text-xs font-medium rounded-lg border-2 transition-all ${
                  filterType === "nodeOverride"
                    ? "bg-neon-blue/40 border-neon-blue text-white"
                    : "bg-dark-600/50 border-gray-600 text-gray-300 hover:bg-dark-600 hover:border-gray-500"
                }`}
              >
                🎯 {t("filterNodeOverride")}
              </button>
              <button
                onClick={() => setFilterType("plan")}
                className={`px-3 py-1 text-xs font-medium rounded-lg border-2 transition-all ${
                  filterType === "plan"
                    ? "bg-neon-blue/40 border-neon-blue text-white"
                    : "bg-dark-600/50 border-gray-600 text-gray-300 hover:bg-dark-600 hover:border-gray-500"
                }`}
              >
                📋 {t("filterPlan")}
              </button>
              <button
                onClick={() => setFilterType("powerGeneration")}
                className={`px-3 py-1 text-xs font-medium rounded-lg border-2 transition-all ${
                  filterType === "powerGeneration"
                    ? "bg-neon-blue/40 border-neon-blue text-white"
                    : "bg-dark-600/50 border-gray-600 text-gray-300 hover:bg-dark-600 hover:border-gray-500"
                }`}
              >
                ⚡ {t("filterPowerGeneration")}
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-neon-cyan">🔍 {t("searchHistory")}:</span>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={t("searchHistoryPlaceholder")}
              className="flex-1 px-3 py-1.5 text-sm border-2 border-neon-blue/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-neon-blue focus:border-neon-blue bg-dark-700/50 text-white placeholder-gray-400 backdrop-blur-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="px-2 py-1 text-sm text-gray-400 hover:text-white transition-colors"
                aria-label={t("clearHistory")}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {entries.length === 0 ? (
            <div className="text-center py-12 text-space-300">
              <div className="text-6xl mb-4">📝</div>
              <p className="text-lg">{t("noHistoryEntries")}</p>
            </div>
          ) : (
            entries
              .map((entry, originalIndex) => ({ entry, originalIndex }))
              .filter(({ entry }) => {
                // Apply type filter
                if (filterType !== "all" && entry.type !== filterType) {
                  return false;
                }
                // Apply search query filter
                if (searchQuery) {
                  const description = regenerateHistoryDescription(entry);
                  return description.toLowerCase().includes(searchQuery.toLowerCase());
                }
                return true;
              })
              .map(({ entry, originalIndex }) => {
                const isCurrent = originalIndex === currentIndex;
                const isPast = originalIndex < currentIndex;
                const needsUndo = originalIndex < currentIndex;

                return (
                  <div
                    key={entry.id}
                    data-testid={`history-entry-${originalIndex}`}
                    className={`
                    p-3 rounded-lg border-2 transition-all
                    ${
                      isCurrent
                        ? "border-neon-cyan bg-neon-cyan/10 shadow-[0_0_20px_rgba(0,217,255,0.4)]"
                        : isPast
                          ? "border-neon-blue/20 bg-dark-600/50"
                          : "border-space-400/20 bg-dark-600/30 opacity-60"
                    }
                  `}
                  >
                    <div className="flex items-center gap-3">
                      {/* Icon */}
                      <div
                        data-testid={`history-entry-icon-${originalIndex}`}
                        className="text-xl flex-shrink-0"
                      >
                        {getHistoryEntryIcon(entry.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            data-testid={`history-entry-text-${originalIndex}`}
                            className={`font-semibold text-sm ${
                              isCurrent
                                ? "text-neon-cyan"
                                : isPast
                                  ? "text-white"
                                  : "text-space-300"
                            }`}
                          >
                            {regenerateHistoryDescription(entry)}
                          </span>
                          {isCurrent && (
                            <span className="text-xs px-2 py-0.5 bg-neon-cyan/20 text-neon-cyan rounded border border-neon-cyan/50 flex-shrink-0">
                              {t("current")}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Timestamp and Restore button */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-space-400">
                          {formatTimestamp(entry.timestamp, t)}
                        </span>
                        {!isCurrent && (
                          <button
                            onClick={() => handleRestoreToEntry(entry, originalIndex)}
                            className="px-3 py-1 text-xs font-medium rounded-lg border-2 transition-all ripple-effect
                            bg-neon-blue/30 border-neon-blue/50 text-white
                            hover:bg-neon-blue/40 hover:border-neon-blue hover:shadow-[0_0_15px_rgba(0,136,255,0.4)]"
                          >
                            {needsUndo ? t("restoreToHere") : t("restoreFromHere")}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neon-blue/30 bg-dark-800/50 flex items-center justify-between">
          <div className="text-sm text-space-300">
            {canUndo() && <span>{t("canUndo")}</span>}
            {canUndo() && canRedo() && <span className="mx-2">•</span>}
            {canRedo() && <span>{t("canRedo")}</span>}
            {!canUndo() && !canRedo() && <span>{t("noHistoryOperations")}</span>}
          </div>
          <button
            onClick={() => {
              useHistoryStore.getState().clearHistory();
            }}
            className="px-4 py-2 bg-red-600/30 border border-red-600/50 text-white rounded-lg hover:bg-red-600/40 hover:border-red-600 hover:shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-all ripple-effect text-sm"
          >
            {t("clearHistory")}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
