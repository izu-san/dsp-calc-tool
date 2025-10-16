import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '../../stores/settingsStore';
import { useNodeOverrideStore } from '../../stores/nodeOverrideStore';
import type { RecipeTreeNode, NodeOverrideSettings } from '../../types';
import type { ProliferatorType, ProliferatorMode } from '../../types/settings';
import { PROLIFERATOR_DATA } from '../../types/settings';
import { ICONS } from '../../constants/icons';

interface CompactNodeSettingsProps {
  node: RecipeTreeNode;
}

export function CompactNodeSettings({ node }: CompactNodeSettingsProps) {
  const { t } = useTranslation();
  const { settings } = useSettingsStore();
  const { nodeOverrides, setNodeOverride, clearNodeOverride } = useNodeOverrideStore();
  
  // Get current override or use global settings
  const currentOverride = nodeOverrides.get(node.nodeId);
  
  const [useOverride, setUseOverride] = useState(() => !!currentOverride);
  const [proliferatorType, setProliferatorType] = useState<ProliferatorType>(() =>
    currentOverride?.proliferator?.type || settings.proliferator.type
  );
  const [proliferatorMode, setProliferatorMode] = useState<ProliferatorMode>(() =>
    currentOverride?.proliferator?.mode || settings.proliferator.mode
  );
  const [machineRank, setMachineRank] = useState<string>(() =>
    currentOverride?.machineRank || ''
  );



  useEffect(() => {
    const override = nodeOverrides.get(node.nodeId);
    const hasOverride = !!override;
    
    // Only update if the override state has actually changed
    if (hasOverride !== useOverride) {
      setUseOverride(hasOverride);
    }
    
    // Only update values if we don't have an override or if we're not actively editing
    if (!useOverride && !hasOverride) {
      setProliferatorType(settings.proliferator.type);
      setProliferatorMode(settings.proliferator.mode);
      setMachineRank('');
    }
  }, [node.nodeId, settings.proliferator.type, settings.proliferator.mode]);

  // Auto-save when settings change
  useEffect(() => {
    if (useOverride) {
      const overrideSettings: NodeOverrideSettings = {
        proliferator: {
          ...PROLIFERATOR_DATA[proliferatorType],
          mode: proliferatorMode,
        },
      };
      
      // Always include machineRank, even if empty string (which means "none")
      if (machineRank !== undefined) {
        overrideSettings.machineRank = machineRank;
      }
      
      setNodeOverride(node.nodeId, overrideSettings);
    }
  }, [useOverride, proliferatorType, proliferatorMode, machineRank, node.nodeId, node.recipe?.SID, setNodeOverride]);



  const recipeType = node.recipe?.Type;
  const isProductionAllowed = node.recipe?.productive !== false;

  // Machine rank options based on recipe type
  const getMachineRankOptions = () => {
    if (!recipeType) return [];
    
    const options: { value: string; label: string; iconId: number }[] = [];
    
    switch (recipeType) {
      case 'Smelt':
        options.push(
          { value: 'arc', label: t('arcSmelter'), iconId: ICONS.machine.smelter.arc },
          { value: 'plane', label: t('planeSmelter'), iconId: ICONS.machine.smelter.plane },
          { value: 'negentropy', label: t('negentropySmelter'), iconId: ICONS.machine.smelter.negentropy }
        );
        break;
      case 'Assemble':
        options.push(
          { value: 'mk1', label: t('assemblingMachineMk1'), iconId: ICONS.machine.assembler.mk1 },
          { value: 'mk2', label: t('assemblingMachineMk2'), iconId: ICONS.machine.assembler.mk2 },
          { value: 'mk3', label: t('assemblingMachineMk3'), iconId: ICONS.machine.assembler.mk3 }
        );
        break;
      case 'Chemical':
        options.push(
          { value: 'standard', label: t('chemicalPlant'), iconId: ICONS.machine.chemical.standard },
          { value: 'quantum', label: t('quantumChemicalPlant'), iconId: ICONS.machine.chemical.quantum }
        );
        break;
      case 'Research':
        options.push(
          { value: 'matrixLab', label: t('matrixLab'), iconId: ICONS.machine.research.standard },
          { value: 'self-evolution', label: t('selfEvolutionLab'), iconId: ICONS.machine.research['self-evolution'] }
        );
        break;
    }
    
    return options;
  };

  const machineOptions = getMachineRankOptions();

  return (
    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
      <div className="space-y-3">
        {/* Override Toggle */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{t('useCustomSettings')}</span>
          <button
            onClick={() => {
              const newUseOverride = !useOverride;
              setUseOverride(newUseOverride);
              if (!newUseOverride) {
                // Clear the override when disabling
                clearNodeOverride(node.nodeId);
              }
              // Auto-save is handled by useEffect
            }}
            role="switch"
            aria-checked={useOverride}
            aria-label={t('useCustomSettings')}
            className={`
              relative inline-flex h-4 w-7 items-center rounded-full transition-colors
              ${useOverride ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}
            `}
          >
            <span
              className={`
                inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform
                ${useOverride ? 'translate-x-3.5' : 'translate-x-1'}
              `}
            />
          </button>
        </div>

        {useOverride && (
          <div className="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-600">
            {/* Proliferator */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">💊 {t('proliferator')}</label>
              <div className="space-y-2">
                {/* Type */}
                <select
                  value={proliferatorType}
                  onChange={(e) => {
                    setProliferatorType(e.target.value as ProliferatorType);
                  }}
                  aria-label={t('proliferator')}
                  className="w-full text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="none">{t('none')}</option>
                  <option value="mk1">Mk.I</option>
                  <option value="mk2">Mk.II</option>
                  <option value="mk3">Mk.III</option>
                </select>
                
                {/* Mode */}
                {proliferatorType !== 'none' && (
                  <div className="grid grid-cols-2 gap-1">
                    {(['production', 'speed'] as ProliferatorMode[]).map((mode) => {
                      const isDisabled = mode === 'production' && !isProductionAllowed;
                      return (
                        <button
                          key={mode}
                          onClick={() => {
                            if (!isDisabled) {
                              setProliferatorMode(mode);
                            }
                          }}
                          disabled={isDisabled}
                          aria-pressed={proliferatorMode === mode}
                          aria-label={`${t('mode')}: ${mode}`}
                          className={`
                            px-2 py-2 text-xs rounded transition-all min-h-[2rem] flex items-center justify-center
                            ${isDisabled
                              ? 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                              : proliferatorMode === mode
                                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                                : 'bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-500'
                            }
                          `}
                        >
                          <div className="flex items-center gap-1">
                            <span>{mode === 'production' ? '🏭' : '⚡'}</span>
                            <span className="text-xs">{mode === 'production' ? t('productionMode') : t('speedMode')}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Machine Rank */}
            {machineOptions.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">🏭 {t('machineRank')}</label>
                <select
                  value={machineRank}
                  onChange={(e) => {
                    setMachineRank(e.target.value);
                  }}
                  className="w-full text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">{t('none')}</option>
                  {machineOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {!useOverride && (
          <div className="text-center py-2 text-gray-500 dark:text-gray-400">
            <p className="text-xs">{t('usingGlobalSettings')}</p>
          </div>
        )}
      </div>
    </div>
  );
}