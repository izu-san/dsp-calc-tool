import { create } from "zustand";
import { persist } from "zustand/middleware";
import { recordSettingsHistory } from "../services/history-recording";
import {
  generateMiningMachineTypeDescription,
  generateMiningWorkSpeedDescription,
  generateMiningSettingsBatchDescription,
} from "../utils/history/formatters";
import i18n from "../i18n";

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
        set(state => {
          const before = { miningSettings: state.settings };
          const after = { miningSettings: { ...state.settings, machineType } };
          const t = (key: string) => i18n.t(key);
          const description = generateMiningMachineTypeDescription(machineType, t, i18n.language);
          recordSettingsHistory({ description, before, after });
          return {
            settings: { ...state.settings, machineType },
          };
        }),
      setWorkSpeedMultiplier: workSpeedMultiplier =>
        set(state => {
          const before = { miningSettings: state.settings };
          const after = { miningSettings: { ...state.settings, workSpeedMultiplier } };
          const t = (key: string) => i18n.t(key);
          const description = generateMiningWorkSpeedDescription(
            workSpeedMultiplier,
            t,
            i18n.language
          );
          recordSettingsHistory({ description, before, after });
          return {
            settings: { ...state.settings, workSpeedMultiplier },
          };
        }),
      setSettings: newSettings =>
        set(state => {
          const before = { miningSettings: state.settings };
          const after = { miningSettings: { ...state.settings, ...newSettings } };
          const t = (key: string) => i18n.t(key);
          const description = generateMiningSettingsBatchDescription(t, i18n.language);
          recordSettingsHistory({ description, before, after });
          return {
            settings: { ...state.settings, ...newSettings },
          };
        }),
    }),
    {
      name: "mining-settings-storage",
      partialize: state => ({
        settings: state.settings,
      }),
    }
  )
);
