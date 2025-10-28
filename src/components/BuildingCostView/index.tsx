import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { CalculationResult } from '../../types/calculation';
import { calculateBuildingCost } from '../../lib/buildingCost';
import { formatBuildingCount } from '../../utils/format';
import { ItemIcon } from '../ItemIcon';
import { MiningCalculator } from '../MiningCalculator';
import { useGameDataStore } from '../../stores/gameDataStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { ICONS } from '../../constants/icons';

interface BuildingCostViewProps {
  calculationResult: CalculationResult;
}

export function BuildingCostView({ calculationResult }: BuildingCostViewProps) {
  const { t } = useTranslation();
  const { data } = useGameDataStore();
  const { settings } = useSettingsStore();

  const buildingCost = useMemo(() => {
    if (!calculationResult) return null;
    return calculateBuildingCost(calculationResult.rootNode);
  }, [calculationResult]);

  // Get sorter icon based on settings
  const getSorterIcon = () => {
    return ICONS.sorter[settings.sorter.tier];
  };

  // Enhanced building cost with resolved machine names (language-dependent)
  const enhancedBuildingCost = useMemo(() => {
    if (!buildingCost) return null;
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
                    ×{formatBuildingCount(machine.count)}
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
                <ItemIcon itemId={getSorterIcon()} size={24} />
                <span className="text-xs font-medium text-neon-magenta">{t('sorters')}</span>
              </div>
              <div className="text-2xl font-bold text-white">
                ×{formatBuildingCount(enhancedBuildingCost.sorters)}
              </div>
            </div>

            <div className="p-4 bg-neon-cyan/20 backdrop-blur-sm rounded-lg border border-neon-cyan/40 shadow-[0_0_15px_rgba(0,217,255,0.2)]">
              <div className="flex items-center gap-2 mb-2">
                <ItemIcon itemId={2001} size={24} />
                <span className="text-xs font-medium text-neon-cyan">{t('conveyorBelts')}</span>
              </div>
              <div className="text-2xl font-bold text-white">
                ×{formatBuildingCount(enhancedBuildingCost.belts)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mining Calculator */}
      <div className="pt-6">
        <MiningCalculator calculationResult={calculationResult} />
      </div>
    </div>
  );
}
