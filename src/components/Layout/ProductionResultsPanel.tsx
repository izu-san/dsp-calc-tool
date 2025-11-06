import { Suspense, lazy, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { calculateMiningRequirements } from "../../lib/miningCalculation";
import { useGameDataStore } from "../../stores/gameDataStore";
import { useMiningSettingsStore } from "../../stores/miningSettingsStore";
import { useSettingsStore } from "../../stores/settingsStore";
import type { CalculationResult, Recipe } from "../../types";
import { ProductionResultsTab } from "../../types/ui-tabs";
import { cn } from "../../utils/classNames";
import { formatNumber } from "../../utils/format";
import { ItemIcon } from "../ItemIcon";
import { TEXT_GLOW } from "../../constants/theme";

const ProductionTree = lazy(() =>
  import("../ResultTree").then(m => ({ default: m.ProductionTree }))
);
const StatisticsView = lazy(() =>
  import("../StatisticsView").then(m => ({ default: m.StatisticsView }))
);
const BuildingCostView = lazy(() =>
  import("../BuildingCostView").then(m => ({ default: m.BuildingCostView }))
);
const PowerGenerationView = lazy(() =>
  import("../PowerGenerationView").then(m => ({ default: m.PowerGenerationView }))
);
const MiningCalculator = lazy(() =>
  import("../MiningCalculator").then(m => ({ default: m.MiningCalculator }))
);
const BuildingRoadmapView = lazy(() =>
  import("../BuildingRoadmapView").then(m => ({ default: m.BuildingRoadmapView }))
);
const VisualizationView = lazy(() =>
  import("../VisualizationView").then(m => ({ default: m.VisualizationView }))
);

interface ProductionResultsPanelProps {
  calculationResult: CalculationResult | null;
  selectedRecipe: Recipe | null;
  collapsedNodes: Set<string>;
  isTreeExpanded: boolean;
  handleToggleCollapse: (nodeId: string) => void;
  handleToggleAll: () => void;
}

/**
 * 生産結果パネル
 */
export function ProductionResultsPanel({
  calculationResult,
  selectedRecipe,
  collapsedNodes,
  isTreeExpanded,
  handleToggleCollapse,
  handleToggleAll,
}: ProductionResultsPanelProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<ProductionResultsTab>(
    ProductionResultsTab.ProductionTree
  );
  const { settings } = useSettingsStore();
  const { settings: miningSettings } = useMiningSettingsStore();
  const { data: gameData } = useGameDataStore();

  // Calculate mining requirements for statistics
  const miningCalculation = useMemo(() => {
    if (!calculationResult) return null;
    return calculateMiningRequirements(
      calculationResult,
      settings.miningSpeedResearch / 100,
      miningSettings.machineType,
      miningSettings.workSpeedMultiplier,
      gameData
    );
  }, [
    calculationResult,
    settings.miningSpeedResearch,
    miningSettings.machineType,
    miningSettings.workSpeedMultiplier,
    gameData,
  ]);

  return (
    <div className="hologram-panel rounded-lg shadow-panel p-6 border border-neon-blue/20 hover-lift">
      <h2 className="text-lg font-semibold text-neon-cyan mb-4">{t("productionTree")}</h2>
      {calculationResult ? (
        <div className="space-y-4">
          {/* Multi-output results display */}
          {calculationResult.multiOutputResults &&
            calculationResult.multiOutputResults.length > 0 && (
              <div
                className="bg-neon-green/10 border border-neon-green/30 rounded-lg p-4 backdrop-blur-sm"
                data-testid="multiple-output-items-section"
              >
                <h3 className="text-sm font-semibold text-neon-green mb-3 flex items-center gap-2">
                  <span>📦</span>
                  {t("multiOutputResults")}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {calculationResult.multiOutputResults.map(result => (
                    <div
                      key={result.itemId}
                      className="flex items-center gap-3 p-3 bg-dark-700/50 rounded-lg border border-neon-green/20 hover:border-neon-green/40 transition-all"
                      data-testid={`output-item-${result.itemId}`}
                    >
                    <ItemIcon itemId={result.itemId} alt={result.itemName} size={32} />
                    <div className="flex-1 text-sm font-medium text-white">{result.itemName}</div>
                    <div
                      className={cn("text-lg font-bold text-neon-cyan", TEXT_GLOW.cyan)}
                      data-testid={`output-item-rate-${result.itemId}`}
                    >
                        {formatNumber(result.productionRate)}/s
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          <div>
            {/* Tab Buttons */}
            <div className="flex items-center gap-2 mb-4 border-b border-neon-blue/20">
              <button
                data-testid="production-chain-tab"
                onClick={() => setActiveTab(ProductionResultsTab.ProductionTree)}
                className={cn(
                  "px-4 py-2 text-sm font-medium border-b-2 transition-all ripple-effect",
                  {
                    "border-neon-blue text-neon-cyan shadow-neon-blue":
                      activeTab === ProductionResultsTab.ProductionTree,
                    "border-transparent text-space-300 hover:text-neon-cyan":
                      activeTab !== ProductionResultsTab.ProductionTree,
                  }
                )}
              >
                {t("productionTree")}
              </button>
              <button
                data-testid="visualization-tab"
                onClick={() => setActiveTab(ProductionResultsTab.Visualization)}
                className={cn(
                  "px-4 py-2 text-sm font-medium border-b-2 transition-all ripple-effect",
                  {
                    "border-neon-blue text-neon-cyan shadow-neon-blue":
                      activeTab === ProductionResultsTab.Visualization,
                    "border-transparent text-space-300 hover:text-neon-cyan":
                      activeTab !== ProductionResultsTab.Visualization,
                  }
                )}
              >
                {t("visualization.tabLabel")}
              </button>
              <button
                data-testid="statistics-tab"
                onClick={() => setActiveTab(ProductionResultsTab.Statistics)}
                className={cn(
                  "px-4 py-2 text-sm font-medium border-b-2 transition-all ripple-effect",
                  {
                    "border-neon-blue text-neon-cyan shadow-neon-blue":
                      activeTab === ProductionResultsTab.Statistics,
                    "border-transparent text-space-300 hover:text-neon-cyan":
                      activeTab !== ProductionResultsTab.Statistics,
                  }
                )}
              >
                {t("statistics")}
              </button>
              <button
                data-testid="building-cost-tab"
                onClick={() => setActiveTab(ProductionResultsTab.BuildingCost)}
                className={cn(
                  "px-4 py-2 text-sm font-medium border-b-2 transition-all ripple-effect",
                  {
                    "border-neon-blue text-neon-cyan shadow-neon-blue":
                      activeTab === ProductionResultsTab.BuildingCost,
                    "border-transparent text-space-300 hover:text-neon-cyan":
                      activeTab !== ProductionResultsTab.BuildingCost,
                  }
                )}
              >
                {t("buildingCost")}
              </button>
              <button
                data-testid="power-generation-tab"
                onClick={() => setActiveTab(ProductionResultsTab.PowerGeneration)}
                className={cn(
                  "px-4 py-2 text-sm font-medium border-b-2 transition-all ripple-effect",
                  {
                    "border-neon-blue text-neon-cyan shadow-neon-blue":
                      activeTab === ProductionResultsTab.PowerGeneration,
                    "border-transparent text-space-300 hover:text-neon-cyan":
                      activeTab !== ProductionResultsTab.PowerGeneration,
                  }
                )}
              >
                {t("powerGeneration.title")}
              </button>
              <button
                data-testid="mining-calculator-tab"
                onClick={() => setActiveTab(ProductionResultsTab.MiningCalculator)}
                className={cn(
                  "px-4 py-2 text-sm font-medium border-b-2 transition-all ripple-effect",
                  {
                    "border-neon-blue text-neon-cyan shadow-neon-blue":
                      activeTab === ProductionResultsTab.MiningCalculator,
                    "border-transparent text-space-300 hover:text-neon-cyan":
                      activeTab !== ProductionResultsTab.MiningCalculator,
                  }
                )}
              >
                {t("miningCalculator")}
              </button>
              <button
                data-testid="roadmap-tab"
                onClick={() => setActiveTab(ProductionResultsTab.Roadmap)}
                className={cn(
                  "px-4 py-2 text-sm font-medium border-b-2 transition-all ripple-effect",
                  {
                    "border-neon-blue text-neon-cyan shadow-neon-blue":
                      activeTab === ProductionResultsTab.Roadmap,
                    "border-transparent text-space-300 hover:text-neon-cyan":
                      activeTab !== ProductionResultsTab.Roadmap,
                  }
                )}
              >
                {t("roadmap.title")}
              </button>

              {/* Expand/Collapse All button */}
              {activeTab === ProductionResultsTab.ProductionTree && (
                <button
                  data-testid="expand-collapse-all-button"
                  onClick={handleToggleAll}
                  className={cn(
                    "ml-auto px-4 py-2 text-sm font-medium rounded-lg border transition-all duration-300 ease-in-out ripple-effect",
                    {
                      "bg-neon-blue/20 text-neon-cyan border-neon-blue shadow-neon-blue hover:bg-neon-blue/30":
                        isTreeExpanded,
                      "bg-dark-700/50 text-space-200 border-neon-blue/30 hover:bg-dark-600 hover:border-neon-blue/50 hover:text-neon-cyan":
                        !isTreeExpanded,
                    }
                  )}
                >
                  <span className="inline-flex items-center gap-2">
                    <span
                      className={cn("transition-transform duration-300", {
                        "rotate-180": isTreeExpanded,
                        "rotate-0": !isTreeExpanded,
                      })}
                    >
                      ▼
                    </span>
                    <span>{isTreeExpanded ? t("collapseAll") : t("expandAll")}</span>
                  </span>
                </button>
              )}
            </div>

            {/* Content */}
            <Suspense fallback={<div className="text-center py-4">{t("loading")}</div>}>
              {activeTab === ProductionResultsTab.Statistics ? (
                <div id="statistics-view" data-testid="statistics-tab-content">
                  <StatisticsView
                    calculationResult={calculationResult}
                    miningCalculation={miningCalculation}
                  />
                </div>
              ) : activeTab === ProductionResultsTab.Visualization ? (
                <div id="visualization-view" data-testid="visualization-content">
                  {calculationResult ? (
                    <VisualizationView calculationResult={calculationResult} />
                  ) : (
                    <div className="py-6 text-center text-sm text-space-300">
                      {t("visualization.emptyState.noData")}
                    </div>
                  )}
                </div>
              ) : activeTab === ProductionResultsTab.BuildingCost ? (
                <div id="building-cost-view" data-testid="building-cost-content">
                  <BuildingCostView calculationResult={calculationResult} />
                </div>
              ) : activeTab === ProductionResultsTab.PowerGeneration ? (
                <div id="power-generation-view" data-testid="power-generation-content">
                  <PowerGenerationView
                    calculationResult={calculationResult}
                    miningCalculation={miningCalculation}
                  />
                </div>
              ) : activeTab === ProductionResultsTab.MiningCalculator ? (
                <MiningCalculator calculationResult={calculationResult} />
              ) : activeTab === ProductionResultsTab.Roadmap ? (
                <BuildingRoadmapView
                  calculationResult={calculationResult}
                  miningCalculation={miningCalculation}
                />
              ) : (
                <div id="production-tree-view" data-testid="production-tree-content">
                  <ProductionTree
                    node={calculationResult.rootNode}
                    collapsedNodes={collapsedNodes}
                    onToggleCollapse={handleToggleCollapse}
                    nodeId="root"
                  />
                </div>
              )}
            </Suspense>
          </div>
        </div>
      ) : selectedRecipe ? (
        <div className="text-sm text-space-300">
          <p>{t("calculating")}</p>
        </div>
      ) : (
        <p className="text-sm text-space-300">{t("noRecipeSelected")}</p>
      )}
    </div>
  );
}
