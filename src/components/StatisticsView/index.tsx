import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { CalculationResult } from '../../types';
import { calculateItemStatistics, getRawMaterials, getIntermediateProducts, getFinalProducts } from '../../lib/statistics';
import { formatRate, formatPower } from '../../utils/format';
import { ItemIcon } from '../ItemIcon';
import { PowerGraphView } from '../PowerGraphView';
import { useGameDataStore } from '../../stores/gameDataStore';

interface StatisticsViewProps {
  calculationResult: CalculationResult | null;
}

export function StatisticsView({ calculationResult }: StatisticsViewProps) {
  const { t } = useTranslation();
  const [showPowerGraph, setShowPowerGraph] = useState(false);
  const { data } = useGameDataStore();
  
  // Helper function to get item name by ID
  const getItemName = (itemId: number): string => {
    if (!data) return `Item ${itemId}`;
    const item = data.items.get(itemId);
    return item?.name || `Item ${itemId}`;
  };

  const statistics = useMemo(() => {
    if (!calculationResult) return null;
    return calculateItemStatistics(calculationResult.rootNode);
  }, [calculationResult]);

  // Enhanced statistics with resolved item names (language-dependent)
  const enhancedStatistics = useMemo(() => {
    if (!statistics) return null;
    
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
  }, [statistics, data, t]); // Include 't' to re-calculate when language changes

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
  const finalProducts = getFinalProducts(enhancedStatistics);

  return (
    <div className="space-y-6">
      {/* Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">📊 {t('productionOverview')}</h2>
          <button
            onClick={() => setShowPowerGraph(!showPowerGraph)}
            className={`
              px-4 py-2 text-sm font-medium rounded-lg border transition-all duration-200
              ${showPowerGraph 
                ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border-purple-300 dark:border-purple-700' 
                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
              }
            `}
          >
            ⚡ {showPowerGraph ? t('hide') : t('show')} {t('powerGraph')}
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">{t('totalMachines')}</div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{enhancedStatistics.totalMachines.toFixed(1)}</div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">{t('totalPower')}</div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{formatPower(enhancedStatistics.totalPower)}</div>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">{t('rawMaterials')}</div>
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{rawMaterials.length}</div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">{t('itemsProduced')}</div>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{enhancedStatistics.items.size}</div>
          </div>
        </div>
      </div>

      {/* Power Graph - conditionally shown */}
      {showPowerGraph && calculationResult && (
        <PowerGraphView calculationResult={calculationResult} />
      )}

      {/* Raw Materials */}
      {rawMaterials.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">🔨 {t('rawMaterials')}</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">{t('item')}</th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-gray-700 dark:text-gray-300">{t('requiredRate')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {rawMaterials.map((item) => (
                  <tr key={item.itemId} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <ItemIcon itemId={item.itemId} size={24} />
                        <span className="text-sm dark:text-white">{item.itemName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-red-600 dark:text-red-400">
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
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">⚙️ {t('intermediateProducts')}</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">{t('item')}</th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-gray-700 dark:text-gray-300">{t('production')}</th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-gray-700 dark:text-gray-300">{t('consumption')}</th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-gray-700 dark:text-gray-300">{t('net')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {intermediateProducts.map((item) => (
                  <tr key={item.itemId} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <ItemIcon itemId={item.itemId} size={24} />
                        <span className="text-sm dark:text-white">{item.itemName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-green-600 dark:text-green-400">
                      {formatRate(item.totalProduction)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-red-600 dark:text-red-400">
                      {formatRate(item.totalConsumption)}
                    </td>
                    <td className={`px-4 py-3 text-right text-sm font-medium ${
                      Math.abs(item.netProduction) < 0.01 
                        ? 'text-gray-600 dark:text-gray-400' 
                        : item.netProduction > 0 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
                    }`}>
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
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">📦 {t('finalProducts')}</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">{t('item')}</th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-gray-700 dark:text-gray-300">{t('productionRate')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {finalProducts.map((item) => (
                  <tr key={item.itemId} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <ItemIcon itemId={item.itemId} size={24} />
                        <span className="text-sm dark:text-white">{item.itemName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-green-600 dark:text-green-400">
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
