import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GameTemplate } from "../types";
import { PROLIFERATOR_DATA } from "../types/settings";
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
import { defaultSettings } from "./defaultSettings";
import { createSettingsStorage } from "./storage/settingsStorage";

interface SettingsStore
  extends SettingsSlice, TemplateSlice, PowerGenerationSlice, CustomTemplateSlice {
  resetSettings: () => void;
}

/**
 * Helper type for Zustand set function that accepts partial updates
 */
type ZustandSet<T> = (
  partial: T | Partial<T> | ((state: T) => T | Partial<T>),
  replace?: boolean | undefined
) => void;

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => {
      // Combine all slices
      // Type-safe set function casting
      const typedSet = set as ZustandSet<SettingsStore>;
      const settingsSlice = createSettingsSlice(typedSet);
      const templateSlice = createTemplateSlice<SettingsStore>(typedSet, get);
      const powerGenerationSlice = createPowerGenerationSlice(typedSet);
      const customTemplateSlice = createCustomTemplateSlice<SettingsStore>(typedSet, get);

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
              settings: {
                ...defaultSettings,
                // Deep clone Map to avoid reference issues
                alternativeRecipes: new Map(defaultSettings.alternativeRecipes),
              },
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
      storage: createSettingsStorage(),
    }
  )
);
