import { useTranslation } from "react-i18next";
import type { BottleneckSuggestion } from "../types";

interface BottleneckWarningsProps {
  bottleneckSuggestions: BottleneckSuggestion[];
  onFixAll: () => void;
  onFixNow: (scenarioId: string) => void;
}

/**
 * ボトルネック警告表示コンポーネント
 */
export function BottleneckWarnings({
  bottleneckSuggestions,
  onFixAll,
  onFixNow,
}: BottleneckWarningsProps) {
  const { t } = useTranslation();

  if (bottleneckSuggestions.length === 0) {
    return (
      <div
        className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-300 dark:border-green-600 rounded-lg p-3"
        data-testid="whatif-no-bottlenecks-message"
      >
        <div className="flex items-start gap-2">
          <span className="text-green-600 dark:text-green-400 text-xl">✓</span>
          <div className="flex-1">
            <div className="text-sm font-semibold text-green-900 dark:text-green-300 mb-1">
              {t("noBottlenecksDetected")}
            </div>
            <div className="text-xs text-green-700 dark:text-green-400">
              {t("productionChainSmooth")}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-neon-orange/10 backdrop-blur-sm border border-neon-orange/40 rounded-lg p-3 shadow-[0_0_15px_rgba(255,107,53,0.2)] animate-fadeInScale">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-start gap-2 flex-1">
          <span className="text-yellow-600 dark:text-yellow-400 text-xl">⚠️</span>
          <div className="flex-1">
            <div className="text-sm font-semibold text-neon-orange mb-1">
              {t("bottlenecksDetected")} ({bottleneckSuggestions.length})
            </div>
            <div className="text-xs text-yellow-700 dark:text-yellow-400 mb-2">
              {t("productionChainInefficiencies")}
            </div>
          </div>
        </div>
        <button
          data-testid="whatif-fix-all-bottlenecks-button"
          onClick={onFixAll}
          className="px-3 py-1.5 bg-neon-orange/30 border-2 border-neon-orange hover:bg-neon-orange/40 text-white text-xs font-bold rounded-lg shadow-[0_0_15px_rgba(255,107,53,0.4)] hover:shadow-[0_0_20px_rgba(255,107,53,0.6)] transition-all whitespace-nowrap flex-shrink-0 ripple-effect"
          title={t("fixAllBottlenecks")}
        >
          🔧 {t("fixAll")}
        </button>
      </div>

      <div className="space-y-2">
        {bottleneckSuggestions.slice(0, 3).map((suggestion, idx) => (
          <div
            key={idx}
            className="bg-dark-700/50 backdrop-blur-sm rounded-lg p-2 border border-neon-orange/30 hover:border-neon-orange/50 transition-all"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`
                      text-xs font-semibold px-2 py-0.5 rounded
                      ${
                        suggestion.severity === "high"
                          ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                          : suggestion.severity === "medium"
                            ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400"
                            : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                      }
                    `}
                  >
                    {suggestion.severity.toUpperCase()}
                  </span>
                  <span className="text-xs text-gray-700 dark:text-gray-300 truncate">
                    {suggestion.issue}
                  </span>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  💡 {suggestion.suggestion}
                </div>
              </div>
              <button
                onClick={() => onFixNow(suggestion.scenarioId)}
                className="px-2 py-1 text-xs bg-neon-blue/30 border border-neon-blue hover:bg-neon-blue/40 text-white rounded transition-all whitespace-nowrap flex-shrink-0 shadow-[0_0_10px_rgba(0,136,255,0.3)] ripple-effect"
                data-testid={`whatif-fix-now-button-${suggestion.scenarioId}`}
              >
                {t("fixNow")}
              </button>
            </div>
          </div>
        ))}
        {bottleneckSuggestions.length > 3 && (
          <div className="text-xs text-yellow-600 dark:text-yellow-400 text-center">
            +{bottleneckSuggestions.length - 3} more suggestions below
          </div>
        )}
      </div>
    </div>
  );
}
