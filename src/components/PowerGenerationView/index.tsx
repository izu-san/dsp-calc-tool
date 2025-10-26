/**
 * 発電設備表示コンポーネント
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { CalculationResult } from '@/types';
import { calculatePowerGeneration } from '@/lib/powerGenerationCalculation';
import { useSettingsStore } from '@/stores/settingsStore';
import type { GameTemplate } from '@/types/settings/templates';
import { formatNumber } from '@/utils/format';

interface PowerGenerationViewProps {
  calculationResult: CalculationResult;
}

/**
 * 発電設備表示ビュー
 */
export function PowerGenerationView({
  calculationResult,
}: PowerGenerationViewProps) {
  const { t, i18n } = useTranslation();
  const settings = useSettingsStore((state) => state.settings);

  // 総消費電力を取得 (kW)
  const totalPowerConsumption = useMemo(() => {
    return calculationResult.totalPower?.total || 0;
  }, [calculationResult.totalPower]);

  // テンプレートを判定（簡易版 - 実際には設定に保存する必要がある）
  const template = useMemo((): GameTemplate => {
    // 施設ランクから推測
    const { machineRank } = settings;

    if (
      machineRank.Assemble === 'recomposing' ||
      machineRank.Smelt === 'negentropy'
    ) {
      return 'endGame';
    }

    if (machineRank.Assemble === 'mk3' || machineRank.Chemical === 'quantum') {
      return 'lateGame';
    }

    if (machineRank.Assemble === 'mk2') {
      return 'midGame';
    }

    return 'earlyGame';
  }, [settings]);

  // 発電設備を計算
  const powerGeneration = useMemo(() => {
    return calculatePowerGeneration(totalPowerConsumption, template);
  }, [totalPowerConsumption, template]);

  if (totalPowerConsumption <= 0) {
    return (
      <div className="text-center py-8 text-space-300">
        <p>{t('powerGeneration.noPowerRequired')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 必要電力 */}
      <div className="hologram-card p-4 border border-neon-blue/30 rounded-lg bg-dark-800/50">
        <h3 className="text-sm font-medium text-neon-cyan mb-2">
          {t('powerGeneration.requiredPower')}
        </h3>
        <p className="text-2xl font-bold text-white">
          {formatNumber(totalPowerConsumption)} kW
          <span className="text-base text-space-300 ml-2">
            ({formatNumber(totalPowerConsumption / 1000)} MW)
          </span>
        </p>
      </div>

      {/* 発電設備リスト */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-neon-cyan">
          {t('powerGeneration.generatorAllocation')}
        </h3>

        {powerGeneration.generators.map((allocation, index) => (
          <div
            key={index}
            className="hologram-card p-4 border border-neon-blue/30 rounded-lg bg-dark-800/50 hover:bg-dark-700/50 transition-colors"
          >
            {/* 発電設備名 */}
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-base font-semibold text-white">
                {i18n.language === 'ja'
                  ? allocation.generator.machineName
                  : allocation.generator.type}
              </h4>
              <span className="text-sm text-space-300">
                ID: {allocation.generator.machineId}
              </span>
            </div>

            {/* 発電設備情報 */}
            <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
              <div>
                <span className="text-space-300">
                  {t('powerGeneration.baseOutput')}:
                </span>
                <span className="ml-2 text-white font-medium">
                  {formatNumber(allocation.generator.baseOutput)} kW
                </span>
              </div>
              <div>
                <span className="text-space-300">
                  {t('powerGeneration.operatingRate')}:
                </span>
                <span className="ml-2 text-white font-medium">
                  {(allocation.generator.operatingRate * 100).toFixed(1)}%
                </span>
              </div>
              <div>
                <span className="text-space-300">
                  {t('powerGeneration.count')}:
                </span>
                <span className="ml-2 text-neon-cyan font-bold">
                  {allocation.count} {t('powerGeneration.units')}
                </span>
              </div>
              <div>
                <span className="text-space-300">
                  {t('powerGeneration.totalOutput')}:
                </span>
                <span className="ml-2 text-white font-medium">
                  {formatNumber(allocation.totalOutput)} kW
                </span>
              </div>
            </div>

            {/* 燃料情報 */}
            {allocation.fuel && (
              <div className="border-t border-neon-blue/20 pt-3 mt-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-space-300">
                      {t('powerGeneration.fuel')}:
                    </span>
                    <span className="ml-2 text-white font-medium">
                      {i18n.language === 'ja'
                        ? allocation.fuel.itemName
                        : `Fuel #${allocation.fuel.itemId}`}
                    </span>
                  </div>
                  <div>
                    <span className="text-space-300">
                      {t('powerGeneration.energyPerItem')}:
                    </span>
                    <span className="ml-2 text-white font-medium">
                      {formatNumber(allocation.fuel.energyPerItem)} MJ
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-space-300">
                      {t('powerGeneration.fuelConsumption')}:
                    </span>
                    <span className="ml-2 text-neon-cyan font-bold">
                      {formatNumber(allocation.fuelConsumptionRate)}{' '}
                      {t('powerGeneration.itemsPerSecond')}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 注意書き（出力変動設備） */}
            {allocation.generator.isVariableOutput && (
              <div className="mt-3 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded text-xs text-yellow-200">
                ⚠️{' '}
                {t('powerGeneration.variableOutputWarning', {
                  name:
                    i18n.language === 'ja'
                      ? allocation.generator.machineName
                      : allocation.generator.type,
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* サマリー */}
      <div className="hologram-card p-4 border border-neon-cyan/50 rounded-lg bg-dark-800/50">
        <h3 className="text-sm font-medium text-neon-cyan mb-3">
          {t('powerGeneration.summary')}
        </h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-space-300">
              {t('powerGeneration.totalGenerators')}:
            </span>
            <span className="ml-2 text-white font-bold">
              {powerGeneration.totalGenerators} {t('powerGeneration.units')}
            </span>
          </div>
          {powerGeneration.totalFuelConsumption.size > 0 && (
            <div>
              <span className="text-space-300">
                {t('powerGeneration.totalFuelConsumption')}:
              </span>
              {Array.from(powerGeneration.totalFuelConsumption.entries()).map(
                ([itemId, rate]) => (
                  <div key={itemId} className="ml-2 text-white font-bold">
                    ID {itemId}: {formatNumber(rate)}{' '}
                    {t('powerGeneration.itemsPerSecond')}
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

