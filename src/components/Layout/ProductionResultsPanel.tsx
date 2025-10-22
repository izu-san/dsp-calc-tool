import { useState, Suspense, lazy } from 'react';
import { useTranslation } from 'react-i18next';
import type { Recipe, CalculationResult } from '../../types';

const ProductionTree = lazy(() => import('../ResultTree').then(m => ({ default: m.ProductionTree })));
const StatisticsView = lazy(() => import('../StatisticsView').then(m => ({ default: m.StatisticsView })));
const BuildingCostView = lazy(() => import('../BuildingCostView').then(m => ({ default: m.BuildingCostView })));

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
  const [showStatistics, setShowStatistics] = useState(false);
  const [showBuildingCost, setShowBuildingCost] = useState(false);

  return (
    <div className="hologram-panel rounded-lg shadow-panel p-6 border border-neon-blue/20 hover-lift">
      <h2 className="text-lg font-semibold text-neon-cyan mb-4">{t('productionTree')}</h2>
      {calculationResult ? (
        <div className="space-y-4">
          <div>
            {/* Tab Buttons */}
            <div className="flex items-center gap-2 mb-4 border-b border-neon-blue/20">
              <button
                onClick={() => { setShowStatistics(false); setShowBuildingCost(false); }}
                className={`
                  px-4 py-2 text-sm font-medium border-b-2 transition-all ripple-effect
                  ${!showStatistics && !showBuildingCost
                    ? 'border-neon-blue text-neon-cyan shadow-neon-blue' 
                    : 'border-transparent text-space-300 hover:text-neon-cyan'
                  }
                `}
              >
                {t('productionTree')}
              </button>
              <button
                onClick={() => { setShowStatistics(true); setShowBuildingCost(false); }}
                className={`
                  px-4 py-2 text-sm font-medium border-b-2 transition-all ripple-effect
                  ${showStatistics 
                    ? 'border-neon-blue text-neon-cyan shadow-neon-blue' 
                    : 'border-transparent text-space-300 hover:text-neon-cyan'
                  }
                `}
              >
                {t('statistics')}
              </button>
              <button
                onClick={() => { setShowStatistics(false); setShowBuildingCost(true); }}
                className={`
                  px-4 py-2 text-sm font-medium border-b-2 transition-all ripple-effect
                  ${showBuildingCost
                    ? 'border-neon-blue text-neon-cyan shadow-neon-blue' 
                    : 'border-transparent text-space-300 hover:text-neon-cyan'
                  }
                `}
              >
                {t('buildingCost')}
              </button>
              
              {/* Expand/Collapse All button */}
              {!showStatistics && !showBuildingCost && (
                <button
                  onClick={handleToggleAll}
                  className={`
                    ml-auto px-4 py-2 text-sm font-medium rounded-lg border transition-all duration-300 ease-in-out ripple-effect
                    ${isTreeExpanded 
                      ? 'bg-neon-blue/20 text-neon-cyan border-neon-blue shadow-neon-blue hover:bg-neon-blue/30' 
                      : 'bg-dark-700/50 text-space-200 border-neon-blue/30 hover:bg-dark-600 hover:border-neon-blue/50 hover:text-neon-cyan'
                    }
                  `}
                >
                  <span className="inline-flex items-center gap-2">
                    <span className={`transition-transform duration-300 ${isTreeExpanded ? 'rotate-180' : 'rotate-0'}`}>
                      ▼
                    </span>
                    <span>{isTreeExpanded ? t('collapseAll') : t('expandAll')}</span>
                  </span>
                </button>
              )}
            </div>

            {/* Content */}
            <Suspense fallback={<div className="text-center py-4">{t('loading')}</div>}>
              {showStatistics ? (
                <StatisticsView calculationResult={calculationResult} />
              ) : showBuildingCost ? (
                <BuildingCostView calculationResult={calculationResult} />
              ) : (
                <ProductionTree 
                  node={calculationResult.rootNode}
                  collapsedNodes={collapsedNodes}
                  onToggleCollapse={handleToggleCollapse}
                  nodeId="root"
                />
              )}
            </Suspense>
          </div>
        </div>
      ) : selectedRecipe ? (
        <div className="text-sm text-space-300">
          <p>{t('calculating')}</p>
        </div>
      ) : (
        <p className="text-sm text-space-300">{t('noRecipeSelected')}</p>
      )}
    </div>
  );
}

