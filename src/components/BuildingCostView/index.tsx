import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { CalculationResult } from '../../types/calculation';
import { calculateBuildingCost } from '../../lib/buildingCost';
import { formatNumber } from '../../utils/format';
import { ItemIcon } from '../ItemIcon';
import { MiningCalculator } from '../MiningCalculator';
import { useGameDataStore } from '../../stores/gameDataStore';

interface BuildingCostViewProps {
  calculationResult: CalculationResult;
}

export function BuildingCostView({ calculationResult }: BuildingCostViewProps) {
  const { t } = useTranslation();
  const { data } = useGameDataStore();
  
  // Helper function to get machine name by ID
  const getMachineName = (machineId: number): string => {
    if (!data) return `Machine ${machineId}`;
    const machine = data.machines.get(machineId);
    return machine?.name || `Machine ${machineId}`;
  };

  const buildingCost = useMemo(() => {
    if (!calculationResult) return null;
    return calculateBuildingCost(calculationResult.rootNode);
  }, [calculationResult]);

  // Enhanced building cost with resolved machine names (language-dependent)
  const enhancedBuildingCost = useMemo(() => {
    if (!buildingCost) return null;
    
    const enhancedMachines = buildingCost.machines.map(machine => ({
      ...machine,
      machineName: getMachineName(machine.machineId)
    }));
    
    return {
      ...buildingCost,
      machines: enhancedMachines
    };
  }, [buildingCost, data, t]); // Include 't' to re-calculate when language changes

  if (!enhancedBuildingCost) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">🏗️ {t('buildingCost')}</h2>
        <p className="text-gray-500 dark:text-gray-400">{t('selectRecipeForBuildingReqs')}</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">🏗️ {t('buildingCost')}</h2>
      
      <div className="space-y-6">
        {/* Machines */}
        {enhancedBuildingCost.machines.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">{t('productionMachines')}</h3>
            <div className="space-y-2">
              {enhancedBuildingCost.machines.map((machine, index) => (
                <div
                  key={`${machine.machineId}-${index}`}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <ItemIcon itemId={machine.machineId} size={32} />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {machine.machineName}
                    </span>
                  </div>
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    ×{formatNumber(machine.count)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Logistics */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">{t('logistics')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-2 mb-2">
                <ItemIcon itemId={2011} size={24} />
                <span className="text-xs font-medium text-purple-700 dark:text-purple-300">{t('sorters')}</span>
              </div>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                ×{formatNumber(enhancedBuildingCost.sorters)}
              </div>
              <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                ({t('mkIOrHigher')})
              </div>
            </div>

            <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-2">
                <ItemIcon itemId={2001} size={24} />
                <span className="text-xs font-medium text-blue-700 dark:text-blue-300">{t('conveyorBelts')}</span>
              </div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                ×{formatNumber(enhancedBuildingCost.belts)}
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                ({t('currentTierSetting')})
              </div>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-green-600 dark:text-green-400 text-lg">✓</span>
              <span className="text-sm font-semibold text-green-900 dark:text-green-300">
                {t('totalBuildingRequirements')}
              </span>
            </div>
            <div className="text-xs text-green-700 dark:text-green-400 space-y-1">
              <div className="flex justify-between">
                <span>{t('productionMachines')}:</span>
                <span className="font-semibold">
                  {enhancedBuildingCost.machines.reduce((sum, m) => sum + m.count, 0)} {t('units')}
                </span>
              </div>
              <div className="flex justify-between">
                <span>{t('sorters')}:</span>
                <span className="font-semibold">{formatNumber(enhancedBuildingCost.sorters)} {t('units')}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('conveyorBelts')}:</span>
                <span className="font-semibold">{formatNumber(enhancedBuildingCost.belts)} {t('units')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mining Calculator */}
      <MiningCalculator calculationResult={calculationResult} />
    </div>
  );
}
