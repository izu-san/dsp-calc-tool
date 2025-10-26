import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '../../stores/settingsStore';
import { calculateRayTransmissionEfficiency, getMaxMeaningfulResearchLevel } from '../../lib/photonGenerationCalculation';
import { PROLIFERATOR_DATA, type ProliferatorType } from '../../types/settings';
import { ItemIcon } from '../ItemIcon';

// Proliferator item IDs
const PROLIFERATOR_IDS: Record<ProliferatorType, number | null> = {
  none: null,
  mk1: 1141,
  mk2: 1142,
  mk3: 1143,
};

export function PhotonGenerationSettings() {
  const { t } = useTranslation();
  const { settings, setPhotonGenerationSetting } = useSettingsStore();
  const { photonGeneration } = settings;

  const maxResearchLevel = getMaxMeaningfulResearchLevel();
  const currentEfficiency = calculateRayTransmissionEfficiency(photonGeneration.rayTransmissionEfficiency);

  const handleProliferatorChange = (type: ProliferatorType) => {
    // 重力子レンズへの増産剤は速度上昇モードのみ
    const config = {
      ...PROLIFERATOR_DATA[type],
      mode: 'speed' as const,
    };
    setPhotonGenerationSetting('gravitonLensProliferator', config);
  };

  const speedBonus = (photonGeneration.gravitonLensProliferator.speedBonus * 100).toFixed(1);
  const powerIncrease = (photonGeneration.gravitonLensProliferator.powerIncrease * 100).toFixed(1);

  return (
    <div className="space-y-4">
      {/* 重力子レンズの使用 */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={photonGeneration.useGravitonLens}
          onChange={(e) => setPhotonGenerationSetting('useGravitonLens', e.target.checked)}
          className="w-4 h-4 rounded border-neon-magenta/30 bg-dark-800 text-neon-magenta focus:ring-2 focus:ring-neon-magenta/50"
        />
        <span className="text-sm">{t('useGravitonLens')}</span>
      </label>

      {/* 重力子レンズへの増産剤 */}
      {photonGeneration.useGravitonLens && (
        <div className="ml-6 space-y-2 border-l-2 border-neon-magenta/30 pl-4">
          <label className="text-sm font-medium text-neon-magenta">
            {t('gravitonLensProliferator')} <span className="text-xs text-yellow-500">({t('speedMode')} {t('only')})</span>
          </label>
          <div className="grid grid-cols-4 gap-2">
            {(['none', 'mk1', 'mk2', 'mk3'] as ProliferatorType[]).map((type) => {
              const iconId = PROLIFERATOR_IDS[type];
              const isSelected = photonGeneration.gravitonLensProliferator.type === type;
              const getLabel = (pType: ProliferatorType) => {
                if (pType === 'none') return t('none');
                return t(`proliferator${pType.toUpperCase()}`);
              };
              return (
                <button
                  key={type}
                  onClick={() => handleProliferatorChange(type)}
                  className={`
                    px-3 py-2 text-sm font-medium rounded-lg border-2 transition-all duration-200 hover:scale-105
                    ${isSelected
                      ? 'bg-neon-magenta/30 text-white border-neon-magenta shadow-[0_0_20px_rgba(233,53,255,0.6),inset_0_0_20px_rgba(233,53,255,0.2)] backdrop-blur-sm font-bold scale-105'
                      : 'bg-dark-700/50 text-space-200 border-neon-magenta/20 hover:bg-neon-magenta/10 hover:border-neon-magenta/50 hover:text-neon-magenta'
                    }
                  `}
                >
                  <div className="flex flex-col items-center gap-1">
                    {iconId && <ItemIcon itemId={iconId} size={24} />}
                    <span className="text-xs leading-tight text-center">{getLabel(type)}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* 増産剤の効果表示 */}
          {photonGeneration.gravitonLensProliferator.type !== 'none' && (
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-800 mt-2">
              <h4 className="text-xs font-semibold text-purple-800 dark:text-purple-300 mb-2">{t('activeEffects')}</h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-700 dark:text-gray-300">⚡ {t('speedBonus')}:</span>
                  <span className="font-semibold text-purple-700 dark:text-purple-400">+{speedBonus}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700 dark:text-gray-300">⚠️ {t('powerIncrease')}:</span>
                  <span className="font-semibold text-orange-600 dark:text-orange-400">+{powerIncrease}%</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 放射線伝送効率研究レベル */}
      <div className="space-y-2">
        <label className="text-sm font-medium block">
          {t('rayTransmissionEfficiency')}: {t('researchLevel')} {photonGeneration.rayTransmissionEfficiency}
        </label>
        <input
          type="range"
          min="0"
          max={maxResearchLevel}
          step="1"
          value={photonGeneration.rayTransmissionEfficiency}
          onChange={(e) => setPhotonGenerationSetting('rayTransmissionEfficiency', Number(e.target.value))}
          className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-dark-600 border border-neon-cyan/40"
          style={{
            backgroundImage: `linear-gradient(to right, rgb(0, 217, 255) 0%, rgb(0, 217, 255) ${(photonGeneration.rayTransmissionEfficiency / maxResearchLevel) * 100}%, rgb(30, 41, 59) ${(photonGeneration.rayTransmissionEfficiency / maxResearchLevel) * 100}%, rgb(30, 41, 59) 100%)`
          }}
        />
        <div className="flex justify-between text-xs text-space-300 mt-1">
          <span>0%</span>
          <span className="text-neon-cyan">
            {t('rayTransmissionEfficiencyValue')}: {(currentEfficiency * 100).toFixed(2)}%
          </span>
          <span>100% <span className="text-gray-500">(Lv: {maxResearchLevel})</span></span>
        </div>
      </div>

      {/* 注意事項 */}
      <p className="text-xs text-yellow-500 bg-yellow-500/10 border border-yellow-500/30 rounded p-2">
        ⚠️ {t('continuousReceptionFixed')}
      </p>
    </div>
  );
}
