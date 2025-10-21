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
      <div className="bg-dark-700/50 backdrop-blur-sm rounded-xl p-6 border border-neon-yellow/30 shadow-[0_0_20px_rgba(255,215,0,0.2)]">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2" data-testid="miningCalculator">
          <span>⛏️</span>
          {t('miningCalculator')}
        </h3>
        <p className="text-space-300" data-testid="noRawMaterialsRequired">
          {t('noRawMaterialsRequired')}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-dark-700/50 backdrop-blur-sm rounded-xl p-6 border border-neon-yellow/30 shadow-[0_0_20px_rgba(255,215,0,0.2)] space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2" data-testid="miningCalculator">
          <span>⛏️</span>
          {t('miningCalculator')}
        </h3>
        <p className="text-sm text-space-200">
          {t('calculateMiningMachinesNeeded')}
        </p>
      </div>

      {/* Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Mining Speed Bonus (Research) - Numeric Input */}
        <div>
          <label className="block text-sm font-medium text-neon-blue mb-2 flex items-center gap-2" data-testid="miningSpeedResearch">
            <span>🔬</span>
            {t('miningSpeedResearch')} (%)
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setMiningSpeedBonus(Math.max(100, miningSpeedBonus - 10))}
              className="px-3 py-2 bg-dark-700/50 border border-neon-blue/40 text-neon-blue rounded-lg hover:border-neon-blue hover:bg-neon-blue/10 hover:text-white transition-all ripple-effect"
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
              className="flex-1 px-3 py-2 bg-dark-700/50 border border-neon-blue/40 rounded-lg text-white text-center focus:border-neon-blue focus:shadow-[0_0_10px_rgba(0,136,255,0.3)] transition-all"
            />
            <button
              onClick={() => setMiningSpeedBonus(Math.min(100000, miningSpeedBonus + 10))}
              className="px-3 py-2 bg-dark-700/50 border border-neon-blue/40 text-neon-blue rounded-lg hover:border-neon-blue hover:bg-neon-blue/10 hover:text-white transition-all ripple-effect"
            >
              +
            </button>
          </div>
          <div className="text-xs text-space-300 mt-1">
            {t('miningResearchHint')}
          </div>
        </div>

        {/* Mining Machine Type */}
        <div>
          <label className="block text-sm font-medium text-neon-green mb-2 flex items-center gap-2" data-testid="machineType">
            <span>🏭</span>
            {t('machineType')}
          </label>
          <select
            value={machineType}
            onChange={(e) => setMachineType(e.target.value as typeof machineType)}
            className="w-full px-3 py-2 bg-dark-700/50 border border-neon-green/40 rounded-lg text-white focus:border-neon-green focus:shadow-[0_0_10px_rgba(0,255,136,0.3)] transition-all"
            style={{
              backgroundColor: 'rgba(30, 41, 59, 0.5)',
              color: '#FFFFFF'
            }}
          >
            <option value="Mining Machine" style={{ backgroundColor: '#1E293B', color: '#FFFFFF' }}>{t('miningMachine')}</option>
            <option value="Advanced Mining Machine" style={{ backgroundColor: '#1E293B', color: '#FFFFFF' }}>{t('advancedMiningMachine')}</option>
          </select>
        </div>

        {/* Work Speed Multiplier (Advanced only) - Slider */}
        <div>
          <label className="block text-sm font-medium text-neon-orange mb-2 flex items-center gap-2">
            <span>⚡</span>
            {t('workSpeed')}: {workSpeedMultiplier}%
            {machineType === 'Mining Machine' && (
              <span className="text-xs text-space-400 ml-1">({t('advancedOnly')})</span>
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
                ? 'bg-dark-600 border border-neon-orange/20 opacity-50 cursor-not-allowed'
                : 'bg-dark-600 border border-neon-orange/40'
              }
            `}
            style={{
              background: machineType === 'Advanced Mining Machine'
                ? `linear-gradient(to right, rgb(255, 107, 53) 0%, rgb(255, 107, 53) ${(workSpeedMultiplier - 100) / 2}%, rgb(30, 41, 59) ${(workSpeedMultiplier - 100) / 2}%, rgb(30, 41, 59) 100%)`
                : undefined,
              backgroundImage: machineType === 'Advanced Mining Machine'
                ? `linear-gradient(to right, rgb(255, 107, 53) 0%, rgb(255, 107, 53) ${(workSpeedMultiplier - 100) / 2}%, rgb(30, 41, 59) ${(workSpeedMultiplier - 100) / 2}%, rgb(30, 41, 59) 100%)`
                : undefined
            }}
            data-has-gradient={machineType === 'Advanced Mining Machine' ? 'true' : 'false'}
          />
          <div className="flex justify-between text-xs text-space-300 mt-1">
            <span>100%</span>
            <span className="text-neon-orange">
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
          <div className="bg-gradient-to-br from-neon-blue/20 to-neon-cyan/20 backdrop-blur-sm rounded-xl p-4 border border-neon-blue/40 shadow-[0_0_20px_rgba(0,136,255,0.3)]">
            <div className="text-sm text-space-300 mb-1 flex items-center gap-2" data-testid="orbitalCollectors">
              <span>🚀</span>
              {t('orbitalCollectors')}
            </div>
            <div className="text-3xl font-bold text-white drop-shadow-[0_0_8px_rgba(0,136,255,0.6)]">
              {formatNumber(miningCalc.totalOrbitalCollectors)}
            </div>
            <div className="text-xs text-neon-blue mt-1">
              {t('forHydrogenDeuterium')}
            </div>
          </div>
        )}
        
        <div className="bg-gradient-to-br from-neon-purple/20 to-neon-magenta/20 backdrop-blur-sm rounded-xl p-4 border border-neon-purple/40 shadow-[0_0_20px_rgba(168,85,247,0.3)]">
          <div className="text-sm text-space-300 mb-1 flex items-center gap-2">
            <span>⚡</span>
            {t('powerMultiplier')}
          </div>
          <div className="text-3xl font-bold text-white drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]">
            {workSpeedMultiplier > 100 ? `${((workSpeedMultiplier / 100) ** 2).toFixed(2)}x` : '1.0x'}
          </div>
          <div className="text-xs text-neon-purple mt-1">
            {workSpeedMultiplier > 100 ? `${workSpeedMultiplier}% ${t('speed')} = ${((workSpeedMultiplier / 100) ** 2 * 100).toFixed(0)}% ${t('power')}` : t('standardPower')}
          </div>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div>
        <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <span>📋</span>
          {t('materialBreakdown')}
        </h4>
        <div className="space-y-2">
          {miningCalc.rawMaterials.map(material => {
            // Check if this is Hydrogen or Deuterium (Orbital Collector only)
            const isOrbitalOnly = material.orbitCollectorsNeeded !== undefined;
            
            return (
              <div
                key={material.itemId}
                className="flex items-center gap-3 p-3 rounded-lg bg-dark-800/50 border border-neon-yellow/20 hover:border-neon-yellow/40 transition-all"
              >
                {/* Item Icon */}
                <ItemIcon itemId={material.itemId} size={32} />

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white">
                    {material.itemName}
                  </div>
                  <div className="text-sm text-space-300">
                    {t('required')}: {formatNumber(material.requiredRate)}/s
                  </div>
                  <div className="text-xs text-space-400">
                    {(material.miningSpeedBonus * 100).toFixed(0)}% {t('research')}
                    {!isOrbitalOnly && material.workSpeedMultiplier > 100 && (
                      <span className="text-neon-orange">
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
                      <div className="font-bold text-neon-blue text-lg drop-shadow-[0_0_4px_rgba(0,136,255,0.6)]">
                        {formatNumber(material.orbitCollectorsNeeded!)} {t('collectors')}<span data-testid="collectors-label" className="hidden">collectors</span>
                      </div>
                      <div className="text-xs text-space-300">
                        {formatNumber(material.orbitalCollectorSpeed || 0)}/s {t('each')}
                      </div>
                    </>
                  ) : (
                    // Veins needed (other materials)
                    <>
                      <div className="font-bold text-neon-orange text-lg drop-shadow-[0_0_4px_rgba(255,107,53,0.6)]">
                        {formatNumber(material.veinsNeeded)} {t('veins')}<span data-testid="veins-label" className="hidden">veins</span>
                      </div>
                      <div className="text-xs text-space-300">
                        ~{formatNumber(material.minersNeeded)} {t('minersNeeded')}<span data-testid="minersNeeded-label" className="hidden">minersNeeded</span>
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
      <div className="text-xs text-space-300 bg-dark-800/50 backdrop-blur-sm border border-neon-cyan/20 rounded-lg p-3 space-y-1">
        <p>
          ⛏️ <strong className="text-neon-orange">{t('veinsNeededLabel')}:</strong> {t('veinsNeededDesc')}
        </p>
        <p>
          📊 <strong className="text-neon-blue">{t('miningSpeedResearch')}:</strong> {t('miningSpeedResearchDesc')}
        </p>
        <p>
          ⚡ <strong className="text-neon-orange">{t('workSpeedAdvanced')}:</strong> {t('workSpeedAdvancedDesc')}
        </p>
        <p>
          🚀 <strong className="text-neon-blue">{t('orbitalCollectors')}:</strong> {t('orbitalCollectorsDesc')}
        </p>
        <p className="text-neon-green font-semibold mt-2 pt-2 border-t border-neon-cyan/20">
          ✅ <strong>{t('verified')}:</strong> {t('verifiedDesc')}
        </p>
      </div>
    </div>
  );
}
