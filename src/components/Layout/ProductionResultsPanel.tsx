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
    <section
      className="hologram-panel rounded-md p-6 hover-lift"
      aria-labelledby="production-results-heading"
    >
      <h2 id="production-results-heading" className="text-lg font-semibold text-space-50 mb-4">
        {t("productionTree")}
      </h2>
      {calculationResult ? (
        <div className="space-y-4">
          {/* Multi-output results display */}
          {calculationResult.multiOutputResults &&
            calculationResult.multiOutputResults.length > 0 && (
              <div
                className="bg-dark-800/60 border border-space-600/60 rounded-md p-4"
                data-testid="multiple-output-items-section"
              >
                <h3 className="text-sm font-semibold text-space-100 mb-3 flex items-center gap-2">
                  <span aria-hidden="true">Output</span>
                  {t("multiOutputResults")}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {calculationResult.multiOutputResults.map(result => (
                    <div
                      key={result.itemId}
                      className="flex items-center gap-3 p-3 bg-dark-700/60 rounded-md border border-space-700/70 hover:border-space-500 transition-colors"
                      data-testid={`output-item-${result.itemId}`}
                    >
                      <ItemIcon itemId={result.itemId} alt={result.itemName} size={32} />
                      <div className="flex-1 text-sm font-medium text-white">{result.itemName}</div>
                      <div
                        className={cn("text-lg font-semibold text-primary-200", TEXT_GLOW.cyan)}
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
            <div
              className="flex items-center gap-2 mb-4 border-b border-space-700/80 overflow-x-auto"
              role="tablist"
              aria-label={t("productionTree")}
            >
              <button
                data-testid="production-chain-tab"
                onClick={() => setActiveTab(ProductionResultsTab.ProductionTree)}
                role="tab"
                id="tab-production-tree"
                aria-selected={activeTab === ProductionResultsTab.ProductionTree}
                aria-controls="production-tree-view"
                className={cn(
                  "px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                  {
                    "border-primary-300 text-primary-100":
                      activeTab === ProductionResultsTab.ProductionTree,
                    "border-transparent text-space-300 hover:text-space-100":
                      activeTab !== ProductionResultsTab.ProductionTree,
                  }
                )}
              >
                {t("productionTree")}
              </button>
              <button
                data-testid="visualization-tab"
                onClick={() => setActiveTab(ProductionResultsTab.Visualization)}
                role="tab"
                id="tab-visualization"
                aria-selected={activeTab === ProductionResultsTab.Visualization}
                aria-controls="visualization-view"
                className={cn(
                  "px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                  {
                    "border-primary-300 text-primary-100":
                      activeTab === ProductionResultsTab.Visualization,
                    "border-transparent text-space-300 hover:text-space-100":
                      activeTab !== ProductionResultsTab.Visualization,
                  }
                )}
              >
                {t("visualization.tabLabel")}
              </button>
              <button
                data-testid="statistics-tab"
                onClick={() => setActiveTab(ProductionResultsTab.Statistics)}
                role="tab"
                id="tab-statistics"
                aria-selected={activeTab === ProductionResultsTab.Statistics}
                aria-controls="statistics-view"
                className={cn(
                  "px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                  {
                    "border-primary-300 text-primary-100":
                      activeTab === ProductionResultsTab.Statistics,
                    "border-transparent text-space-300 hover:text-space-100":
                      activeTab !== ProductionResultsTab.Statistics,
                  }
                )}
              >
                {t("statistics")}
              </button>
              <button
                data-testid="building-cost-tab"
                onClick={() => setActiveTab(ProductionResultsTab.BuildingCost)}
                role="tab"
                id="tab-building-cost"
                aria-selected={activeTab === ProductionResultsTab.BuildingCost}
                aria-controls="building-cost-view"
                className={cn(
                  "px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                  {
                    "border-primary-300 text-primary-100":
                      activeTab === ProductionResultsTab.BuildingCost,
                    "border-transparent text-space-300 hover:text-space-100":
                      activeTab !== ProductionResultsTab.BuildingCost,
                  }
                )}
              >
                {t("buildingCost")}
              </button>
              <button
                data-testid="power-generation-tab"
                onClick={() => setActiveTab(ProductionResultsTab.PowerGeneration)}
                role="tab"
                id="tab-power-generation"
                aria-selected={activeTab === ProductionResultsTab.PowerGeneration}
                aria-controls="power-generation-view"
                className={cn(
                  "px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                  {
                    "border-primary-300 text-primary-100":
                      activeTab === ProductionResultsTab.PowerGeneration,
                    "border-transparent text-space-300 hover:text-space-100":
                      activeTab !== ProductionResultsTab.PowerGeneration,
                  }
                )}
              >
                {t("powerGeneration.title")}
              </button>
              <button
                data-testid="mining-calculator-tab"
                onClick={() => setActiveTab(ProductionResultsTab.MiningCalculator)}
                role="tab"
                id="tab-mining-calculator"
                aria-selected={activeTab === ProductionResultsTab.MiningCalculator}
                className={cn(
                  "px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                  {
                    "border-primary-300 text-primary-100":
                      activeTab === ProductionResultsTab.MiningCalculator,
                    "border-transparent text-space-300 hover:text-space-100":
                      activeTab !== ProductionResultsTab.MiningCalculator,
                  }
                )}
              >
                {t("miningCalculator")}
              </button>
              <button
                data-testid="roadmap-tab"
                onClick={() => setActiveTab(ProductionResultsTab.Roadmap)}
                role="tab"
                id="tab-roadmap"
                aria-selected={activeTab === ProductionResultsTab.Roadmap}
                className={cn(
                  "px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                  {
                    "border-primary-300 text-primary-100":
                      activeTab === ProductionResultsTab.Roadmap,
                    "border-transparent text-space-300 hover:text-space-100":
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
                  aria-expanded={isTreeExpanded}
                  className={cn(
                    "ml-auto px-4 py-2 text-sm font-medium rounded-md border transition-colors whitespace-nowrap",
                    {
                      "bg-primary-900/30 text-primary-100 border-primary-500/60 hover:bg-primary-900/45":
                        isTreeExpanded,
                      "bg-dark-700/70 text-space-200 border-space-600/70 hover:bg-dark-600 hover:border-space-500":
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
                      <span aria-hidden="true">▼</span>
                    </span>
                    <span>{isTreeExpanded ? t("collapseAll") : t("expandAll")}</span>
                  </span>
                </button>
              )}
            </div>

            {/* Content */}
            <Suspense fallback={<div className="text-center py-4">{t("loading")}</div>}>
              {activeTab === ProductionResultsTab.Statistics ? (
                <div
                  id="statistics-view"
                  data-testid="statistics-tab-content"
                  role="tabpanel"
                  aria-labelledby="tab-statistics"
                >
                  <StatisticsView
                    calculationResult={calculationResult}
                    miningCalculation={miningCalculation}
                  />
                </div>
              ) : activeTab === ProductionResultsTab.Visualization ? (
                <div
                  id="visualization-view"
                  data-testid="visualization-content"
                  role="tabpanel"
                  aria-labelledby="tab-visualization"
                >
                  {calculationResult ? (
                    <VisualizationView calculationResult={calculationResult} />
                  ) : (
                    <div className="py-6 text-center text-sm text-space-300">
                      {t("visualization.emptyState.noData")}
                    </div>
                  )}
                </div>
              ) : activeTab === ProductionResultsTab.BuildingCost ? (
                <div
                  id="building-cost-view"
                  data-testid="building-cost-content"
                  role="tabpanel"
                  aria-labelledby="tab-building-cost"
                >
                  <BuildingCostView calculationResult={calculationResult} />
                </div>
              ) : activeTab === ProductionResultsTab.PowerGeneration ? (
                <div
                  id="power-generation-view"
                  data-testid="power-generation-content"
                  role="tabpanel"
                  aria-labelledby="tab-power-generation"
                >
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
                <div
                  id="production-tree-view"
                  data-testid="production-tree-content"
                  role="tabpanel"
                  aria-labelledby="tab-production-tree"
                >
                  <ProductionTree
                    node={calculationResult.rootNode}
                    collapsedNodes={collapsedNodes}
                    onToggleCollapse={handleToggleCollapse}
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
    </section>
  );
}
