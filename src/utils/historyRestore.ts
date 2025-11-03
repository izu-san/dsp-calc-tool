import { useGameDataStore } from "../stores/gameDataStore";
import { useMiningSettingsStore } from "../stores/miningSettingsStore";
import { useNodeOverrideStore } from "../stores/nodeOverrideStore";
import { useRecipeSelectionStore } from "../stores/recipeSelectionStore";
import { useSettingsStore } from "../stores/settingsStore";
import type { CustomSettingsTemplate, NodeOverrideSettings } from "../types";
import type { HistoryEntry } from "../types/history";
import { PROLIFERATOR_DATA } from "../types/settings";
import { setRestoring } from "./historyRecorder";
import { deserializeSettings } from "./storageSerializer";

/**
 * Restore state from history entry
 * @param entry - History entry to restore
 */
export function restoreStateFromHistory(entry: HistoryEntry, isUndo: boolean = false): void {
  // Set restoring flag to prevent recording new history entries during restoration
  setRestoring(true);

  // Get all store functions and state at the start
  const setAllOverrides = useNodeOverrideStore.getState().setAllOverrides;
  const setTargetQuantity = useRecipeSelectionStore.getState().setTargetQuantity;
  const setSelectedRecipe = useRecipeSelectionStore.getState().setSelectedRecipe;
  const setCalculationResult = useRecipeSelectionStore.getState().setCalculationResult;
  const setMiningSettings = useMiningSettingsStore.getState().setSettings;
  const setPowerGenerationTemplate = useSettingsStore.getState().setPowerGenerationTemplate;
  const setManualPowerGenerator = useSettingsStore.getState().setManualPowerGenerator;
  const setManualPowerFuel = useSettingsStore.getState().setManualPowerFuel;
  const setPowerFuelProliferator = useSettingsStore.getState().setPowerFuelProliferator;
  const setSelectedTemplate = useSettingsStore.getState().setSelectedTemplate;
  const data = useGameDataStore.getState().data;

  // Use previousChanges for undo, changes for redo
  const changesToApply = isUndo ? entry.previousChanges || entry.changes : entry.changes;

  // Collect all settings changes first
  const settingsChanges: Record<string, unknown> = {};
  let hasSettingsChanges = false;

  // Collect mining settings changes
  const miningSettingsChanges: Record<string, unknown> = {};
  let hasMiningSettingsChanges = false;

  // Store completeSettings outside try block for use after finally
  let completeSettings: import("../types").GlobalSettings | null = null;

  try {
    // Process each change
    for (const [path, value] of Object.entries(changesToApply)) {
      if (path.startsWith("settings.")) {
        // Collect settings changes
        const settingPath = path.replace("settings.", "");
        settingsChanges[settingPath] = value;
        hasSettingsChanges = true;
      } else if (path.startsWith("miningSettings.")) {
        // Collect mining settings changes
        const miningSettingPath = path.replace("miningSettings.", "");
        miningSettingsChanges[miningSettingPath] = value;
        hasMiningSettingsChanges = true;
      } else if (path === "powerGenerationTemplate") {
        // Power generation template change - does NOT affect production chain
        if (typeof value === "string") {
          setPowerGenerationTemplate(value as import("../types/settings").GameTemplate);
        }
      } else if (path === "manualPowerGenerator") {
        // Manual power generator change - does NOT affect production chain
        setManualPowerGenerator(
          value as import("../types/power-generation").PowerGeneratorType | null
        );
      } else if (path === "manualPowerFuel") {
        // Manual power fuel change - does NOT affect production chain
        setManualPowerFuel(value as string | null);
      } else if (path.startsWith("powerFuelProliferator.")) {
        // Power fuel proliferator change - does NOT affect production chain
        const propertyPath = path.replace("powerFuelProliferator.", "");
        const currentProliferator = useSettingsStore.getState().powerFuelProliferator;
        if (propertyPath === "type" && typeof value === "string") {
          setPowerFuelProliferator(
            value as keyof typeof PROLIFERATOR_DATA,
            currentProliferator.mode
          );
        } else if (propertyPath === "mode" && typeof value === "string") {
          setPowerFuelProliferator(
            currentProliferator.type as keyof typeof PROLIFERATOR_DATA,
            value as "production" | "speed"
          );
        }
      } else if (path.startsWith("nodeOverrides.")) {
        // Node override change
        // Path format: "nodeOverrides.nodeId" or "nodeOverrides.nodeId.property"
        const pathAfterPrefix = path.replace("nodeOverrides.", "");
        const pathParts = pathAfterPrefix.split(".");
        const nodeId = pathParts[0];

        const currentOverrides = useNodeOverrideStore.getState().nodeOverrides;
        const newOverrides = new Map(currentOverrides);
        const currentOverride = newOverrides.get(nodeId) || {};

        if (pathParts.length === 1) {
          // Direct node override replacement or deletion
          if (value === undefined || value === null) {
            // Delete override
            newOverrides.delete(nodeId);
          } else {
            // Replace entire override
            newOverrides.set(nodeId, value as NodeOverrideSettings);
          }
        } else {
          // Nested property change (e.g., "nodeOverrides.nodeId.machineRank")
          const propertyPath = pathParts.slice(1).join(".");
          const updatedOverride = applyNestedValueToOverride(currentOverride, propertyPath, value);
          newOverrides.set(nodeId, updatedOverride);
        }

        setAllOverrides(newOverrides);
      } else if (path === "targetQuantity") {
        // Target quantity change
        if (typeof value === "number") {
          setTargetQuantity(value);
        }
      } else if (path === "selectedTemplate") {
        // Selected template change (includes custom templates)
        if (value === null || value === undefined) {
          setSelectedTemplate(null);
        } else if (typeof value === "string") {
          // Type assertion: value could be GameTemplate or CustomTemplateId
          setSelectedTemplate(
            value as import("../types").GameTemplate | import("../types").CustomTemplateId | null
          );
        }
      } else if (path === "customTemplates") {
        // Custom templates change - restore entire customTemplates object
        if (value && typeof value === "object" && !Array.isArray(value)) {
          // Deserialize customTemplates to ensure proper Map handling
          const customTemplates: Record<string, CustomSettingsTemplate> = {};
          for (const [id, template] of Object.entries(value)) {
            if (
              template &&
              typeof template === "object" &&
              "meta" in template &&
              "settings" in template
            ) {
              const templateObj = template as {
                meta: CustomSettingsTemplate["meta"];
                settings: unknown;
              };
              const deserializedSettings = deserializeSettings(templateObj.settings);
              if (deserializedSettings) {
                customTemplates[id] = {
                  meta: templateObj.meta,
                  settings: deserializedSettings,
                };
              }
            }
          }
          useSettingsStore.setState({ customTemplates });
        } else if (value === undefined || value === null) {
          // Clear custom templates
          useSettingsStore.setState({ customTemplates: {} });
        }
      } else if (path.startsWith("customTemplates.")) {
        // Custom template change - individual template add/update/delete
        // Path format: "customTemplates.<id>" or "customTemplates.<id>.meta" or "customTemplates.<id>.settings"
        const pathAfterPrefix = path.replace("customTemplates.", "");
        const pathParts = pathAfterPrefix.split(".");
        const templateId = pathParts[0];

        const currentCustomTemplates = useSettingsStore.getState().customTemplates;
        const newCustomTemplates = { ...currentCustomTemplates };

        if (pathParts.length === 1) {
          // Direct template add/update/delete: "customTemplates.<id>"
          if (value === undefined || value === null) {
            // Delete template
            delete newCustomTemplates[templateId];
          } else if (value && typeof value === "object" && "meta" in value && "settings" in value) {
            // Add or update template
            const templateObj = value as {
              meta: CustomSettingsTemplate["meta"];
              settings: unknown;
            };
            const deserializedSettings = deserializeSettings(templateObj.settings);
            if (deserializedSettings) {
              newCustomTemplates[templateId] = {
                meta: templateObj.meta,
                settings: deserializedSettings,
              };
            }
          }
        } else {
          // Nested property change: "customTemplates.<id>.meta" or "customTemplates.<id>.settings"
          const existingTemplate = currentCustomTemplates[templateId];
          if (!existingTemplate) {
            // Template doesn't exist, skip nested changes
            // Skip to next iteration
            continue;
          }

          const propertyPath = pathParts.slice(1).join(".");
          if (propertyPath === "meta" || propertyPath.startsWith("meta.")) {
            // Update meta property
            const metaObj = { ...existingTemplate.meta } as Record<string, unknown>;
            const metaPath = propertyPath.replace("meta.", "");
            applyNestedValue(metaObj, metaPath, value);
            newCustomTemplates[templateId] = {
              ...existingTemplate,
              meta: metaObj as unknown as CustomSettingsTemplate["meta"],
            };
          } else if (propertyPath === "settings" || propertyPath.startsWith("settings.")) {
            // Update settings property
            if (propertyPath === "settings") {
              // Replace entire settings object
              const deserializedSettings = deserializeSettings(value);
              if (deserializedSettings) {
                newCustomTemplates[templateId] = {
                  ...existingTemplate,
                  settings: deserializedSettings,
                };
              }
            } else {
              // Nested settings property change
              const settingPath = propertyPath.replace("settings.", "");
              const updatedSettings = applySettingsChanges(existingTemplate.settings, {
                [settingPath]: value,
              });
              newCustomTemplates[templateId] = {
                ...existingTemplate,
                settings: {
                  ...existingTemplate.settings,
                  ...updatedSettings,
                } as import("../types").GlobalSettings,
              };
            }
          }
        }

        useSettingsStore.setState({ customTemplates: newCustomTemplates });
      } else if (path === "selectedRecipe.recipeSID") {
        // Recipe selection change via SID
        if (value === undefined || value === null) {
          // Clear recipe selection
          setSelectedRecipe(null);
        } else if (typeof value === "number" && data) {
          const recipe = data.recipes.get(value);
          if (recipe) {
            setSelectedRecipe(recipe);
          }
        }
      }
    }

    // Apply all settings changes at once
    if (hasSettingsChanges) {
      const currentSettings = useSettingsStore.getState().settings;
      const newSettings = applySettingsChanges(currentSettings, settingsChanges);

      // Build complete settings object - always create new object with new references
      // This ensures React detects the change and re-runs useProductionCalculation
      completeSettings = {
        ...currentSettings,
        ...newSettings,
        // Always create new objects for nested properties to ensure reference changes
        proliferator: newSettings.proliferator
          ? { ...currentSettings.proliferator, ...newSettings.proliferator }
          : { ...currentSettings.proliferator },
        machineRank: newSettings.machineRank
          ? { ...currentSettings.machineRank, ...newSettings.machineRank }
          : { ...currentSettings.machineRank },
        conveyorBelt: newSettings.conveyorBelt
          ? { ...currentSettings.conveyorBelt, ...newSettings.conveyorBelt }
          : { ...currentSettings.conveyorBelt },
        proliferatorMultiplier: newSettings.proliferatorMultiplier
          ? { ...currentSettings.proliferatorMultiplier, ...newSettings.proliferatorMultiplier }
          : { ...currentSettings.proliferatorMultiplier },
        photonGeneration: newSettings.photonGeneration
          ? { ...currentSettings.photonGeneration, ...newSettings.photonGeneration }
          : { ...currentSettings.photonGeneration },
        // Always create new Map to ensure reference changes
        alternativeRecipes:
          newSettings.alternativeRecipes instanceof Map
            ? new Map(newSettings.alternativeRecipes)
            : newSettings.alternativeRecipes &&
                typeof newSettings.alternativeRecipes === "object" &&
                !Array.isArray(newSettings.alternativeRecipes)
              ? new Map(
                  Object.entries(newSettings.alternativeRecipes).map(([k, v]) => [
                    Number(k),
                    Number(v),
                  ])
                )
              : new Map(currentSettings.alternativeRecipes),
      };

      // Clear calculation result FIRST before updating settings
      // This ensures the UI shows "calculating..." state immediately
      setCalculationResult(null);

      // Directly update settings using setState to ensure React re-render
      // This bypasses updateSettings which might not properly update the reference
      // No setTimeout needed - React will detect the settings change and recalculate
      if (completeSettings !== null) {
        useSettingsStore.setState({ settings: completeSettings });

        // No need to call setCalculationResult(null) again
        // The useProductionCalculation hook will detect the settings change
        // and automatically recalculate when settings reference changes
      }
    }

    // Apply mining settings changes
    if (hasMiningSettingsChanges) {
      setMiningSettings(
        miningSettingsChanges as Partial<import("../stores/miningSettingsStore").MiningSettings>
      );
    }
  } finally {
    // Always reset restoring flag, even if an error occurs
    setRestoring(false);
  }

  // Force recalculation if any changes that affect production chain were made
  // This must be done AFTER resetting the restoring flag and outside the try-finally block
  // Note: setCalculationResult(null) is already called inside the settings update block above
  // This is a backup to ensure recalculation happens even if settings weren't updated
  if (hasMiningSettingsChanges && !hasSettingsChanges) {
    // Only clear calculation result if settings weren't updated (settings update already cleared it)
    // Mining settings changes will trigger useProductionCalculation automatically
    setCalculationResult(null);
  }

  // No additional setCalculationResult(null) calls needed
  // useProductionCalculation hook will automatically detect settings/miningSettings changes
  // and recalculate when those dependencies change
}

/**
 * Apply multiple settings changes to current settings
 */
function applySettingsChanges(
  currentSettings: import("../types").GlobalSettings,
  changes: Record<string, unknown>
): Partial<import("../types").GlobalSettings> {
  // Group changes by top-level property (e.g., "proliferator", "machineRank")
  const groupedChanges: Record<string, Record<string, unknown>> = {};

  for (const [path, value] of Object.entries(changes)) {
    const parts = path.split(".");
    const topLevel = parts[0];

    if (!groupedChanges[topLevel]) {
      groupedChanges[topLevel] = {};
    }

    if (parts.length === 1) {
      // Direct property change
      groupedChanges[topLevel] = value as Record<string, unknown>;
    } else {
      // Nested property change - collect sub-properties
      const subPath = parts.slice(1).join(".");
      if (typeof groupedChanges[topLevel] !== "object" || groupedChanges[topLevel] === null) {
        groupedChanges[topLevel] = {};
      }
      (groupedChanges[topLevel] as Record<string, unknown>)[subPath] = value;
    }
  }

  // Build result by applying grouped changes
  const result: Record<string, unknown> = { ...currentSettings };

  // Deep clone and apply changes
  for (const [topLevel, changeValue] of Object.entries(groupedChanges)) {
    if (topLevel === "alternativeRecipes" && result[topLevel] instanceof Map) {
      // Handle Map specially - changeValue may be a Map or an object with individual key changes
      if (changeValue instanceof Map) {
        result[topLevel] = new Map(changeValue);
      } else if (
        typeof changeValue === "object" &&
        changeValue !== null &&
        !Array.isArray(changeValue)
      ) {
        // Apply individual Map entry changes
        const currentMap = result[topLevel] as Map<number, number>;
        const newMap = new Map(currentMap);

        for (const [key, value] of Object.entries(changeValue)) {
          const numKey = Number(key);
          if (value === undefined || value === null) {
            newMap.delete(numKey);
          } else {
            newMap.set(numKey, value as number);
          }
        }

        result[topLevel] = newMap;
      } else {
        // Keep existing Map if changeValue is not a Map or object
        result[topLevel] = new Map(result[topLevel] as Map<unknown, unknown>);
      }
    } else {
      const currentValue = result[topLevel];

      if (typeof changeValue === "object" && changeValue !== null && !Array.isArray(changeValue)) {
        // Nested object - merge or replace
        if (
          typeof currentValue === "object" &&
          currentValue !== null &&
          !Array.isArray(currentValue)
        ) {
          // Deep clone current value
          const clonedCurrent = JSON.parse(JSON.stringify(currentValue)) as Record<string, unknown>;

          // Apply nested changes
          for (const [subPath, subValue] of Object.entries(
            changeValue as Record<string, unknown>
          )) {
            applyNestedValue(clonedCurrent, subPath, subValue);
          }

          result[topLevel] = clonedCurrent;
        } else {
          // Replace entirely
          result[topLevel] = JSON.parse(JSON.stringify(changeValue));
        }
      } else {
        // Primitive value - replace
        result[topLevel] = changeValue;
      }
    }
  }

  return result as Partial<import("../types").GlobalSettings>;
}

/**
 * Apply a nested value to an object using dot notation path
 */
function applyNestedValue(obj: Record<string, unknown>, path: string, value: unknown): void {
  const parts = path.split(".");
  let current: Record<string, unknown> = obj;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!(part in current) || typeof current[part] !== "object" || current[part] === null) {
      current[part] = {};
    } else {
      current[part] = JSON.parse(JSON.stringify(current[part]));
    }
    current = current[part] as Record<string, unknown>;
  }

  const finalKey = parts[parts.length - 1];
  if (value === undefined) {
    delete current[finalKey];
  } else {
    current[finalKey] = value;
  }
}

/**
 * Apply a nested value to NodeOverrideSettings using dot notation path
 */
function applyNestedValueToOverride(
  override: NodeOverrideSettings,
  path: string,
  value: unknown
): NodeOverrideSettings {
  // Deep clone to avoid mutation
  const result: NodeOverrideSettings = JSON.parse(JSON.stringify(override));

  const parts = path.split(".");
  let current: Record<string, unknown> = result as Record<string, unknown>;

  // Navigate to parent object
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!(part in current) || typeof current[part] !== "object" || current[part] === null) {
      current[part] = {};
    } else {
      current[part] = JSON.parse(JSON.stringify(current[part]));
    }
    current = current[part] as Record<string, unknown>;
  }

  // Set final value
  const finalKey = parts[parts.length - 1];
  if (value === undefined) {
    delete current[finalKey];
  } else {
    current[finalKey] = value;
  }

  return result;
}
