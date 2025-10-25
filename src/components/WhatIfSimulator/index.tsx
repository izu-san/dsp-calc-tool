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

  // Recursive function to count total belts (memoized)
  const countTotalBelts = useCallback((node: RecipeTreeNode): number => {
    const count = (n: RecipeTreeNode): number => {
      let total = n.conveyorBelts?.total || 0;
      if (n.children) {
        for (const child of n.children) {
          total += count(child);
        }
      }
      return total;
    };
    return count(node);
  }, []);

  // Check if a scenario is already applied (current settings match scenario)
  const isScenarioAlreadyApplied = useCallback((scenario: Scenario): boolean => {
    const scenarioSettings = scenario.settings;

    // Check proliferator
    if (scenarioSettings.proliferator) {
      if (settings.proliferator.type !== scenarioSettings.proliferator.type) {
        return false;
      }
      if (
        typeof scenarioSettings.proliferator.mode !== 'undefined' &&
        settings.proliferator.mode !== scenarioSettings.proliferator.mode
      ) {
        return false;
      }
    }

    // Check conveyor belt
    if (scenarioSettings.conveyorBelt) {
      if (
        scenarioSettings.conveyorBelt.tier &&
        settings.conveyorBelt.tier !== scenarioSettings.conveyorBelt.tier
      ) {
        return false;
      }
      if (
        scenarioSettings.conveyorBelt.stackCount !== undefined &&
        settings.conveyorBelt.stackCount !== scenarioSettings.conveyorBelt.stackCount
      ) {
        return false;
      }
    }

    // Check machine ranks with rank ordering (current >= scenario requirement)
    if (scenarioSettings.machineRank) {
      const assembleOrder = ['mk1', 'mk2', 'mk3', 'recomposing'] as const;
      const smeltOrder = ['arc', 'plane', 'negentropy'] as const;
      const chemicalOrder = ['standard', 'quantum'] as const;
      const researchOrder = ['standard', 'self-evolution'] as const;

      const isAtLeast = (current: string, required: string, order: readonly string[]) => {
        const ci = order.indexOf(current);
        const ri = order.indexOf(required);
        return ci !== -1 && ri !== -1 && ci >= ri;
      };

      for (const [type, rank] of Object.entries(scenarioSettings.machineRank)) {
        const currentRank = settings.machineRank[type as keyof typeof settings.machineRank] as string;
        switch (type) {
          case 'Assemble':
            if (!isAtLeast(currentRank, rank as string, assembleOrder)) return false;
            break;
          case 'Smelt':
            if (!isAtLeast(currentRank, rank as string, smeltOrder)) return false;
            break;
          case 'Chemical':
            if (!isAtLeast(currentRank, rank as string, chemicalOrder)) return false;
            break;
          case 'Research':
            if (!isAtLeast(currentRank, rank as string, researchOrder)) return false;
            break;
          default:
            if (currentRank !== (rank as string)) return false;
        }
      }
    }

    return true;
  }, [settings]);

  // Define scenarios - memoized to prevent infinite re-renders
  const scenarios: Scenario[] = useMemo(() => [
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
  ], [
    t,
    settings.proliferator,
    settings.conveyorBelt,
    settings.machineRank,
  ]);

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
    
    // Check for overall inefficiency - only if proliferator upgrade would help
    if (settings.proliferator.type !== 'mk3') {
      suggestions.push({
        issue: t('notUsingMk3Proliferator'),
        severity: 'low',
        suggestion: t('upgradeToMk3ProliferatorSuggestion'),
        scenarioId: 'proliferator_mk3',
      });
    }
    
    return suggestions;
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
        <div className="bg-neon-green/10 backdrop-blur-sm border border-neon-green/40 rounded-lg p-3 flex items-center gap-2 shadow-[0_0_15px_rgba(0,255,136,0.2)] animate-fadeInScale">
          <span className="text-green-600 dark:text-green-400 text-xl">✓</span>
          <div className="flex-1">
            <div className="text-sm font-semibold text-neon-green">
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
        <div className="bg-neon-orange/10 backdrop-blur-sm border border-neon-orange/40 rounded-lg p-3 shadow-[0_0_15px_rgba(255,107,53,0.2)] animate-fadeInScale">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-start gap-2 flex-1">
              <span className="text-yellow-600 dark:text-yellow-400 text-xl">⚠️</span>
              <div className="flex-1">
                <div className="text-sm font-semibold text-neon-orange mb-1">
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
              className="px-3 py-1.5 bg-neon-orange/30 border-2 border-neon-orange hover:bg-neon-orange/40 text-white text-xs font-bold rounded-lg shadow-[0_0_15px_rgba(255,107,53,0.4)] hover:shadow-[0_0_20px_rgba(255,107,53,0.6)] transition-all whitespace-nowrap flex-shrink-0 ripple-effect"
              title={t('fixAllBottlenecks')}
            >
              🔧 {t('fixAll')}
            </button>
          </div>
          
          <div className="space-y-2">
            {bottleneckSuggestions.slice(0, 3).map((suggestion, idx) => (
              <div
                key={idx}
                className="bg-dark-700/50 backdrop-blur-sm rounded-lg p-2 border border-neon-orange/30 hover:border-neon-orange/50 transition-all"
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
                    className="px-2 py-1 text-xs bg-neon-blue/30 border border-neon-blue hover:bg-neon-blue/40 text-white rounded transition-all whitespace-nowrap flex-shrink-0 shadow-[0_0_10px_rgba(0,136,255,0.3)] ripple-effect"
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
                ? 'bg-neon-blue/30 text-white border-neon-blue shadow-[0_0_15px_rgba(0,136,255,0.5)] backdrop-blur-sm font-bold scale-105'
                : 'bg-dark-700/50 text-space-200 border-neon-blue/20 hover:border-neon-blue/50 hover:bg-neon-blue/10 hover:text-neon-blue'
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
                ? 'bg-neon-blue/30 text-white border-neon-blue shadow-[0_0_15px_rgba(0,136,255,0.5)] backdrop-blur-sm font-bold scale-105'
                : 'bg-dark-700/50 text-space-200 border-neon-blue/20 hover:border-neon-blue/50 hover:bg-neon-blue/10 hover:text-neon-blue'
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
                ? 'bg-neon-blue/30 text-white border-neon-blue shadow-[0_0_15px_rgba(0,136,255,0.5)] backdrop-blur-sm font-bold scale-105'
                : 'bg-dark-700/50 text-space-200 border-neon-blue/20 hover:border-neon-blue/50 hover:bg-neon-blue/10 hover:text-neon-blue'
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
                ? 'bg-neon-blue/30 text-white border-neon-blue shadow-[0_0_15px_rgba(0,136,255,0.5)] backdrop-blur-sm font-bold scale-105'
                : 'bg-dark-700/50 text-space-200 border-neon-blue/20 hover:border-neon-blue/50 hover:bg-neon-blue/10 hover:text-neon-blue'
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
                  className="px-3 py-1.5 bg-neon-green/30 border-2 border-neon-green hover:bg-neon-green/40 text-white text-xs font-bold rounded-lg shadow-[0_0_15px_rgba(0,255,136,0.4)] hover:shadow-[0_0_20px_rgba(0,255,136,0.6)] transition-all flex items-center gap-1.5 whitespace-nowrap ripple-effect"
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
        <div className="bg-neon-purple/10 backdrop-blur-sm border border-neon-purple/40 rounded-lg p-3 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-indigo-600 dark:text-indigo-400 text-lg">⚡</span>
              <div>
                <div className="text-sm font-semibold text-neon-purple">
                  {t('quickActions')}
                </div>
                <div className="text-xs text-space-200">
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
                className="px-3 py-2 bg-neon-magenta/30 border-2 border-neon-magenta hover:bg-neon-magenta/40 disabled:bg-dark-800/50 disabled:border-dark-600 disabled:cursor-not-allowed disabled:opacity-40 text-white text-xs font-medium rounded transition-all flex flex-col items-center justify-center gap-1 min-h-[60px] shadow-[0_0_10px_rgba(233,53,255,0.3)] ripple-effect"
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
                className="px-3 py-2 bg-neon-cyan/30 border-2 border-neon-cyan hover:bg-neon-cyan/40 disabled:bg-dark-800/50 disabled:border-dark-600 disabled:cursor-not-allowed disabled:opacity-40 text-white text-xs font-medium rounded transition-all flex flex-col items-center justify-center gap-1 min-h-[60px] shadow-[0_0_10px_rgba(0,217,255,0.3)] ripple-effect"
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
                className="px-3 py-2 bg-neon-green/30 border-2 border-neon-green hover:bg-neon-green/40 disabled:bg-dark-800/50 disabled:border-dark-600 disabled:cursor-not-allowed disabled:opacity-40 text-white text-xs font-medium rounded transition-all flex flex-col items-center justify-center gap-1 min-h-[60px] shadow-[0_0_10px_rgba(0,255,136,0.3)] ripple-effect"
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
                p-3 rounded-lg border-2 transition-all backdrop-blur-sm
                ${isApplied
                  ? 'bg-neon-green/20 border-neon-green shadow-[0_0_20px_rgba(0,255,136,0.4)]'
                  : isAlreadyApplied
                  ? 'bg-dark-700/30 border-dark-600 opacity-60'
                  : isRecommended
                  ? 'bg-neon-blue/20 border-neon-blue shadow-[0_0_20px_rgba(0,136,255,0.5)]'
                  : bottlenecksFixes > 0
                  ? 'bg-neon-orange/20 border-neon-orange shadow-[0_0_20px_rgba(255,107,53,0.4)]'
                  : isActive
                  ? 'bg-neon-cyan/20 border-neon-cyan shadow-[0_0_15px_rgba(0,217,255,0.4)]'
                  : 'bg-dark-700/50 border-neon-blue/30 hover:border-neon-blue/50'
                }
              `}
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                <button
                  onClick={() => toggleScenario(scenario.id)}
                  className="flex-1 text-left min-w-0"
                >
                  <h4 className="font-semibold text-white mb-1 flex flex-wrap items-center gap-2">
                    {isRecommended && !isAlreadyApplied && (
                      <span className="text-neon-blue font-bold text-sm">
                        #{index + 1}
                      </span>
                    )}
                    <span className="truncate">{scenario.name}</span>
                    {isAlreadyApplied && (
                      <span className="text-space-300 text-xs font-bold whitespace-nowrap">✓ {t('current')}</span>
                    )}
                    {!isAlreadyApplied && isImprovement && (
                      <span className="text-neon-green text-xs whitespace-nowrap">✓ {t('improvement')}</span>
                    )}
                    {isApplied && (
                      <span className="text-neon-green text-xs font-bold whitespace-nowrap">✓ {t('applied')}!</span>
                    )}
                    {isRecommended && !isApplied && !isAlreadyApplied && (
                      <span className="bg-neon-blue/30 border border-neon-blue text-white text-xs font-bold px-2 py-0.5 rounded whitespace-nowrap shadow-[0_0_10px_rgba(0,136,255,0.4)]">
                        ⭐ {t('topN')} {index + 1}
                      </span>
                    )}
                    {bottlenecksFixes > 0 && !isApplied && !isRecommended && !isAlreadyApplied && (
                      <span className="text-neon-orange text-xs font-bold whitespace-nowrap">🔧 {t('fixes')} {bottlenecksFixes}</span>
                    )}
                  </h4>
                  <p className="text-xs text-space-200">
                    {scenario.description}
                  </p>
                </button>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {isActive && !isApplied && !isAlreadyApplied && (
                    <span className="text-neon-cyan">📊</span>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      applyScenario(scenario);
                    }}
                    disabled={isApplied || isAlreadyApplied}
                    className={`
                      px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap border-2 ripple-effect
                      ${isApplied || isAlreadyApplied
                        ? 'bg-dark-800/50 border-dark-600 text-space-400 cursor-not-allowed opacity-50'
                        : 'bg-neon-green/30 border-neon-green hover:bg-neon-green/40 text-white shadow-[0_0_15px_rgba(0,255,136,0.4)] hover:shadow-[0_0_20px_rgba(0,255,136,0.6)]'
                      }
                    `}
                    title={isApplied ? t('applied') : isAlreadyApplied ? t('current') : t('applyScenarioToSettings')}
                  >
                    {isApplied ? `✓ ${t('applied')}` : isAlreadyApplied ? t('current') : t('apply')}
                  </button>
                </div>
              </div>

              {/* Impact Summary */}
              <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-neon-blue/30">
                {/* Power Change */}
                <div className="text-center">
                  <div className="text-xs text-space-300 mb-1">{t('power')}</div>
                  <div 
                    className="text-sm font-bold"
                    style={{
                      color: Math.abs(diff.powerPercent) < 0.1 ? '#ffffff' : (diff.power < 0 ? '#00FF88' : '#FF6B35')
                    }}
                  >
                    {diff.power > 0 ? '+' : ''}{diff.powerPercent.toFixed(1)}%
                  </div>
                </div>

                {/* Machines Change */}
                <div className="text-center">
                  <div className="text-xs text-space-300 mb-1">{t('machines')}</div>
                  <div 
                    className="text-sm font-bold"
                    style={{
                      color: Math.abs(diff.machinePercent) < 0.1 ? '#ffffff' : (diff.machines < 0 ? '#00FF88' : '#FF6B35')
                    }}
                  >
                    {diff.machines > 0 ? '+' : ''}{diff.machinePercent.toFixed(1)}%
                  </div>
                </div>

                {/* Belts Change */}
                <div className="text-center">
                  <div className="text-xs text-space-300 mb-1">{t('belts')}</div>
                  <div 
                    className="text-sm font-bold"
                    style={{
                      color: Math.abs(diff.beltPercent) < 0.1 ? '#ffffff' : (diff.belts < 0 ? '#00FF88' : '#FF6B35')
                    }}
                  >
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
        <div className="bg-dark-700/50 backdrop-blur-sm rounded-lg p-4 border border-neon-blue/30 shadow-[0_0_15px_rgba(0,136,255,0.2)]">
          <h4 className="font-semibold text-white mb-3">
            {t('detailedComparison')}
          </h4>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neon-blue/40">
                  <th className="text-left py-2 px-3 text-space-200">{t('metric')}</th>
                  <th className="text-right py-2 px-3 text-space-200">{t('current')}</th>
                  {activeScenarios.map(scenarioId => {
                    const scenario = scenarios.find(s => s.id === scenarioId);
                    return (
                      <th key={scenarioId} className="text-right py-2 px-3 text-neon-cyan">
                        {scenario?.name.split(' ').slice(0, 2).join(' ')}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-neon-blue/20">
                  <td className="py-2 px-3 text-white">{t('totalPower')}</td>
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
                            color: hasChange ? (powerDiff < 0 ? '#00FF88' : '#FF6B35') : '#ffffff'
                          }}
                        >
                          {formatPower(result?.result.totalPower.total || 0)}
                        </span>
                        {hasChange && (
                          <span 
                            className="ml-2 text-xs"
                            style={{
                              color: powerDiff < 0 ? '#00FF88' : '#FF6B35'
                            }}
                          >
                            ({powerDiff > 0 ? '+' : ''}{powerDiff.toFixed(1)} kW)
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>

                <tr className="border-b border-neon-blue/20">
                  <td className="py-2 px-3 text-white">{t('totalMachines')}</td>
                  <td className="text-right py-2 px-3 text-white">
                    {formatNumber(results.baseResult?.totalMachines || 0)}
                  </td>
                  {activeScenarios.map(scenarioId => {
                    const result = results.scenarioResults.find(r => r.scenario.id === scenarioId);
                    const machinesDiff = result?.diff.machines || 0;
                    const hasChange = Math.abs(machinesDiff) > 0.01;
                    return (
                      <td key={scenarioId} className="text-right py-2 px-3">
                        <span 
                          style={{
                            color: hasChange ? (machinesDiff < 0 ? '#00FF88' : '#FF6B35') : '#ffffff'
                          }}
                        >
                          {formatNumber(result?.result.totalMachines || 0)}
                        </span>
                        {hasChange && (
                          <span 
                            className="ml-2 text-xs"
                            style={{
                              color: machinesDiff < 0 ? '#00FF88' : '#FF6B35'
                            }}
                          >
                            ({machinesDiff > 0 ? '+' : ''}{formatNumber(machinesDiff)})
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>

                <tr>
                  <td className="py-2 px-3 text-white">{t('totalBelts')}</td>
                  <td className="text-right py-2 px-3 text-white">
                    {formatNumber(results.baseResult?.rootNode ? countTotalBelts(results.baseResult.rootNode) : 0)}
                  </td>
                  {activeScenarios.map(scenarioId => {
                    const result = results.scenarioResults.find(r => r.scenario.id === scenarioId);
                    const beltsDiff = result?.diff.belts || 0;
                    const hasChange = Math.abs(beltsDiff) > 0.01;
                    return (
                      <td key={scenarioId} className="text-right py-2 px-3">
                        <span 
                          style={{
                            color: hasChange ? (beltsDiff < 0 ? '#00FF88' : '#FF6B35') : '#ffffff'
                          }}
                        >
                          {formatNumber(result?.result.rootNode ? countTotalBelts(result.result.rootNode) : 0)}
                        </span>
                        {hasChange && (
                          <span 
                            className="ml-2 text-xs"
                            style={{
                              color: beltsDiff < 0 ? '#00FF88' : '#FF6B35'
                            }}
                          >
                            ({beltsDiff > 0 ? '+' : ''}{formatNumber(beltsDiff)})
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
                  onClick={() => applyScenario(scenario)}
                  className="px-4 py-2 bg-neon-green/30 border-2 border-neon-green hover:bg-neon-green/40 text-white text-sm font-medium rounded-lg transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(0,255,136,0.4)] hover:shadow-[0_0_20px_rgba(0,255,136,0.6)] ripple-effect"
                >
                  <span>✓</span>
                  {t('apply')} "{scenario.name}"
                </button>
              );
            })}
          </div>

          <div className="mt-3 text-xs text-space-200">
            💡 <span className="text-neon-green">{t('green')}</span> {t('greenIndicatesImprovement')}, 
            <span className="text-neon-orange ml-1">{t('red')}</span> {t('redIndicatesIncrease')}
          </div>
        </div>
      )}
    </div>
  );
}
