import { useSettingsStore } from '../../stores/settingsStore';
import { useTranslation } from 'react-i18next';
import type { 
  SmelterRank, 
  AssemblerRank, 
  ChemicalPlantRank, 
  MatrixLabRank 
} from '../../types/settings';
import { ItemIcon } from '../ItemIcon';
import { cn } from '../../utils/classNames';
import { getMachineById } from '../../stores/gameDataStore';

interface MachineOption {
  value: string;
  description?: string;
  iconId: number;
}

const MACHINE_OPTIONS: Record<string, MachineOption[]> = {
  Smelt: [
    { value: 'arc', description: '1x speed', iconId: 2302 },
    { value: 'plane', description: '2x speed', iconId: 2315 },
    { value: 'negentropy', description: '3x speed', iconId: 2319 },
  ],
  Assemble: [
    { value: 'mk1', description: '0.75x speed', iconId: 2303 },
    { value: 'mk2', description: '1x speed', iconId: 2304 },
    { value: 'mk3', description: '1.5x speed', iconId: 2305 },
    { value: 'recomposing', description: '3x speed', iconId: 2318 },
  ],
  Chemical: [
    { value: 'standard', description: '1x speed', iconId: 2309 },
    { value: 'quantum', description: '2x speed', iconId: 2317 },
  ],
  Research: [
    { value: 'standard', description: '1x speed', iconId: 2901 },
    { value: 'self-evolution', description: '3x speed', iconId: 2902 },
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

  const getMachineName = (iconId: number): string => {
    const machine = getMachineById(iconId);
    return machine?.name || `Unknown Machine (${iconId})`;
  };

  const handleRankChange = (
    recipeType: keyof typeof machineRank,
    rank: string
  ) => {
    setMachineRank(recipeType, rank);
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-space-200 mb-3">
        {t('selectMachineRankDesc')}
      </div>

      <div className="space-y-4">
        {/* Smelter */}
        <div>
          <label className="block text-sm font-medium text-neon-orange mb-2">
            {MACHINE_ICONS.Smelt} {MACHINE_LABELS_I18N.Smelt}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {MACHINE_OPTIONS.Smelt.map((option) => (
              <button
                key={option.value}
                data-testid={`machine-rank-button-smelt-${option.value}`}
                onClick={() => handleRankChange('Smelt', option.value as SmelterRank)}
                className={cn(
                  'px-2 py-2 text-xs font-medium rounded-lg border-2 transition-all duration-200 hover:scale-105',
                  {
                    'bg-neon-orange/30 text-white border-neon-orange shadow-[0_0_20px_rgba(255,107,53,0.6),inset_0_0_20px_rgba(255,107,53,0.2)] backdrop-blur-sm font-bold scale-105': 
                      machineRank.Smelt === option.value,
                    'bg-dark-700/50 text-space-200 border-neon-orange/20 hover:bg-neon-orange/10 hover:border-neon-orange/50 hover:text-neon-orange': 
                      machineRank.Smelt !== option.value,
                  }
                )}
              >
                <div className="flex flex-col items-center gap-1">
                  <ItemIcon itemId={option.iconId} size={28} />
                  <span className="font-semibold text-[10px] leading-tight text-center">{getMachineName(option.iconId)}</span>
                  {option.description && (
                    <span className="text-[10px] font-medium opacity-90">{option.description}</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Assembler */}
        <div>
          <label className="block text-sm font-medium text-neon-blue mb-2">
            {MACHINE_ICONS.Assemble} {MACHINE_LABELS_I18N.Assemble}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {MACHINE_OPTIONS.Assemble.map((option) => (
              <button
                key={option.value}
                data-testid={`machine-rank-button-assemble-${option.value}`}
                onClick={() => handleRankChange('Assemble', option.value as AssemblerRank)}
                className={cn(
                  'px-2 py-2 text-xs font-medium rounded-lg border-2 transition-all duration-200 hover:scale-105',
                  {
                    'bg-neon-blue/30 text-white border-neon-blue shadow-[0_0_20px_rgba(0,136,255,0.6),inset_0_0_20px_rgba(0,136,255,0.2)] backdrop-blur-sm font-bold scale-105': 
                      machineRank.Assemble === option.value,
                    'bg-dark-700/50 text-space-200 border-neon-blue/20 hover:bg-neon-blue/10 hover:border-neon-blue/50 hover:text-neon-blue': 
                      machineRank.Assemble !== option.value,
                  }
                )}
              >
                <div className="flex flex-col items-center gap-1">
                  <ItemIcon itemId={option.iconId} size={28} />
                  <span className="font-semibold text-[10px] leading-tight text-center">{getMachineName(option.iconId)}</span>
                  {option.description && (
                    <span className="text-[10px] font-medium opacity-90">{option.description}</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chemical Plant */}
        <div>
          <label className="block text-sm font-medium text-neon-green mb-2">
            {MACHINE_ICONS.Chemical} {MACHINE_LABELS_I18N.Chemical}
          </label>
          <div className="grid grid-cols-2 gap-2">
            {MACHINE_OPTIONS.Chemical.map((option) => (
              <button
                key={option.value}
                data-testid={`machine-rank-button-chemical-${option.value}`}
                onClick={() => handleRankChange('Chemical', option.value as ChemicalPlantRank)}
                className={cn(
                  'px-2 py-2 text-xs font-medium rounded-lg border-2 transition-all duration-200 hover:scale-105',
                  {
                    'bg-neon-green/30 text-white border-neon-green shadow-[0_0_20px_rgba(0,255,136,0.6),inset_0_0_20px_rgba(0,255,136,0.2)] backdrop-blur-sm font-bold scale-105': 
                      machineRank.Chemical === option.value,
                    'bg-dark-700/50 text-space-200 border-neon-green/20 hover:bg-neon-green/10 hover:border-neon-green/50 hover:text-neon-green': 
                      machineRank.Chemical !== option.value,
                  }
                )}
              >
                <div className="flex flex-col items-center gap-1">
                  <ItemIcon itemId={option.iconId} size={28} />
                  <span className="font-semibold text-[10px] leading-tight text-center">{getMachineName(option.iconId)}</span>
                  {option.description && (
                    <span className="text-[10px] font-medium opacity-90">{option.description}</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Matrix Lab */}
        <div>
          <label className="block text-sm font-medium text-neon-purple mb-2">
            {MACHINE_ICONS.Research} {MACHINE_LABELS_I18N.Research}
          </label>
          <div className="grid grid-cols-2 gap-2">
            {MACHINE_OPTIONS.Research.map((option) => (
              <button
                key={option.value}
                data-testid={`machine-rank-button-research-${option.value}`}
                onClick={() => handleRankChange('Research', option.value as MatrixLabRank)}
                className={cn(
                  'px-2 py-2 text-xs font-medium rounded-lg border-2 transition-all duration-200 hover:scale-105',
                  {
                    'bg-neon-purple/30 text-white border-neon-purple shadow-[0_0_20px_rgba(168,85,247,0.6),inset_0_0_20px_rgba(168,85,247,0.2)] backdrop-blur-sm font-bold scale-105': 
                      machineRank.Research === option.value,
                    'bg-dark-700/50 text-space-200 border-neon-purple/20 hover:bg-neon-purple/10 hover:border-neon-purple/50 hover:text-neon-purple': 
                      machineRank.Research !== option.value,
                  }
                )}
              >
                <div className="flex flex-col items-center gap-1">
                  <ItemIcon itemId={option.iconId} size={28} />
                  <span className="font-semibold text-[10px] leading-tight text-center">{getMachineName(option.iconId)}</span>
                  {option.description && (
                    <span className="text-[10px] font-medium opacity-90">{option.description}</span>
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
