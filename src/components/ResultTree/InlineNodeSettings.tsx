import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ICONS } from "../../constants/icons";
import { useNodeOverrideStore } from "../../stores/nodeOverrideStore";
import { useSettingsStore } from "../../stores/settingsStore";
import type { NodeOverrideSettings, RecipeTreeNode } from "../../types";
import type { ProliferatorMode, ProliferatorType } from "../../types/settings";
import { PROLIFERATOR_DATA } from "../../types/settings";
import { ItemIcon } from "../ItemIcon";

interface InlineNodeSettingsProps {
  node: RecipeTreeNode;
  isExpanded: boolean;
  onToggle: () => void;
}

export function InlineNodeSettings({ node, isExpanded, onToggle }: InlineNodeSettingsProps) {
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
  const [machineRank, setMachineRank] = useState<string>(currentOverride?.machineRank || "");

  useEffect(() => {
    if (isExpanded) {
      // Sync state when expanded
      const override = nodeOverrides.get(node.nodeId);
      // Use queueMicrotask to defer state updates
      queueMicrotask(() => {
        setUseOverride(!!override);
        setProliferatorType(override?.proliferator?.type || settings.proliferator.type);
        setProliferatorMode(override?.proliferator?.mode || settings.proliferator.mode);
        setMachineRank(override?.machineRank || "");
      });
    }
  }, [isExpanded, node.nodeId, nodeOverrides, settings]);

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
    onToggle(); // Close the inline settings
  };

  const handleReset = () => {
    setUseOverride(false);
    setProliferatorType(settings.proliferator.type);
    setProliferatorMode(settings.proliferator.mode);
    setMachineRank("");
    clearNodeOverride(node.nodeId);
    onToggle();
  };

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
            value: "negentropySmelter",
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

  if (!isExpanded) return null;

  return (
    <div
      className="mt-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
      data-testid="inline-node-settings"
    >
      <div className="space-y-4">
        {/* Override Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-gray-900 dark:text-white text-sm">
              {t("useCustomSettings")}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {t("overrideGlobalSettingsForNode")}
            </div>
          </div>
          <button
            onClick={() => setUseOverride(!useOverride)}
            role="switch"
            aria-checked={useOverride}
            aria-label={t("useCustomSettings")}
            data-testid="custom-settings-toggle"
            className={`
              relative inline-flex h-5 w-9 items-center rounded-full transition-colors
              ${useOverride ? "bg-blue-600 dark:bg-blue-500" : "bg-gray-300 dark:bg-gray-600"}
            `}
          >
            <span
              className={`
                inline-block h-3 w-3 transform rounded-full bg-white transition-transform
                ${useOverride ? "translate-x-5" : "translate-x-1"}
              `}
            />
          </button>
        </div>

        {useOverride && (
          <>
            {/* Proliferator Settings */}
            <div>
              <h5 className="font-medium text-gray-900 dark:text-white mb-2 text-sm">
                💊 {t("proliferator")}
              </h5>

              {/* Type Selection */}
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("type")}
                </label>
                <div className="grid grid-cols-4 gap-1">
                  {(["none", "mk1", "mk2", "mk3"] as ProliferatorType[]).map(type => (
                    <button
                      key={type}
                      onClick={() => setProliferatorType(type)}
                      aria-pressed={proliferatorType === type}
                      aria-label={`${t("proliferator")} ${type}`}
                      data-testid={`proliferator-type-${type}`}
                      className={`
                        px-2 py-1.5 text-xs font-medium rounded border transition-all
                        ${
                          proliferatorType === type
                            ? "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-purple-400 dark:border-purple-600"
                            : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
                        }
                      `}
                    >
                      {type === "none" ? t("none") : type.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mode Selection */}
              {proliferatorType !== "none" && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t("mode")}
                  </label>
                  {!isProductionAllowed && (
                    <div
                      className="mb-2 p-1.5 bg-orange-100 dark:bg-orange-900/20 border border-orange-300 dark:border-orange-700 rounded text-xs"
                      role="alert"
                    >
                      <div className="flex items-center gap-1 text-orange-800 dark:text-orange-300 font-medium">
                        <span>⚠️</span>
                        <span>{t("productionModeDisabled")}</span>
                      </div>
                      <div className="text-orange-700 dark:text-orange-400 mt-0.5 ml-4">
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
                          onClick={() => !isDisabled && setProliferatorMode(mode)}
                          disabled={isDisabled}
                          aria-pressed={proliferatorMode === mode}
                          aria-label={`${t("mode")}: ${mode}`}
                          data-testid={`proliferator-mode-${mode}`}
                          className={`
                            px-2 py-1.5 text-xs font-medium rounded border transition-all
                            ${
                              isDisabled
                                ? "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-700 cursor-not-allowed opacity-50 hover:bg-gray-100 dark:hover:bg-gray-800"
                                : proliferatorMode === mode
                                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-400 dark:border-blue-600"
                                  : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
                            }
                          `}
                        >
                          {mode === "production" ? `🏭 ${t("production")}` : `⚡ ${t("speed")}`}
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
                <h5 className="font-medium text-gray-900 dark:text-white mb-2 text-sm">
                  🏭 {t("machineRank")}
                </h5>
                <div className="grid grid-cols-3 gap-1">
                  {machineOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => setMachineRank(option.value)}
                      data-testid={`machine-rank-${option.value}`}
                      className={`
                        px-2 py-1.5 text-xs font-medium rounded border transition-all
                        ${
                          machineRank === option.value
                            ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-400 dark:border-blue-600"
                            : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
                        }
                      `}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <ItemIcon itemId={option.iconId} size={16} />
                        <span className="text-[10px] leading-none">
                          {option.label.split(" ").pop()}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {!useOverride && (
          <div className="text-center py-4 text-gray-500 dark:text-gray-400">
            <p className="text-sm">{t("usingGlobalSettings")}</p>
            <p className="text-xs mt-1">{t("enableCustomSettingsToOverride")}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-600">
          <button
            onClick={handleReset}
            data-testid="reset-to-global-button"
            className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            {t("resetToGlobal")}
          </button>
          <div className="flex gap-2">
            <button
              onClick={onToggle}
              data-testid="cancel-button"
              className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-500"
            >
              {t("cancel")}
            </button>
            <button
              onClick={handleSave}
              data-testid="apply-settings-button"
              className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 dark:bg-blue-700 rounded hover:bg-blue-700 dark:hover:bg-blue-600"
            >
              {t("apply")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
