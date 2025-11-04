import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  GlobalSettings,
  GameTemplate,
  CustomTemplateId,
  CustomSettingsTemplate,
} from "../types";
import {
  PROLIFERATOR_DATA,
  CONVEYOR_BELT_DATA,
  SORTER_DATA,
  DEFAULT_ALTERNATIVE_RECIPES,
  DEFAULT_PHOTON_GENERATION_SETTINGS,
} from "../types/settings";
import { serializeSettings, deserializeSettings } from "../utils/storageSerializer";
import { recordSettingsHistory } from "../services/history-recording";
import {
  createSettingsSlice,
  createTemplateSlice,
  createPowerGenerationSlice,
  createCustomTemplateSlice,
  type SettingsSlice,
  type TemplateSlice,
  type PowerGenerationSlice,
  type CustomTemplateSlice,
} from "./settingsSlice";

const defaultSettings: GlobalSettings = {
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
  miningSpeedResearch: 100, // Default: +0% (no research bonus)
  proliferatorMultiplier: { production: 1, speed: 1 }, // Default: 1x (no multiplier)
  photonGeneration: DEFAULT_PHOTON_GENERATION_SETTINGS,
};

interface SettingsStore
  extends SettingsSlice,
    TemplateSlice,
    PowerGenerationSlice,
    CustomTemplateSlice {
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => {
      // Combine all slices
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const settingsSlice = createSettingsSlice(set as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const templateSlice = createTemplateSlice<SettingsStore>(set as any, get);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const powerGenerationSlice = createPowerGenerationSlice(set as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const customTemplateSlice = createCustomTemplateSlice<SettingsStore>(set as any, get);

      return {
        ...settingsSlice,
        ...templateSlice,
        ...powerGenerationSlice,
        ...customTemplateSlice,

        resetSettings: () =>
          set(state => {
            const before = {
              settings: state.settings,
              selectedTemplate: state.selectedTemplate,
              powerGenerationTemplate: state.powerGenerationTemplate,
              manualPowerGenerator: state.manualPowerGenerator,
              manualPowerFuel: state.manualPowerFuel,
              powerFuelProliferator: state.powerFuelProliferator,
            };

            const after = {
              settings: defaultSettings,
              selectedTemplate: null,
              powerGenerationTemplate: "default" as GameTemplate,
              manualPowerGenerator: null,
              manualPowerFuel: null,
              powerFuelProliferator: { ...PROLIFERATOR_DATA.none, mode: "production" as const },
            };

            recordSettingsHistory({ description: "設定をリセット", before, after });

            return after;
          }),
      };
    },
    {
      name: "dsp-calculator-settings",
      storage: {
        getItem: name => {
          const str = localStorage.getItem(name);
          if (!str) return null;

          try {
            const { state } = JSON.parse(str);

            // 型安全なデシリアライズ
            if (state?.settings) {
              const deserialized = deserializeSettings(state.settings);
              if (deserialized) {
                state.settings = deserialized;
              }
            }

            // customTemplates のデシリアライズ
            if (state?.customTemplates && typeof state.customTemplates === "object") {
              const customTemplates: Record<string, CustomSettingsTemplate> = {};
              for (const [id, template] of Object.entries(state.customTemplates)) {
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
              state.customTemplates = customTemplates;
            } else {
              // customTemplates が存在しない場合は空オブジェクト
              state.customTemplates = {};
            }

            // selectedTemplate の型チェック（custom: 接頭辞の処理）
            if (state?.selectedTemplate && typeof state.selectedTemplate === "string") {
              if (state.selectedTemplate.startsWith("custom:")) {
                // CustomTemplateId として扱う
                state.selectedTemplate = state.selectedTemplate as CustomTemplateId;
              }
            }

            return { state };
          } catch (error) {
            console.warn("Failed to deserialize settings from localStorage:", error);
            return null;
          }
        },
        setItem: (name, value) => {
          try {
            // 型安全なシリアライズ
            const serialized = serializeSettings(value.state.settings);

            // customTemplates のシリアライズ
            const serializedCustomTemplates: Record<
              string,
              {
                meta: CustomSettingsTemplate["meta"];
                settings: ReturnType<typeof serializeSettings>;
              }
            > = {};
            if (value.state.customTemplates && typeof value.state.customTemplates === "object") {
              for (const [id, template] of Object.entries(value.state.customTemplates)) {
                if (template && typeof template === "object" && "settings" in template) {
                  serializedCustomTemplates[id] = {
                    meta: (template as CustomSettingsTemplate).meta,
                    settings: serializeSettings((template as CustomSettingsTemplate).settings),
                  };
                }
              }
            }

            const str = JSON.stringify({
              state: {
                ...value.state,
                settings: serialized,
                customTemplates: serializedCustomTemplates,
              },
            });
            localStorage.setItem(name, str);
          } catch (error) {
            console.error("Failed to serialize settings to localStorage:", error);
          }
        },
        removeItem: name => localStorage.removeItem(name),
      },
    }
  )
);
