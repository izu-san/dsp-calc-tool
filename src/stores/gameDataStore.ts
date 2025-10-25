import { create } from 'zustand';
import type { GameData, Machine } from '../types';
import { loadGameData } from '../lib/parser';
import i18n from '../i18n';
import { handleError } from '../utils/errorHandler';

interface GameDataStore {
  data: GameData | null;
  isLoading: boolean;
  error: string | null;
  locale: string;
  loadData: (locale?: string) => Promise<void>;
  updateData: (data: GameData) => void;
  setLocale: (locale: string) => void;
}

export const useGameDataStore = create<GameDataStore>((set, get) => {
  // Initialize i18n with stored locale
  const initialLocale = localStorage.getItem('dsp_locale') || 'ja';
  i18n.changeLanguage(initialLocale);
  document.documentElement.lang = initialLocale;
  
  return {
    data: null,
    isLoading: false,
    error: null,
    locale: initialLocale,

  loadData: async (locale?: string) => {
    const currentLocale = locale || get().locale;
    set({ isLoading: true, error: null });
    try {
      const data = await loadGameData(undefined, currentLocale);
      set({ data, isLoading: false, locale: currentLocale });
      localStorage.setItem('dsp_locale', currentLocale);
    } catch (error) {
      const errorMessage = handleError(error, 'Failed to load game data');
      set({ 
        error: errorMessage,
        isLoading: false 
      });
    }
  },

  updateData: (data: GameData) => {
    set({ data, error: null });
  },

    setLocale: (locale: string) => {
      set({ locale });
      localStorage.setItem('dsp_locale', locale);
      i18n.changeLanguage(locale);
      document.documentElement.lang = locale;
      get().loadData(locale);
    },
  };
});

// Helper function to get machine by ID
export function getMachineById(machineId: number): Machine | undefined {
  const state = useGameDataStore.getState();
  return state.data?.machines.get(machineId);
}
