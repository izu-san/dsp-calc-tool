import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface MiningSettings {
  machineType: "Mining Machine" | "Advanced Mining Machine";
  workSpeedMultiplier: number; // 100-300%
}

interface MiningSettingsStore {
  settings: MiningSettings;
  setMachineType: (machineType: "Mining Machine" | "Advanced Mining Machine") => void;
  setWorkSpeedMultiplier: (workSpeedMultiplier: number) => void;
  setSettings: (settings: Partial<MiningSettings>) => void;
}

export const useMiningSettingsStore = create<MiningSettingsStore>()(
  persist(
    set => ({
      settings: {
        machineType: "Advanced Mining Machine",
        workSpeedMultiplier: 100,
      },
      setMachineType: machineType =>
        set(state => ({
          settings: { ...state.settings, machineType },
        })),
      setWorkSpeedMultiplier: workSpeedMultiplier =>
        set(state => ({
          settings: { ...state.settings, workSpeedMultiplier },
        })),
      setSettings: newSettings =>
        set(state => ({
          settings: { ...state.settings, ...newSettings },
        })),
    }),
    {
      name: "mining-settings-storage",
      partialize: state => ({
        settings: state.settings,
      }),
    }
  )
);
