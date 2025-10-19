import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameDataStore } from '../../stores/gameDataStore';
import { useRecipeSelectionStore } from '../../stores/recipeSelectionStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useNodeOverrideStore } from '../../stores/nodeOverrideStore';
import { calculateProductionChain } from '../../lib/calculator';
import { formatNumber, formatPower } from '../../utils/format';
import type { GlobalSettings, ConveyorBeltTier, RecipeTreeNode } from '../../types';

interface Scenario {
  id: string;
  name: string;
  description: string;
  settings: Partial<GlobalSettings>;
  isBottleneckFix?: boolean; // Mark scenarios that fix bottlenecks
}

interface BottleneckSuggestion {
  nodeId?: string;
  issue: string;
  severity: 'high' | 'medium' | 'low';
  suggestion: string;
  scenarioId: string;
}

type OptimizationGoal = 'power' | 'machines' | 'efficiency' | 'balanced' | null;

export function WhatIfSimulator() {
  const { t } = useTranslation();
  const { data } = useGameDataStore();
  const { selectedRecipe, targetQuantity } = useRecipeSelectionStore();
  const { settings, setProliferator, setConveyorBelt, setMachineRank } = useSettingsStore();
  const { nodeOverrides } = useNodeOverrideStore();
  const [activeScenarios, setActiveScenarios] = useState<string[]>([]);
  const [appliedScenario, setAppliedScenario] = useState<string | null>(null);
  const [optimizationGoal, setOptimizationGoal] = useState<OptimizationGoal>(null);

  const countTotalBelts = useCallback((node: RecipeTreeNode): number => {
    let total = node.conveyorBelts?.total || 0;
    if (node.children) {
      for (const child of node.children) {
        total += countTotalBelts(child);
      }
    }
    return total;
  }, []);

  // Check if a scenario is already applied (current settings match scenario)
  const isScenarioAlreadyApplied = useCallback((scenario: Scenario): boolean => {
    const scenarioSettings = scenario.settings;
    
    // Check proliferator
    if (scenarioSettings.proliferator) {
      if (settings.proliferator.type !== scenarioSettings.proliferator.type) {
        return false;
      }
    }
    
    // Check conveyor belt
    if (scenarioSettings.conveyorBelt) {
      if (scenarioSettings.conveyorBelt.tier && 
          settings.conveyorBelt.tier !== scenarioSettings.conveyorBelt.tier) {
        return false;
      }
      if (scenarioSettings.conveyorBelt.stackCount !== undefined && 
          settings.conveyorBelt.stackCount !== scenarioSettings.conveyorBelt.stackCount) {
        return false;
      }
    }
    
    // Check machine ranks
    if (scenarioSettings.machineRank) {
      for (const [type, rank] of Object.entries(scenarioSettings.machineRank)) {
        if (settings.machineRank[type as keyof typeof settings.machineRank] !== rank) {
          return false;
        }
      }
    }
    
    return true;
  }, [settings]);

  // Define scenarios
  const scenarios: Scenario[] = [
    {
      id: 'proliferator_mk3',
      name: t('upgradeToMk3Proliferator'),
      description: t('upgradeToMk3ProliferatorDesc'),
      isBottleneckFix: true,
      settings: {
        proliferator: {
          type: 'mk3',
          mode: settings.proliferator.mode,
          productionBonus: 0.25,
          speedBonus: 1.0,
          powerIncrease: 1.5,
        },
      },
    },
    {
      id: 'belt_mk3',
      name: t('upgradeToMk3Belt'),
      description: t('upgradeToMk3BeltDesc'),
      isBottleneckFix: true,
      settings: {
        conveyorBelt: {
          tier: 'mk3' as ConveyorBeltTier,
          speed: 30,
          stackCount: settings.conveyorBelt.stackCount,
        },
      },
    },
    {
      id: 'stack_4',
      name: t('increaseBeltStack'),
      description: t('increaseBeltStackDesc'),
      isBottleneckFix: true,
      settings: {
        conveyorBelt: {
          ...settings.conveyorBelt,
          stackCount: 4,
        },
      },
    },
    {
      id: 'quantum_chemical',
      name: t('upgradeToQuantumChemical'),
      description: t('upgradeToQuantumChemicalDesc'),
      settings: {
        machineRank: {
          ...settings.machineRank,
          Chemical: 'quantum',
        },
      },
    },
    {
      id: 'assembler_mk3',
      name: t('upgradeToAssemblerMk3'),
      description: t('upgradeToAssemblerMk3Desc'),
      settings: {
        machineRank: {
          ...settings.machineRank,
          Assemble: 'mk3',
        },
      },
    },
    {
      id: 'assembler_recomposing',
      name: t('upgradeToRecomposingAssembler'),
      description: t('upgradeToRecomposingAssemblerDesc'),
      settings: {
        machineRank: {
          ...settings.machineRank,
          Assemble: 'recomposing',
        },
      },
    },
    {
      id: 'production_mode',
      name: t('switchToProductionMode'),
      description: t('switchToProductionModeDesc'),
      settings: {
        proliferator: {
          ...settings.proliferator,
          mode: 'production',
        },
      },
    },
    {
      id: 'speed_mode',
      name: t('switchToSpeedMode'),
      description: t('switchToSpeedModeDesc'),
      settings: {
        proliferator: {
          ...settings.proliferator,
          mode: 'speed',
        },
      },
    },
  ];

  // Calculate results for each scenario with memoization
  const results = useMemo(() => {
    if (!selectedRecipe || !data || targetQuantity <= 0) {
      return { baseResult: null, scenarioResults: [] };
    }
    
    const baseResult = calculateProductionChain(
      selectedRecipe,
      targetQuantity,
      data,
      settings,
      nodeOverrides
    );

    const scenarioResults = scenarios.map(scenario => {
      const modifiedSettings = { ...settings, ...scenario.settings };
      const result = calculateProductionChain(
        selectedRecipe,
        targetQuantity,
        data,
        modifiedSettings,
        nodeOverrides
      );

      // Calculate differences
      const powerDiff = result.totalPower.total - baseResult.totalPower.total;
      const machineDiff = result.totalMachines - baseResult.totalMachines;
      
      // Calculate belt changes
      const baseBelts = countTotalBelts(baseResult.rootNode);
      const scenarioBelts = countTotalBelts(result.rootNode);
      const beltDiff = scenarioBelts - baseBelts;

      return {
        scenario,
        result,
        baseResult,
        diff: {
          power: powerDiff,
          powerPercent: (powerDiff / baseResult.totalPower.total) * 100,
          machines: machineDiff,
          machinePercent: (machineDiff / baseResult.totalMachines) * 100,
          belts: beltDiff,
          beltPercent: baseBelts > 0 ? (beltDiff / baseBelts) * 100 : 0,
        },
      };
    });

    return { baseResult, scenarioResults };
  }, [data, selectedRecipe, targetQuantity, settings, nodeOverrides, scenarios, countTotalBelts]);

  // Optimization ranking based on selected goal
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
        case 'power':
          // Lower power is better
          return a.diff.power - b.diff.power;
        
        case 'machines':
          // Fewer machines is better
          return a.diff.machines - b.diff.machines;
        
        case 'efficiency': {
          // Combined efficiency score (lower is better)
          const scoreA = (
            Math.abs(a.diff.powerPercent) * 0.4 +
            Math.abs(a.diff.machinePercent) * 0.3 +
            Math.abs(a.diff.beltPercent) * 0.3
          );
          const scoreB = (
            Math.abs(b.diff.powerPercent) * 0.4 +
            Math.abs(b.diff.machinePercent) * 0.3 +
            Math.abs(b.diff.beltPercent) * 0.3
          );
          return scoreA - scoreB;
        }
        
        case 'balanced': {
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


  // Detect bottlenecks in the production tree
  const bottleneckSuggestions = useMemo((): BottleneckSuggestion[] => {
    if (!results.baseResult) return [];
    
    const suggestions: BottleneckSuggestion[] = [];
    
    // Check for conveyor belt bottlenecks
    const checkNodeForBottlenecks = (node: RecipeTreeNode) => {
      if (node.conveyorBelts?.saturation && node.conveyorBelts.saturation > 80) {
        const severity = node.conveyorBelts.saturation > 95 ? 'high' : 
                        node.conveyorBelts.saturation > 85 ? 'medium' : 'low';
        
        // Suggest belt upgrade if not using Mk3
        if (settings.conveyorBelt.tier !== 'mk3') {
          suggestions.push({
            nodeId: node.nodeId,
            issue: `${t('conveyorBeltSaturationAt')} ${node.conveyorBelts.saturation.toFixed(1)}%`,
            severity,
            suggestion: t('upgradeToMk3ConveyorBelts'),
            scenarioId: 'belt_mk3',
          });
        }
        
        // Suggest stack increase if less than 4
        // Only suggest if not already at max stack and belt upgrade won't fix it alone
        if (settings.conveyorBelt.stackCount < 4 && 
            (settings.conveyorBelt.tier === 'mk3' || node.conveyorBelts.saturation > 90)) {
          suggestions.push({
            nodeId: node.nodeId,
            issue: `${t('conveyorBeltSaturationAt')} ${node.conveyorBelts.saturation.toFixed(1)}%`,
            severity,
            suggestion: t('increaseBeltStackTo4'),
            scenarioId: 'stack_4',
          });
        }
      }
      
      // Recursively check children
      if (node.children) {
        node.children.forEach((child) => checkNodeForBottlenecks(child));
      }
    };
    
    checkNodeForBottlenecks(results.baseResult.rootNode);
    
    // Check for overall inefficiency - only if proliferator upgrade would help
    if (settings.proliferator.type !== 'mk3') {
      const hasBottleneck = suggestions.length > 0;
      suggestions.push({
        issue: t('notUsingMk3Proliferator'),
        severity: hasBottleneck ? 'medium' : 'low',
        suggestion: t('upgradeToMk3ProliferatorSuggestion'),
        scenarioId: 'proliferator_mk3',
      });
    }
    
    // Remove duplicate suggestions (same scenarioId)
    const uniqueSuggestions = suggestions.filter((suggestion, index, self) =>
      index === self.findIndex((s) => s.scenarioId === suggestion.scenarioId)
    );
    
    return uniqueSuggestions;
  }, [results.baseResult, settings, t]);

  const toggleScenario = (scenarioId: string) => {
    setActiveScenarios(prev => 
      prev.includes(scenarioId)
        ? prev.filter(id => id !== scenarioId)
        : [...prev, scenarioId]
    );
  };

  const applyScenario = (scenario: Scenario) => {
    // Apply the scenario settings to global settings
    const scenarioSettings = scenario.settings;

    if (scenarioSettings.proliferator) {
      setProliferator(
        scenarioSettings.proliferator.type,
        scenarioSettings.proliferator.mode
      );
    }

    if (scenarioSettings.conveyorBelt) {
      setConveyorBelt(
        scenarioSettings.conveyorBelt.tier,
        scenarioSettings.conveyorBelt.stackCount
      );
    }

    if (scenarioSettings.machineRank) {
      Object.entries(scenarioSettings.machineRank).forEach(([type, rank]) => {
        setMachineRank(type as keyof GlobalSettings['machineRank'], rank as string);
      });
    }

    // Show applied state
    setAppliedScenario(scenario.id);
    
    // Reset after 3 seconds
    setTimeout(() => {
      setAppliedScenario(null);
    }, 3000);
  };

  if (!data || !selectedRecipe) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            {t('whatIfAnalysis')}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('compareDifferentSettings')}
          </p>
        </div>
        {results.baseResult && (
          <div className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
            {t('current')}: {formatPower(results.baseResult.totalPower.total)} · {formatNumber(results.baseResult.totalMachines)} {t('machines')}
          </div>
        )}
      </div>

      {/* Applied Scenario Notification */}
      {appliedScenario && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded-lg p-3 flex items-center gap-2">
          <span className="text-green-600 dark:text-green-400 text-xl">✓</span>
          <div className="flex-1">
            <div className="text-sm font-semibold text-green-900 dark:text-green-300">
              {t('scenarioApplied')}
            </div>
            <div className="text-xs text-green-700 dark:text-green-400">
              {scenarios.find(s => s.id === appliedScenario)?.name} {t('scenarioAppliedToSettings')}
            </div>
          </div>
        </div>
      )}

      {/* Bottleneck Warnings */}
      {bottleneckSuggestions.length > 0 ? (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg p-3">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-start gap-2 flex-1">
              <span className="text-yellow-600 dark:text-yellow-400 text-xl">⚠️</span>
              <div className="flex-1">
                <div className="text-sm font-semibold text-yellow-900 dark:text-yellow-300 mb-1">
                  {t('bottlenecksDetected')} ({bottleneckSuggestions.length})
                </div>
                <div className="text-xs text-yellow-700 dark:text-yellow-400 mb-2">
                  {t('productionChainInefficiencies')}
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                // Get unique scenario IDs from suggestions
                const uniqueScenarioIds = [...new Set(bottleneckSuggestions.map(s => s.scenarioId))];
                // Apply each scenario in sequence
                uniqueScenarioIds.forEach((scenarioId, index) => {
                  const scenario = scenarios.find(s => s.id === scenarioId);
                  if (scenario && !isScenarioAlreadyApplied(scenario)) {
                    setTimeout(() => {
                      applyScenario(scenario);
                    }, index * 100); // Stagger applications slightly
                  }
                });
              }}
              className="px-3 py-1.5 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 dark:from-orange-700 dark:to-red-700 dark:hover:from-orange-600 dark:hover:to-red-600 text-white text-xs font-bold rounded-lg shadow-md hover:shadow-lg transition-all whitespace-nowrap flex-shrink-0"
              title={t('fixAllBottlenecks')}
            >
              🔧 {t('fixAll')}
            </button>
          </div>
          
          <div className="space-y-2">
            {bottleneckSuggestions.slice(0, 3).map((suggestion, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-gray-800 rounded-lg p-2 border border-yellow-200 dark:border-yellow-800"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`
                        text-xs font-semibold px-2 py-0.5 rounded
                        ${suggestion.severity === 'high' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                          suggestion.severity === 'medium' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' :
                          'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                        }
                      `}>
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
                    onClick={() => {
                      const scenario = scenarios.find(s => s.id === suggestion.scenarioId);
                      if (scenario) applyScenario(scenario);
                    }}
                    className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white rounded transition-colors whitespace-nowrap flex-shrink-0"
                  >
                    {t('fixNow')}
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
      ) : (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-300 dark:border-green-600 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <span className="text-green-600 dark:text-green-400 text-xl">✓</span>
            <div className="flex-1">
              <div className="text-sm font-semibold text-green-900 dark:text-green-300 mb-1">
                {t('noBottlenecksDetected')}
              </div>
              <div className="text-xs text-green-700 dark:text-green-400">
                {t('productionChainSmooth')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Optimization Goal Selector */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-300 dark:border-blue-700 rounded-lg p-3">
        <div className="flex items-start gap-2 mb-3">
          <span className="text-blue-600 dark:text-blue-400 text-xl">🎯</span>
          <div className="flex-1">
            <div className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-1">
              {t('optimizationEngine')}
            </div>
            <div className="text-xs text-blue-700 dark:text-blue-400">
              {t('selectOptimizationGoal')}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            onClick={() => setOptimizationGoal(optimizationGoal === 'power' ? null : 'power')}
            className={`
              px-3 py-2 rounded-lg text-xs font-medium transition-all border-2
              ${optimizationGoal === 'power'
                ? 'bg-blue-600 dark:bg-blue-700 text-white border-blue-600 dark:border-blue-700 shadow-md'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-600'
              }
            `}
          >
            <div className="flex flex-col items-center gap-1">
              <span className="text-base">⚡</span>
              <span>{t('minPower')}</span>
            </div>
          </button>
          
          <button
            onClick={() => setOptimizationGoal(optimizationGoal === 'machines' ? null : 'machines')}
            className={`
              px-3 py-2 rounded-lg text-xs font-medium transition-all border-2
              ${optimizationGoal === 'machines'
                ? 'bg-blue-600 dark:bg-blue-700 text-white border-blue-600 dark:border-blue-700 shadow-md'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-600'
              }
            `}
          >
            <div className="flex flex-col items-center gap-1">
              <span className="text-base">🏭</span>
              <span>{t('minMachines')}</span>
            </div>
          </button>
          
          <button
            onClick={() => setOptimizationGoal(optimizationGoal === 'efficiency' ? null : 'efficiency')}
            className={`
              px-3 py-2 rounded-lg text-xs font-medium transition-all border-2
              ${optimizationGoal === 'efficiency'
                ? 'bg-blue-600 dark:bg-blue-700 text-white border-blue-600 dark:border-blue-700 shadow-md'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-600'
              }
            `}
          >
            <div className="flex flex-col items-center gap-1">
              <span className="text-base">📈</span>
              <span>{t('maxEfficiency')}</span>
            </div>
          </button>
          
          <button
            onClick={() => setOptimizationGoal(optimizationGoal === 'balanced' ? null : 'balanced')}
            className={`
              px-3 py-2 rounded-lg text-xs font-medium transition-all border-2
              ${optimizationGoal === 'balanced'
                ? 'bg-blue-600 dark:bg-blue-700 text-white border-blue-600 dark:border-blue-700 shadow-md'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-600'
              }
            `}
          >
            <div className="flex flex-col items-center gap-1">
              <span className="text-base">⚖️</span>
              <span>{t('balanced')}</span>
            </div>
          </button>
        </div>
        
        {optimizationGoal && (
          <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
            {rankedScenarios.length === 0 ? (
              <div className="flex items-center gap-2">
                <span className="text-green-600 dark:text-green-400 text-lg">✓</span>
                <div className="text-xs text-green-700 dark:text-green-400 font-semibold">
                  {t('allOptimizationsComplete')} {t('perfectConfiguration')}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs text-blue-700 dark:text-blue-400 flex-1">
                  {optimizationGoal === 'power' && `💡 ${t('showingScenariosLowestPower')}`}
                  {optimizationGoal === 'machines' && `💡 ${t('showingScenariosFewestMachines')}`}
                  {optimizationGoal === 'efficiency' && `💡 ${t('showingScenariosBestEfficiency')}`}
                  {optimizationGoal === 'balanced' && `💡 ${t('showingScenariosBalanced')}`}
                </div>
                <button
                  onClick={() => {
                    const topScenario = rankedScenarios[0];
                    if (topScenario) applyScenario(topScenario.scenario);
                  }}
                  className="px-3 py-1.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 dark:from-green-700 dark:to-emerald-700 dark:hover:from-green-600 dark:hover:to-emerald-600 text-white text-xs font-bold rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 whitespace-nowrap"
                  title={t('applyBestScenarioTitle')}
                >
                  <span className="text-sm">⚡</span>
                  <span>{t('applyBest')}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Actions Bar */}
      {rankedScenarios.length > 0 && !optimizationGoal && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-300 dark:border-indigo-700 rounded-lg p-3">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-indigo-600 dark:text-indigo-400 text-lg">⚡</span>
              <div>
                <div className="text-sm font-semibold text-indigo-900 dark:text-indigo-300">
                  {t('quickActions')}
                </div>
                <div className="text-xs text-indigo-700 dark:text-indigo-400">
                  {t('applyCommonOptimizations')}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => {
                  const scenario = scenarios.find(s => s.id === 'proliferator_mk3');
                  if (scenario && !isScenarioAlreadyApplied(scenario)) applyScenario(scenario);
                }}
                disabled={isScenarioAlreadyApplied(scenarios.find(s => s.id === 'proliferator_mk3')!)}
                className="px-3 py-2 bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-xs font-medium rounded transition-colors flex flex-col items-center justify-center gap-1 min-h-[60px]"
              >
                <span className="text-lg">🧪</span>
                <span className="text-xs leading-tight text-center">{t('maxProliferator')}</span>
              </button>
              <button
                onClick={() => {
                  const scenario = scenarios.find(s => s.id === 'belt_mk3');
                  if (scenario && !isScenarioAlreadyApplied(scenario)) applyScenario(scenario);
                }}
                disabled={isScenarioAlreadyApplied(scenarios.find(s => s.id === 'belt_mk3')!)}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-xs font-medium rounded transition-colors flex flex-col items-center justify-center gap-1 min-h-[60px]"
              >
                <span className="text-lg">🛤️</span>
                <span className="text-xs leading-tight text-center">{t('maxBelts')}</span>
              </button>
              <button
                onClick={() => {
                  const scenario = scenarios.find(s => s.id === 'stack_4');
                  if (scenario && !isScenarioAlreadyApplied(scenario)) applyScenario(scenario);
                }}
                disabled={isScenarioAlreadyApplied(scenarios.find(s => s.id === 'stack_4')!)}
                className="px-3 py-2 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-xs font-medium rounded transition-colors flex flex-col items-center justify-center gap-1 min-h-[60px]"
              >
                <span className="text-lg">📦</span>
                <span className="text-xs leading-tight text-center">{t('maxStack')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scenario Cards */}
      <div className="grid grid-cols-1 gap-3">
        {rankedScenarios.length === 0 && optimizationGoal && (
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-400 dark:border-green-600 rounded-lg p-6 text-center">
            <div className="text-5xl mb-3">🎉</div>
            <h3 className="text-lg font-bold text-green-900 dark:text-green-300 mb-2">
              {t('optimizationComplete')}
            </h3>
            <p className="text-sm text-green-700 dark:text-green-400 mb-4">
              {t('alreadyOptimizedFor')}{' '}
              {optimizationGoal === 'power' && t('minimumPowerConsumption')}
              {optimizationGoal === 'machines' && t('minimumMachineCount')}
              {optimizationGoal === 'efficiency' && t('maximumEfficiency')}
              {optimizationGoal === 'balanced' && t('balancedPerformance')}
              .
            </p>
            <div className="text-xs text-green-600 dark:text-green-500">
              {t('noFurtherImprovements')}
            </div>
          </div>
        )}
        {rankedScenarios.length === 0 && !optimizationGoal && (
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-2 border-purple-400 dark:border-purple-600 rounded-lg p-6 text-center">
            <div className="text-5xl mb-3">🌟</div>
            <h3 className="text-lg font-bold text-purple-900 dark:text-purple-300 mb-2">
              {t('perfectConfiguration')}
            </h3>
            <p className="text-sm text-purple-700 dark:text-purple-400 mb-4">
              {t('allScenariosApplied')}
            </p>
            <div className="text-xs text-purple-600 dark:text-purple-500">
              {t('usingBestConfigurations')}
            </div>
          </div>
        )}
        {rankedScenarios.map(({ scenario, diff }, index) => {
          const isActive = activeScenarios.includes(scenario.id);
          const isImprovement = diff.power < 0 || diff.machines < 0 || diff.belts < 0;
          const isApplied = appliedScenario === scenario.id;
          const isAlreadyApplied = isScenarioAlreadyApplied(scenario);
          const bottlenecksFixes = scenario.isBottleneckFix 
            ? bottleneckSuggestions.filter(s => s.scenarioId === scenario.id).length 
            : 0;
          const isRecommended = optimizationGoal && index < 3;

          return (
            <div
              key={scenario.id}
              className={`
                p-3 rounded-lg border-2 transition-all
                ${isApplied
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-400 dark:border-green-600 shadow-md'
                  : isAlreadyApplied
                  ? 'bg-gray-50 dark:bg-gray-900/20 border-gray-400 dark:border-gray-600 opacity-60'
                  : isRecommended
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 dark:border-blue-600 shadow-lg'
                  : bottlenecksFixes > 0
                  ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-400 dark:border-yellow-600 shadow-md'
                  : isActive
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-400 dark:border-blue-600 shadow-md'
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                }
              `}
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                <button
                  onClick={() => toggleScenario(scenario.id)}
                  className="flex-1 text-left min-w-0"
                >
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1 flex flex-wrap items-center gap-2">
                    {isRecommended && !isAlreadyApplied && (
                      <span className="text-blue-600 dark:text-blue-400 font-bold text-sm">
                        #{index + 1}
                      </span>
                    )}
                    <span className="truncate">{scenario.name}</span>
                    {isAlreadyApplied && (
                      <span className="text-gray-500 dark:text-gray-400 text-xs font-bold whitespace-nowrap">✓ {t('current')}</span>
                    )}
                    {!isAlreadyApplied && isImprovement && (
                      <span className="text-green-500 dark:text-green-400 text-xs whitespace-nowrap">✓ {t('improvement')}</span>
                    )}
                    {isApplied && (
                      <span className="text-green-600 dark:text-green-400 text-xs font-bold whitespace-nowrap">✓ {t('applied')}!</span>
                    )}
                    {isRecommended && !isApplied && !isAlreadyApplied && (
                      <span className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 text-white text-xs font-bold px-2 py-0.5 rounded whitespace-nowrap">
                        ⭐ {t('topN')} {index + 1}
                      </span>
                    )}
                    {bottlenecksFixes > 0 && !isApplied && !isRecommended && !isAlreadyApplied && (
                      <span className="text-yellow-600 dark:text-yellow-400 text-xs font-bold whitespace-nowrap">🔧 {t('fixes')} {bottlenecksFixes}</span>
                    )}
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {scenario.description}
                  </p>
                </button>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {isActive && !isApplied && !isAlreadyApplied && (
                    <span className="text-blue-600 dark:text-blue-400">📊</span>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      applyScenario(scenario);
                    }}
                    disabled={isApplied || isAlreadyApplied}
                    className={`
                      px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap
                      ${isApplied || isAlreadyApplied
                        ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white'
                      }
                    `}
                    title={isApplied ? t('applied') : isAlreadyApplied ? t('current') : t('applyScenarioToSettings')}
                  >
                    {isApplied ? `✓ ${t('applied')}` : isAlreadyApplied ? t('current') : t('apply')}
                  </button>
                </div>
              </div>

              {/* Impact Summary */}
              <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                {/* Power Change */}
                <div className="text-center">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('power')}</div>
                  <div className={`text-sm font-bold ${
                    diff.power < 0 ? 'text-green-600 dark:text-green-400' :
                    diff.power > 0 ? 'text-red-600 dark:text-red-400' :
                    'text-gray-600 dark:text-gray-400'
                  }`}>
                    {diff.power > 0 ? '+' : ''}{diff.powerPercent.toFixed(1)}%
                  </div>
                </div>

                {/* Machines Change */}
                <div className="text-center">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('machines')}</div>
                  <div className={`text-sm font-bold ${
                    diff.machines < 0 ? 'text-green-600 dark:text-green-400' :
                    diff.machines > 0 ? 'text-red-600 dark:text-red-400' :
                    'text-gray-600 dark:text-gray-400'
                  }`}>
                    {diff.machines > 0 ? '+' : ''}{diff.machinePercent.toFixed(1)}%
                  </div>
                </div>

                {/* Belts Change */}
                <div className="text-center">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('belts')}</div>
                  <div className={`text-sm font-bold ${
                    diff.belts < 0 ? 'text-green-600 dark:text-green-400' :
                    diff.belts > 0 ? 'text-red-600 dark:text-red-400' :
                    'text-gray-600 dark:text-gray-400'
                  }`}>
                    {diff.belts > 0 ? '+' : ''}{diff.beltPercent.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Scenarios Comparison */}
      {activeScenarios.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
            {t('detailedComparison')}
          </h4>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-300 dark:border-gray-600">
                  <th className="text-left py-2 px-3 text-gray-700 dark:text-gray-300">{t('metric')}</th>
                  <th className="text-right py-2 px-3 text-gray-700 dark:text-gray-300">{t('current')}</th>
                  {activeScenarios.map(scenarioId => {
                    const scenario = scenarios.find(s => s.id === scenarioId);
                    return (
                      <th key={scenarioId} className="text-right py-2 px-3 text-blue-600 dark:text-blue-400">
                        {scenario?.name.split(' ').slice(0, 2).join(' ')}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <td className="py-2 px-3 text-gray-900 dark:text-white">{t('totalPower')}</td>
                  <td className="text-right py-2 px-3 text-gray-900 dark:text-white">
                    {formatPower(results.baseResult?.totalPower.total || 0)}
                  </td>
                  {activeScenarios.map(scenarioId => {
                    const result = results.scenarioResults.find(r => r.scenario.id === scenarioId);
                    return (
                      <td key={scenarioId} className="text-right py-2 px-3">
                        <span className="text-gray-900 dark:text-white">
                          {formatPower(result?.result.totalPower.total || 0)}
                        </span>
                        <span className={`ml-2 text-xs ${
                          (result?.diff.power || 0) < 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                        }`}>
                          ({result?.diff.power && result.diff.power > 0 ? '+' : ''}{result?.diff.power.toFixed(1)} kW)
                        </span>
                      </td>
                    );
                  })}
                </tr>

                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <td className="py-2 px-3 text-gray-900 dark:text-white">{t('totalMachines')}</td>
                  <td className="text-right py-2 px-3 text-gray-900 dark:text-white">
                    {formatNumber(results.baseResult?.totalMachines || 0)}
                  </td>
                  {activeScenarios.map(scenarioId => {
                    const result = results.scenarioResults.find(r => r.scenario.id === scenarioId);
                    return (
                      <td key={scenarioId} className="text-right py-2 px-3">
                        <span className="text-gray-900 dark:text-white">
                          {formatNumber(result?.result.totalMachines || 0)}
                        </span>
                        <span className={`ml-2 text-xs ${
                          (result?.diff.machines || 0) < 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                        }`}>
                          ({result?.diff.machines && result.diff.machines > 0 ? '+' : ''}{formatNumber(result?.diff.machines || 0)})
                        </span>
                      </td>
                    );
                  })}
                </tr>

                <tr>
                  <td className="py-2 px-3 text-gray-900 dark:text-white">{t('totalBelts')}</td>
                  <td className="text-right py-2 px-3 text-gray-900 dark:text-white">
                    {formatNumber(results.baseResult?.rootNode ? countTotalBelts(results.baseResult.rootNode) : 0)}
                  </td>
                  {activeScenarios.map(scenarioId => {
                    const result = results.scenarioResults.find(r => r.scenario.id === scenarioId);
                    return (
                      <td key={scenarioId} className="text-right py-2 px-3">
                        <span className="text-gray-900 dark:text-white">
                          {formatNumber(result?.result.rootNode ? countTotalBelts(result.result.rootNode) : 0)}
                        </span>
                        <span className={`ml-2 text-xs ${
                          (result?.diff.belts || 0) < 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                        }`}>
                          ({result?.diff.belts && result.diff.belts > 0 ? '+' : ''}{formatNumber(result?.diff.belts || 0)})
                        </span>
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
                  onClick={() => applyScenario(scenario)}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                >
                  <span>✓</span>
                  {t('apply')} "{scenario.name}"
                </button>
              );
            })}
          </div>

          <div className="mt-3 text-xs text-gray-600 dark:text-gray-400">
            💡 <span className="text-green-600 dark:text-green-400">{t('green')}</span> {t('greenIndicatesImprovement')}, 
            <span className="text-red-600 dark:text-red-400 ml-1">{t('red')}</span> {t('redIndicatesIncrease')}
          </div>
        </div>
      )}
    </div>
  );
}
