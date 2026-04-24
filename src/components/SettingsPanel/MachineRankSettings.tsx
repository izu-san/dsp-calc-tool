import { useSettingsStore } from "../../stores/settingsStore";
import { useTranslation } from "react-i18next";
import type {
  SmelterRank,
  AssemblerRank,
  ChemicalPlantRank,
  MatrixLabRank,
} from "../../types/settings";
import { ItemIcon } from "../ItemIcon";
import { cn } from "../../utils/classNames";
import { getMachineById } from "../../stores/gameDataStore";
import { NEON_GLOW } from "../../constants/theme";

interface MachineOption {
  value: string;
  description?: string;
  iconId: number;
}

const MACHINE_OPTIONS: Record<string, MachineOption[]> = {
  Smelt: [
    { value: "arc", description: "1x speed", iconId: 2302 },
    { value: "plane", description: "2x speed", iconId: 2315 },
    { value: "negentropy", description: "3x speed", iconId: 2319 },
  ],
  Assemble: [
    { value: "mk1", description: "0.75x speed", iconId: 2303 },
    { value: "mk2", description: "1x speed", iconId: 2304 },
    { value: "mk3", description: "1.5x speed", iconId: 2305 },
    { value: "recomposing", description: "3x speed", iconId: 2318 },
  ],
  Chemical: [
    { value: "standard", description: "1x speed", iconId: 2309 },
    { value: "quantum", description: "2x speed", iconId: 2317 },
  ],
  Research: [
    { value: "standard", description: "1x speed", iconId: 2901 },
    { value: "self-evolution", description: "3x speed", iconId: 2902 },
  ],
};

export function MachineRankSettings() {
  const { t } = useTranslation();
  const { settings, setMachineRank } = useSettingsStore();
  const { machineRank } = settings;

  const MACHINE_LABELS_I18N: Record<string, string> = {
    Smelt: t("smelter"),
    Assemble: t("assembler"),
    Chemical: t("chemicalPlant"),
    Research: t("matrixLab"),
    Refine: t("oilRefinery"),
    Particle: t("particleCollider"),
  };

  const getMachineName = (iconId: number): string => {
    const machine = getMachineById(iconId);
    return machine?.name || `Unknown Machine (${iconId})`;
  };

  const handleRankChange = (recipeType: keyof typeof machineRank, rank: string) => {
    setMachineRank(recipeType, rank);
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-space-200 mb-3">{t("selectMachineRankDesc")}</div>

      <div className="space-y-4">
        {/* Smelter */}
        <div>
          <label className="block text-sm font-medium text-space-100 mb-2">
            {MACHINE_LABELS_I18N.Smelt}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {MACHINE_OPTIONS.Smelt.map(option => (
              <button
                key={option.value}
                data-testid={`machine-rank-button-smelt-${option.value}`}
                onClick={() => handleRankChange("Smelt", option.value as SmelterRank)}
                aria-pressed={machineRank.Smelt === option.value}
                className={cn(
                  "relative px-2 py-2 text-xs font-medium rounded-md border transition-colors",
                  machineRank.Smelt === option.value &&
                    cn(
                      "bg-primary-900/55 text-white border-primary-300 font-semibold ring-1 ring-primary-300/70",
                      NEON_GLOW.orangeStrong
                    ),
                  machineRank.Smelt !== option.value &&
                    "bg-dark-700/60 text-space-200 border-space-700 hover:bg-dark-600 hover:border-space-500 hover:text-space-100"
                )}
              >
                {machineRank.Smelt === option.value && (
                  <span
                    className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-sm bg-primary-300 text-[11px] font-bold leading-none text-dark-900"
                    aria-hidden="true"
                  >
                    ✓
                  </span>
                )}
                <div className="flex flex-col items-center gap-1">
                  <ItemIcon itemId={option.iconId} size={28} />
                  <span className="font-semibold text-[10px] leading-tight text-center">
                    {getMachineName(option.iconId)}
                  </span>
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
          <label className="block text-sm font-medium text-space-100 mb-2">
            {MACHINE_LABELS_I18N.Assemble}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {MACHINE_OPTIONS.Assemble.map(option => (
              <button
                key={option.value}
                data-testid={`machine-rank-button-assemble-${option.value}`}
                onClick={() => handleRankChange("Assemble", option.value as AssemblerRank)}
                aria-pressed={machineRank.Assemble === option.value}
                className={cn(
                  "relative px-2 py-2 text-xs font-medium rounded-md border transition-colors",
                  machineRank.Assemble === option.value &&
                    cn(
                      "bg-primary-900/55 text-white border-primary-300 font-semibold ring-1 ring-primary-300/70",
                      NEON_GLOW.blueStrong
                    ),
                  machineRank.Assemble !== option.value &&
                    "bg-dark-700/60 text-space-200 border-space-700 hover:bg-dark-600 hover:border-space-500 hover:text-space-100"
                )}
              >
                {machineRank.Assemble === option.value && (
                  <span
                    className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-sm bg-primary-300 text-[11px] font-bold leading-none text-dark-900"
                    aria-hidden="true"
                  >
                    ✓
                  </span>
                )}
                <div className="flex flex-col items-center gap-1">
                  <ItemIcon itemId={option.iconId} size={28} />
                  <span className="font-semibold text-[10px] leading-tight text-center">
                    {getMachineName(option.iconId)}
                  </span>
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
          <label className="block text-sm font-medium text-space-100 mb-2">
            {MACHINE_LABELS_I18N.Chemical}
          </label>
          <div className="grid grid-cols-2 gap-2">
            {MACHINE_OPTIONS.Chemical.map(option => (
              <button
                key={option.value}
                data-testid={`machine-rank-button-chemical-${option.value}`}
                onClick={() => handleRankChange("Chemical", option.value as ChemicalPlantRank)}
                aria-pressed={machineRank.Chemical === option.value}
                className={cn(
                  "relative px-2 py-2 text-xs font-medium rounded-md border transition-colors",
                  machineRank.Chemical === option.value &&
                    cn(
                      "bg-primary-900/55 text-white border-primary-300 font-semibold ring-1 ring-primary-300/70",
                      NEON_GLOW.greenStrong
                    ),
                  machineRank.Chemical !== option.value &&
                    "bg-dark-700/60 text-space-200 border-space-700 hover:bg-dark-600 hover:border-space-500 hover:text-space-100"
                )}
              >
                {machineRank.Chemical === option.value && (
                  <span
                    className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-sm bg-primary-300 text-[11px] font-bold leading-none text-dark-900"
                    aria-hidden="true"
                  >
                    ✓
                  </span>
                )}
                <div className="flex flex-col items-center gap-1">
                  <ItemIcon itemId={option.iconId} size={28} />
                  <span className="font-semibold text-[10px] leading-tight text-center">
                    {getMachineName(option.iconId)}
                  </span>
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
          <label className="block text-sm font-medium text-space-100 mb-2">
            {MACHINE_LABELS_I18N.Research}
          </label>
          <div className="grid grid-cols-2 gap-2">
            {MACHINE_OPTIONS.Research.map(option => (
              <button
                key={option.value}
                data-testid={`machine-rank-button-research-${option.value}`}
                onClick={() => handleRankChange("Research", option.value as MatrixLabRank)}
                aria-pressed={machineRank.Research === option.value}
                className={cn(
                  "relative px-2 py-2 text-xs font-medium rounded-md border transition-colors",
                  machineRank.Research === option.value &&
                    cn(
                      "bg-primary-900/55 text-white border-primary-300 font-semibold ring-1 ring-primary-300/70",
                      NEON_GLOW.purpleStrong
                    ),
                  machineRank.Research !== option.value &&
                    "bg-dark-700/60 text-space-200 border-space-700 hover:bg-dark-600 hover:border-space-500 hover:text-space-100"
                )}
              >
                {machineRank.Research === option.value && (
                  <span
                    className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-sm bg-primary-300 text-[11px] font-bold leading-none text-dark-900"
                    aria-hidden="true"
                  >
                    ✓
                  </span>
                )}
                <div className="flex flex-col items-center gap-1">
                  <ItemIcon itemId={option.iconId} size={28} />
                  <span className="font-semibold text-[10px] leading-tight text-center">
                    {getMachineName(option.iconId)}
                  </span>
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
