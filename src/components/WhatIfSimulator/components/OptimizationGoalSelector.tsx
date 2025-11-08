import { useTranslation } from "react-i18next";
import type { OptimizationGoal } from "../types";

interface OptimizationGoalSelectorProps {
  optimizationGoal: OptimizationGoal;
  rankedScenariosCount: number;
  onGoalChange: (goal: OptimizationGoal) => void;
  onApplyBest: () => void;
}

/**
 * 最適化目標選択UI
 */
export function OptimizationGoalSelector({
  optimizationGoal,
  rankedScenariosCount,
  onGoalChange,
  onApplyBest,
}: OptimizationGoalSelectorProps) {
  const { t } = useTranslation();

  const goalOptions: Array<{
    id: OptimizationGoal;
    icon: string;
    label: string;
    testId: string;
  }> = [
    { id: "power", icon: "⚡", label: t("minPower"), testId: "whatif-optimization-goal-power" },
    {
      id: "machines",
      icon: "🏭",
      label: t("minMachines"),
      testId: "whatif-optimization-goal-machines",
    },
    {
      id: "efficiency",
      icon: "📈",
      label: t("maxEfficiency"),
      testId: "whatif-optimization-goal-efficiency",
    },
    {
      id: "balanced",
      icon: "⚖️",
      label: t("balanced"),
      testId: "whatif-optimization-goal-balanced",
    },
  ];

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-300 dark:border-blue-700 rounded-lg p-3">
      <div className="flex items-start gap-2 mb-3">
        <span className="text-blue-600 dark:text-blue-400 text-xl">🎯</span>
        <div className="flex-1">
          <div className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-1">
            {t("optimizationEngine")}
          </div>
          <div className="text-xs text-blue-700 dark:text-blue-400">
            {t("selectOptimizationGoal")}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {goalOptions.map(option => (
          <button
            key={option.id}
            data-testid={option.testId}
            onClick={() => onGoalChange(optimizationGoal === option.id ? null : option.id)}
            className={`
              px-3 py-2 rounded-lg text-xs font-medium transition-all border-2
              ${
                optimizationGoal === option.id
                  ? "bg-neon-blue/30 text-white border-neon-blue shadow-[0_0_15px_rgba(0,136,255,0.5)] backdrop-blur-sm font-bold scale-105"
                  : "bg-dark-700/50 text-space-200 border-neon-blue/20 hover:border-neon-blue/50 hover:bg-neon-blue/10 hover:text-neon-blue"
              }
            `}
          >
            <div className="flex flex-col items-center gap-1">
              <span className="text-base">{option.icon}</span>
              <span>{option.label}</span>
            </div>
          </button>
        ))}
      </div>

      {optimizationGoal && (
        <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
          {rankedScenariosCount === 0 ? (
            <div className="flex items-center gap-2">
              <span className="text-green-600 dark:text-green-400 text-lg">✓</span>
              <div className="text-xs text-green-700 dark:text-green-400 font-semibold">
                {t("allOptimizationsComplete")} {t("perfectConfiguration")}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs text-blue-700 dark:text-blue-400 flex-1">
                {optimizationGoal === "power" && `💡 ${t("showingScenariosLowestPower")}`}
                {optimizationGoal === "machines" && `💡 ${t("showingScenariosFewestMachines")}`}
                {optimizationGoal === "efficiency" && `💡 ${t("showingScenariosBestEfficiency")}`}
                {optimizationGoal === "balanced" && `💡 ${t("showingScenariosBalanced")}`}
              </div>
              <button
                data-testid="whatif-apply-best-button"
                onClick={onApplyBest}
                className="px-3 py-1.5 bg-neon-green/30 border-2 border-neon-green hover:bg-neon-green/40 text-white text-xs font-bold rounded-lg shadow-[0_0_15px_rgba(0,255,136,0.4)] hover:shadow-[0_0_20px_rgba(0,255,136,0.6)] transition-all flex items-center gap-1.5 whitespace-nowrap ripple-effect"
                title={t("applyBestScenarioTitle")}
              >
                <span className="text-sm">⚡</span>
                <span>{t("applyBest")}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
