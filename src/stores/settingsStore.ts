import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { 
  GlobalSettings, 
  MachineRankSettings,
} from '../types';
import { 
  PROLIFERATOR_DATA, 
  CONVEYOR_BELT_DATA, 
  SORTER_DATA,
  DEFAULT_ALTERNATIVE_RECIPES,
  SETTINGS_TEMPLATES,
} from '../types/settings';
import { serializeSettings, deserializeSettings } from '../utils/storageSerializer';

const defaultSettings: GlobalSettings = {
  proliferator: {
    ...PROLIFERATOR_DATA.none,
    mode: 'speed',
  },
  machineRank: {
    Smelt: 'arc',
    Assemble: 'mk1',
    Chemical: 'standard',
    Research: 'standard',
    Refine: 'standard',
    Particle: 'standard',
  },
  conveyorBelt: CONVEYOR_BELT_DATA.mk3,
  sorter: SORTER_DATA.pile,
  alternativeRecipes: new Map(Object.entries(DEFAULT_ALTERNATIVE_RECIPES).map(([k, v]) => [Number(k), v])),
  miningSpeedResearch: 100, // Default: +0% (no research bonus)
  proliferatorMultiplier: { production: 1, speed: 1 }, // Default: 1x (no multiplier)
};

interface SettingsStore {
  settings: GlobalSettings;
  setProliferator: (type: keyof typeof PROLIFERATOR_DATA, mode: 'production' | 'speed') => void;
  setMachineRank: (recipeType: keyof MachineRankSettings, rank: string) => void;
  setConveyorBelt: (tier: keyof typeof CONVEYOR_BELT_DATA, stackCount?: number) => void;
  setSorter: (tier: keyof typeof SORTER_DATA) => void;
  setAlternativeRecipe: (itemId: number, recipeId: number) => void;
  setMiningSpeedResearch: (bonus: number) => void;
  setProliferatorMultiplier: (production: number, speed: number) => void;
  applyTemplate: (templateId: keyof typeof SETTINGS_TEMPLATES) => void;
  updateSettings: (settings: Partial<GlobalSettings>) => void;
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      settings: defaultSettings,

      setProliferator: (type, mode) => set((state) => ({
        settings: {
          ...state.settings,
          proliferator: {
            ...PROLIFERATOR_DATA[type],
            mode,
          },
        },
      })),

      setMachineRank: (recipeType, rank) => set((state) => ({
        settings: {
          ...state.settings,
          machineRank: {
            ...state.settings.machineRank,
            [recipeType]: rank,
          },
        },
      })),

      setConveyorBelt: (tier, stackCount) => set((state) => ({
        settings: {
          ...state.settings,
          conveyorBelt: {
            ...CONVEYOR_BELT_DATA[tier],
            stackCount: stackCount !== undefined 
              ? stackCount 
              : (typeof state.settings.conveyorBelt.stackCount === 'number' 
                ? state.settings.conveyorBelt.stackCount 
                : 1), // Default to 1 if not a valid number
          },
        },
      })),

      setSorter: (tier) => set((state) => ({
        settings: {
          ...state.settings,
          sorter: SORTER_DATA[tier],
        },
      })),

      setAlternativeRecipe: (itemId, recipeId) => set((state) => {
        const newMap = new Map(state.settings.alternativeRecipes);
        newMap.set(itemId, recipeId);
        return {
          settings: {
            ...state.settings,
            alternativeRecipes: newMap,
          },
        };
      }),

      setMiningSpeedResearch: (bonus) => set((state) => ({
        settings: {
          ...state.settings,
          miningSpeedResearch: bonus,
        },
      })),

      setProliferatorMultiplier: (production, speed) => set((state) => ({
        settings: {
          ...state.settings,
          proliferatorMultiplier: { production, speed },
        },
      })),

      applyTemplate: (templateId) => set(() => {
        const template = SETTINGS_TEMPLATES[templateId];
        // Deep clone the settings to avoid reference issues
        return {
          settings: {
            ...template.settings,
            alternativeRecipes: new Map(template.settings.alternativeRecipes),
          },
        };
      }),

      updateSettings: (newSettings) => set((state) => {
        const updatedSettings = { ...state.settings, ...newSettings };
        
        // Convert alternativeRecipes to Map if it's an object
        if (newSettings.alternativeRecipes && !(newSettings.alternativeRecipes instanceof Map)) {
          updatedSettings.alternativeRecipes = new Map(
            Object.entries(newSettings.alternativeRecipes).map(([k, v]) => [Number(k), Number(v)])
          );
        }
        
        return { settings: updatedSettings };
      }),

      resetSettings: () => set({ settings: defaultSettings }),
    }),
    {
      name: 'dsp-calculator-settings',
      storage: {
        getItem: (name) => {
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
            console.warn('Failed to deserialize settings from localStorage:', error);
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
            console.error('Failed to serialize settings to localStorage:', error);
          }
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);
