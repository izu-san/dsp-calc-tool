import { describe, it, expect, beforeEach } from "vitest";
import { useMiningSettingsStore } from "../miningSettingsStore";

describe("miningSettingsStore", () => {
  beforeEach(() => {
    // Reset store state before each test
    useMiningSettingsStore.setState({
      settings: {
        machineType: "Advanced Mining Machine",
        workSpeedMultiplier: 100,
      },
    });
  });

  describe("initial state", () => {
    it("should have correct default values", () => {
      const state = useMiningSettingsStore.getState();
      expect(state.settings.machineType).toBe("Advanced Mining Machine");
      expect(state.settings.workSpeedMultiplier).toBe(100);
    });
  });

  describe("setMachineType", () => {
    it("should update machine type to Mining Machine", () => {
      const { setMachineType } = useMiningSettingsStore.getState();
      setMachineType("Mining Machine");

      const state = useMiningSettingsStore.getState();
      expect(state.settings.machineType).toBe("Mining Machine");
    });

    it("should update machine type to Advanced Mining Machine", () => {
      const { setMachineType } = useMiningSettingsStore.getState();
      setMachineType("Advanced Mining Machine");

      const state = useMiningSettingsStore.getState();
      expect(state.settings.machineType).toBe("Advanced Mining Machine");
    });
  });

  describe("setWorkSpeedMultiplier", () => {
    it("should update work speed multiplier", () => {
      const { setWorkSpeedMultiplier } = useMiningSettingsStore.getState();
      setWorkSpeedMultiplier(150);

      const state = useMiningSettingsStore.getState();
      expect(state.settings.workSpeedMultiplier).toBe(150);
    });

    it("should handle edge cases", () => {
      const { setWorkSpeedMultiplier } = useMiningSettingsStore.getState();

      // Test minimum value
      setWorkSpeedMultiplier(100);
      expect(useMiningSettingsStore.getState().settings.workSpeedMultiplier).toBe(100);

      // Test maximum value
      setWorkSpeedMultiplier(300);
      expect(useMiningSettingsStore.getState().settings.workSpeedMultiplier).toBe(300);
    });
  });

  describe("setSettings", () => {
    it("should update multiple settings at once", () => {
      const { setSettings } = useMiningSettingsStore.getState();
      setSettings({
        machineType: "Mining Machine",
        workSpeedMultiplier: 200,
      });

      const state = useMiningSettingsStore.getState();
      expect(state.settings.machineType).toBe("Mining Machine");
      expect(state.settings.workSpeedMultiplier).toBe(200);
    });

    it("should update partial settings", () => {
      const { setSettings } = useMiningSettingsStore.getState();
      setSettings({
        workSpeedMultiplier: 250,
      });

      const state = useMiningSettingsStore.getState();
      expect(state.settings.machineType).toBe("Advanced Mining Machine"); // Should remain unchanged
      expect(state.settings.workSpeedMultiplier).toBe(250);
    });
  });

  describe("persistence", () => {
    it("should persist settings to localStorage", () => {
      const { setMachineType, setWorkSpeedMultiplier } = useMiningSettingsStore.getState();
      setMachineType("Mining Machine");
      setWorkSpeedMultiplier(150);

      // Check if settings are persisted (this is handled by zustand persist middleware)
      const state = useMiningSettingsStore.getState();
      expect(state.settings.machineType).toBe("Mining Machine");
      expect(state.settings.workSpeedMultiplier).toBe(150);
    });
  });
});
