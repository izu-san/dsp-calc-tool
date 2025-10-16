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
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                onClick={() => handleTypeChange(type)}
                className={`
                  px-3 py-2 text-sm font-medium rounded-lg border transition-all duration-200
                  ${proliferator.type === type
                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-purple-400 dark:border-purple-600 ring-2 ring-purple-300 dark:ring-purple-700'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('proliferatorMode')} <span className="text-xs text-gray-500 dark:text-gray-400">({t('exclusive')})</span>
              {!isProductionAllowed && (
                <span className="ml-2 text-xs text-orange-600 dark:text-orange-400 font-medium">
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
                    onClick={() => !isDisabled && handleModeChange(mode)}
                    disabled={isDisabled}
                    className={`
                      px-4 py-3 text-sm font-medium rounded-lg border transition-all duration-200
                      ${isDisabled
                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-700 cursor-not-allowed opacity-60'
                        : proliferator.mode === mode
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-400 dark:border-blue-600 ring-2 ring-blue-300 dark:ring-blue-700'
                          : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
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
                        <span className="text-xs text-red-500 dark:text-red-400 mt-1">{t('notAllowed')}</span>
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
