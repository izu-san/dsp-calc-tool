import { useSettingsStore } from '../../stores/settingsStore';
import { useTranslation } from 'react-i18next';
import type { 
  SmelterRank, 
  AssemblerRank, 
  ChemicalPlantRank, 
  MatrixLabRank 
} from '../../types/settings';
import { ItemIcon } from '../ItemIcon';

interface MachineOption {
  value: string;
  label: string;
  description?: string;
  iconId: number;
}

const MACHINE_OPTIONS: Record<string, MachineOption[]> = {
  Smelt: [
    { value: 'arc', label: 'Arc Smelter', description: '1x speed', iconId: 2302 },
    { value: 'plane', label: 'Plane Smelter', description: '2x speed', iconId: 2315 },
    { value: 'negentropy', label: 'Negentropy Smelter', description: '3x speed', iconId: 2319 },
  ],
  Assemble: [
    { value: 'mk1', label: 'Assembling Machine Mk.I', description: '0.75x speed', iconId: 2303 },
    { value: 'mk2', label: 'Assembling Machine Mk.II', description: '1x speed', iconId: 2304 },
    { value: 'mk3', label: 'Assembling Machine Mk.III', description: '1.5x speed', iconId: 2305 },
    { value: 'recomposing', label: 'Re-composing Assembler', description: '3x speed', iconId: 2318 },
  ],
  Chemical: [
    { value: 'standard', label: 'Chemical Plant', description: '1x speed', iconId: 2309 },
    { value: 'quantum', label: 'Quantum Chemical Plant', description: '2x speed', iconId: 2317 },
  ],
  Research: [
    { value: 'standard', label: 'Matrix Lab', description: '1x speed', iconId: 2901 },
    { value: 'self-evolution', label: 'Self-evolution Lab', description: '3x speed', iconId: 2902 },
  ],
};

const MACHINE_ICONS: Record<string, string> = {
  Smelt: '🔥',
  Assemble: '⚙️',
  Chemical: '🧪',
  Research: '🔬',
  Refine: '🛢️',
  Particle: '⚛️',
};

export function MachineRankSettings() {
  const { t } = useTranslation();
  const { settings, setMachineRank } = useSettingsStore();
  const { machineRank } = settings;

  const MACHINE_LABELS_I18N: Record<string, string> = {
    Smelt: t('smelter'),
    Assemble: t('assembler'),
    Chemical: t('chemicalPlant'),
    Research: t('matrixLab'),
    Refine: t('oilRefinery'),
    Particle: t('particleCollider'),
  };

  const getMachineName = (originalLabel: string): string => {
    const keyMap: Record<string, string> = {
      'Arc Smelter': 'arcSmelter',
      'Plane Smelter': 'planeSmelter',
      'Negentropy Smelter': 'negentropySmelter',
      'Assembling Machine Mk.I': 'assemblingMachineMk1',
      'Assembling Machine Mk.II': 'assemblingMachineMk2',
      'Assembling Machine Mk.III': 'assemblingMachineMk3',
      'Re-composing Assembler': 'recomposingAssembler',
      'Chemical Plant': 'chemicalPlantStandard',
      'Quantum Chemical Plant': 'quantumChemicalPlant',
      'Matrix Lab': 'matrixLabStandard',
      'Self-evolution Lab': 'selfEvolutionLab',
    };
    const key = keyMap[originalLabel];
    return key ? t(key) : originalLabel;
  };

  const handleRankChange = (
    recipeType: keyof typeof machineRank,
    rank: string
  ) => {
    setMachineRank(recipeType, rank);
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
        {t('selectMachineRankDesc')}
      </div>

      <div className="space-y-4">
        {/* Smelter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {MACHINE_ICONS.Smelt} {MACHINE_LABELS_I18N.Smelt}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {MACHINE_OPTIONS.Smelt.map((option) => (
              <button
                key={option.value}
                onClick={() => handleRankChange('Smelt', option.value as SmelterRank)}
                className={`
                  px-2 py-2 text-xs font-medium rounded-lg border transition-all duration-200
                  ${machineRank.Smelt === option.value
                    ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border-orange-400 dark:border-orange-600 ring-2 ring-orange-300 dark:ring-orange-700'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                  }
                `}
              >
                <div className="flex flex-col items-center gap-1">
                  <ItemIcon itemId={option.iconId} size={28} />
                  <span className="font-semibold text-[10px] leading-tight text-center">{getMachineName(option.label)}</span>
                  {option.description && (
                    <span className="text-[10px] font-medium opacity-85 text-gray-600 dark:text-gray-400">{option.description}</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Assembler */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {MACHINE_ICONS.Assemble} {MACHINE_LABELS_I18N.Assemble}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {MACHINE_OPTIONS.Assemble.map((option) => (
              <button
                key={option.value}
                onClick={() => handleRankChange('Assemble', option.value as AssemblerRank)}
                className={`
                  px-2 py-2 text-xs font-medium rounded-lg border transition-all duration-200
                  ${machineRank.Assemble === option.value
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-400 dark:border-blue-600 ring-2 ring-blue-300 dark:ring-blue-700'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                  }
                `}
              >
                <div className="flex flex-col items-center gap-1">
                  <ItemIcon itemId={option.iconId} size={28} />
                  <span className="font-semibold text-[10px] leading-tight text-center">{getMachineName(option.label)}</span>
                  {option.description && (
                    <span className="text-[10px] font-medium opacity-85 text-gray-600 dark:text-gray-400">{option.description}</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chemical Plant */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {MACHINE_ICONS.Chemical} {MACHINE_LABELS_I18N.Chemical}
          </label>
          <div className="grid grid-cols-2 gap-2">
            {MACHINE_OPTIONS.Chemical.map((option) => (
              <button
                key={option.value}
                onClick={() => handleRankChange('Chemical', option.value as ChemicalPlantRank)}
                className={`
                  px-2 py-2 text-xs font-medium rounded-lg border transition-all duration-200
                  ${machineRank.Chemical === option.value
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-400 dark:border-green-600 ring-2 ring-green-300 dark:ring-green-700'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                  }
                `}
              >
                <div className="flex flex-col items-center gap-1">
                  <ItemIcon itemId={option.iconId} size={28} />
                  <span className="font-semibold text-[10px] leading-tight text-center">{getMachineName(option.label)}</span>
                  {option.description && (
                    <span className="text-[10px] font-medium opacity-85 text-gray-600 dark:text-gray-400">{option.description}</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Matrix Lab */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {MACHINE_ICONS.Research} {MACHINE_LABELS_I18N.Research}
          </label>
          <div className="grid grid-cols-2 gap-2">
            {MACHINE_OPTIONS.Research.map((option) => (
              <button
                key={option.value}
                onClick={() => handleRankChange('Research', option.value as MatrixLabRank)}
                className={`
                  px-2 py-2 text-xs font-medium rounded-lg border transition-all duration-200
                  ${machineRank.Research === option.value
                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-purple-400 dark:border-purple-600 ring-2 ring-purple-300 dark:ring-purple-700'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                  }
                `}
              >
                <div className="flex flex-col items-center gap-1">
                  <ItemIcon itemId={option.iconId} size={28} />
                  <span className="font-semibold text-[10px] leading-tight text-center">{getMachineName(option.label)}</span>
                  {option.description && (
                    <span className="text-[10px] font-medium opacity-85 text-gray-600 dark:text-gray-400">{option.description}</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
