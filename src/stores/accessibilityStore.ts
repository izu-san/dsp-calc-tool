import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AccessibilitySettings {
  highContrast: boolean;
  focusIndicatorSize: "small" | "medium" | "large";
}

interface AccessibilityStore {
  settings: AccessibilitySettings;
  setHighContrast: (enabled: boolean) => void;
  setFocusIndicatorSize: (size: "small" | "medium" | "large") => void;
  resetSettings: () => void;
}

const defaultSettings: AccessibilitySettings = {
  highContrast: false,
  focusIndicatorSize: "medium",
};

export const useAccessibilityStore = create<AccessibilityStore>()(
  persist(
    set => ({
      settings: defaultSettings,
      setHighContrast: enabled =>
        set(state => ({
          settings: { ...state.settings, highContrast: enabled },
        })),
      setFocusIndicatorSize: size =>
        set(state => ({
          settings: { ...state.settings, focusIndicatorSize: size },
        })),
      resetSettings: () => set({ settings: defaultSettings }),
    }),
    {
      name: "dsp-calculator-accessibility",
      partialize: state => ({
        settings: state.settings,
      }),
    }
  )
);
