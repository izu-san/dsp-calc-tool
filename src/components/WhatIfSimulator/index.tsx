import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useSettingsStore } from "../../stores/settingsStore";
import { formatPower, formatBuildingCount } from "../../utils/format";
import { useWhatIfSimulation } from "./hooks/useWhatIfSimulation";
import { BottleneckWarnings } from "./components/BottleneckWarnings";
import { OptimizationGoalSelector } from "./components/OptimizationGoalSelector";
import { QuickActionsBar } from "./components/QuickActionsBar";
import { ScenarioCard } from "./components/ScenarioCard";
import { ScenarioComparisonTable } from "./components/ScenarioComparisonTable";
import type { OptimizationGoal, Scenario } from "./types";

/**
 * What-Ifシミュレーター: 設定変更の影響を比較分析
 */
export function WhatIfSimulator() {
  const { t } = useTranslation();
  const { updateSettings } = useSettingsStore();
  const {
    data,
    selectedRecipe,
    scenarios,
    results,
    bottleneckSuggestions,
    countTotalBelts,
    isScenarioAlreadyApplied,
  } = useWhatIfSimulation();

  const [activeScenarios, setActiveScenarios] = useState<string[]>([]);
  const [appliedScenario, setAppliedScenario] = useState<string | null>(null);
  const [optimizationGoal, setOptimizationGoal] = useState<OptimizationGoal>(null);

  /**
   * 最適化目標に基づいてシナリオをランク付け
   */
  const rankedScenarios = useMemo(() => {
    // Filter out scenarios that are already applied
    const applicableScenarios = results.scenarioResults.filter(
      ({ scenario }) => !isScenarioAlreadyApplied(scenario)
    );

    if (!optimizationGoal) {
      return applicableScenarios;
    }

    const ranked = [...applicableScenarios].sort((a, b) => {
      switch (optimizationGoal) {
        case "power":
          // Lower power is better
          return a.diff.power - b.diff.power;

        case "machines":
          // Fewer machines is better
          return a.diff.machines - b.diff.machines;

        case "efficiency": {
          // Combined efficiency score (lower is better)
          const scoreA =
            Math.abs(a.diff.powerPercent) * 0.4 +
            Math.abs(a.diff.machinePercent) * 0.3 +
            Math.abs(a.diff.beltPercent) * 0.3;
          const scoreB =
            Math.abs(b.diff.powerPercent) * 0.4 +
            Math.abs(b.diff.machinePercent) * 0.3 +
            Math.abs(b.diff.beltPercent) * 0.3;
          return scoreA - scoreB;
        }

        case "balanced": {
          // Balanced improvement (minimize worst metric)
          const maxA = Math.max(
            Math.abs(a.diff.powerPercent),
            Math.abs(a.diff.machinePercent),
            Math.abs(a.diff.beltPercent)
          );
          const maxB = Math.max(
            Math.abs(b.diff.powerPercent),
            Math.abs(b.diff.machinePercent),
            Math.abs(b.diff.beltPercent)
          );
          return maxA - maxB;
        }

        default:
          return 0;
      }
    });

    return ranked;
  }, [results.scenarioResults, optimizationGoal, isScenarioAlreadyApplied]);

  /**
   * シナリオを適用
   */
  const applyScenario = (scenario: Scenario) => {
    updateSettings(scenario.settings);
    setAppliedScenario(scenario.id);
    setTimeout(() => setAppliedScenario(null), 3000);
  };

  /**
   * 全ボトルネックを修正
   */
  const handleFixAllBottlenecks = () => {
    const uniqueScenarioIds = [...new Set(bottleneckSuggestions.map(s => s.scenarioId))];
    uniqueScenarioIds.forEach((scenarioId, index) => {
      const scenario = scenarios.find(s => s.id === scenarioId);
      if (scenario && !isScenarioAlreadyApplied(scenario)) {
        setTimeout(() => {
          applyScenario(scenario);
        }, index * 100);
      }
    });
  };

  /**
   * 特定のボトルネックを修正
   */
  const handleFixNow = (scenarioId: string) => {
    const scenario = scenarios.find(s => s.id === scenarioId);
    if (scenario) applyScenario(scenario);
  };

  /**
   * シナリオをトグル（比較テーブルに表示/非表示）
   */
  const toggleScenario = (scenarioId: string) => {
    setActiveScenarios(prev =>
      prev.includes(scenarioId) ? prev.filter(id => id !== scenarioId) : [...prev, scenarioId]
    );
  };

  /**
   * ベストシナリオを適用
   */
  const handleApplyBest = () => {
    const topScenario = rankedScenarios[0];
    if (topScenario) applyScenario(topScenario.scenario);
  };

  /**
   * クイックアクションからシナリオを適用
   */
  const handleQuickAction = (scenarioId: string) => {
    const scenario = scenarios.find(s => s.id === scenarioId);
    if (scenario && !isScenarioAlreadyApplied(scenario)) {
      applyScenario(scenario);
    }
  };

  if (!data || !selectedRecipe) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t("whatIfAnalysis")}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t("compareDifferentSettings")}
          </p>
        </div>
        {results.baseResult && (
          <div className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
            {t("current")}: {formatPower(results.baseResult.totalPower.total)} ·{" "}
            {formatBuildingCount(results.baseResult.totalMachines)} {t("machines")}
          </div>
        )}
      </div>

      {/* Applied Scenario Notification */}
      {appliedScenario && (
        <div className="bg-neon-green/10 backdrop-blur-sm border border-neon-green/40 rounded-lg p-3 flex items-center gap-2 shadow-[0_0_15px_rgba(0,255,136,0.2)] animate-fadeInScale">
          <span className="text-green-600 dark:text-green-400 text-xl">✓</span>
          <div className="flex-1">
            <div className="text-sm font-semibold text-neon-green">{t("scenarioApplied")}</div>
            <div className="text-xs text-green-700 dark:text-green-400">
              {scenarios.find(s => s.id === appliedScenario)?.name} {t("scenarioAppliedToSettings")}
            </div>
          </div>
        </div>
      )}

      {/* Bottleneck Warnings */}
      <BottleneckWarnings
        bottleneckSuggestions={bottleneckSuggestions}
        onFixAll={handleFixAllBottlenecks}
        onFixNow={handleFixNow}
      />

      {/* Optimization Goal Selector */}
      <OptimizationGoalSelector
        optimizationGoal={optimizationGoal}
        rankedScenariosCount={rankedScenarios.length}
        onGoalChange={setOptimizationGoal}
        onApplyBest={handleApplyBest}
      />

      {/* Quick Actions Bar */}
      {rankedScenarios.length > 0 && !optimizationGoal && (
        <QuickActionsBar
          scenarios={scenarios}
          isScenarioAlreadyApplied={isScenarioAlreadyApplied}
          onApplyScenario={handleQuickAction}
        />
      )}

      {/* Scenario Cards */}
      <div className="grid grid-cols-1 gap-3">
        {rankedScenarios.length === 0 && optimizationGoal && (
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-400 dark:border-green-600 rounded-lg p-6 text-center">
            <div className="text-5xl mb-3">🎉</div>
            <h3 className="text-lg font-bold text-green-900 dark:text-green-300 mb-2">
              {t("optimizationComplete")}
            </h3>
            <p className="text-sm text-green-700 dark:text-green-400 mb-4">
              {t("alreadyOptimizedFor")}{" "}
              {optimizationGoal === "power" && t("minimumPowerConsumption")}
              {optimizationGoal === "machines" && t("minimumMachineCount")}
              {optimizationGoal === "efficiency" && t("maximumEfficiency")}
              {optimizationGoal === "balanced" && t("balancedPerformance")}.
            </p>
            <div className="text-xs text-green-600 dark:text-green-500">
              {t("noFurtherImprovements")}
            </div>
          </div>
        )}
        {rankedScenarios.length === 0 && !optimizationGoal && (
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-2 border-purple-400 dark:border-purple-600 rounded-lg p-6 text-center">
            <div className="text-5xl mb-3">🌟</div>
            <h3 className="text-lg font-bold text-purple-900 dark:text-purple-300 mb-2">
              {t("perfectConfiguration")}
            </h3>
            <p className="text-sm text-purple-700 dark:text-purple-400 mb-4">
              {t("allScenariosApplied")}
            </p>
            <div className="text-xs text-purple-600 dark:text-purple-500">
              {t("usingBestConfigurations")}
            </div>
          </div>
        )}
        {rankedScenarios.map((scenarioResult, index) => {
          const { scenario } = scenarioResult;
          const isActive = activeScenarios.includes(scenario.id);
          const isApplied = appliedScenario === scenario.id;
          const isAlreadyApplied = isScenarioAlreadyApplied(scenario);
          const bottlenecksFixes = scenario.isBottleneckFix
            ? bottleneckSuggestions.filter(s => s.scenarioId === scenario.id).length
            : 0;
          const isRecommended = optimizationGoal && index < 3;

          return (
            <ScenarioCard
              key={scenario.id}
              scenarioResult={scenarioResult}
              index={index}
              isActive={isActive}
              isApplied={isApplied}
              isAlreadyApplied={isAlreadyApplied}
              isRecommended={!!isRecommended}
              bottlenecksFixes={bottlenecksFixes}
              onToggle={() => toggleScenario(scenario.id)}
              onApply={() => applyScenario(scenario)}
            />
          );
        })}
      </div>

      {/* Active Scenarios Comparison */}
      <ScenarioComparisonTable
        activeScenarios={activeScenarios}
        scenarios={scenarios}
        results={results}
        countTotalBelts={countTotalBelts}
        onApply={scenarioId => {
          const scenario = scenarios.find(s => s.id === scenarioId);
          if (scenario) applyScenario(scenario);
        }}
      />
    </div>
  );
}
