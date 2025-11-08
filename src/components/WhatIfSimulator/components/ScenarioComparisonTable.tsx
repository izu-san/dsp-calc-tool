import { useTranslation } from "react-i18next";
import { formatPower, formatBuildingCount, formatNumber } from "../../../utils/format";
import type { RecipeTreeNode } from "../../../types";
import type { ScenarioResult, Scenario } from "../types";

interface ScenarioComparisonTableProps {
  activeScenarios: string[];
  scenarios: Scenario[];
  results: {
    baseResult: {
      rootNode: RecipeTreeNode;
      totalPower: { total: number };
      totalMachines: number;
    } | null;
    scenarioResults: ScenarioResult[];
  };
  countTotalBelts: (node: RecipeTreeNode) => number;
  onApply: (scenarioId: string) => void;
}

/**
 * シナリオ比較テーブル
 */
export function ScenarioComparisonTable({
  activeScenarios,
  scenarios,
  results,
  countTotalBelts,
  onApply,
}: ScenarioComparisonTableProps) {
  const { t } = useTranslation();

  if (activeScenarios.length === 0) {
    return null;
  }

  return (
    <div className="bg-dark-700/50 backdrop-blur-sm rounded-lg p-4 border border-neon-blue/30 shadow-[0_0_15px_rgba(0,136,255,0.2)]">
      <h4 className="font-semibold text-white mb-3">{t("detailedComparison")}</h4>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neon-blue/40">
              <th className="text-left py-2 px-3 text-space-200">{t("metric")}</th>
              <th className="text-right py-2 px-3 text-space-200">{t("current")}</th>
              {activeScenarios.map(scenarioId => {
                const scenario = scenarios.find(s => s.id === scenarioId);
                return (
                  <th key={scenarioId} className="text-right py-2 px-3 text-neon-cyan">
                    {scenario?.name.split(" ").slice(0, 2).join(" ")}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-neon-blue/20">
              <td className="py-2 px-3 text-white">{t("totalPower")}</td>
              <td className="text-right py-2 px-3 text-white">
                {formatPower(results.baseResult?.totalPower.total || 0)}
              </td>
              {activeScenarios.map(scenarioId => {
                const result = results.scenarioResults.find(r => r.scenario.id === scenarioId);
                const powerDiff = result?.diff.power || 0;
                const hasChange = Math.abs(powerDiff) > 0.01;
                return (
                  <td key={scenarioId} className="text-right py-2 px-3">
                    <span
                      style={{
                        color: hasChange ? (powerDiff < 0 ? "#00FF88" : "#FF6B35") : "#ffffff",
                      }}
                    >
                      {formatPower(result?.result.totalPower.total || 0)}
                    </span>
                    {hasChange && (
                      <span
                        className="ml-2 text-xs"
                        style={{
                          color: powerDiff < 0 ? "#00FF88" : "#FF6B35",
                        }}
                      >
                        ({powerDiff > 0 ? "+" : ""}
                        {powerDiff.toFixed(1)} kW)
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>

            <tr className="border-b border-neon-blue/20">
              <td className="py-2 px-3 text-white">{t("totalMachines")}</td>
              <td className="text-right py-2 px-3 text-white">
                {formatBuildingCount(results.baseResult?.totalMachines || 0)}
              </td>
              {activeScenarios.map(scenarioId => {
                const result = results.scenarioResults.find(r => r.scenario.id === scenarioId);
                const machinesDiff = result?.diff.machines || 0;
                const hasChange = Math.abs(machinesDiff) > 0.01;
                return (
                  <td key={scenarioId} className="text-right py-2 px-3">
                    <span
                      style={{
                        color: hasChange ? (machinesDiff < 0 ? "#00FF88" : "#FF6B35") : "#ffffff",
                      }}
                    >
                      {formatBuildingCount(result?.result.totalMachines || 0)}
                    </span>
                    {hasChange && (
                      <span
                        className="ml-2 text-xs"
                        style={{
                          color: machinesDiff < 0 ? "#00FF88" : "#FF6B35",
                        }}
                      >
                        ({machinesDiff > 0 ? "+" : ""}
                        {formatNumber(machinesDiff)})
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>

            <tr>
              <td className="py-2 px-3 text-white">{t("totalBelts")}</td>
              <td className="text-right py-2 px-3 text-white">
                {formatNumber(
                  results.baseResult?.rootNode ? countTotalBelts(results.baseResult.rootNode) : 0
                )}
              </td>
              {activeScenarios.map(scenarioId => {
                const result = results.scenarioResults.find(r => r.scenario.id === scenarioId);
                const beltsDiff = result?.diff.belts || 0;
                const hasChange = Math.abs(beltsDiff) > 0.01;
                return (
                  <td key={scenarioId} className="text-right py-2 px-3">
                    <span
                      style={{
                        color: hasChange ? (beltsDiff < 0 ? "#00FF88" : "#FF6B35") : "#ffffff",
                      }}
                    >
                      {formatNumber(
                        result?.result.rootNode ? countTotalBelts(result.result.rootNode) : 0
                      )}
                    </span>
                    {hasChange && (
                      <span
                        className="ml-2 text-xs"
                        style={{
                          color: beltsDiff < 0 ? "#00FF88" : "#FF6B35",
                        }}
                      >
                        ({beltsDiff > 0 ? "+" : ""}
                        {formatNumber(beltsDiff)})
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Apply Buttons for Active Scenarios */}
      <div className="mt-4 flex flex-wrap gap-2">
        {activeScenarios.map(scenarioId => {
          const scenario = scenarios.find(s => s.id === scenarioId);
          if (!scenario) return null;

          return (
            <button
              key={scenarioId}
              onClick={() => onApply(scenarioId)}
              className="px-4 py-2 bg-neon-green/30 border-2 border-neon-green hover:bg-neon-green/40 text-white text-sm font-medium rounded-lg transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(0,255,136,0.4)] hover:shadow-[0_0_20px_rgba(0,255,136,0.6)] ripple-effect"
              data-testid={`whatif-active-scenario-apply-button-${scenarioId}`}
            >
              <span>✓</span>
              {t("apply")} "{scenario.name}"
            </button>
          );
        })}
      </div>

      <div className="mt-3 text-xs text-space-200">
        💡 <span className="text-neon-green">{t("green")}</span> {t("greenIndicatesImprovement")},
        <span className="text-neon-orange ml-1">{t("red")}</span> {t("redIndicatesIncrease")}
      </div>
    </div>
  );
}
