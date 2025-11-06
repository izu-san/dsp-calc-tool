import { create } from "zustand";
import type { GameData, Machine } from "../types";
import { loadGameData, loadGameDataVersion } from "../lib/parser";
import i18n from "../i18n";
import { handleError } from "../utils/errorHandler";
import { createSelectors } from "./createSelectors";

interface GameDataStore {
  data: GameData | null;
  isLoading: boolean;
  error: string | null;
  locale: string;
  selectedVersion: string | null; // null = 最新バージョン、設定されている場合は過去バージョン
  loadData: (locale?: string) => Promise<void>;
  loadDataVersion: (version: string, locale?: string) => Promise<void>;
  resetToLatestVersion: () => Promise<void>;
  updateData: (data: GameData) => void;
  setLocale: (locale: string) => void;
}

const useGameDataStoreBase = create<GameDataStore>((set, get) => {
  // Initialize i18n with stored locale
  const initialLocale = localStorage.getItem("dsp_locale") || "ja";
  void i18n.changeLanguage(initialLocale);
  document.documentElement.lang = initialLocale;

  return {
    data: null,
    isLoading: false,
    error: null,
    locale: initialLocale,
    selectedVersion: null,

    loadData: async (locale?: string) => {
      const currentLocale = locale || get().locale;
      set({ isLoading: true, error: null, selectedVersion: null });
      try {
        const data = await loadGameData(undefined, currentLocale);
        set({ data, isLoading: false, locale: currentLocale });
        localStorage.setItem("dsp_locale", currentLocale);
      } catch (error) {
        const errorMessage = handleError(error, "Failed to load game data");
        set({
          error: errorMessage,
          isLoading: false,
        });
      }
    },

    loadDataVersion: async (version: string, locale?: string) => {
      const currentLocale = locale || get().locale;
      set({ isLoading: true, error: null, selectedVersion: version });
      try {
        const data = await loadGameDataVersion(version, currentLocale);
        set({ data, isLoading: false, locale: currentLocale });
        localStorage.setItem("dsp_locale", currentLocale);
      } catch (error) {
        const errorMessage = handleError(error, "Failed to load version data");
        set({
          error: errorMessage,
          isLoading: false,
          selectedVersion: null,
        });
      }
    },

    resetToLatestVersion: async () => {
      const currentLocale = get().locale;
      await get().loadData(currentLocale);
    },

    updateData: (data: GameData) => {
      set({ data, error: null });
    },

    setLocale: (locale: string) => {
      set({ locale });
      localStorage.setItem("dsp_locale", locale);
      void i18n.changeLanguage(locale);
      document.documentElement.lang = locale;
      // バージョンが選択されている場合は、そのバージョンで再読み込み
      const currentVersion = get().selectedVersion;
      if (currentVersion) {
        void get().loadDataVersion(currentVersion, locale);
      } else {
        void get().loadData(locale);
      }
    },
  };
});

export const useGameDataStore = createSelectors(useGameDataStoreBase);

// Helper function to get machine by ID
export function getMachineById(machineId: number): Machine | undefined {
  const state = useGameDataStoreBase.getState();
  return state.data?.machines.get(machineId);
}
