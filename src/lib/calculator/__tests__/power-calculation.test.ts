import { describe, it, expect } from "vitest";
import { calculateMachinePower, calculateSorterPower } from "../power-calculation";
import type { Recipe, Machine, ProliferatorConfig } from "../../../types";
import { PROLIFERATOR_DATA } from "../../../types/settings";

describe("calculateMachinePower", () => {
  const mockMachine: Machine = {
    id: 2302,
    name: "Arc Smelter",
    Type: "Smelt",
    assemblerSpeed: 10000,
    workEnergyPerTick: 360000, // 360,000 ticks * 60 / 1000 = 21,600 kW
    idleEnergyPerTick: 18000,
    exchangeEnergyPerTick: 0,
    isPowerConsumer: true,
    isPowerExchanger: false,
    isRaw: false,
  };

  it("should calculate basic machine power consumption", () => {
    const proliferator: ProliferatorConfig = {
      ...PROLIFERATOR_DATA.none,
      mode: "production",
    };

    // Base power = (360,000 * 60) / 1000 = 21,600 kW per machine
    // For 1 machine = 21,600 kW
    const result = calculateMachinePower(mockMachine, 1, proliferator, { production: 1, speed: 1 });

    expect(result.machines).toBe(21600);
    expect(result.total).toBe(21600);
  });

  it("should scale power with machine count", () => {
    const proliferator: ProliferatorConfig = {
      ...PROLIFERATOR_DATA.none,
      mode: "production",
    };

    // For 10 machines = 216,000 kW
    const result = calculateMachinePower(mockMachine, 10, proliferator, {
      production: 1,
      speed: 1,
    });

    expect(result.machines).toBe(216000);
    expect(result.total).toBe(216000);
  });

  it("should apply power increase for proliferator", () => {
    const proliferator: ProliferatorConfig = {
      ...PROLIFERATOR_DATA.mk3,
      mode: "speed",
    };

    // With Mk3, power increase is 150% (1.5)
    // Power = 21,600 * (1 + 1.5) = 21,600 * 2.5 = 54,000 kW
    const result = calculateMachinePower(mockMachine, 1, proliferator, { production: 1, speed: 1 });

    expect(result.machines).toBe(54000);
    expect(result.total).toBe(54000);
  });

  it("should apply proliferator multiplier to power increase", () => {
    const proliferator: ProliferatorConfig = {
      ...PROLIFERATOR_DATA.mk3,
      mode: "speed",
    };

    // Power increase = 1.5 * 2 = 3.0
    // Power = 21,600 * (1 + 3.0) = 21,600 * 4 = 86,400 kW
    const result = calculateMachinePower(mockMachine, 1, proliferator, { production: 2, speed: 2 });

    expect(result.machines).toBe(86400);
    expect(result.total).toBe(86400);
  });

  describe("PhotonGeneration power calculation", () => {
    const rayReceiver: Machine = {
      id: 2208,
      name: "Ray Receiver",
      Type: "PhotonGenerator",
      assemblerSpeed: 10000,
      workEnergyPerTick: 0, // ダイソンスフィア電力を別計算するため0
      idleEnergyPerTick: 0,
      exchangeEnergyPerTick: 0,
      isPowerConsumer: false,
      isPowerExchanger: true,
      isRaw: false,
    };

    it("should calculate dyson sphere power for photon generation", () => {
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
        rayTransmissionEfficiency: 0, // 30% efficiency, 70% loss
        continuousReception: 100,
      };

      // 理論電力120MW, 受信効率58% -> 要求電力 約206.9MW = 206900kW
      const result = calculateMachinePower(
        rayReceiver,
        1,
        proliferator,
        { production: 1, speed: 1 },
        "PhotonGeneration",
        photonSettings
      );

      expect(result.machines).toBe(0); // 通常電力は消費しない
      expect(result.sorters).toBe(0);
      expect(result.dysonSphere).toBeCloseTo(206896.55, 2);
      expect(result.total).toBeCloseTo(206896.55, 2);
    });

    it("should calculate dyson sphere power with graviton lens", () => {
      const proliferator: ProliferatorConfig = {
        ...PROLIFERATOR_DATA.none,
        mode: "speed",
      };

      const photonSettings = {
        useGravitonLens: true, // 理論電力2倍
        gravitonLensProliferator: {
          ...PROLIFERATOR_DATA.none,
          mode: "speed" as const,
        },
        rayTransmissionEfficiency: 0,
        continuousReception: 100,
      };

      // 理論電力240MW, 受信効率58% -> 要求電力 約413.8MW = 413800kW
      const result = calculateMachinePower(
        rayReceiver,
        1,
        proliferator,
        { production: 1, speed: 1 },
        "PhotonGeneration",
        photonSettings
      );

      expect(result.dysonSphere).toBeCloseTo(413793.1, 1);
    });

    it("should apply graviton lens proliferator to power", () => {
      const proliferator: ProliferatorConfig = {
        ...PROLIFERATOR_DATA.none,
        mode: "speed",
      };

      const photonSettings = {
        useGravitonLens: true,
        gravitonLensProliferator: {
          ...PROLIFERATOR_DATA.mk3, // +100% speed -> 理論電力2倍
          mode: "speed" as const,
        },
        rayTransmissionEfficiency: 0,
        continuousReception: 100,
      };

      // 理論電力240MW * 2.0 = 480MW, 受信効率58% -> 要求電力 約827.6MW
      const result = calculateMachinePower(
        rayReceiver,
        1,
        proliferator,
        { production: 1, speed: 1 },
        "PhotonGeneration",
        photonSettings
      );

      expect(result.dysonSphere).toBeCloseTo(827586.2, 1);
    });

    it("should scale power with machine count", () => {
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
        rayTransmissionEfficiency: 0,
        continuousReception: 100,
      };

      // 10機の場合、電力も10倍
      const result = calculateMachinePower(
        rayReceiver,
        10,
        proliferator,
        { production: 1, speed: 1 },
        "PhotonGeneration",
        photonSettings
      );

      expect(result.dysonSphere).toBeCloseTo(2068965.5, 1);
    });

    it("should improve efficiency with higher research level", () => {
      const proliferator: ProliferatorConfig = {
        ...PROLIFERATOR_DATA.none,
        mode: "speed",
      };

      const photonSettingsLv0 = {
        useGravitonLens: false,
        gravitonLensProliferator: {
          ...PROLIFERATOR_DATA.none,
          mode: "speed" as const,
        },
        rayTransmissionEfficiency: 0, // 30% efficiency, 70% loss -> 58% efficiency
        continuousReception: 100,
      };

      const photonSettingsLv50 = {
        ...photonSettingsLv0,
        rayTransmissionEfficiency: 50, // 損失が大幅に減少 -> 高効率
      };

      const powerLv0 = calculateMachinePower(
        rayReceiver,
        1,
        proliferator,
        { production: 1, speed: 1 },
        "PhotonGeneration",
        photonSettingsLv0
      );

      const powerLv50 = calculateMachinePower(
        rayReceiver,
        1,
        proliferator,
        { production: 1, speed: 1 },
        "PhotonGeneration",
        photonSettingsLv50
      );

      // 研究レベルが高いと要求電力が減少する
      expect(powerLv50.dysonSphere).toBeLessThan(powerLv0.dysonSphere);
    });
  });
});

describe("calculateSorterPower", () => {
  it("should calculate sorter power based on input/output types", () => {
    const mockRecipe: Recipe = {
      SID: 1,
      name: "Test",
      TimeSpend: 60,
      Items: [
        { id: 1, name: "Iron Ore", count: 1, Type: "0", isRaw: true },
        { id: 2, name: "Copper Ore", count: 1, Type: "0", isRaw: true },
      ],
      Results: [{ id: 3, name: "Iron Ingot", count: 1, Type: "0", isRaw: false }],
      Type: "Assemble",
      Explicit: false,
      GridIndex: "1101",
      productive: true,
    };

    const machineCount = 10;
    const sorterPowerPerUnit = 0.03; // 30W = 0.03kW

    // Sorters per machine = 2 inputs + 1 output = 3
    // Total sorters = 3 * 10 = 30
    // Power = 30 * 0.03 = 0.9 kW
    const power = calculateSorterPower(mockRecipe, machineCount, sorterPowerPerUnit);

    expect(power).toBeCloseTo(0.9, 5); // Use toBeCloseTo for floating point comparison
  });

  it("should handle recipes with no inputs", () => {
    const mockRecipe: Recipe = {
      SID: 1,
      name: "Mining",
      TimeSpend: 60,
      Items: [],
      Results: [{ id: 1, name: "Iron Ore", count: 1, Type: "0", isRaw: true }],
      Type: "Smelt",
      Explicit: false,
      GridIndex: "1101",
      productive: false,
    };

    // Sorters = 0 inputs + 1 output = 1
    const power = calculateSorterPower(mockRecipe, 5, 0.03);

    expect(power).toBe(0.15); // 1 * 5 * 0.03
  });
});

describe("Power Calculation Edge Cases", () => {
  it("should handle Dyson Sphere power correctly (should be excluded from consumption)", () => {
    // This test verifies that Dyson Sphere power is treated as generated power,
    // not consumed power, which is important for power generation calculations

    const mockMachine: Machine = {
      id: 2208, // Ray Receiver
      name: "Ray Receiver",
      Type: "Particle",
      assemblerSpeed: 10000,
      workEnergyPerTick: 0, // Ray Receivers don't consume work energy
      idleEnergyPerTick: 0,
      exchangeEnergyPerTick: 0,
      isPowerConsumer: false,
      isPowerExchanger: true, // This is the key - it exchanges power
      isRaw: false,
    };

    const proliferator: ProliferatorConfig = {
      ...PROLIFERATOR_DATA.none,
      mode: "production",
    };

    // Ray Receivers should not consume power for work (they generate power)
    const result = calculateMachinePower(mockMachine, 1, proliferator, { production: 1, speed: 1 });

    expect(result.machines).toBe(0); // No work power consumption
    expect(result.total).toBe(0);
  });

  it("should handle power consumers correctly (should be included in consumption)", () => {
    const mockMachine: Machine = {
      id: 2302, // Arc Smelter
      name: "Arc Smelter",
      Type: "Smelt",
      assemblerSpeed: 10000,
      workEnergyPerTick: 360000,
      idleEnergyPerTick: 18000,
      exchangeEnergyPerTick: 0,
      isPowerConsumer: true, // This is the key - it consumes power
      isPowerExchanger: false,
      isRaw: false,
    };

    const proliferator: ProliferatorConfig = {
      ...PROLIFERATOR_DATA.none,
      mode: "production",
    };

    // Regular machines should consume power
    const result = calculateMachinePower(mockMachine, 1, proliferator, { production: 1, speed: 1 });

    expect(result.machines).toBeGreaterThan(0); // Should consume power
    expect(result.total).toBeGreaterThan(0);
  });
});
