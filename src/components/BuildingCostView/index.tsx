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

  const buildingCost = useMemo(() => {
    if (!calculationResult) return null;
    return calculateBuildingCost(calculationResult.rootNode);
  }, [calculationResult]);

  // Enhanced building cost with resolved machine names (language-dependent)
  const enhancedBuildingCost = useMemo(() => {
    if (!buildingCost) return null;
    
    // Helper function to get machine name by ID
    const getMachineName = (machineId: number): string => {
      if (!data) return `Machine ${machineId}`;
      const machine = data.machines.get(machineId);
      return machine?.name || `Machine ${machineId}`;
    };
    
    const enhancedMachines = buildingCost.machines.map(machine => ({
      ...machine,
      machineName: getMachineName(machine.machineId)
    }));
    
    return {
      ...buildingCost,
      machines: enhancedMachines
    };
  }, [buildingCost, data]);

  if (!enhancedBuildingCost) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">🏗️ {t('buildingCost')}</h2>
        <p className="text-gray-500 dark:text-gray-400">{t('selectRecipeForBuildingReqs')}</p>
      </div>
    );
  }

  return (
    <div className="bg-dark-700/50 backdrop-blur-sm border border-neon-orange/30 rounded-lg shadow-panel p-6">
      <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <span>🏗️</span>
        {t('buildingCost')}
      </h2>
      
      <div className="space-y-6">
        {/* Machines */}
        {enhancedBuildingCost.machines.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-neon-cyan mb-3">{t('productionMachines')}</h3>
            <div className="space-y-2">
              {enhancedBuildingCost.machines.map((machine, index) => (
                <div
                  key={`${machine.machineId}-${index}`}
                  className="flex items-center justify-between p-3 bg-dark-800/50 border border-neon-blue/20 rounded-lg hover:bg-neon-blue/10 hover:border-neon-blue/40 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <ItemIcon itemId={machine.machineId} size={32} />
                    <span className="text-sm font-medium text-white">
                      {machine.machineName}
                    </span>
                  </div>
                  <span className="text-lg font-bold text-neon-cyan">
                    ×{formatNumber(machine.count)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Logistics */}
        <div>
          <h3 className="text-sm font-semibold text-neon-cyan mb-3">{t('logistics')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 bg-neon-magenta/20 backdrop-blur-sm rounded-lg border border-neon-magenta/40 shadow-[0_0_15px_rgba(233,53,255,0.2)]">
              <div className="flex items-center gap-2 mb-2">
                <ItemIcon itemId={2011} size={24} />
                <span className="text-xs font-medium text-neon-magenta">{t('sorters')}</span>
              </div>
              <div className="text-2xl font-bold text-white">
                ×{formatNumber(enhancedBuildingCost.sorters)}
              </div>
              <div className="text-xs text-space-200 mt-1">
                ({t('mkIOrHigher')})
              </div>
            </div>

            <div className="p-4 bg-neon-cyan/20 backdrop-blur-sm rounded-lg border border-neon-cyan/40 shadow-[0_0_15px_rgba(0,217,255,0.2)]">
              <div className="flex items-center gap-2 mb-2">
                <ItemIcon itemId={2001} size={24} />
                <span className="text-xs font-medium text-neon-cyan">{t('conveyorBelts')}</span>
              </div>
              <div className="text-2xl font-bold text-white">
                ×{formatNumber(enhancedBuildingCost.belts)}
              </div>
              <div className="text-xs text-space-200 mt-1">
                ({t('currentTierSetting')})
              </div>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="pt-4 border-t border-neon-green/30">
          <div className="bg-neon-green/20 backdrop-blur-sm border border-neon-green/40 rounded-lg p-4 shadow-[0_0_15px_rgba(0,255,136,0.2)]">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-neon-green text-lg">✓</span>
              <span className="text-sm font-semibold text-white">
                {t('totalBuildingRequirements')}
              </span>
            </div>
            <div className="text-xs text-space-200 space-y-1">
              <div className="flex justify-between">
                <span>{t('productionMachines')}:</span>
                <span className="font-semibold text-neon-green">
                  {enhancedBuildingCost.machines.reduce((sum, m) => sum + m.count, 0)} {t('units')}
                </span>
              </div>
              <div className="flex justify-between">
                <span>{t('sorters')}:</span>
                <span className="font-semibold text-neon-green">{formatNumber(enhancedBuildingCost.sorters)} {t('units')}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('conveyorBelts')}:</span>
                <span className="font-semibold text-neon-green">{formatNumber(enhancedBuildingCost.belts)} {t('units')}</span>
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
