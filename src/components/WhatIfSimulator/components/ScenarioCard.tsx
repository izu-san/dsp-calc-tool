import { useTranslation } from "react-i18next";
import type { ScenarioResult } from "../types";

interface ScenarioCardProps {
  scenarioResult: ScenarioResult;
  index: number;
  isActive: boolean;
  isApplied: boolean;
  isAlreadyApplied: boolean;
  isRecommended: boolean;
  bottlenecksFixes: number;
  onToggle: () => void;
  onApply: () => void;
}

/**
 * 個別シナリオカード
 */
export function ScenarioCard({
  scenarioResult,
  index,
  isActive,
  isApplied,
  isAlreadyApplied,
  isRecommended,
  bottlenecksFixes,
  onToggle,
  onApply,
}: ScenarioCardProps) {
  const { t } = useTranslation();
  const { scenario, diff } = scenarioResult;

  const isImprovement = diff.power < 0 || diff.machines < 0 || diff.belts < 0;

  return (
    <div
      className={`
        p-3 rounded-lg border-2 transition-all backdrop-blur-sm
        ${
          isApplied
            ? "bg-neon-green/20 border-neon-green shadow-[0_0_20px_rgba(0,255,136,0.4)]"
            : isAlreadyApplied
              ? "bg-dark-700/30 border-dark-600 opacity-60"
              : isRecommended
                ? "bg-neon-blue/20 border-neon-blue shadow-[0_0_20px_rgba(0,136,255,0.5)]"
                : bottlenecksFixes > 0
                  ? "bg-neon-orange/20 border-neon-orange shadow-[0_0_20px_rgba(255,107,53,0.4)]"
                  : isActive
                    ? "bg-neon-cyan/20 border-neon-cyan shadow-[0_0_15px_rgba(0,217,255,0.4)]"
                    : "bg-dark-700/50 border-neon-blue/30 hover:border-neon-blue/50"
        }
      `}
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
        <button onClick={onToggle} className="flex-1 text-left min-w-0">
          <h4 className="font-semibold text-white mb-1 flex flex-wrap items-center gap-2">
            {isRecommended && !isAlreadyApplied && (
              <span className="text-neon-blue font-bold text-sm">#{index + 1}</span>
            )}
            <span className="truncate">{scenario.name}</span>
            {isAlreadyApplied && (
              <span className="text-space-300 text-xs font-bold whitespace-nowrap">
                ✓ {t("current")}
              </span>
            )}
            {!isAlreadyApplied && isImprovement && (
              <span className="text-neon-green text-xs whitespace-nowrap">
                ✓ {t("improvement")}
              </span>
            )}
            {isApplied && (
              <span className="text-neon-green text-xs font-bold whitespace-nowrap">
                ✓ {t("applied")}!
              </span>
            )}
            {isRecommended && !isApplied && !isAlreadyApplied && (
              <span className="bg-neon-blue/30 border border-neon-blue text-white text-xs font-bold px-2 py-0.5 rounded whitespace-nowrap shadow-[0_0_10px_rgba(0,136,255,0.4)]">
                ⭐ {t("topN")} {index + 1}
              </span>
            )}
            {bottlenecksFixes > 0 && !isApplied && !isRecommended && !isAlreadyApplied && (
              <span className="text-neon-orange text-xs font-bold whitespace-nowrap">
                🔧 {t("fixes")} {bottlenecksFixes}
              </span>
            )}
          </h4>
          <p className="text-xs text-space-200">{scenario.description}</p>
        </button>
        <div className="flex items-center gap-2 flex-shrink-0">
          {isActive && !isApplied && !isAlreadyApplied && (
            <span className="text-neon-cyan">📊</span>
          )}
          <button
            onClick={e => {
              e.stopPropagation();
              onApply();
            }}
            disabled={isApplied || isAlreadyApplied}
            className={`
              px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap border-2 ripple-effect
              ${
                isApplied || isAlreadyApplied
                  ? "bg-dark-800/50 border-dark-600 text-space-400 cursor-not-allowed opacity-50"
                  : "bg-neon-green/30 border-neon-green hover:bg-neon-green/40 text-white shadow-[0_0_15px_rgba(0,255,136,0.4)] hover:shadow-[0_0_20px_rgba(0,255,136,0.6)]"
              }
            `}
            title={
              isApplied
                ? t("applied")
                : isAlreadyApplied
                  ? t("current")
                  : t("applyScenarioToSettings")
            }
            data-testid={`whatif-scenario-apply-button-${scenario.id}`}
          >
            {isApplied ? `✓ ${t("applied")}` : isAlreadyApplied ? t("current") : t("apply")}
          </button>
        </div>
      </div>

      {/* Impact Summary */}
      <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-neon-blue/30">
        {/* Power Change */}
        <div className="text-center">
          <div className="text-xs text-space-300 mb-1">{t("power")}</div>
          <div
            className="text-sm font-bold"
            style={{
              color:
                Math.abs(diff.powerPercent) < 0.1
                  ? "#ffffff"
                  : diff.power < 0
                    ? "#00FF88"
                    : "#FF6B35",
            }}
          >
            {diff.power > 0 ? "+" : ""}
            {diff.powerPercent.toFixed(1)}%
          </div>
        </div>

        {/* Machines Change */}
        <div className="text-center">
          <div className="text-xs text-space-300 mb-1">{t("machines")}</div>
          <div
            className="text-sm font-bold"
            style={{
              color:
                Math.abs(diff.machinePercent) < 0.1
                  ? "#ffffff"
                  : diff.machines < 0
                    ? "#00FF88"
                    : "#FF6B35",
            }}
          >
            {diff.machines > 0 ? "+" : ""}
            {diff.machinePercent.toFixed(1)}%
          </div>
        </div>

        {/* Belts Change */}
        <div className="text-center">
          <div className="text-xs text-space-300 mb-1">{t("belts")}</div>
          <div
            className="text-sm font-bold"
            style={{
              color:
                Math.abs(diff.beltPercent) < 0.1
                  ? "#ffffff"
                  : diff.belts < 0
                    ? "#00FF88"
                    : "#FF6B35",
            }}
          >
            {diff.belts > 0 ? "+" : ""}
            {diff.beltPercent.toFixed(1)}%
          </div>
        </div>
      </div>
    </div>
  );
}
