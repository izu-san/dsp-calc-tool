import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  GlobalSettings,
  MachineRankSettings,
  PhotonGenerationSettings,
  GameTemplate,
  ProliferatorConfig,
} from "../types";
import type { PowerGeneratorType } from "../types/power-generation";
import {
  PROLIFERATOR_DATA,
  CONVEYOR_BELT_DATA,
  SORTER_DATA,
  DEFAULT_ALTERNATIVE_RECIPES,
  SETTINGS_TEMPLATES,
  DEFAULT_PHOTON_GENERATION_SETTINGS,
} from "../types/settings";
import { serializeSettings, deserializeSettings } from "../utils/storageSerializer";
import { recordHistoryEntry } from "../utils/historyRecorder";
import {
  generateProliferatorDescription,
  generateMachineRankDescription,
  generateConveyorBeltDescription,
  generateSorterDescription,
  generateAlternativeRecipeDescription,
  generateMiningSpeedResearchDescription,
  generateProliferatorMultiplierDescription,
  generatePhotonGenerationDescription,
  generateTemplateDescription,
  generateBatchSettingsDescription,
  generatePowerGenerationTemplateDescription,
  generateManualPowerGeneratorDescription,
  generateManualPowerFuelDescription,
  generatePowerFuelProliferatorDescription,
} from "../utils/historyDescriptionHelper";
import { useGameDataStore } from "./gameDataStore";
import i18n from "../i18n";

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

interface SettingsStore {
  settings: GlobalSettings;
  selectedTemplate: GameTemplate | null; // テンプレート適用状態
  powerGenerationTemplate: GameTemplate; // 発電設備専用テンプレート
  manualPowerGenerator: PowerGeneratorType | null; // 手動選択された発電設備
  manualPowerFuel: string | null; // 手動選択された燃料
  powerFuelProliferator: ProliferatorConfig; // 燃料に適用する増産剤
  setProliferator: (type: keyof typeof PROLIFERATOR_DATA, mode: "production" | "speed") => void;
  setPowerFuelProliferator: (
    type: keyof typeof PROLIFERATOR_DATA,
    mode: "production" | "speed"
  ) => void;
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
  setSelectedTemplate: (template: GameTemplate | null) => void;
  setPowerGenerationTemplate: (template: GameTemplate) => void;
  setManualPowerGenerator: (generator: PowerGeneratorType | null) => void;
  setManualPowerFuel: (fuel: string | null) => void;
  applyTemplate: (templateId: keyof typeof SETTINGS_TEMPLATES) => void;
  updateSettings: (settings: Partial<GlobalSettings>) => void;
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    set => ({
      settings: defaultSettings,
      selectedTemplate: null, // 初期状態ではテンプレート未選択
      powerGenerationTemplate: "default", // 初期状態ではデフォルトテンプレート
      manualPowerGenerator: null, // 初期状態では手動選択なし（自動選択）
      manualPowerFuel: null, // 初期状態では手動選択なし（自動選択）
      powerFuelProliferator: { ...PROLIFERATOR_DATA.none, mode: "production" as const }, // 初期状態では増産剤なし

      setProliferator: (type, mode) =>
        set(state => {
          const before = state.settings.proliferator;
          const after = {
            ...PROLIFERATOR_DATA[type],
            mode,
          };

          // Generate description with before/after values
          const t = (key: string) => i18n.t(key);
          const description = generateProliferatorDescription(before, after, t, i18n.language);

          // Record history
          recordHistoryEntry(
            "settings",
            description,
            { settings: { proliferator: before } },
            { settings: { proliferator: after } }
          );

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

          // Generate description with before/after values
          const t = (key: string) => i18n.t(key);
          const description = generateMachineRankDescription(
            recipeType,
            before,
            rank,
            t,
            i18n.language
          );

          // Record history
          recordHistoryEntry(
            "settings",
            description,
            { settings: { machineRank: { [recipeType]: before } } },
            { settings: { machineRank: { [recipeType]: after } } }
          );

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
                  : 1, // Default to 1 if not a valid number
          };

          // Generate description with before/after values
          const t = (key: string) => i18n.t(key);
          const description = generateConveyorBeltDescription(before, after, t, i18n.language);

          // Record history
          recordHistoryEntry(
            "settings",
            description,
            { settings: { conveyorBelt: before } },
            { settings: { conveyorBelt: after } }
          );

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

          // Generate description with before/after values
          const t = (key: string) => i18n.t(key);
          const description = generateSorterDescription(before, after, t, i18n.language);

          // Record history
          recordHistoryEntry(
            "settings",
            description,
            { settings: { sorter: before } },
            { settings: { sorter: after } }
          );

          return {
            settings: {
              ...state.settings,
              sorter: after,
            },
          };
        }),

      setAlternativeRecipe: (itemId, recipeId) =>
        set(state => {
          // Create before state - need to wrap in settings object for calculateChanges
          const before = {
            settings: {
              ...state.settings,
              alternativeRecipes: new Map(state.settings.alternativeRecipes),
            },
          };

          // Create after state with modified Map
          const afterMap = new Map(state.settings.alternativeRecipes);
          afterMap.set(itemId, recipeId);
          const after = {
            settings: {
              ...state.settings,
              alternativeRecipes: afterMap,
            },
          };

          // Generate description with before/after values
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

          recordHistoryEntry("settings", description, before, after);

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

          recordHistoryEntry("settings", description, before, after);

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
          recordHistoryEntry("settings", description, before, after);

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
          recordHistoryEntry("settings", description, before, after);

          return after;
        }),

      applyTemplate: templateId =>
        set(state => {
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
            selectedTemplate: templateId as GameTemplate, // テンプレート選択状態を保存
            powerGenerationTemplate: templateId as GameTemplate, // 発電設備テンプレートも同じに設定
          };

          // Record history as batch operation
          const t = (key: string) => i18n.t(key);
          const description = generateTemplateDescription(templateId, t, i18n.language);
          recordHistoryEntry("settings", description, before, after);

          return after;
        }),

      updateSettings: newSettings =>
        set(state => {
          const before = { settings: state.settings };
          const updatedSettings = { ...state.settings, ...newSettings };

          // Convert alternativeRecipes to Map if it's an object
          if (newSettings.alternativeRecipes && !(newSettings.alternativeRecipes instanceof Map)) {
            updatedSettings.alternativeRecipes = new Map(
              Object.entries(newSettings.alternativeRecipes).map(([k, v]) => [Number(k), Number(v)])
            );
          }

          const after = { settings: updatedSettings };

          const t = (key: string) => i18n.t(key);
          const description = generateBatchSettingsDescription(t, i18n.language);
          recordHistoryEntry("settings", description, before, after);

          return after;
        }),

      setSelectedTemplate: template => set({ selectedTemplate: template }),

      setPowerGenerationTemplate: template =>
        set(state => {
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
          recordHistoryEntry("powerGeneration", description, before, after);
          return { powerGenerationTemplate: template };
        }),

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
          recordHistoryEntry("powerGeneration", description, before, after);
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
          recordHistoryEntry("powerGeneration", description, before, after);
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
          recordHistoryEntry("powerGeneration", description, before, after);
          return {
            powerFuelProliferator: {
              ...PROLIFERATOR_DATA[type],
              mode,
            },
          };
        }),

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

          recordHistoryEntry("settings", "設定をリセット", before, after);

          return after;
        }),
    }),
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
            const str = JSON.stringify({
              state: {
                ...value.state,
                settings: serialized,
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
