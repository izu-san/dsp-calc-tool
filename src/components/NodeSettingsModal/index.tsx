import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '../../stores/settingsStore';
import { useNodeOverrideStore } from '../../stores/nodeOverrideStore';
import type { RecipeTreeNode, NodeOverrideSettings } from '../../types';
import type { ProliferatorType, ProliferatorMode } from '../../types/settings';
import { PROLIFERATOR_DATA } from '../../types/settings';
import { ICONS } from '../../constants/icons';
import { ItemIcon } from '../ItemIcon';

interface NodeSettingsModalProps {
  node: RecipeTreeNode;
  isOpen: boolean;
  onClose: () => void;
}

export function NodeSettingsModal({ node, isOpen, onClose }: NodeSettingsModalProps) {
  const { t } = useTranslation();
  const { settings } = useSettingsStore();
  const { nodeOverrides, setNodeOverride, clearNodeOverride } = useNodeOverrideStore();
  
  // Get current override or use global settings
  const currentOverride = nodeOverrides.get(node.nodeId);
  
  const [useOverride, setUseOverride] = useState(!!currentOverride);
  const [proliferatorType, setProliferatorType] = useState<ProliferatorType>(
    currentOverride?.proliferator?.type || settings.proliferator.type
  );
  const [proliferatorMode, setProliferatorMode] = useState<ProliferatorMode>(
    currentOverride?.proliferator?.mode || settings.proliferator.mode
  );
  const [machineRank, setMachineRank] = useState<string>(
    currentOverride?.machineRank || ''
  );

  useEffect(() => {
    if (isOpen) {
      // Sync state when modal opens
      const override = nodeOverrides.get(node.nodeId);
      // Use queueMicrotask to defer state updates
      queueMicrotask(() => {
        setUseOverride(!!override);
        setProliferatorType(override?.proliferator?.type || settings.proliferator.type);
        setProliferatorMode(override?.proliferator?.mode || settings.proliferator.mode);
        setMachineRank(override?.machineRank || '');
      });
    }
  }, [isOpen, node.nodeId, nodeOverrides, settings]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (useOverride) {
      const overrideSettings: NodeOverrideSettings = {
        proliferator: {
          ...PROLIFERATOR_DATA[proliferatorType],
          mode: proliferatorMode,
        },
      };
      
      if (machineRank) {
        overrideSettings.machineRank = machineRank;
      }
      
      setNodeOverride(node.nodeId, overrideSettings);
    } else {
      clearNodeOverride(node.nodeId);
    }
    onClose();
  };

  const handleReset = () => {
    setUseOverride(false);
    setProliferatorType(settings.proliferator.type);
    setProliferatorMode(settings.proliferator.mode);
    setMachineRank('');
    clearNodeOverride(node.nodeId);
  };

  const recipeName = node.recipe?.name || node.itemName || t('unknown');
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
          { value: 'negentropySmelter', label: t('negentropySmelter'), iconId: ICONS.machine.smelter.negentropy }
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
          { value: 'standard', label: t('matrixLab'), iconId: ICONS.machine.research.standard },
          { value: 'self-evolution', label: t('selfEvolutionLab'), iconId: ICONS.machine.research['self-evolution'] }
        );
        break;
    }
    
    return options;
  };

  const machineOptions = getMachineRankOptions();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {node.recipe && (
              <ItemIcon itemId={node.recipe.Results[0]?.id} size={32} />
            )}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('nodeSettings')}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{recipeName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-6">
          {/* Override Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div>
              <div className="font-medium text-gray-900 dark:text-white">{t('useCustomSettings')}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {t('overrideGlobalSettingsForNode')}
              </div>
            </div>
            <button
              onClick={() => setUseOverride(!useOverride)}
              className={`
                relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                ${useOverride ? 'bg-blue-600 dark:bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}
              `}
            >
              <span
                className={`
                  inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                  ${useOverride ? 'translate-x-6' : 'translate-x-1'}
                `}
              />
            </button>
          </div>

          {useOverride && (
            <>
              {/* Proliferator Settings */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">💊 Proliferator</h4>
                
                {/* Type Selection */}
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('type')}</label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['none', 'mk1', 'mk2', 'mk3'] as ProliferatorType[]).map((type) => (
                      <button
                        key={type}
                        onClick={() => setProliferatorType(type)}
                        className={`
                          px-2 py-2 text-xs font-medium rounded-lg border transition-all
                          ${proliferatorType === type
                            ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-purple-400 dark:border-purple-600 ring-2 ring-purple-300 dark:ring-purple-700'
                            : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                          }
                        `}
                      >
                        {type === 'none' ? t('none') : type.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mode Selection */}
                {proliferatorType !== 'none' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('mode')}
                      {!isProductionAllowed && (
                        <span className="ml-2 text-xs text-orange-600 dark:text-orange-400">
                          ⚠️ {t('productionModeDisabled')}
                        </span>
                      )}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['production', 'speed'] as ProliferatorMode[]).map((mode) => {
                        const isDisabled = mode === 'production' && !isProductionAllowed;
                        return (
                          <button
                            key={mode}
                            onClick={() => !isDisabled && setProliferatorMode(mode)}
                            disabled={isDisabled}
                            className={`
                              px-3 py-2 text-sm font-medium rounded-lg border transition-all
                              ${isDisabled
                                ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-700 cursor-not-allowed'
                                : proliferatorMode === mode
                                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-400 dark:border-blue-600 ring-2 ring-blue-300 dark:ring-blue-700'
                                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                              }
                            `}
                          >
                            {mode === 'production' ? `🏭 ${t('production')}` : `⚡ ${t('speed')}`}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Machine Rank Settings */}
              {machineOptions.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">🏭 {t('machineRank')}</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {machineOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setMachineRank(option.value)}
                        className={`
                          px-2 py-2 text-xs font-medium rounded-lg border transition-all
                          ${machineRank === option.value
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-400 dark:border-blue-600 ring-2 ring-blue-300 dark:ring-blue-700'
                            : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                          }
                        `}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <ItemIcon itemId={option.iconId} size={24} />
                          <span className="text-[10px]">{option.label.split(' ').pop()}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {!useOverride && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>{t('usingGlobalSettings')}</p>
              <p className="text-sm mt-2">{t('enableCustomSettingsToOverride')}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            {t('resetToGlobal')}
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500"
            >
              {t('cancel')}
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-blue-700 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600"
            >
              {t('applySettings')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
