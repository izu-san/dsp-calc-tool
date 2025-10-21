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
  }, [data, recipes, settings, itemId, itemName, canBeMined, t]);

  // Local helper removed; using centralized getMachineForRecipe

  if (!isOpen) return null;

  const selectedRecipeId = settings.alternativeRecipes.get(itemId) ?? (canBeMined ? -1 : recipes[0]?.SID);

  const modalContent = (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
      style={{ zIndex: 99999 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="bg-dark-700/95 backdrop-blur-md border-2 border-neon-blue/40 rounded-lg shadow-[0_0_30px_rgba(0,136,255,0.3)] max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col relative animate-fadeInScale"
        style={{ zIndex: 100000 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-neon-blue/30 flex items-center justify-between bg-dark-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-neon-blue/20 border border-neon-blue/50 rounded-lg shadow-[0_0_15px_rgba(0,136,255,0.3)]">
              <ItemIcon itemId={itemId} size={48} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white drop-shadow-[0_0_8px_rgba(0,217,255,0.6)]">
                {t('recipeComparison')}
              </h2>
              <p className="text-sm text-space-200">
                {t('comparingProductionMethods')}: <span className="font-semibold text-neon-cyan">{itemName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-space-300 hover:text-neon-cyan transition-all hover:scale-110 ripple-effect p-2 rounded-lg hover:bg-neon-cyan/10"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-dark-800/30">
          <div className="mb-4 text-sm text-space-200 bg-neon-blue/10 border border-neon-blue/40 rounded-lg p-3 backdrop-blur-sm">
            📊 {t('comparisonBasedOnProducing')}: <span className="font-semibold text-neon-cyan">{BASELINE_PRODUCTION_RATE} {t('itemPerSecond')}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-neon-blue/20 border-b-2 border-neon-blue/50">
                  <th className="p-3 text-left font-semibold text-neon-cyan border border-neon-blue/30">
                    {t('method')}
                  </th>
                  <th className="p-3 text-left font-semibold text-neon-cyan border border-neon-blue/30">
                    {t('machine')}
                  </th>
                  <th className="p-3 text-center font-semibold text-neon-cyan border border-neon-blue/30">
                    {t('machines')}
                  </th>
                  <th className="p-3 text-center font-semibold text-neon-cyan border border-neon-blue/30">
                    {t('power')}
                  </th>
                  <th className="p-3 text-left font-semibold text-neon-cyan border border-neon-blue/30">
                    {t('inputs')}
                  </th>
                  <th className="p-3 text-center font-semibold text-neon-cyan border border-neon-blue/30">
                    {t('efficiency')}
                  </th>
                  <th className="p-3 text-center font-semibold text-neon-cyan border border-neon-blue/30">
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
                        ${isSelected ? 'bg-neon-cyan/20 border-neon-cyan shadow-[0_0_15px_rgba(0,217,255,0.2)]' : 'bg-dark-700/30 hover:bg-neon-blue/10'}
                        transition-all
                      `}
                    >
                      {/* Method */}
                      <td className="p-3 border border-neon-blue/20">
                        <div className="flex items-center gap-2">
                          {analysis.isMining ? (
                            <>
                              <span className="text-2xl">⛏️</span>
                              <span className="font-medium text-white">{t('mining')}</span>
                            </>
                          ) : (
                            <>
                              <ItemIcon itemId={analysis.recipe!.Results[0]?.id} size={24} />
                              <span className="font-medium text-white">{analysis.recipe!.name}</span>
                            </>
                          )}
                          {isBest && (
                            <span className="text-neon-yellow text-sm" title={t('mostEfficient')}>⭐</span>
                          )}
                          {isSelected && (
                            <span className="text-neon-cyan text-sm font-bold">✓</span>
                          )}
                        </div>
                      </td>

                      {/* Machine */}
                      <td className="p-3 border border-neon-blue/20">
                        <span className="text-space-200">{analysis.machineType}</span>
                      </td>

                      {/* Machine Count */}
                      <td className="p-3 text-center border border-neon-blue/20">
                        <span className="font-medium text-white">
                          {analysis.isMining ? '-' : formatNumber(analysis.machineCount)}
                        </span>
                      </td>

                      {/* Power */}
                      <td className="p-3 text-center border border-neon-blue/20">
                        <span className="font-medium text-white">
                          {analysis.isMining ? '-' : formatPower(analysis.powerConsumption)}
                        </span>
                      </td>

                      {/* Inputs */}
                      <td className="p-3 border border-neon-blue/20">
                        {analysis.inputsPerSecond.length === 0 ? (
                          <span className="text-space-300 text-sm italic">{t('none')}</span>
                        ) : (
                          <div className="space-y-1">
                            {analysis.inputsPerSecond.map(input => (
                              <div key={input.itemId} className="flex items-center gap-1 text-xs">
                                <ItemIcon itemId={input.itemId} size={16} />
                                <span className="text-space-200 truncate">
                                  {input.itemName}: {input.rate.toFixed(2)}/s
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Efficiency */}
                      <td className="p-3 text-center border border-neon-blue/20">
                        <div className="flex flex-col items-center">
                          <span 
                            className="font-bold text-lg"
                            style={{
                              color: analysis.efficiency > 80 ? '#00FF88' :
                                     analysis.efficiency > 60 ? '#FFD700' :
                                     '#FF6B35'
                            }}
                          >
                            {analysis.efficiency.toFixed(0)}
                          </span>
                          <div className="w-20 h-3 bg-space-800 border-2 border-neon-blue/50 rounded-full mt-1 relative overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all absolute top-0 left-0"
                              style={{
                                width: `${analysis.efficiency}%`,
                                backgroundColor: analysis.efficiency > 80 ? '#00FF88' :
                                                analysis.efficiency > 60 ? '#FFD700' :
                                                '#FF6B35',
                                boxShadow: analysis.efficiency > 80 ? '0 0 10px rgba(0,255,136,0.8), inset 0 0 5px rgba(255,255,255,0.3)' :
                                          analysis.efficiency > 60 ? '0 0 10px rgba(255,215,0,0.8), inset 0 0 5px rgba(255,255,255,0.3)' :
                                          '0 0 10px rgba(255,107,53,0.8), inset 0 0 5px rgba(255,255,255,0.3)'
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="p-3 text-center border border-neon-blue/20">
                        <button
                          onClick={() => {
                            onSelectRecipe(recipeId);
                            onClose();
                          }}
                          className={`
                            px-4 py-2 rounded-lg font-medium transition-all border-2 ripple-effect
                            ${isSelected
                              ? 'bg-neon-cyan/30 border-neon-cyan text-white shadow-[0_0_15px_rgba(0,217,255,0.5)] scale-105'
                              : 'bg-dark-700/50 border-neon-blue/30 text-space-200 hover:border-neon-blue hover:bg-neon-blue/20 hover:text-neon-cyan'
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
          <div className="mt-6 p-4 bg-neon-purple/10 border border-neon-purple/40 rounded-lg backdrop-blur-sm shadow-[0_0_15px_rgba(168,85,247,0.2)]">
            <h3 className="font-semibold text-neon-purple mb-2 flex items-center gap-2">
              <span>📊</span>
              {t('efficiencyScoreCalculation')}
            </h3>
            <ul className="text-sm text-space-200 space-y-1">
              <li>• <span className="font-medium text-neon-cyan">40%</span> {t('powerConsumptionLowerIsBetter')}</li>
              <li>• <span className="font-medium text-neon-cyan">30%</span> {t('machineCountFewerIsBetter')}</li>
              <li>• <span className="font-medium text-neon-cyan">30%</span> {t('inputComplexityFewerIsBetter')}</li>
              <li className="mt-2 text-xs italic text-neon-yellow">⭐ {t('starIndicatesMostEfficient')}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
