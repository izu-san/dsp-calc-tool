import { useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useGameDataStore } from '../../stores/gameDataStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { ItemIcon } from '../ItemIcon';
import { formatNumber, formatPower } from '../../utils/format';
import type { Recipe } from '../../types';
import { getMachineForRecipe } from '../../constants/machines';
import { getEffectiveBonuses } from '../../lib/proliferator';

interface RecipeComparisonModalProps {
  itemId: number;
  itemName: string;
  recipes: Recipe[];
  isOpen: boolean;
  onClose: () => void;
  onSelectRecipe: (recipeId: number) => void;
  canBeMined?: boolean;
  miningFrom?: string;
}

interface RecipeAnalysis {
  recipe: Recipe | null; // null for mining option
  isMining: boolean;
  machineCount: number;
  powerConsumption: number;
  machineType: string;
  inputsPerSecond: { itemId: number; itemName: string; rate: number }[];
  outputsPerSecond: { itemId: number; itemName: string; rate: number }[];
  efficiency: number; // Score based on power, machine count, etc.
}

const BASELINE_PRODUCTION_RATE = 1; // items/s for comparison

export function RecipeComparisonModal({
  itemId,
  itemName,
  recipes,
  isOpen,
  onClose,
  onSelectRecipe,
  canBeMined = false,
}: RecipeComparisonModalProps) {
  const { t } = useTranslation();
  const { data } = useGameDataStore();
  const { settings } = useSettingsStore();

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const analyses = useMemo(() => {
    if (!data) return [];

    const results: RecipeAnalysis[] = [];

    // Add mining option if available
    if (canBeMined) {
      results.push({
        recipe: null,
        isMining: true,
        machineCount: 0,
        powerConsumption: 0,
        machineType: t('mining'),
        inputsPerSecond: [],
        outputsPerSecond: [{ itemId, itemName, rate: BASELINE_PRODUCTION_RATE }],
        efficiency: 100, // Mining is always efficient (no inputs)
      });
    }

    // Analyze each recipe
    for (const recipe of recipes) {
      const machine = getMachineForRecipe(recipe.Type, data.machines, settings);
      if (!machine) continue;

      const baseTime = recipe.TimeSpend / 60; // ticks to seconds
      let machineSpeedMultiplier = machine.assemblerSpeed / 10000;
      if (machineSpeedMultiplier === 0) machineSpeedMultiplier = 1;

      // Apply effective bonuses via shared util
      const { effectiveSpeedBonus, effectiveProductionBonus } = getEffectiveBonuses(settings.proliferator, settings.proliferatorMultiplier);

      const speedMultiplier = settings.proliferator.type !== 'none' && settings.proliferator.mode === 'speed'
        ? 1 + effectiveSpeedBonus
        : 1;

      const productionMultiplier = settings.proliferator.type !== 'none' && settings.proliferator.mode === 'production' && recipe.productive
        ? 1 + effectiveProductionBonus
        : 1;

      const timePerCraft = baseTime / (machineSpeedMultiplier * speedMultiplier);
      const outputPerCraft = (recipe.Results[0]?.count || 1) * productionMultiplier;
      const productionRatePerMachine = outputPerCraft / timePerCraft;

      const machineCount = BASELINE_PRODUCTION_RATE / productionRatePerMachine;
      const powerConsumption = (machine.workEnergyPerTick * 60 / 1000) * machineCount; // kW

      const inputsPerSecond = recipe.Items.map(item => ({
        itemId: item.id,
        itemName: item.name,
        rate: (item.count / timePerCraft) * machineCount,
      }));

      const outputsPerSecond = recipe.Results.map(item => ({
        itemId: item.id,
        itemName: item.name,
        rate: (item.count * productionMultiplier / timePerCraft) * machineCount,
      }));

      // Calculate efficiency score (lower is better)
      // Weighted: 40% power, 30% machine count, 30% input complexity
      const powerScore = powerConsumption / 10; // Normalize
      const machineScore = machineCount;
      const inputScore = inputsPerSecond.length;
      const efficiency = 100 - (powerScore * 0.4 + machineScore * 0.3 + inputScore * 0.3);

      results.push({
        recipe,
        isMining: false,
        machineCount,
        powerConsumption,
        machineType: machine.name,
        inputsPerSecond,
        outputsPerSecond,
        efficiency: Math.max(0, efficiency),
      });
    }

    // Sort by efficiency (higher is better)
    return results.sort((a, b) => b.efficiency - a.efficiency);
  }, [data, recipes, settings, itemId, itemName, canBeMined]);

  // Local helper removed; using centralized getMachineForRecipe

  if (!isOpen) return null;

  const selectedRecipeId = settings.alternativeRecipes.get(itemId) ?? (canBeMined ? -1 : recipes[0]?.SID);

  const modalContent = (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
      style={{ zIndex: 99999 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col relative"
        style={{ zIndex: 100000 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ItemIcon itemId={itemId} size={48} />
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('recipeComparison')}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('comparingProductionMethods')}: <span className="font-semibold">{itemName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            📊 {t('comparisonBasedOnProducing')}: <span className="font-semibold">{BASELINE_PRODUCTION_RATE} {t('itemPerSecond')}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700">
                  <th className="p-3 text-left font-semibold text-gray-700 dark:text-gray-300 border dark:border-gray-600">
                    {t('method')}
                  </th>
                  <th className="p-3 text-left font-semibold text-gray-700 dark:text-gray-300 border dark:border-gray-600">
                    {t('machine')}
                  </th>
                  <th className="p-3 text-center font-semibold text-gray-700 dark:text-gray-300 border dark:border-gray-600">
                    {t('machines')}
                  </th>
                  <th className="p-3 text-center font-semibold text-gray-700 dark:text-gray-300 border dark:border-gray-600">
                    {t('power')}
                  </th>
                  <th className="p-3 text-left font-semibold text-gray-700 dark:text-gray-300 border dark:border-gray-600">
                    {t('inputs')}
                  </th>
                  <th className="p-3 text-center font-semibold text-gray-700 dark:text-gray-300 border dark:border-gray-600">
                    {t('efficiency')}
                  </th>
                  <th className="p-3 text-center font-semibold text-gray-700 dark:text-gray-300 border dark:border-gray-600">
                    {t('action')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {analyses.map((analysis, index) => {
                  const recipeId = analysis.isMining ? -1 : analysis.recipe!.SID;
                  const isSelected = selectedRecipeId === recipeId;
                  const isBest = index === 0;

                  return (
                    <tr
                      key={recipeId}
                      className={`
                        ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}
                        transition-colors
                      `}
                    >
                      {/* Method */}
                      <td className="p-3 border dark:border-gray-600">
                        <div className="flex items-center gap-2">
                          {analysis.isMining ? (
                            <>
                              <span className="text-2xl">⛏️</span>
                              <span className="font-medium text-gray-900 dark:text-white">{t('mining')}</span>
                            </>
                          ) : (
                            <>
                              <ItemIcon itemId={analysis.recipe!.Results[0]?.id} size={24} />
                              <span className="font-medium text-gray-900 dark:text-white">{analysis.recipe!.name}</span>
                            </>
                          )}
                          {isBest && (
                            <span className="text-yellow-500 dark:text-yellow-400 text-sm" title={t('mostEfficient')}>⭐</span>
                          )}
                          {isSelected && (
                            <span className="text-blue-600 dark:text-blue-400 text-sm">✓</span>
                          )}
                        </div>
                      </td>

                      {/* Machine */}
                      <td className="p-3 border dark:border-gray-600">
                        <span className="text-gray-700 dark:text-gray-300">{analysis.machineType}</span>
                      </td>

                      {/* Machine Count */}
                      <td className="p-3 text-center border dark:border-gray-600">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {analysis.isMining ? '-' : formatNumber(analysis.machineCount)}
                        </span>
                      </td>

                      {/* Power */}
                      <td className="p-3 text-center border dark:border-gray-600">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {analysis.isMining ? '-' : formatPower(analysis.powerConsumption)}
                        </span>
                      </td>

                      {/* Inputs */}
                      <td className="p-3 border dark:border-gray-600">
                        {analysis.inputsPerSecond.length === 0 ? (
                          <span className="text-gray-500 dark:text-gray-400 text-sm italic">{t('none')}</span>
                        ) : (
                          <div className="space-y-1">
                            {analysis.inputsPerSecond.map(input => (
                              <div key={input.itemId} className="flex items-center gap-1 text-xs">
                                <ItemIcon itemId={input.itemId} size={16} />
                                <span className="text-gray-700 dark:text-gray-300 truncate">
                                  {input.itemName}: {input.rate.toFixed(2)}/s
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Efficiency */}
                      <td className="p-3 text-center border dark:border-gray-600">
                        <div className="flex flex-col items-center">
                          <span className={`font-bold ${
                            analysis.efficiency > 80 ? 'text-green-600 dark:text-green-400' :
                            analysis.efficiency > 60 ? 'text-yellow-600 dark:text-yellow-400' :
                            'text-red-600 dark:text-red-400'
                          }`}>
                            {analysis.efficiency.toFixed(0)}
                          </span>
                          <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full mt-1">
                            <div
                              className={`h-full rounded-full ${
                                analysis.efficiency > 80 ? 'bg-green-500' :
                                analysis.efficiency > 60 ? 'bg-yellow-500' :
                                'bg-red-500'
                              }`}
                              style={{ width: `${analysis.efficiency}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="p-3 text-center border dark:border-gray-600">
                        <button
                          onClick={() => {
                            onSelectRecipe(recipeId);
                            onClose();
                          }}
                          className={`
                            px-4 py-2 rounded-lg font-medium transition-colors
                            ${isSelected
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                            }
                          `}
                        >
                          {isSelected ? t('selected') : t('select')}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{t('efficiencyScoreCalculation')}</h3>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• <span className="font-medium">40%</span> {t('powerConsumptionLowerIsBetter')}</li>
              <li>• <span className="font-medium">30%</span> {t('machineCountFewerIsBetter')}</li>
              <li>• <span className="font-medium">30%</span> {t('inputComplexityFewerIsBetter')}</li>
              <li className="mt-2 text-xs italic">⭐ {t('starIndicatesMostEfficient')}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
