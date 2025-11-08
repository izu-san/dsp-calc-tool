import { useTranslation } from "react-i18next";
import { ICON_GLOW } from "../../../constants/theme";
import type { Scenario } from "../types";

interface QuickActionsBarProps {
  scenarios: Scenario[];
  isScenarioAlreadyApplied: (scenario: Scenario) => boolean;
  onApplyScenario: (scenarioId: string) => void;
}

/**
 * クイックアクションバー
 */
export function QuickActionsBar({
  scenarios,
  isScenarioAlreadyApplied,
  onApplyScenario,
}: QuickActionsBarProps) {
  const { t } = useTranslation();

  const quickActions = [
    { id: "proliferator_mk3", icon: "🧪", label: t("maxProliferator") },
    { id: "belt_mk3", icon: "🛤️", label: t("maxBelts") },
    { id: "stack_4", icon: "📦", label: t("maxStack") },
  ];

  return (
    <div className="bg-neon-purple/10 backdrop-blur-sm border border-neon-purple/40 rounded-lg p-3 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-indigo-600 dark:text-indigo-400 text-lg">⚡</span>
          <div>
            <div className="text-sm font-semibold text-neon-purple">{t("quickActions")}</div>
            <div className="text-xs text-space-200">{t("applyCommonOptimizations")}</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {quickActions.map((action, index) => {
            const scenario = scenarios.find(s => s.id === action.id);
            const isApplied = scenario ? isScenarioAlreadyApplied(scenario) : true;

            const colorClasses = [
              "bg-neon-magenta/30 border-neon-magenta hover:bg-neon-magenta/40 shadow-[0_0_10px_rgba(233,53,255,0.3)]",
              `bg-neon-cyan/30 border-neon-cyan hover:bg-neon-cyan/40 ${ICON_GLOW.cyan}`,
              "bg-neon-green/30 border-neon-green hover:bg-neon-green/40 shadow-[0_0_10px_rgba(0,255,136,0.3)]",
            ];

            return (
              <button
                key={action.id}
                data-testid={`whatif-quick-action-${action.id.replace("_", "-")}`}
                onClick={() => !isApplied && onApplyScenario(action.id)}
                disabled={isApplied}
                className={`px-3 py-2 ${colorClasses[index]} border-2 disabled:bg-dark-800/50 disabled:border-dark-600 disabled:cursor-not-allowed disabled:opacity-40 text-white text-xs font-medium rounded transition-all flex flex-col items-center justify-center gap-1 min-h-[60px] ripple-effect`}
              >
                <span className="text-lg">{action.icon}</span>
                <span className="text-xs leading-tight text-center">{action.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
