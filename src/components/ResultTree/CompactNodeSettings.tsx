import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ICONS } from "../../constants/icons";
import { PROLIFERATOR_MODES } from "../../constants/proliferator";
import { CARD_GLOW, ICON_GLOW } from "../../constants/theme";
import { useNodeOverrideStore } from "../../stores/nodeOverrideStore";
import { useSettingsStore } from "../../stores/settingsStore";
import type { NodeOverrideSettings, RecipeTreeNode } from "../../types";
import type { ProliferatorMode, ProliferatorType } from "../../types/settings";
import { PROLIFERATOR_DATA } from "../../types/settings";
import { cn } from "../../utils/classNames";

interface CompactNodeSettingsProps {
  node: RecipeTreeNode;
}

export function CompactNodeSettings({ node }: CompactNodeSettingsProps) {
  const { t } = useTranslation();
  const { settings } = useSettingsStore();
  const { nodeOverrides, setNodeOverride, clearNodeOverride } = useNodeOverrideStore();

  // Get current override or use global settings
  const currentOverride = nodeOverrides.get(node.nodeId);
  const recipeType = node.recipe?.Type;

  // Normalize machineRank: convert "matrixLab" to "standard" for Research type
  const normalizeMachineRank = (
    rank: string | undefined,
    type: string | undefined
  ): string | undefined => {
    if (!rank || !type) return rank;
    if (type === "Research" && rank === "matrixLab") {
      return "standard";
    }
    return rank;
  };

  const isProductionAllowed = node.recipe?.productive !== false;
  const [useOverride, setUseOverride] = useState(() => !!currentOverride);

  // Machine rank options based on recipe type
  const getMachineRankOptions = () => {
    if (!recipeType) return [];

    const options: { value: string; label: string; iconId: number }[] = [];

    switch (recipeType) {
      case "Smelt":
        options.push(
          { value: "arc", label: t("arcSmelter"), iconId: ICONS.machine.smelter.arc },
          { value: "plane", label: t("planeSmelter"), iconId: ICONS.machine.smelter.plane },
          {
            value: "negentropy",
            label: t("negentropySmelter"),
            iconId: ICONS.machine.smelter.negentropy,
          }
        );
        break;
      case "Assemble":
        options.push(
          { value: "mk1", label: t("assemblingMachineMk1"), iconId: ICONS.machine.assembler.mk1 },
          { value: "mk2", label: t("assemblingMachineMk2"), iconId: ICONS.machine.assembler.mk2 },
          { value: "mk3", label: t("assemblingMachineMk3"), iconId: ICONS.machine.assembler.mk3 }
        );
        break;
      case "Chemical":
        options.push(
          { value: "standard", label: t("chemicalPlant"), iconId: ICONS.machine.chemical.standard },
          {
            value: "quantum",
            label: t("quantumChemicalPlant"),
            iconId: ICONS.machine.chemical.quantum,
          }
        );
        break;
      case "Research":
        options.push(
          { value: "standard", label: t("matrixLab"), iconId: ICONS.machine.research.standard },
          {
            value: "self-evolution",
            label: t("selfEvolutionLab"),
            iconId: ICONS.machine.research["self-evolution"],
          }
        );
        break;
    }

    return options;
  };

  const machineOptions = getMachineRankOptions();
  const [proliferatorType, setProliferatorType] = useState<ProliferatorType>(
    () => currentOverride?.proliferator?.type || settings.proliferator.type
  );
  const [proliferatorMode, setProliferatorMode] = useState<ProliferatorMode>(
    () => currentOverride?.proliferator?.mode || settings.proliferator.mode
  );
  const [machineRank, setMachineRank] = useState<string>(() => {
    const overrideRank = normalizeMachineRank(currentOverride?.machineRank, recipeType);
    if (overrideRank) {
      return overrideRank;
    }

    const calculatedRank = normalizeMachineRank(node.overrideSettings?.machineRank, recipeType);
    if (calculatedRank) {
      return calculatedRank;
    }

    if (recipeType && recipeType in settings.machineRank) {
      const globalRank = settings.machineRank[recipeType as keyof typeof settings.machineRank];
      if (globalRank) {
        return globalRank;
      }
    }

    return machineOptions[0]?.value || "";
  });

  // Ensure machineRank is valid (not empty and exists in options)
  const validMachineRank =
    machineRank && machineOptions.some(opt => opt.value === machineRank)
      ? machineRank
      : machineOptions.length > 0
        ? machineOptions[0].value
        : "";

  const updateOverride = (
    nextProliferatorType: ProliferatorType = proliferatorType,
    nextProliferatorMode: ProliferatorMode = proliferatorMode,
    machineRank: string = validMachineRank
  ) => {
    const overrideSettings: NodeOverrideSettings = {
      proliferator: {
        ...PROLIFERATOR_DATA[nextProliferatorType],
        mode: nextProliferatorMode,
      },
    };

    if (machineRank) {
      overrideSettings.machineRank = machineRank;
    }

    setNodeOverride(node.nodeId, overrideSettings);
  };

  return (
    <div
      className={cn(
        "bg-dark-800/50 backdrop-blur-sm rounded-lg p-3 border border-neon-purple/30",
        CARD_GLOW.purpleLight
      )}
      data-testid="compact-node-settings"
    >
      <div className="space-y-3">
        {/* Override Toggle */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-neon-purple flex items-center gap-2">
            <span>⚙️</span>
            {t("useCustomSettings")}
          </span>
          <button
            onClick={() => {
              if (useOverride) {
                setUseOverride(false);
                clearNodeOverride(node.nodeId);
              } else {
                setUseOverride(true);
                updateOverride();
              }
            }}
            role="switch"
            aria-checked={useOverride}
            aria-label={t("useCustomSettings")}
            data-testid="custom-settings-toggle"
            className={cn(
              "relative inline-flex h-4 w-7 items-center rounded-full transition-all ripple-effect",
              useOverride
                ? cn("bg-neon-purple", ICON_GLOW.purple)
                : "bg-dark-600 border border-neon-purple/30"
            )}
          >
            <span
              className={`
                inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform
                ${useOverride ? "translate-x-3.5" : "translate-x-1"}
              `}
            />
          </button>
        </div>

        {useOverride && (
          <div className="space-y-3 pt-2 border-t border-neon-purple/20">
            {/* Proliferator */}
            <div>
              <label className="block text-xs font-medium text-neon-magenta mb-1 flex items-center gap-2">
                <span>💊</span>
                {t("proliferator")}
              </label>
              <div className="space-y-2">
                {/* Type */}
                <select
                  value={proliferatorType}
                  onChange={e => {
                    const nextType = e.target.value as ProliferatorType;
                    setProliferatorType(nextType);
                    updateOverride(nextType, proliferatorMode, validMachineRank);
                  }}
                  aria-label={t("proliferator")}
                  data-testid="proliferator-type-select"
                  className={cn(
                    "w-full text-xs border border-neon-magenta/40 rounded px-2 py-1 bg-dark-700/50 text-white focus:border-neon-magenta transition-all",
                    `focus:${ICON_GLOW.magenta}`
                  )}
                  style={{
                    backgroundColor: "#1E293B",
                    color: "#FFFFFF",
                  }}
                >
                  <option value="none" style={{ backgroundColor: "#1E293B", color: "#FFFFFF" }}>
                    {t("none")}
                  </option>
                  <option value="mk1" style={{ backgroundColor: "#1E293B", color: "#FFFFFF" }}>
                    Mk.I
                  </option>
                  <option value="mk2" style={{ backgroundColor: "#1E293B", color: "#FFFFFF" }}>
                    Mk.II
                  </option>
                  <option value="mk3" style={{ backgroundColor: "#1E293B", color: "#FFFFFF" }}>
                    Mk.III
                  </option>
                </select>

                {/* Mode */}
                {proliferatorType !== "none" && (
                  <div>
                    {!isProductionAllowed && (
                      <div
                        className="mb-2 p-1.5 bg-neon-orange/10 border border-neon-orange/30 rounded text-xs"
                        role="alert"
                      >
                        <div className="flex items-center gap-1 text-neon-orange font-medium">
                          <span>⚠️</span>
                          <span>{t("productionModeDisabled")}</span>
                        </div>
                        <div className="text-neon-orange/80 mt-0.5 ml-4">
                          {t("productionModeDisabledDescription")}
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-1">
                      {PROLIFERATOR_MODES.map(mode => {
                        const isDisabled = mode === "production" && !isProductionAllowed;
                        return (
                          <button
                            key={mode}
                            onClick={() => {
                              if (!isDisabled) {
                                setProliferatorMode(mode);
                                updateOverride(proliferatorType, mode, validMachineRank);
                              }
                            }}
                            disabled={isDisabled}
                            aria-pressed={proliferatorMode === mode}
                            aria-label={`${t("mode")}: ${mode}`}
                            data-testid={`proliferator-mode-${mode}`}
                            className={cn(
                              "px-2 py-2 text-xs rounded transition-all min-h-[2rem] flex items-center justify-center ripple-effect",
                              isDisabled
                                ? "bg-dark-600 border border-neon-magenta/20 text-space-400 cursor-not-allowed opacity-50 hover:bg-dark-600"
                                : proliferatorMode === mode
                                  ? cn(
                                      "bg-neon-magenta/30 border border-neon-magenta text-white",
                                      ICON_GLOW.magenta
                                    )
                                  : "bg-dark-700/50 border border-neon-magenta/30 text-space-200 hover:border-neon-magenta/60 hover:bg-neon-magenta/10 hover:text-neon-magenta"
                            )}
                          >
                            <div className="flex items-center gap-1">
                              <span>{mode === "production" ? "🏭" : "⚡"}</span>
                              <span className="text-xs">
                                {mode === "production" ? t("productionMode") : t("speedMode")}
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

            {/* Machine Rank */}
            {machineOptions.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-neon-blue mb-1 flex items-center gap-2">
                  <span>🏭</span>
                  {t("machineRank")}
                </label>
                <select
                  value={validMachineRank}
                  onChange={e => {
                    setMachineRank(e.target.value);
                    updateOverride(proliferatorType, proliferatorMode, e.target.value);
                  }}
                  data-testid="machine-rank-select"
                  className={cn(
                    "w-full text-xs border border-neon-blue/40 rounded px-2 py-1 bg-dark-700/50 text-white focus:border-neon-blue transition-all",
                    `focus:${ICON_GLOW.blue}`
                  )}
                  style={{
                    backgroundColor: "#1E293B",
                    color: "#FFFFFF",
                  }}
                >
                  {machineOptions.map(option => (
                    <option
                      key={option.value}
                      value={option.value}
                      style={{ backgroundColor: "#1E293B", color: "#FFFFFF" }}
                    >
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {!useOverride && (
          <div className="text-center py-2 text-space-300">
            <p className="text-xs flex items-center justify-center gap-2">
              <span>🌐</span>
              {t("usingGlobalSettings")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
