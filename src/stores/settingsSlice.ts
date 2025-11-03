/**
 * Settings Store Slices
 * Split settingsStore into logical slices for better maintainability
 */

import i18n from "../i18n";
import { recordSettingsHistory } from "../services/history-recording";
import type { GlobalSettings, MachineRankSettings, PhotonGenerationSettings } from "../types";
import {
  CONVEYOR_BELT_DATA,
  DEFAULT_ALTERNATIVE_RECIPES,
  DEFAULT_PHOTON_GENERATION_SETTINGS,
  PROLIFERATOR_DATA,
  SORTER_DATA,
} from "../types/settings";
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
