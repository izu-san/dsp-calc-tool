import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '../../stores/settingsStore';
import { useRecipeSelectionStore } from '../../stores/recipeSelectionStore';
import type { ProliferatorType, ProliferatorMode } from '../../types/settings';
import { ItemIcon } from '../ItemIcon';

// Proliferator item IDs
const PROLIFERATOR_IDS: Record<ProliferatorType, number | null> = {
  none: null,
  mk1: 1141,
  mk2: 1142,
  mk3: 1143,
};

export function ProliferatorSettings() {
  const { t } = useTranslation();
  const { settings, setProliferator } = useSettingsStore();
  const { selectedRecipe } = useRecipeSelectionStore();
  const { proliferator } = settings;

  // Check if current recipe allows production mode
  const isProductionAllowed = selectedRecipe?.productive !== false;

  // Auto-switch to speed mode if production is not allowed
  useEffect(() => {
    if (!isProductionAllowed && proliferator.mode === 'production' && proliferator.type !== 'none') {
      setProliferator(proliferator.type, 'speed');
    }
  }, [isProductionAllowed, proliferator.mode, proliferator.type, setProliferator]);

  const handleTypeChange = (type: ProliferatorType) => {
    // If production is not allowed, force speed mode
    const mode = !isProductionAllowed && type !== 'none' ? 'speed' : proliferator.mode;
    setProliferator(type, mode);
  };

  const handleModeChange = (mode: ProliferatorMode) => {
    setProliferator(proliferator.type, mode);
  };

  // Get bonus percentages for display
  const productionBonus = (proliferator.productionBonus * 100).toFixed(1);
  const speedBonus = (proliferator.speedBonus * 100).toFixed(1);
  const powerIncrease = (proliferator.powerIncrease * 100).toFixed(1);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-neon-magenta mb-2">
          {t('proliferatorType')}
        </label>
        <div className="grid grid-cols-4 gap-2">
          {(['none', 'mk1', 'mk2', 'mk3'] as ProliferatorType[]).map((type) => {
            const iconId = PROLIFERATOR_IDS[type];
            const getProliferatorLabel = (pType: ProliferatorType) => {
              if (pType === 'none') return t('none');
              return t(`proliferator${pType.toUpperCase()}`);
            };
            return (
              <button
                key={type}
                data-testid={`proliferator-type-button-${type}`}
                onClick={() => handleTypeChange(type)}
                className={`
                  px-3 py-2 text-sm font-medium rounded-lg border-2 transition-all duration-200 hover:scale-105
                  ${proliferator.type === type
                    ? 'bg-neon-magenta/30 text-white border-neon-magenta shadow-[0_0_20px_rgba(233,53,255,0.6),inset_0_0_20px_rgba(233,53,255,0.2)] backdrop-blur-sm font-bold scale-105'
                    : 'bg-dark-700/50 text-space-200 border-neon-magenta/20 hover:bg-neon-magenta/10 hover:border-neon-magenta/50 hover:text-neon-magenta'
                  }
                `}
              >
                <div className="flex flex-col items-center gap-1">
                  {iconId && <ItemIcon itemId={iconId} size={24} />}
                  <span className="text-xs leading-tight text-center">{getProliferatorLabel(type)}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {proliferator.type !== 'none' && (
        <>
          <div>
            <label className="block text-sm font-medium text-neon-cyan mb-2">
              {t('proliferatorMode')} <span className="text-xs text-space-300">({t('exclusive')})</span>
            </label>
            {!isProductionAllowed && (
              <div className="mb-3 p-2 bg-neon-orange/10 border border-neon-orange/30 rounded-lg" role="alert">
                <div className="flex items-center gap-2 text-sm text-neon-orange font-medium">
                  <span className="text-lg">⚠️</span>
                  <span>{t('productionModeDisabled')}</span>
                </div>
                <div className="text-xs text-neon-orange/80 mt-1 ml-6">
                  {t('productionModeDisabledDescription')}
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              {(['production', 'speed'] as ProliferatorMode[]).map((mode) => {
                const isDisabled = mode === 'production' && !isProductionAllowed;
                return (
                  <button
                    key={mode}
                    data-testid={`proliferator-mode-button-${mode}`}
                    onClick={() => !isDisabled && handleModeChange(mode)}
                    disabled={isDisabled}
                    className={`
                      px-4 py-3 text-sm font-medium rounded-lg border-2 transition-all duration-200
                      ${isDisabled
                        ? 'bg-dark-800/30 text-space-500 border-dark-700 cursor-not-allowed opacity-50 hover:scale-100 hover:bg-dark-800/30'
                        : proliferator.mode === mode
                          ? 'bg-neon-cyan/30 text-white border-neon-cyan shadow-[0_0_20px_rgba(0,217,255,0.6),inset_0_0_20px_rgba(0,217,255,0.2)] backdrop-blur-sm font-bold scale-105 hover:scale-105'
                          : 'bg-dark-700/50 text-space-200 border-neon-cyan/20 hover:bg-neon-cyan/10 hover:border-neon-cyan/50 hover:text-neon-cyan hover:scale-105'
                      }
                    `}
                  >
                    <div className="flex flex-col items-center">
                      <span className="font-semibold">
                        {mode === 'production' ? `🏭 ${t('productionMode')}` : `⚡ ${t('speedMode')}`}
                      </span>
                      <span className="text-xs mt-1">
                        {mode === 'production' 
                          ? `+${productionBonus}% ${t('output')}`
                          : `+${speedBonus}% ${t('speed')}`
                        }
                      </span>
                      {isDisabled && (
                        <span className="text-xs text-neon-orange mt-1">{t('notAllowed')}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Stats Display */}
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
            <h4 className="text-xs font-semibold text-purple-800 dark:text-purple-300 mb-2">{t('activeEffects')}</h4>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-700 dark:text-gray-300">
                  {proliferator.mode === 'production' ? `📦 ${t('productionBonus')}:` : `⚡ ${t('speedBonus')}:`}
                </span>
                <span className="font-semibold text-purple-700 dark:text-purple-400">
                  +{proliferator.mode === 'production' ? productionBonus : speedBonus}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700 dark:text-gray-300">⚠️ {t('powerIncrease')}:</span>
                <span className="font-semibold text-orange-600 dark:text-orange-400">+{powerIncrease}%</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
