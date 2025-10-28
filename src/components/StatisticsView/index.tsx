import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { CalculationResult } from '../../types';
import type { MiningCalculation } from '../../lib/miningCalculation';
import { calculateItemStatistics, getRawMaterials, getIntermediateProducts, getFinalProducts } from '../../lib/statistics';
import { formatRate, formatPower, formatBuildingCount } from '../../utils/format';
import { ItemIcon } from '../ItemIcon';
import { PowerGraphView } from '../PowerGraphView';
import { useGameDataStore } from '../../stores/gameDataStore';

interface StatisticsViewProps {
  calculationResult: CalculationResult | null;
  miningCalculation?: MiningCalculation | null;
}

export function StatisticsView({ calculationResult, miningCalculation }: StatisticsViewProps) {
  const { t } = useTranslation();
  const [showPowerGraph, setShowPowerGraph] = useState(false);
  const { data } = useGameDataStore();

  const statistics = useMemo(() => {
    if (!calculationResult) return null;
    return calculateItemStatistics(calculationResult.rootNode, miningCalculation || undefined);
  }, [calculationResult, miningCalculation]);

  // Enhanced statistics with resolved item names (language-dependent)
  const enhancedStatistics = useMemo(() => {
    if (!statistics) return null;
    
    // Helper function to get item name by ID
    const getItemName = (itemId: number): string => {
      if (!data) return `Item ${itemId}`;
      const item = data.items.get(itemId);
      return item?.name || `Item ${itemId}`;
    };
    
    const enhancedItems = new Map();
    statistics.items.forEach((item, key) => {
      enhancedItems.set(key, {
        ...item,
        itemName: getItemName(item.itemId)
      });
    });
    
    return {
      ...statistics,
      items: enhancedItems
    };
  }, [statistics, data]);

  if (!enhancedStatistics) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">📊 {t('productionStatistics')}</h2>
        <p className="text-gray-500 dark:text-gray-400">{t('selectRecipeToSeeStats')}</p>
      </div>
    );
  }

  const rawMaterials = getRawMaterials(enhancedStatistics);
  const intermediateProducts = getIntermediateProducts(enhancedStatistics);
  
  // Final products should be the outputs of the selected recipe
  // Use multiOutputResults if available, otherwise use getFinalProducts
  const finalProducts = calculationResult?.multiOutputResults && calculationResult.multiOutputResults.length > 0
    ? calculationResult.multiOutputResults.map(result => ({
        itemId: result.itemId,
        itemName: result.itemName,
        totalProduction: result.productionRate,
        totalConsumption: 0,
        netProduction: result.productionRate,
        isRawMaterial: false,
      }))
    : getFinalProducts(enhancedStatistics);

  return (
    <div className="space-y-6">
      {/* Overview */}
      <div className="bg-dark-700/50 backdrop-blur-sm border border-neon-blue/30 rounded-lg shadow-panel p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <span>📊</span>
            {t('productionOverview')}
          </h2>
          <button
            data-testid="statistics-show-power-graph-button"
            onClick={() => setShowPowerGraph(!showPowerGraph)}
            className={`
              px-4 py-2 text-sm font-medium rounded-lg border-2 transition-all ripple-effect
              ${showPowerGraph 
                ? 'bg-neon-purple/30 border-neon-purple text-white shadow-[0_0_15px_rgba(168,85,247,0.5)]' 
                : 'bg-dark-700/50 border-neon-purple/30 text-space-200 hover:border-neon-purple hover:bg-neon-purple/10 hover:text-neon-purple'
              }
            `}
          >
            ⚡ {showPowerGraph ? t('hide') : t('show')} {t('powerGraph')}
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-neon-blue/20 backdrop-blur-sm border border-neon-blue/40 rounded-lg p-4 shadow-[0_0_15px_rgba(0,136,255,0.2)]">
            <div className="text-sm text-space-300">{t('totalMachines')}</div>
            <div className="text-2xl font-bold text-neon-blue">{formatBuildingCount(enhancedStatistics.totalMachines)}</div>
            {enhancedStatistics.totalMiningMachines > 0 && (
              <div className="text-xs text-neon-blue mt-1">
                ⛏️ {t('miningMachines')}: {formatBuildingCount(enhancedStatistics.totalMiningMachines)}
              </div>
            )}
          </div>
          <div className="bg-neon-green/20 backdrop-blur-sm border border-neon-green/40 rounded-lg p-4 shadow-[0_0_15px_rgba(0,255,136,0.2)]">
            <div className="text-sm text-space-300">{t('totalPower')}</div>
            <div className="text-2xl font-bold text-neon-green">{formatPower(enhancedStatistics.totalPower + enhancedStatistics.totalMiningPower)}</div>
            {enhancedStatistics.totalMiningPower > 0 && (
              <div className="text-xs text-neon-green mt-1">
                ⛏️ {t('miningPower')}: {formatPower(enhancedStatistics.totalMiningPower)}
              </div>
            )}
            {calculationResult && calculationResult.totalPower.dysonSphere > 0 && (
              <div className="text-xs text-yellow-400 mt-1">
                ⚡ {t('dysonSpherePower')}: {formatPower(calculationResult.totalPower.dysonSphere)}
              </div>
            )}
          </div>
          <div className="bg-neon-yellow/20 backdrop-blur-sm border border-neon-yellow/40 rounded-lg p-4 shadow-[0_0_15px_rgba(255,215,0,0.2)]">
            <div className="text-sm text-space-300">{t('rawMaterials')}</div>
            <div className="text-2xl font-bold text-neon-yellow">{rawMaterials.length}</div>
            {enhancedStatistics.totalOrbitalCollectors > 0 && (
              <div className="text-xs text-neon-yellow mt-1">
                🚀 {t('orbitalCollectors')}: {formatBuildingCount(enhancedStatistics.totalOrbitalCollectors)}
              </div>
            )}
          </div>
          <div className="bg-neon-purple/20 backdrop-blur-sm border border-neon-purple/40 rounded-lg p-4 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
            <div className="text-sm text-space-300">{t('itemsProduced')}</div>
            <div className="text-2xl font-bold text-neon-purple">{enhancedStatistics.items.size}</div>
          </div>
        </div>
      </div>

      {/* Power Graph - conditionally shown */}
      {showPowerGraph && calculationResult && (
        <PowerGraphView calculationResult={calculationResult} miningCalculation={miningCalculation} />
      )}

      {/* Raw Materials */}
      {rawMaterials.length > 0 && (
        <div className="bg-dark-700/50 backdrop-blur-sm border border-neon-green/30 rounded-lg shadow-panel p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span>🔨</span>
            {t('rawMaterials')}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neon-green/20 border-b-2 border-neon-green/50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-neon-green">{t('item')}</th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-neon-green">{t('requiredRate')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neon-green/20">
                {rawMaterials.map((item) => (
                  <tr key={item.itemId} className="hover:bg-neon-green/10 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <ItemIcon itemId={item.itemId} size={24} />
                        <span className="text-sm text-white">{item.itemName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-neon-orange">
                      {formatRate(item.totalConsumption)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Intermediate Products */}
      {intermediateProducts.length > 0 && (
        <div className="bg-dark-700/50 backdrop-blur-sm border border-neon-cyan/30 rounded-lg shadow-panel p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span>⚙️</span>
            {t('intermediateProducts')}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neon-cyan/20 border-b-2 border-neon-cyan/50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-neon-cyan">{t('item')}</th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-neon-cyan">{t('production')}</th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-neon-cyan">{t('consumption')}</th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-neon-cyan">{t('net')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neon-cyan/20">
                {intermediateProducts.map((item) => (
                  <tr key={item.itemId} className="hover:bg-neon-cyan/10 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <ItemIcon itemId={item.itemId} size={24} />
                        <span className="text-sm text-white">{item.itemName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-neon-green">
                      {formatRate(item.totalProduction)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-neon-orange">
                      {formatRate(item.totalConsumption)}
                    </td>
                    <td className={`px-4 py-3 text-right text-sm font-medium`}
                        style={{
                          color: Math.abs(item.netProduction) < 0.01 
                            ? '#B4C5E4' 
                            : item.netProduction > 0 
                              ? '#00FF88' 
                              : '#FF6B35'
                        }}>
                      {formatRate(item.netProduction)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Final Products */}
      {finalProducts.length > 0 && (
        <div className="bg-dark-700/50 backdrop-blur-sm border border-neon-purple/30 rounded-lg shadow-panel p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span>📦</span>
            {t('finalProducts')}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neon-purple/20 border-b-2 border-neon-purple/50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-neon-purple">{t('item')}</th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-neon-purple">{t('productionRate')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neon-purple/20">
                {finalProducts.map((item) => (
                  <tr key={item.itemId} className="hover:bg-neon-purple/10 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <ItemIcon itemId={item.itemId} size={24} />
                        <span className="text-sm text-white">{item.itemName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-neon-green">
                      {formatRate(item.totalProduction)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
