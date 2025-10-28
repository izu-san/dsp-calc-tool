import { describe, it, expect } from "vitest";
import { calculateProductionRate } from "../production-rate";
import type { Recipe, Machine, ProliferatorConfig } from "../../../types";
import { PROLIFERATOR_DATA } from "../../../types/settings";

describe("calculateProductionRate", () => {
  const mockRecipe: Recipe = {
    SID: 1,
    name: "Iron Ingot",
    TimeSpend: 60, // 1 second (60 ticks)
    Results: [{ id: 1001, name: "Iron Ingot", count: 1, Type: "0", isRaw: false }],
    Items: [{ id: 1101, name: "Iron Ore", count: 1, Type: "0", isRaw: true }],
    Type: "Smelt",
    Explicit: false,
    GridIndex: "1101",
    productive: true,
  };

  const mockMachine: Machine = {
    id: 2302,
    name: "Arc Smelter",
    Type: "Smelt",
    assemblerSpeed: 10000, // 100% (10000 = 100%)
    workEnergyPerTick: 360000, // 360kW per tick
    idleEnergyPerTick: 18000,
    exchangeEnergyPerTick: 0,
    isPowerConsumer: true,
    isPowerExchanger: false,
    isRaw: false,
  };

  it("should calculate basic production rate without proliferator", () => {
    const proliferator: ProliferatorConfig = {
      ...PROLIFERATOR_DATA.none,
      mode: "production",
    };

    // Production rate = output / (time / machineSpeed)
    // = 1 / (60 ticks / 60 ticks per second / 100%) = 1 item/s
    const rate = calculateProductionRate(mockRecipe, mockMachine, proliferator, {
      production: 1,
      speed: 1,
    });

    expect(rate).toBe(1);
  });

  it("should apply speed bonus correctly in speed mode", () => {
    const proliferator: ProliferatorConfig = {
      ...PROLIFERATOR_DATA.mk3,
      mode: "speed",
    };

    // With Mk3 speed mode (100% speed bonus)
    // Time per craft = 1s / 1.0 / (1 + 1.0) = 0.5s
    // Rate = 1 / 0.5s = 2 items/s
    const rate = calculateProductionRate(mockRecipe, mockMachine, proliferator, {
      production: 1,
      speed: 1,
    });

    expect(rate).toBe(2);
  });

  it("should apply production bonus correctly in production mode", () => {
    const proliferator: ProliferatorConfig = {
      ...PROLIFERATOR_DATA.mk3,
      mode: "production",
    };

    // With Mk3 production mode (25% production bonus)
    // Output per craft = 1 * (1 + 0.25) = 1.25
    // Rate = 1.25 / 1s = 1.25 items/s
    const rate = calculateProductionRate(mockRecipe, mockMachine, proliferator, {
      production: 1,
      speed: 1,
    });

    expect(rate).toBe(1.25);
  });

  it("should handle machines with zero assemblerSpeed", () => {
    const labMachine: Machine = {
      ...mockMachine,
      assemblerSpeed: 0, // Matrix Lab has 0
    };

    const proliferator: ProliferatorConfig = {
      ...PROLIFERATOR_DATA.none,
      mode: "production",
    };

    // Should default to 100% speed (1.0x multiplier)
    const rate = calculateProductionRate(mockRecipe, labMachine, proliferator, {
      production: 1,
      speed: 1,
    });

    expect(rate).toBe(1);
  });

  it("should handle faster machines correctly", () => {
    const fasterMachine: Machine = {
      ...mockMachine,
      assemblerSpeed: 20000, // 200% speed
    };

    const proliferator: ProliferatorConfig = {
      ...PROLIFERATOR_DATA.none,
      mode: "production",
    };

    // Rate = 1 / (1s / 2.0) = 2 items/s
    const rate = calculateProductionRate(mockRecipe, fasterMachine, proliferator, {
      production: 1,
      speed: 1,
    });

    expect(rate).toBe(2);
  });

  it("should apply proliferator multiplier correctly", () => {
    const proliferator: ProliferatorConfig = {
      ...PROLIFERATOR_DATA.mk3,
      mode: "speed",
    };

    // Double the speed bonus (2x multiplier)
    // Speed bonus = 1 + (1.0 * 2) = 3.0
    // Time per craft = 1s / 3.0 = 0.333...s
    // Rate = 1 / 0.333... = 3 items/s
    const rate = calculateProductionRate(mockRecipe, mockMachine, proliferator, {
      production: 1,
      speed: 2,
    });

    expect(rate).toBe(3);
  });

  describe("PhotonGeneration recipes", () => {
    const photonRecipe: Recipe = {
      SID: -1,
      name: "Critical Photon (Ray Receiver)",
      TimeSpend: 60,
      Results: [{ id: 1208, name: "Critical Photon", count: 1, Type: "Material", isRaw: false }],
      Items: [],
      Type: "PhotonGeneration",
      Explicit: true,
      GridIndex: "0000",
      productive: false,
    };

    const rayReceiver: Machine = {
      id: 2208,
      name: "Ray Receiver",
      Type: "PhotonGenerator",
      assemblerSpeed: 10000,
      workEnergyPerTick: 0,
      idleEnergyPerTick: 0,
      exchangeEnergyPerTick: 0,
      isPowerConsumer: false,
      isPowerExchanger: true,
      isRaw: false,
    };

    it("should calculate photon generation rate without graviton lens", () => {
      const proliferator: ProliferatorConfig = {
        ...PROLIFERATOR_DATA.none,
        mode: "speed",
      };

      const photonSettings = {
        useGravitonLens: false,
        gravitonLensProliferator: {
          ...PROLIFERATOR_DATA.none,
          mode: "speed" as const,
        },
        solarEnergyLossResearch: 0,
        continuousReception: 100,
      };

      // 連続受信100%, 重力子レンズなし: 0.1個/秒
      const rate = calculateProductionRate(
        photonRecipe,
        rayReceiver,
        proliferator,
        { production: 1, speed: 1 },
        photonSettings
      );

      expect(rate).toBeCloseTo(0.1, 3);
    });

    it("should calculate photon generation rate with graviton lens", () => {
      const proliferator: ProliferatorConfig = {
        ...PROLIFERATOR_DATA.none,
        mode: "speed",
      };

      const photonSettings = {
        useGravitonLens: true,
        gravitonLensProliferator: {
          ...PROLIFERATOR_DATA.none,
          mode: "speed" as const,
        },
        solarEnergyLossResearch: 0,
        continuousReception: 100,
      };

      // 連続受信100%, 重力子レンズあり: 0.2個/秒
      const rate = calculateProductionRate(
        photonRecipe,
        rayReceiver,
        proliferator,
        { production: 1, speed: 1 },
        photonSettings
      );

      expect(rate).toBeCloseTo(0.2, 3);
    });

    it("should apply graviton lens proliferator speed bonus", () => {
      const proliferator: ProliferatorConfig = {
        ...PROLIFERATOR_DATA.none,
        mode: "speed",
      };

      const photonSettings = {
        useGravitonLens: true,
        gravitonLensProliferator: {
          ...PROLIFERATOR_DATA.mk3, // +100% speed
          mode: "speed" as const,
        },
        solarEnergyLossResearch: 0,
        continuousReception: 100,
      };

      // 連続受信100%, 重力子レンズあり, 増産剤Mk.III: 0.2 * 2.0 = 0.4個/秒
      const rate = calculateProductionRate(
        photonRecipe,
        rayReceiver,
        proliferator,
        { production: 1, speed: 1 },
        photonSettings
      );

      expect(rate).toBeCloseTo(0.4, 3);
    });

    it("should handle low continuous reception rate", () => {
      const proliferator: ProliferatorConfig = {
        ...PROLIFERATOR_DATA.none,
        mode: "speed",
      };

      const photonSettings = {
        useGravitonLens: false,
        gravitonLensProliferator: {
          ...PROLIFERATOR_DATA.none,
          mode: "speed" as const,
        },
        solarEnergyLossResearch: 0,
        continuousReception: 50, // 100%未満
      };

      // 連続受信100%未満: 0.04個/秒
      const rate = calculateProductionRate(
        photonRecipe,
        rayReceiver,
        proliferator,
        { production: 1, speed: 1 },
        photonSettings
      );

      expect(rate).toBeCloseTo(0.04, 3);
    });

    it("should combine graviton lens and proliferator correctly", () => {
      const proliferator: ProliferatorConfig = {
        ...PROLIFERATOR_DATA.none,
        mode: "speed",
      };

      const photonSettings = {
        useGravitonLens: true,
        gravitonLensProliferator: {
          ...PROLIFERATOR_DATA.mk2, // +50% speed
          mode: "speed" as const,
        },
        solarEnergyLossResearch: 0,
        continuousReception: 100,
      };

      // 連続受信100%, 重力子レンズあり, 増産剤Mk.II: 0.2 * 1.5 = 0.3個/秒
      const rate = calculateProductionRate(
        photonRecipe,
        rayReceiver,
        proliferator,
        { production: 1, speed: 1 },
        photonSettings
      );

      expect(rate).toBeCloseTo(0.3, 3);
    });
  });
});
