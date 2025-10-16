import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { CalculationResult } from '../../types/calculation';
import { calculateMiningRequirements } from '../../lib/miningCalculation';
import { formatNumber } from '../../utils/format';
import { ItemIcon } from '../ItemIcon';
import { useSettingsStore } from '../../stores/settingsStore';

interface MiningCalculatorProps {
  calculationResult: CalculationResult;
}

export function MiningCalculator({ calculationResult }: MiningCalculatorProps) {
  const { t } = useTranslation();
  const { settings, setMiningSpeedResearch } = useSettingsStore();
  const [miningSpeedBonus, setMiningSpeedBonus] = useState(settings.miningSpeedResearch);
  const [machineType, setMachineType] = useState<'Mining Machine' | 'Advanced Mining Machine'>('Advanced Mining Machine');
  const [workSpeedMultiplier, setWorkSpeedMultiplier] = useState(100);

  // Sync with settings store on mount
  useEffect(() => {
    setMiningSpeedBonus(settings.miningSpeedResearch);
  }, [settings.miningSpeedResearch]);

  // Save to settings store when changed
  useEffect(() => {
    setMiningSpeedResearch(miningSpeedBonus);
  }, [miningSpeedBonus, setMiningSpeedResearch]);

  const miningCalc = useMemo(() => {
    return calculateMiningRequirements(
      calculationResult,
      miningSpeedBonus / 100, // Convert percentage to multiplier
      machineType,
      workSpeedMultiplier
    );
  }, [calculationResult, miningSpeedBonus, machineType, workSpeedMultiplier]);

  if (miningCalc.rawMaterials.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          ⛏️ {t('miningCalculator')}
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          {t('noRawMaterialsRequired')}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          ⛏️ {t('miningCalculator')}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t('calculateMiningMachinesNeeded')}
        </p>
      </div>

      {/* Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Mining Speed Bonus (Research) - Numeric Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('miningSpeedResearch')} (%)
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setMiningSpeedBonus(Math.max(100, miningSpeedBonus - 10))}
              className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-bold"
            >
              −
            </button>
            <input
              type="number"
              value={miningSpeedBonus}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 100;
                setMiningSpeedBonus(Math.max(100, Math.min(100000, value)));
              }}
              min="100"
              max="100000"
              step="10"
              className="flex-1 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 text-center focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            />
            <button
              onClick={() => setMiningSpeedBonus(Math.min(100000, miningSpeedBonus + 10))}
              className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-bold"
            >
              +
            </button>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {t('miningResearchHint')}
          </div>
        </div>

        {/* Mining Machine Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('machineType')}
          </label>
          <select
            value={machineType}
            onChange={(e) => setMachineType(e.target.value as typeof machineType)}
            className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
          >
            <option value="Mining Machine">{t('miningMachine')}</option>
            <option value="Advanced Mining Machine">{t('advancedMiningMachine')}</option>
          </select>
        </div>

        {/* Work Speed Multiplier (Advanced only) - Slider */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('workSpeed')}: {workSpeedMultiplier}%
            {machineType === 'Mining Machine' && (
              <span className="text-xs text-gray-500 ml-1">({t('advancedOnly')})</span>
            )}
          </label>
          <input
            type="range"
            min="100"
            max="300"
            step="1"
            value={workSpeedMultiplier}
            onChange={(e) => setWorkSpeedMultiplier(parseInt(e.target.value))}
            disabled={machineType === 'Mining Machine'}
            className={`
              w-full h-2 rounded-lg appearance-none cursor-pointer
              ${machineType === 'Mining Machine'
                ? 'bg-gray-200 dark:bg-gray-700 opacity-50 cursor-not-allowed'
                : 'bg-blue-200 dark:bg-blue-900/50'
              }
            `}
            style={{
              background: machineType === 'Advanced Mining Machine'
                ? `linear-gradient(to right, rgb(59, 130, 246) 0%, rgb(59, 130, 246) ${(workSpeedMultiplier - 100) / 2}%, rgb(229, 231, 235) ${(workSpeedMultiplier - 100) / 2}%, rgb(229, 231, 235) 100%)`
                : undefined
            }}
          />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>100%</span>
            <span className="text-orange-600 dark:text-orange-400">
              {t('power')}: {((workSpeedMultiplier / 100) ** 2 * 100).toFixed(0)}%
            </span>
            <span>300%</span>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className={`grid grid-cols-1 gap-4 ${miningCalc.totalOrbitalCollectors > 0 ? 'md:grid-cols-2' : 'md:grid-cols-1'}`}>
        {/* Only show Orbital Collectors if Hydrogen or Deuterium is needed */}
        {miningCalc.totalOrbitalCollectors > 0 && (
          <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 dark:from-blue-500/20 dark:to-cyan-500/20 rounded-xl p-4 border border-blue-500/20 dark:border-blue-500/30">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              {t('orbitalCollectors')}
            </div>
            <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              {formatNumber(miningCalc.totalOrbitalCollectors)}
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              {t('forHydrogenDeuterium')}
            </div>
          </div>
        )}
        
        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 dark:from-purple-500/20 dark:to-pink-500/20 rounded-xl p-4 border border-purple-500/20 dark:border-purple-500/30">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            {t('powerMultiplier')}
          </div>
          <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            {workSpeedMultiplier > 100 ? `${((workSpeedMultiplier / 100) ** 2).toFixed(2)}x` : '1.0x'}
          </div>
          <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
            {workSpeedMultiplier > 100 ? `${workSpeedMultiplier}% ${t('speed')} = ${((workSpeedMultiplier / 100) ** 2 * 100).toFixed(0)}% ${t('power')}` : t('standardPower')}
          </div>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
          {t('materialBreakdown')}
        </h4>
        <div className="space-y-2">
          {miningCalc.rawMaterials.map(material => {
            // Check if this is Hydrogen or Deuterium (Orbital Collector only)
            const isOrbitalOnly = material.orbitCollectorsNeeded !== undefined;
            
            return (
              <div
                key={material.itemId}
                className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700"
              >
                {/* Item Icon */}
                <ItemIcon itemId={material.itemId} size={32} />

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {material.itemName}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {t('required')}: {formatNumber(material.requiredRate)}/s
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500">
                    {(material.miningSpeedBonus * 100).toFixed(0)}% {t('research')}
                    {!isOrbitalOnly && material.workSpeedMultiplier > 100 && (
                      <span className="text-orange-600 dark:text-orange-400">
                        {' '}• {material.workSpeedMultiplier}% {t('speed')} ({(material.powerMultiplier * 100).toFixed(0)}% {t('power')})
                      </span>
                    )}
                  </div>
                </div>

                {/* Veins or Collectors */}
                <div className="text-right flex-shrink-0">
                  {isOrbitalOnly ? (
                    // Orbital Collectors only (Hydrogen/Deuterium)
                    <>
                      <div className="font-bold text-blue-600 dark:text-blue-400 text-lg">
                        {formatNumber(material.orbitCollectorsNeeded!)} {t('collectors')}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {formatNumber(material.orbitalCollectorSpeed || 0)}/s {t('each')}
                      </div>
                    </>
                  ) : (
                    // Veins needed (other materials)
                    <>
                      <div className="font-bold text-orange-600 dark:text-orange-400 text-lg">
                        {formatNumber(material.veinsNeeded)} {t('veins')}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        ~{formatNumber(material.minersNeeded)} {t('minersNeeded')}
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Help Text */}
      <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/30 rounded-lg p-3 space-y-1">
        <p>
          ⛏️ <strong>{t('veinsNeededLabel')}:</strong> {t('veinsNeededDesc')}
        </p>
        <p>
          📊 <strong>{t('miningSpeedResearch')}:</strong> {t('miningSpeedResearchDesc')}
        </p>
        <p>
          ⚡ <strong>{t('workSpeedAdvanced')}:</strong> {t('workSpeedAdvancedDesc')}
        </p>
        <p>
          🚀 <strong>{t('orbitalCollectors')}:</strong> {t('orbitalCollectorsDesc')}
        </p>
        <p className="text-green-600 dark:text-green-500 font-semibold mt-2 pt-2 border-t border-gray-300 dark:border-gray-700">
          ✅ <strong>{t('verified')}:</strong> {t('verifiedDesc')}
        </p>
      </div>
    </div>
  );
}
