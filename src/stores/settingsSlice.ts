/**
 * Settings Store Slices
 * Split settingsStore into logical slices for better maintainability
 */

import i18n from "../i18n";
import { recordSettingsHistory, recordPowerGenerationHistory } from "../services/history-recording";
import type {
  GlobalSettings,
  MachineRankSettings,
  PhotonGenerationSettings,
  GameTemplate,
  ProliferatorConfig,
  CustomTemplateId,
  CustomSettingsTemplate,
} from "../types";
import type { PowerGeneratorType } from "../types/power-generation";
import {
  CONVEYOR_BELT_DATA,
  DEFAULT_ALTERNATIVE_RECIPES,
  DEFAULT_PHOTON_GENERATION_SETTINGS,
  PROLIFERATOR_DATA,
  SORTER_DATA,
  SETTINGS_TEMPLATES,
  createCustomTemplateId,
  extractCustomTemplateId,
} from "../types/settings";
import { serializeSettings } from "../utils/storageSerializer";
import { generateUUID } from "../utils/historyUtils";
import {
  generateAlternativeRecipeDescription,
  generateBatchSettingsDescription,
  generateConveyorBeltDescription,
  generateMachineRankDescription,
  generateMiningSpeedResearchDescription,
  generatePhotonGenerationDescription,
  generateProliferatorDescription,
  generateProliferatorMultiplierDescription,
  generateSorterDescription,
  generateTemplateDescription,
  generatePowerGenerationTemplateDescription,
  generateManualPowerGeneratorDescription,
  generateManualPowerFuelDescription,
  generatePowerFuelProliferatorDescription,
  generateCustomTemplateCreatedDescription,
  generateCustomTemplateUpdatedDescription,
  generateCustomTemplateDeletedDescription,
  generateCustomTemplateAppliedDescription,
} from "../utils/historyDescriptionHelper";
import { useGameDataStore } from "./gameDataStore";

/**
 * Base settings slice
 */
export interface SettingsSlice {
  settings: GlobalSettings;
  setProliferator: (type: keyof typeof PROLIFERATOR_DATA, mode: "production" | "speed") => void;
  setMachineRank: (recipeType: keyof MachineRankSettings, rank: string) => void;
  setConveyorBelt: (tier: keyof typeof CONVEYOR_BELT_DATA, stackCount?: number) => void;
  setSorter: (tier: keyof typeof SORTER_DATA) => void;
  setAlternativeRecipe: (itemId: number, recipeId: number) => void;
  setMiningSpeedResearch: (bonus: number) => void;
  setProliferatorMultiplier: (production: number, speed: number) => void;
  setPhotonGenerationSetting: <K extends keyof PhotonGenerationSettings>(
    key: K,
    value: PhotonGenerationSettings[K]
  ) => void;
  updateSettings: (settings: Partial<GlobalSettings>) => void;
}

export function createSettingsSlice(
  set: (
    partial:
      | SettingsSlice
      | Partial<SettingsSlice>
      | ((state: SettingsSlice) => SettingsSlice | Partial<SettingsSlice>),
    replace?: boolean | undefined
  ) => void
): SettingsSlice {
  return {
    settings: {
      proliferator: {
        ...PROLIFERATOR_DATA.none,
        mode: "speed",
      },
      machineRank: {
        Smelt: "arc",
        Assemble: "mk1",
        Chemical: "standard",
        Research: "standard",
        Refine: "standard",
        Particle: "standard",
      },
      conveyorBelt: CONVEYOR_BELT_DATA.mk3,
      sorter: SORTER_DATA.pile,
      alternativeRecipes: new Map(
        Object.entries(DEFAULT_ALTERNATIVE_RECIPES).map(([k, v]) => [Number(k), v])
      ),
      miningSpeedResearch: 100,
      proliferatorMultiplier: { production: 1, speed: 1 },
      photonGeneration: DEFAULT_PHOTON_GENERATION_SETTINGS,
    },

    setProliferator: (type, mode) =>
      set(state => {
        const before = state.settings.proliferator;
        const after = {
          ...PROLIFERATOR_DATA[type],
          mode,
        };

        const t = (key: string) => i18n.t(key);
        const description = generateProliferatorDescription(before, after, t, i18n.language);

        recordSettingsHistory({
          description,
          before: { settings: { proliferator: before } },
          after: { settings: { proliferator: after } },
        });

        return {
          settings: {
            ...state.settings,
            proliferator: after,
          },
        };
      }),

    setMachineRank: (recipeType, rank) =>
      set(state => {
        const before = state.settings.machineRank[recipeType];
        const after = rank;

        const t = (key: string) => i18n.t(key);
        const description = generateMachineRankDescription(
          recipeType,
          before,
          rank,
          t,
          i18n.language
        );

        recordSettingsHistory({
          description,
          before: { settings: { machineRank: { [recipeType]: before } } },
          after: { settings: { machineRank: { [recipeType]: after } } },
        });

        return {
          settings: {
            ...state.settings,
            machineRank: {
              ...state.settings.machineRank,
              [recipeType]: rank,
            },
          },
        };
      }),

    setConveyorBelt: (tier, stackCount) =>
      set(state => {
        const before = state.settings.conveyorBelt;
        const after = {
          ...CONVEYOR_BELT_DATA[tier],
          stackCount:
            stackCount !== undefined
              ? stackCount
              : typeof state.settings.conveyorBelt.stackCount === "number"
                ? state.settings.conveyorBelt.stackCount
                : 1,
        };

        const t = (key: string) => i18n.t(key);
        const description = generateConveyorBeltDescription(before, after, t, i18n.language);

        recordSettingsHistory({
          description,
          before: { settings: { conveyorBelt: before } },
          after: { settings: { conveyorBelt: after } },
        });

        return {
          settings: {
            ...state.settings,
            conveyorBelt: after,
          },
        };
      }),

    setSorter: tier =>
      set(state => {
        const before = state.settings.sorter;
        const after = SORTER_DATA[tier];

        const t = (key: string) => i18n.t(key);
        const description = generateSorterDescription(before, after, t, i18n.language);

        recordSettingsHistory({
          description,
          before: { settings: { sorter: before } },
          after: { settings: { sorter: after } },
        });

        return {
          settings: {
            ...state.settings,
            sorter: after,
          },
        };
      }),

    setAlternativeRecipe: (itemId, recipeId) =>
      set(state => {
        const before = {
          settings: {
            ...state.settings,
            alternativeRecipes: new Map(state.settings.alternativeRecipes),
          },
        };

        const afterMap = new Map(state.settings.alternativeRecipes);
        afterMap.set(itemId, recipeId);
        const after = {
          settings: {
            ...state.settings,
            alternativeRecipes: afterMap,
          },
        };

        const t = (key: string) => i18n.t(key);
        const data = useGameDataStore.getState().data;
        const beforeRecipeSID = state.settings.alternativeRecipes.get(itemId);
        const itemName =
          data?.items.get(itemId)?.name ||
          (i18n.language === "ja" ? `アイテム${itemId}` : `Item ${itemId}`);
        const description = generateAlternativeRecipeDescription(
          itemId,
          itemName,
          beforeRecipeSID,
          recipeId,
          data,
          t,
          i18n.language
        );

        recordSettingsHistory({ description, before, after });

        return after;
      }),

    setMiningSpeedResearch: bonus =>
      set(state => {
        const beforeBonus = state.settings.miningSpeedResearch;
        const before = { settings: state.settings };
        const after = {
          settings: {
            ...state.settings,
            miningSpeedResearch: bonus,
          },
        };

        const t = (key: string) => i18n.t(key);
        const description = generateMiningSpeedResearchDescription(
          beforeBonus,
          bonus,
          t,
          i18n.language
        );

        recordSettingsHistory({ description, before, after });

        return after;
      }),

    setProliferatorMultiplier: (production, speed) =>
      set(state => {
        const before = { settings: state.settings };
        const after = {
          settings: {
            ...state.settings,
            proliferatorMultiplier: { production, speed },
          },
        };

        const t = (key: string) => i18n.t(key);
        const description = generateProliferatorMultiplierDescription(
          production,
          speed,
          t,
          i18n.language
        );
        recordSettingsHistory({ description, before, after });

        return after;
      }),

    setPhotonGenerationSetting: (key, value) =>
      set(state => {
        const before = { settings: state.settings };
        const after = {
          settings: {
            ...state.settings,
            photonGeneration: {
              ...state.settings.photonGeneration,
              [key]: value,
            },
          },
        };

        const t = (key: string) => i18n.t(key);
        const description = generatePhotonGenerationDescription(key, t, i18n.language);
        recordSettingsHistory({ description, before, after });

        return after;
      }),

    updateSettings: newSettings =>
      set(state => {
        const before = { settings: state.settings };
        const updatedSettings = { ...state.settings, ...newSettings };

        if (newSettings.alternativeRecipes && !(newSettings.alternativeRecipes instanceof Map)) {
          updatedSettings.alternativeRecipes = new Map(
            Object.entries(newSettings.alternativeRecipes).map(([k, v]) => [Number(k), Number(v)])
          );
        }

        const after = { settings: updatedSettings };

        const t = (key: string) => i18n.t(key);
        const description = generateBatchSettingsDescription(t, i18n.language);
        recordSettingsHistory({ description, before, after });

        return after;
      }),
  };
}

/**
 * Template slice for template-related state and actions
 */
export interface TemplateSlice {
  selectedTemplate: GameTemplate | CustomTemplateId | null;
  powerGenerationTemplate: GameTemplate;
  setSelectedTemplate: (template: GameTemplate | CustomTemplateId | null) => void;
  setPowerGenerationTemplate: (template: GameTemplate) => void;
  applyTemplate: (templateId: keyof typeof SETTINGS_TEMPLATES) => void;
}

export function createTemplateSlice<T extends TemplateSlice & SettingsSlice>(
  set: (
    partial: T | Partial<T> | ((state: T) => T | Partial<T>),
    replace?: boolean | undefined
  ) => void,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Used for type compatibility, may be used in future
  _get: () => T
): TemplateSlice {
  return {
    selectedTemplate: null,
    powerGenerationTemplate: "default" as GameTemplate,

    setSelectedTemplate: template => set({ selectedTemplate: template } as Partial<T>),

    setPowerGenerationTemplate: template =>
      set((state: T) => {
        const before = {
          powerGenerationTemplate: state.powerGenerationTemplate,
        };
        const after = {
          powerGenerationTemplate: template,
        };
        const t = (key: string) => i18n.t(key);
        const description = generatePowerGenerationTemplateDescription(
          state.powerGenerationTemplate,
          template,
          t,
          i18n.language
        );
        recordPowerGenerationHistory({ description, before, after });
        return { powerGenerationTemplate: template } as Partial<T>;
      }),

    applyTemplate: templateId =>
      set((state: T) => {
        const before = {
          settings: state.settings,
          selectedTemplate: state.selectedTemplate,
          powerGenerationTemplate: state.powerGenerationTemplate,
        };

        const template = SETTINGS_TEMPLATES[templateId];
        // Deep clone the settings to avoid reference issues
        const after = {
          settings: {
            ...template.settings,
            alternativeRecipes: new Map(template.settings.alternativeRecipes),
          },
          selectedTemplate: templateId as GameTemplate,
          powerGenerationTemplate: templateId as GameTemplate,
        };

        // Record history as batch operation
        const t = (key: string) => i18n.t(key);
        const description = generateTemplateDescription(templateId, t, i18n.language);
        recordSettingsHistory({ description, before, after });

        return after as Partial<T>;
      }),
  };
}

/**
 * Power generation slice for power generation-related state and actions
 */
export interface PowerGenerationSlice {
  manualPowerGenerator: PowerGeneratorType | null;
  manualPowerFuel: string | null;
  powerFuelProliferator: ProliferatorConfig;
  setManualPowerGenerator: (generator: PowerGeneratorType | null) => void;
  setManualPowerFuel: (fuel: string | null) => void;
  setPowerFuelProliferator: (
    type: keyof typeof PROLIFERATOR_DATA,
    mode: "production" | "speed"
  ) => void;
}

export function createPowerGenerationSlice(
  set: (
    partial:
      | PowerGenerationSlice
      | Partial<PowerGenerationSlice>
      | ((state: PowerGenerationSlice) => PowerGenerationSlice | Partial<PowerGenerationSlice>),
    replace?: boolean | undefined
  ) => void
): PowerGenerationSlice {
  return {
    manualPowerGenerator: null,
    manualPowerFuel: null,
    powerFuelProliferator: { ...PROLIFERATOR_DATA.none, mode: "production" as const },

    setManualPowerGenerator: generator =>
      set(state => {
        const before = {
          manualPowerGenerator: state.manualPowerGenerator,
        };
        const after = {
          manualPowerGenerator: generator,
        };
        const t = (key: string) => i18n.t(key);
        const data = useGameDataStore.getState().data;
        const description = generateManualPowerGeneratorDescription(
          state.manualPowerGenerator,
          generator,
          t,
          i18n.language,
          data
        );
        recordPowerGenerationHistory({ description, before, after });
        return { manualPowerGenerator: generator };
      }),

    setManualPowerFuel: fuel =>
      set(state => {
        const before = {
          manualPowerFuel: state.manualPowerFuel,
        };
        const after = {
          manualPowerFuel: fuel,
        };
        const t = (key: string) => i18n.t(key);
        const data = useGameDataStore.getState().data;
        const description = generateManualPowerFuelDescription(
          state.manualPowerFuel,
          fuel,
          t,
          i18n.language,
          data
        );
        recordPowerGenerationHistory({ description, before, after });
        return { manualPowerFuel: fuel };
      }),

    setPowerFuelProliferator: (type, mode) =>
      set(state => {
        const before = {
          powerFuelProliferator: state.powerFuelProliferator,
        };
        const after = {
          powerFuelProliferator: {
            ...PROLIFERATOR_DATA[type],
            mode,
          },
        };
        const t = (key: string) => i18n.t(key);
        const description = generatePowerFuelProliferatorDescription(
          before.powerFuelProliferator,
          after.powerFuelProliferator,
          t,
          i18n.language
        );
        recordPowerGenerationHistory({ description, before, after });
        return {
          powerFuelProliferator: {
            ...PROLIFERATOR_DATA[type],
            mode,
          },
        };
      }),
  };
}

/**
 * Custom template slice for custom template management
 */
export interface CustomTemplateSlice {
  customTemplates: Record<string, CustomSettingsTemplate>;
  createCustomTemplate: (name: string, note?: string) => void;
  updateCustomTemplate: (
    id: string,
    name?: string,
    note?: string,
    settings?: GlobalSettings
  ) => void;
  deleteCustomTemplate: (id: string) => void;
  applyCustomTemplate: (id: string) => void;
}

export function createCustomTemplateSlice<
  T extends CustomTemplateSlice & SettingsSlice & TemplateSlice,
>(
  set: (
    partial: T | Partial<T> | ((state: T) => T | Partial<T>),
    replace?: boolean | undefined
  ) => void,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Used for type compatibility, may be used in future
  _get: () => T
): CustomTemplateSlice {
  return {
    customTemplates: {},

    createCustomTemplate: (name, note) =>
      set((state: T) => {
        // 最大保持数チェック（50件）
        const currentCount = Object.keys(state.customTemplates).length;
        if (currentCount >= 50) {
          throw new Error("Maximum number of custom templates (50) reached");
        }

        // 重複チェック
        const existingTemplate = Object.values(state.customTemplates).find(
          t => t.meta.name === name.trim()
        );
        if (existingTemplate) {
          throw new Error(`Template with name "${name}" already exists`);
        }

        // UUID生成
        const uuid = generateUUID();
        const now = Date.now();

        // 現在の設定をディープコピー
        const currentSettings: GlobalSettings = {
          ...state.settings,
          alternativeRecipes: new Map(state.settings.alternativeRecipes),
        };

        const template: CustomSettingsTemplate = {
          meta: {
            id: uuid,
            name: name.trim(),
            note: note?.trim(),
            createdAt: now,
            updatedAt: now,
          },
          settings: currentSettings,
        };

        // Serialize customTemplates for history (Map → Array)
        const serializedBefore: Record<
          string,
          { meta: CustomSettingsTemplate["meta"]; settings: ReturnType<typeof serializeSettings> }
        > = {};
        for (const [id, t] of Object.entries(state.customTemplates)) {
          serializedBefore[id] = {
            meta: t.meta,
            settings: serializeSettings(t.settings),
          };
        }

        const serializedAfter: Record<
          string,
          { meta: CustomSettingsTemplate["meta"]; settings: ReturnType<typeof serializeSettings> }
        > = {
          ...serializedBefore,
          [uuid]: {
            meta: template.meta,
            settings: serializeSettings(template.settings),
          },
        };

        const before = {
          customTemplates: serializedBefore,
        };

        const after = {
          customTemplates: serializedAfter,
        };

        const t = (key: string) => i18n.t(key);
        const description = generateCustomTemplateCreatedDescription(name.trim(), t, i18n.language);
        recordSettingsHistory({ description, before, after });

        return {
          customTemplates: {
            ...state.customTemplates,
            [uuid]: template,
          },
        } as Partial<T>;
      }),

    updateCustomTemplate: (id, name, note, settings) =>
      set((state: T) => {
        const template = state.customTemplates[id];
        if (!template) {
          throw new Error(`Template with id "${id}" not found`);
        }

        // Serialize customTemplates for history (Map → Array)
        const serializedBefore: Record<
          string,
          { meta: CustomSettingsTemplate["meta"]; settings: ReturnType<typeof serializeSettings> }
        > = {};
        for (const [templateId, t] of Object.entries(state.customTemplates)) {
          serializedBefore[templateId] = {
            meta: t.meta,
            settings: serializeSettings(t.settings),
          };
        }

        const updatedTemplate: CustomSettingsTemplate = {
          meta: {
            ...template.meta,
            name: name !== undefined ? name.trim() : template.meta.name,
            note: note !== undefined ? note.trim() : template.meta.note,
            updatedAt: Date.now(),
          },
          settings:
            settings !== undefined
              ? {
                  ...settings,
                  alternativeRecipes: new Map(settings.alternativeRecipes),
                }
              : template.settings,
        };

        // 名称変更時の重複チェック（自分自身を除外）
        if (name !== undefined && name.trim() !== template.meta.name) {
          const existingTemplate = Object.values(state.customTemplates).find(
            t => t.meta.name === name.trim() && t.meta.id !== id
          );
          if (existingTemplate) {
            throw new Error(`Template with name "${name}" already exists`);
          }
        }

        const serializedAfter: Record<
          string,
          { meta: CustomSettingsTemplate["meta"]; settings: ReturnType<typeof serializeSettings> }
        > = {
          ...serializedBefore,
          [id]: {
            meta: updatedTemplate.meta,
            settings: serializeSettings(updatedTemplate.settings),
          },
        };

        const before = {
          customTemplates: serializedBefore,
        };

        const after = {
          customTemplates: serializedAfter,
        };

        const t = (key: string) => i18n.t(key);
        const description = generateCustomTemplateUpdatedDescription(
          updatedTemplate.meta.name,
          t,
          i18n.language
        );
        recordSettingsHistory({ description, before, after });

        return {
          customTemplates: {
            ...state.customTemplates,
            [id]: updatedTemplate,
          },
        } as Partial<T>;
      }),

    deleteCustomTemplate: id =>
      set((state: T) => {
        const template = state.customTemplates[id];
        if (!template) {
          throw new Error(`Template with id "${id}" not found`);
        }

        // Serialize customTemplates for history (Map → Array)
        const serializedBefore: Record<
          string,
          { meta: CustomSettingsTemplate["meta"]; settings: ReturnType<typeof serializeSettings> }
        > = {};
        for (const [templateId, t] of Object.entries(state.customTemplates)) {
          serializedBefore[templateId] = {
            meta: t.meta,
            settings: serializeSettings(t.settings),
          };
        }

        const customTemplateId = createCustomTemplateId(id);
        const isSelected =
          state.selectedTemplate === customTemplateId ||
          (typeof state.selectedTemplate === "string" &&
            state.selectedTemplate.startsWith("custom:") &&
            extractCustomTemplateId(state.selectedTemplate as CustomTemplateId) === id);

        const serializedAfter: Record<
          string,
          { meta: CustomSettingsTemplate["meta"]; settings: ReturnType<typeof serializeSettings> }
        > = {};
        for (const [templateId, t] of Object.entries(state.customTemplates)) {
          if (templateId !== id) {
            serializedAfter[templateId] = {
              meta: t.meta,
              settings: serializeSettings(t.settings),
            };
          }
        }

        const before = {
          customTemplates: serializedBefore,
          selectedTemplate: state.selectedTemplate,
        };

        const after = {
          customTemplates: serializedAfter,
          selectedTemplate: isSelected ? null : state.selectedTemplate,
        };

        const t = (key: string) => i18n.t(key);
        const description = generateCustomTemplateDeletedDescription(
          template.meta.name,
          t,
          i18n.language
        );
        recordSettingsHistory({ description, before, after });

        return {
          customTemplates: Object.fromEntries(
            Object.entries(state.customTemplates).filter(([key]) => key !== id)
          ),
          selectedTemplate: isSelected ? null : state.selectedTemplate,
        } as Partial<T>;
      }),

    applyCustomTemplate: id =>
      set((state: T) => {
        const template = state.customTemplates[id];
        if (!template) {
          throw new Error(`Template with id "${id}" not found`);
        }

        const before = {
          settings: state.settings,
          selectedTemplate: state.selectedTemplate,
          powerGenerationTemplate: state.powerGenerationTemplate,
        };

        const customTemplateId = createCustomTemplateId(id);
        const after = {
          settings: {
            ...template.settings,
            alternativeRecipes: new Map(template.settings.alternativeRecipes),
          },
          selectedTemplate: customTemplateId,
          powerGenerationTemplate: state.powerGenerationTemplate,
        };

        const t = (key: string) => i18n.t(key);
        const description = generateCustomTemplateAppliedDescription(
          template.meta.name,
          t,
          i18n.language
        );
        recordSettingsHistory({ description, before, after });

        return after as Partial<T>;
      }),
  };
}
