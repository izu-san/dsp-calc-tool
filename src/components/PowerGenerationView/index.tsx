/**
 * 発電設備表示コンポーネント
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { CalculationResult } from '@/types';
import { calculatePowerGeneration } from '@/lib/powerGenerationCalculation';
import { useSettingsStore } from '@/stores/settingsStore';
import { useGameDataStore } from '@/stores/gameDataStore';
import type { GameTemplate } from '@/types/settings/templates';
import { formatNumber, formatPower, formatRate } from '@/utils/format';
import { ItemIcon } from '@/components/ItemIcon';
import { FUEL_ITEMS, POWER_GENERATORS, TEMPLATE_POWER_GENERATORS } from '@/constants/powerGeneration';
import type { PowerGeneratorType } from '@/types/power-generation';

interface PowerGenerationViewProps {
  calculationResult: CalculationResult;
}

/**
 * 発電設備表示ビュー
 */
export function PowerGenerationView({
  calculationResult,
}: PowerGenerationViewProps) {
  const { t } = useTranslation();
  const { 
    setPowerGenerationTemplate, 
    setManualPowerGenerator, 
    setManualPowerFuel 
  } = useSettingsStore();
  const data = useGameDataStore((state) => state.data);
  const machines = data?.machines;
  const items = data?.items;

  // 設備名を取得（言語に応じた名前を返す）
  const getGeneratorName = (machineId: number): string => {
    const machine = machines?.get(machineId);
    if (machine?.name) return machine.name;
    
    // フォールバック: POWER_GENERATORSから取得
    const generator = Object.values(POWER_GENERATORS).find(g => g.machineId === machineId);
    return generator?.machineName || `Machine ${machineId}`;
  };

  // 燃料名を取得（言語に応じた名前を返す）
  const getItemName = (itemId: number): string => {
    const item = items?.get(itemId);
    if (item?.name) return item.name;
    
    // フォールバック: FUEL_ITEMSから取得
    const fuel = Object.values(FUEL_ITEMS).find(f => f.itemId === itemId);
    return fuel?.itemName || `Item ${itemId}`;
  };

  // 総消費電力を取得 (kW)
  // Note: Excludes dysonSphere power (which is generated, not consumed by power plants)
  const totalPowerConsumption = useMemo(() => {
    if (!calculationResult.totalPower) return 0;
    return calculationResult.totalPower.machines + calculationResult.totalPower.sorters;
  }, [calculationResult.totalPower]);

  // 発電設備テンプレートを取得（設定ストアから直接取得）
  const template = useSettingsStore((state) => state.powerGenerationTemplate);
  const manualGenerator = useSettingsStore((state) => state.manualPowerGenerator);
  const manualFuel = useSettingsStore((state) => state.manualPowerFuel);

  // 全発電設備リスト（テンプレート関係なく）
  const allGenerators = useMemo(() => {
    return Object.keys(POWER_GENERATORS) as PowerGeneratorType[];
  }, []);

  // 選択された発電設備に応じた利用可能な燃料リスト（全燃料から選択）
  const availableFuels = useMemo(() => {
    // 現在選択されている発電設備（手動選択 or 自動選択の結果）
    let currentGenerator: PowerGeneratorType | null = manualGenerator;
    if (!currentGenerator) {
      // 自動選択の場合はテンプレートから最も高出力の発電設備を取得
      const templateGenerators = TEMPLATE_POWER_GENERATORS[template] || TEMPLATE_POWER_GENERATORS.endGame;
      currentGenerator = templateGenerators[0];
    }
    
    const generator = POWER_GENERATORS[currentGenerator];
    
    if (!generator || generator.acceptedFuelTypes.length === 0) {
      return [];
    }

    const fuelType = generator.acceptedFuelTypes[0];
    
    // 全燃料から選択された発電設備の燃料タイプに合うものを抽出
    return Object.entries(FUEL_ITEMS)
      .filter(([, fuel]) => fuel.fuelType === fuelType)
      .map(([key, fuel]) => ({ key, ...fuel }));
  }, [template, manualGenerator]);

  // 発電設備を計算
  const powerGeneration = useMemo(() => {
    return calculatePowerGeneration(
      totalPowerConsumption, 
      template, 
      manualGenerator, 
      manualFuel
    );
  }, [totalPowerConsumption, template, manualGenerator, manualFuel]);

  if (totalPowerConsumption <= 0) {
    return (
      <div className="text-center py-8 text-space-300">
        <p>{t('powerGeneration.noPowerRequired')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 発電設備テンプレート選択 */}
      <div className="hologram-card p-4 border border-neon-blue/30 rounded-lg bg-dark-800/50">
        <h3 className="text-sm font-medium text-neon-cyan mb-3">
          {t('powerGeneration.templateLabel')}
        </h3>
        <select 
          value={template}
          onChange={(e) => setPowerGenerationTemplate(e.target.value as GameTemplate)}
          className="w-full px-3 py-2 border border-neon-blue/40 rounded-lg bg-dark-700/50 text-white text-sm focus:border-neon-blue focus:shadow-[0_0_10px_rgba(0,136,255,0.3)] transition-all"
          style={{
            backgroundColor: 'rgba(30, 41, 59, 0.5)',
            color: '#FFFFFF'
          }}
        >
          <option value="default" style={{ backgroundColor: '#1E293B', color: '#FFFFFF' }}>{t('powerGeneration.templateDefault')}</option>
          <option value="earlyGame" style={{ backgroundColor: '#1E293B', color: '#FFFFFF' }}>{t('powerGeneration.templateEarlyGame')}</option>
          <option value="midGame" style={{ backgroundColor: '#1E293B', color: '#FFFFFF' }}>{t('powerGeneration.templateMidGame')}</option>
          <option value="lateGame" style={{ backgroundColor: '#1E293B', color: '#FFFFFF' }}>{t('powerGeneration.templateLateGame')}</option>
          <option value="endGame" style={{ backgroundColor: '#1E293B', color: '#FFFFFF' }}>{t('powerGeneration.templateEndGame')}</option>
        </select>
      </div>

      {/* 発電設備と燃料の手動選択 */}
      <div className="hologram-card p-4 border border-neon-purple/30 rounded-lg bg-dark-800/50">
        <h3 className="text-sm font-medium text-neon-cyan mb-3">
          {t('powerGeneration.manualSelection')}
        </h3>
        
        <div className="space-y-4">
          {/* 発電設備選択 */}
          <div>
            <label className="block text-xs text-space-300 mb-2">
              {t('powerGeneration.generatorLabel')}
            </label>
            
            <div className="grid grid-cols-7 gap-2">
              {/* 自動選択ボタン */}
              <button
                onClick={() => {
                  setManualPowerGenerator(null);
                  setManualPowerFuel(null);
                }}
                className={`
                  px-1.5 py-2 text-sm font-medium rounded-lg border-2 transition-all duration-200 hover:scale-105
                  ${manualGenerator === null
                    ? 'bg-neon-purple/30 text-white border-neon-purple shadow-[0_0_20px_rgba(168,85,247,0.6),inset_0_0_20px_rgba(168,85,247,0.2)] backdrop-blur-sm font-bold scale-105'
                    : 'bg-dark-700/50 text-space-200 border-neon-purple/20 hover:bg-neon-purple/10 hover:border-neon-purple/50 hover:text-neon-purple'
                  }
                `}
              >
                <div className="flex flex-col items-center gap-1">
                  <span className="text-2xl">🤖</span>
                  <span className="text-xs leading-tight text-center">{t('powerGeneration.automatic')}</span>
                </div>
              </button>

              {/* 各発電設備ボタン */}
              {allGenerators.map((generatorType) => {
                const generator = POWER_GENERATORS[generatorType];
                const isSelected = manualGenerator === generatorType;
                
                return (
                  <button
                    key={generatorType}
                    onClick={() => {
                      setManualPowerGenerator(generatorType);
                      setManualPowerFuel(null);
                    }}
                    className={`
                      px-1.5 py-2 text-sm font-medium rounded-lg border-2 transition-all duration-200 hover:scale-105
                      ${isSelected
                        ? 'bg-neon-purple/30 text-white border-neon-purple shadow-[0_0_20px_rgba(168,85,247,0.6),inset_0_0_20px_rgba(168,85,247,0.2)] backdrop-blur-sm font-bold scale-105'
                        : 'bg-dark-700/50 text-space-200 border-neon-purple/20 hover:bg-neon-purple/10 hover:border-neon-purple/50 hover:text-neon-purple'
                      }
                    `}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <ItemIcon itemId={generator.machineId} size={32} />
                      <span className="text-xs leading-tight text-center">
                        {getGeneratorName(generator.machineId)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 燃料選択（燃料が2種類以上ある場合のみ表示） */}
          {availableFuels.length > 1 && (
            <div>
              <label className="block text-xs text-space-300 mb-2">
                {t('powerGeneration.fuelLabel')}
              </label>
              
              <div className="grid grid-cols-8 gap-2">
                {/* 自動選択ボタン */}
                <button
                  onClick={() => setManualPowerFuel(null)}
                  className={`
                    px-1.5 py-2 text-sm font-medium rounded-lg border-2 transition-all duration-200 hover:scale-105
                    ${manualFuel === null
                      ? 'bg-neon-purple/30 text-white border-neon-purple shadow-[0_0_20px_rgba(168,85,247,0.6),inset_0_0_20px_rgba(168,85,247,0.2)] backdrop-blur-sm font-bold scale-105'
                      : 'bg-dark-700/50 text-space-200 border-neon-purple/20 hover:bg-neon-purple/10 hover:border-neon-purple/50 hover:text-neon-purple'
                    }
                  `}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xl">🤖</span>
                    <span className="text-xs leading-tight text-center">{t('powerGeneration.automatic')}</span>
                  </div>
                </button>

                {/* 各燃料ボタン */}
                {availableFuels.map((fuel) => {
                  const isSelected = manualFuel === fuel.key;
                  
                  return (
                    <button
                      key={fuel.key}
                      onClick={() => setManualPowerFuel(fuel.key)}
                      className={`
                        px-1.5 py-2 text-sm font-medium rounded-lg border-2 transition-all duration-200 hover:scale-105
                        ${isSelected
                          ? 'bg-neon-purple/30 text-white border-neon-purple shadow-[0_0_20px_rgba(168,85,247,0.6),inset_0_0_20px_rgba(168,85,247,0.2)] backdrop-blur-sm font-bold scale-105'
                          : 'bg-dark-700/50 text-space-200 border-neon-purple/20 hover:bg-neon-purple/10 hover:border-neon-purple/50 hover:text-neon-purple'
                        }
                      `}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <ItemIcon itemId={fuel.itemId} size={24} />
                        <span className="text-xs leading-tight text-center">
                          {getItemName(fuel.itemId)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 必要電力 */}
      <div className="hologram-card p-4 border border-neon-blue/30 rounded-lg bg-dark-800/50">
        <h3 className="text-sm font-medium text-neon-cyan mb-2">
          {t('powerGeneration.requiredPower')}
        </h3>
        <p className="text-2xl font-bold text-white">
          {formatPower(totalPowerConsumption)}
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
            <div className="flex items-center gap-2 mb-3">
              <ItemIcon
                itemId={allocation.generator.machineId}
                size={32}
              />
              <h4 className="text-base font-semibold text-white">
                {getGeneratorName(allocation.generator.machineId)}
              </h4>
            </div>

            {/* 発電設備情報 */}
            <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
              <div>
                <span className="text-space-300">
                  {t('powerGeneration.baseOutput')}:
                </span>
                <span className="ml-2 text-white font-medium">
                  {formatPower(allocation.generator.baseOutput)}
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
                  {formatPower(allocation.totalOutput)}
                </span>
              </div>
            </div>

            {/* 燃料情報 */}
            {allocation.fuel && (
              <div className="border-t border-neon-blue/20 pt-3 mt-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-space-300">
                      {t('powerGeneration.fuel')}:
                    </span>
                    <ItemIcon
                      itemId={allocation.fuel.itemId}
                      size={24}
                    />
                    <span className="text-white font-medium">
                      {getItemName(allocation.fuel.itemId)}
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
                      {formatRate(allocation.fuelConsumptionRate)}
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
                  name: getGeneratorName(allocation.generator.machineId),
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
        <div className="space-y-3 text-sm">
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
              <div className="text-space-300 mb-2">
                {t('powerGeneration.totalFuelConsumption')}:
              </div>
              {Array.from(powerGeneration.totalFuelConsumption.entries()).map(
                ([itemId, rate]) => {
                  return (
                    <div key={itemId} className="flex items-center gap-2 ml-2">
                      <ItemIcon
                        itemId={itemId}
                        size={24}
                      />
                      <span className="text-white font-bold">
                        {getItemName(itemId)}:{' '}
                        {formatRate(rate)}
                      </span>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

