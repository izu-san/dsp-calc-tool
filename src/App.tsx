import { useEffect, useState, lazy, Suspense } from 'react';
import type { RecipeTreeNode } from './types';
import { useTranslation } from 'react-i18next';
import { useGameDataStore } from './stores/gameDataStore';
import { useRecipeSelectionStore } from './stores/recipeSelectionStore';
import { useSettingsStore } from './stores/settingsStore';
import { useNodeOverrideStore } from './stores/nodeOverrideStore';
import i18n from './i18n';
import { ItemIcon } from './components/ItemIcon';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { calculateProductionChain } from './lib/calculator';
import { getPlanFromURL } from './utils/urlShare';
import { restorePlan } from './utils/planExport';

// Lazy load heavy components
const RecipeSelector = lazy(() => import('./components/RecipeSelector').then(m => ({ default: m.RecipeSelector })));
const ProductionTree = lazy(() => import('./components/ResultTree').then(m => ({ default: m.ProductionTree })));
const SettingsPanel = lazy(() => import('./components/SettingsPanel').then(m => ({ default: m.SettingsPanel })));
const PlanManager = lazy(() => import('./components/PlanManager').then(m => ({ default: m.PlanManager })));
const StatisticsView = lazy(() => import('./components/StatisticsView').then(m => ({ default: m.StatisticsView })));
const BuildingCostView = lazy(() => import('./components/BuildingCostView').then(m => ({ default: m.BuildingCostView })));
const ModSettings = lazy(() => import('./components/ModSettings').then(m => ({ default: m.ModSettings })));
const WelcomeModal = lazy(() => import('./components/WelcomeModal').then(m => ({ default: m.WelcomeModal })));

function App() {
  const { t } = useTranslation();
  const { data, isLoading, error, loadData, locale } = useGameDataStore();
  const { selectedRecipe, targetQuantity, calculationResult, setSelectedRecipe, setTargetQuantity, setCalculationResult } = useRecipeSelectionStore();
  const { settings, updateSettings } = useSettingsStore();
  const { nodeOverrides, version: nodeOverridesVersion, setAllOverrides } = useNodeOverrideStore();
  
  // Sync i18n language with store locale and update HTML lang attribute
  useEffect(() => {
    if (locale && i18n.language !== locale) {
      i18n.changeLanguage(locale);
    }
    // Update HTML lang attribute for accessibility and SEO
    document.documentElement.lang = locale;
  }, [locale]);
  
  // Enable dark mode permanently
  useEffect(() => {
    document.documentElement.classList.add('dark');
    document.documentElement.style.colorScheme = 'dark';
  }, []);

  // Load plan from URL if present
  useEffect(() => {
    if (!data || selectedRecipe) return; // Skip if already have a recipe

    const planFromURL = getPlanFromURL();
    if (planFromURL) {
      const recipe = data.recipes.get(planFromURL.recipeSID);
      if (recipe) {
        restorePlan(
          planFromURL,
          () => setSelectedRecipe(recipe),
          setTargetQuantity,
          updateSettings,
          setAllOverrides
        );
        
        // Remove URL parameter after loading
        const url = new URL(window.location.href);
        url.searchParams.delete('plan');
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, [data, selectedRecipe, setSelectedRecipe, setTargetQuantity, updateSettings, setAllOverrides]);
  
  // State for collapsed nodes
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
  const [isTreeExpanded, setIsTreeExpanded] = useState(false);
  const [showStatistics, setShowStatistics] = useState(false);
  const [showBuildingCost, setShowBuildingCost] = useState(false);

  // Generate a unique ID for each node based on its position in the tree
  // Must match the ID generation in ResultTree component
  const generateNodeId = (node: RecipeTreeNode, parentNodeId: string, depth: number): string => {
    if (node.isRawMaterial) {
      return `${parentNodeId}-raw-${node.itemId}-${depth}`;
    }
    return `${parentNodeId}-${node.recipe?.SID}-${depth}`;
  };

  // Helper function to collect all node IDs at depth >= targetDepth
  const collectNodeIdsFromDepth = (node: RecipeTreeNode, currentDepth: number, targetDepth: number, parentNodeId: string = 'root'): Set<string> => {
    const nodeIds = new Set<string>();
    
    const traverse = (n: RecipeTreeNode, depth: number, parentId: string) => {
      if (depth >= targetDepth) {
        const nodeId = depth === 0 ? 'root' : generateNodeId(n, parentId, depth);
        nodeIds.add(nodeId);
      }
      n.children?.forEach((child: RecipeTreeNode) => {
        const currentNodeId = depth === 0 ? 'root' : generateNodeId(n, parentId, depth);
        traverse(child, depth + 1, currentNodeId);
      });
    };
    
    traverse(node, currentDepth, parentNodeId);
    return nodeIds;
  };

  const handleToggleCollapse = (nodeId: string) => {
    setCollapsedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const handleToggleAll = () => {
    if (isTreeExpanded) {
      // Collapse all
      const allNodeIds = new Set<string>();
      const collectAllNodeIds = (node: RecipeTreeNode, depth: number, parentId: string) => {
        const nodeId = depth === 0 ? 'root' : generateNodeId(node, parentId, depth);
        allNodeIds.add(nodeId);
        node.children?.forEach((child: RecipeTreeNode) => {
          collectAllNodeIds(child, depth + 1, nodeId);
        });
      };
      if (calculationResult?.rootNode) {
        collectAllNodeIds(calculationResult.rootNode, 0, 'root');
      }
      setCollapsedNodes(allNodeIds);
      setIsTreeExpanded(false);
    } else {
      // Expand all
      setCollapsedNodes(new Set());
      setIsTreeExpanded(true);
    }
  };

  // Initialize with depth 0 only expanded (depth >= 1 collapsed)
  useEffect(() => {
    if (calculationResult?.rootNode) {
      const depthOneAndBeyond = collectNodeIdsFromDepth(calculationResult.rootNode, 0, 1);
      setCollapsedNodes(depthOneAndBeyond);
      setIsTreeExpanded(false);
    }
  }, [calculationResult]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Calculate production chain when recipe or quantity changes
  useEffect(() => {
    if (selectedRecipe && data && targetQuantity > 0) {
      try {
        const result = calculateProductionChain(selectedRecipe, targetQuantity, data, settings, nodeOverrides);
        setCalculationResult(result);
      } catch (err) {
        console.error('Calculation error:', err);
        setCalculationResult(null);
      }
    } else {
      setCalculationResult(null);
    }
  }, [selectedRecipe, targetQuantity, data, settings, nodeOverridesVersion, setCalculationResult]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-500">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-blue shadow-neon-blue mx-auto"></div>
          <p className="mt-4 text-space-200">{t('loadingGameData')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-500">
        <div className="text-center">
          <div className="text-neon-orange text-xl mb-4">⚠ {t('error')}</div>
          <p className="text-space-200">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="min-h-screen bg-dark-500 relative overflow-hidden">
      {/* Animated background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-nebula-gradient opacity-40"></div>
        <div className="absolute top-0 left-0 w-full h-full grid-bg opacity-30"></div>
      </div>

      {/* Hidden Mod Settings (Ctrl+Shift+M) */}
      <Suspense fallback={null}>
        <ModSettings />
      </Suspense>
      
      <header className="sticky top-0 z-50 backdrop-blur-md bg-dark-600/80 shadow-panel border-b border-neon-blue/30 relative overflow-hidden">
        {/* Animated background line */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-neon-cyan to-transparent opacity-50 animate-pulse-slow"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white drop-shadow-[0_0_8px_rgba(0,217,255,0.6)] animate-fadeIn">
                {t('title')}
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <LanguageSwitcher />
              <Suspense fallback={<div className="w-8 h-8"></div>}>
                <PlanManager />
              </Suspense>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1920px] mx-auto px-4 py-6 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Settings Panel - Wider on large screens */}
          <div className="xl:col-span-1 animate-slideInLeft">
            <div className="hologram-panel rounded-lg shadow-panel p-4 sticky top-6 max-h-[calc(100vh-8rem)] overflow-y-auto border border-neon-blue/20 hover-lift">
              <h2 className="text-lg font-semibold text-neon-cyan mb-4">{t('settings')}</h2>
              
              {/* Target Quantity Input */}
              {selectedRecipe && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-space-100 mb-2">
                    {t('target')}
                  </label>
                  <div className="flex items-center gap-3 mb-2">
                    <ItemIcon itemId={selectedRecipe.Results[0]?.id || 0} size={32} />
                    <span className="font-medium text-white">
                      {selectedRecipe.name}
                    </span>
                  </div>
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={targetQuantity}
                    onChange={(e) => setTargetQuantity(parseFloat(e.target.value) || 0.1)}
                    className="w-full px-3 py-2 border border-neon-blue/30 bg-dark-700/50 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-neon-blue focus:border-neon-blue transition-all"
                  />
                  <p className="text-xs text-space-200 mt-1">{t('itemsPerSecond')}</p>
                </div>
              )}
              
              {/* Proliferator Settings */}
              <Suspense fallback={<div className="text-center py-4">{t('loading')}</div>}>
                <SettingsPanel />
              </Suspense>
            </div>
          </div>

          {/* Recipe Selector & Results - Takes more space */}
          <div className="xl:col-span-3 space-y-6 animate-slideInRight">
            <div className="hologram-panel rounded-lg shadow-panel p-6 border border-neon-blue/20 hover-lift">
              <h2 className="text-lg font-semibold text-neon-cyan mb-4">{t('selectRecipe')}</h2>
              <Suspense fallback={<div className="text-center py-4">{t('loading')}</div>}>
                <RecipeSelector
                  recipes={Array.from(data.recipes.values())}
                  onRecipeSelect={setSelectedRecipe}
                  selectedRecipeId={selectedRecipe?.SID}
                />
              </Suspense>
            </div>

            <div className="hologram-panel rounded-lg shadow-panel p-6 border border-neon-blue/20 hover-lift">
              <h2 className="text-lg font-semibold text-neon-cyan mb-4">{t('productionTree')}</h2>
              {calculationResult ? (
                <div className="space-y-4">
                  {/* View Toggle Tabs */}
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
                      
                      {/* Expand/Collapse All button - only show for Production Tree */}
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

                    {/* Content - Tree, Statistics, or Building Cost */}
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
          </div>
        </div>
      </main>

      {/* Welcome Modal */}
      <Suspense fallback={null}>
        <WelcomeModal />
      </Suspense>
    </div>
  );
}

export default App;
