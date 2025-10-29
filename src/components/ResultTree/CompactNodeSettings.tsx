import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ICONS } from "../../constants/icons";
import { useNodeOverrideStore } from "../../stores/nodeOverrideStore";
import { useSettingsStore } from "../../stores/settingsStore";
import type { NodeOverrideSettings, RecipeTreeNode } from "../../types";
import type { ProliferatorMode, ProliferatorType } from "../../types/settings";
import { PROLIFERATOR_DATA } from "../../types/settings";

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
  const [proliferatorType, setProliferatorType] = useState<ProliferatorType>(
    () => currentOverride?.proliferator?.type || settings.proliferator.type
  );
  const [proliferatorMode, setProliferatorMode] = useState<ProliferatorMode>(
    () => currentOverride?.proliferator?.mode || settings.proliferator.mode
  );
  const [machineRank, setMachineRank] = useState<string>(() => currentOverride?.machineRank || "");

  useEffect(() => {
    const override = nodeOverrides.get(node.nodeId);
    const hasOverride = !!override;

    // Only update if the override state has actually changed
    if (hasOverride !== useOverride) {
      setUseOverride(hasOverride);
    }

    // Only update values if we don't have an override
    if (!hasOverride) {
      setProliferatorType(settings.proliferator.type);
      setProliferatorMode(settings.proliferator.mode);
      setMachineRank("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node.nodeId, settings.proliferator.type, settings.proliferator.mode, nodeOverrides]);

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
  }, [
    useOverride,
    proliferatorType,
    proliferatorMode,
    machineRank,
    node.nodeId,
    node.recipe?.SID,
    setNodeOverride,
  ]);

  const recipeType = node.recipe?.Type;
  const isProductionAllowed = node.recipe?.productive !== false;

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
          { value: "matrixLab", label: t("matrixLab"), iconId: ICONS.machine.research.standard },
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

  return (
    <div
      className="bg-dark-800/50 backdrop-blur-sm rounded-lg p-3 border border-neon-purple/30 shadow-[0_0_15px_rgba(168,85,247,0.2)]"
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
            aria-label={t("useCustomSettings")}
            data-testid="custom-settings-toggle"
            className={`
              relative inline-flex h-4 w-7 items-center rounded-full transition-all ripple-effect
              ${
                useOverride
                  ? "bg-neon-purple shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                  : "bg-dark-600 border border-neon-purple/30"
              }
            `}
          >
            <span
              className={`
                inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform shadow-[0_0_5px_rgba(255,255,255,0.3)]
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
                    setProliferatorType(e.target.value as ProliferatorType);
                  }}
                  aria-label={t("proliferator")}
                  data-testid="proliferator-type-select"
                  className="w-full text-xs border border-neon-magenta/40 rounded px-2 py-1 bg-dark-700/50 text-white focus:border-neon-magenta focus:shadow-[0_0_10px_rgba(233,53,255,0.3)] transition-all"
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
                      {(["production", "speed"] as ProliferatorMode[]).map(mode => {
                        const isDisabled = mode === "production" && !isProductionAllowed;
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
                            aria-label={`${t("mode")}: ${mode}`}
                            data-testid={`proliferator-mode-${mode}`}
                            className={`
                            px-2 py-2 text-xs rounded transition-all min-h-[2rem] flex items-center justify-center ripple-effect
                            ${
                              isDisabled
                                ? "bg-dark-600 border border-neon-magenta/20 text-space-400 cursor-not-allowed opacity-50 hover:bg-dark-600"
                                : proliferatorMode === mode
                                  ? "bg-neon-magenta/30 border border-neon-magenta text-white shadow-[0_0_10px_rgba(233,53,255,0.4)]"
                                  : "bg-dark-700/50 border border-neon-magenta/30 text-space-200 hover:border-neon-magenta/60 hover:bg-neon-magenta/10 hover:text-neon-magenta"
                            }
                          `}
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
                  value={machineRank}
                  onChange={e => {
                    setMachineRank(e.target.value);
                  }}
                  data-testid="machine-rank-select"
                  className="w-full text-xs border border-neon-blue/40 rounded px-2 py-1 bg-dark-700/50 text-white focus:border-neon-blue focus:shadow-[0_0_10px_rgba(0,136,255,0.3)] transition-all"
                  style={{
                    backgroundColor: "#1E293B",
                    color: "#FFFFFF",
                  }}
                >
                  <option value="" style={{ backgroundColor: "#1E293B", color: "#FFFFFF" }}>
                    {t("none")}
                  </option>
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
