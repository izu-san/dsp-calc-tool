import { describe, it, expect } from "vitest";
import {
  calculateProductionRate,
  calculateMachinePower,
  calculateSorterPower,
  calculateConveyorBelts,
  buildRecipeTree,
  calculateProductionChain,
} from "../calculator";
import type { Recipe, Machine, ProliferatorConfig, GameData, GlobalSettings } from "../../types";
import { PROLIFERATOR_DATA, CONVEYOR_BELT_DATA, SORTER_DATA } from "../../types/settings";

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
});

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

describe("calculateConveyorBelts", () => {
  it("should calculate required belts for given throughput", () => {
    const targetRate = 30; // 30 items/s
    const inputs = [{ itemId: 1, itemName: "Iron Ore", requiredRate: 30 }];
    const beltSpeed = 6; // Mk1 belt = 6 items/s

    // Output belts = ceil(30 / 6) = 5
    // Input belts = ceil(30 / 6) = 5
    // Total = 10
    const result = calculateConveyorBelts(targetRate, inputs, beltSpeed);

    expect(result.outputs).toBe(5);
    expect(result.inputs).toBe(5);
    expect(result.total).toBe(10);
  });

  it("should calculate saturation percentage", () => {
    const targetRate = 18; // 18 items/s
    const inputs = [{ itemId: 1, itemName: "Iron Ore", requiredRate: 18 }];
    const beltSpeed = 6; // Mk1 belt

    // Required belts = 3
    // Saturation = (18 / (3 * 6)) * 100 = 100%
    const result = calculateConveyorBelts(targetRate, inputs, beltSpeed);

    expect(result.saturation).toBe(100);
  });

  it("should return zero belts when belt speed is invalid", () => {
    const targetRate = 30;
    const inputs = [{ itemId: 1, itemName: "Iron Ore", requiredRate: 30 }];
    const beltSpeed = 0; // Invalid

    const result = calculateConveyorBelts(targetRate, inputs, beltSpeed);

    expect(result.total).toBe(0);
    expect(result.saturation).toBe(0);
  });

  it("should handle multiple input types", () => {
    const targetRate = 10;
    const inputs = [
      { itemId: 1, itemName: "Iron Ore", requiredRate: 8 },
      { itemId: 2, itemName: "Copper Ore", requiredRate: 5 },
    ];
    const beltSpeed = 6;

    // Output belts = ceil(10 / 6) = 2
    // Input belts = ceil(8 / 6) + ceil(5 / 6) = 2 + 1 = 3
    // Total = 5
    const result = calculateConveyorBelts(targetRate, inputs, beltSpeed);

    expect(result.outputs).toBe(2);
    expect(result.inputs).toBe(3);
    expect(result.total).toBe(5);
  });

  it("should identify bottleneck type", () => {
    const targetRate = 30; // High output rate
    const inputs = [
      { itemId: 1, itemName: "Iron Ore", requiredRate: 5 }, // Low input rate
    ];
    const beltSpeed = 6;

    const result = calculateConveyorBelts(targetRate, inputs, beltSpeed);

    // Output saturation = (30 / (5 * 6)) * 100 = 100%
    // Input saturation = (5 / (1 * 6)) * 100 = 83.3%
    // Should identify output as bottleneck
    expect(result.bottleneckType).toBe("output");
  });
});

describe("buildRecipeTree", () => {
  // Create comprehensive mock data
  const createMockGameData = (): GameData => {
    const machines = new Map<number, Machine>();
    machines.set(2302, {
      id: 2302,
      name: "Arc Smelter",
      Type: "Smelt",
      assemblerSpeed: 10000,
      workEnergyPerTick: 360000,
      idleEnergyPerTick: 18000,
      exchangeEnergyPerTick: 0,
      isPowerConsumer: true,
      isPowerExchanger: false,
      isRaw: false,
    });
    machines.set(2315, {
      id: 2315,
      name: "Plane Smelter",
      Type: "Smelt",
      assemblerSpeed: 15000,
      workEnergyPerTick: 540000,
      idleEnergyPerTick: 27000,
      exchangeEnergyPerTick: 0,
      isPowerConsumer: true,
      isPowerExchanger: false,
      isRaw: false,
    });
    machines.set(2303, {
      id: 2303,
      name: "Assembling Machine Mk.I",
      Type: "Assemble",
      assemblerSpeed: 7500,
      workEnergyPerTick: 270000,
      idleEnergyPerTick: 18000,
      exchangeEnergyPerTick: 0,
      isPowerConsumer: true,
      isPowerExchanger: false,
      isRaw: false,
    });
    machines.set(2304, {
      id: 2304,
      name: "Assembling Machine Mk.II",
      Type: "Assemble",
      assemblerSpeed: 10000,
      workEnergyPerTick: 360000,
      idleEnergyPerTick: 24000,
      exchangeEnergyPerTick: 0,
      isPowerConsumer: true,
      isPowerExchanger: false,
      isRaw: false,
    });
    machines.set(2305, {
      id: 2305,
      name: "Assembling Machine Mk.III",
      Type: "Assemble",
      assemblerSpeed: 15000,
      workEnergyPerTick: 540000,
      idleEnergyPerTick: 36000,
      exchangeEnergyPerTick: 0,
      isPowerConsumer: true,
      isPowerExchanger: false,
      isRaw: false,
    });
    machines.set(2309, {
      id: 2309,
      name: "Chemical Plant",
      Type: "Chemical",
      assemblerSpeed: 10000,
      workEnergyPerTick: 720000,
      idleEnergyPerTick: 36000,
      exchangeEnergyPerTick: 0,
      isPowerConsumer: true,
      isPowerExchanger: false,
      isRaw: false,
    });
    machines.set(2317, {
      id: 2317,
      name: "Quantum Chemical Plant",
      Type: "Chemical",
      assemblerSpeed: 20000,
      workEnergyPerTick: 1440000,
      idleEnergyPerTick: 72000,
      exchangeEnergyPerTick: 0,
      isPowerConsumer: true,
      isPowerExchanger: false,
      isRaw: false,
    });
    machines.set(2901, {
      id: 2901,
      name: "Matrix Lab",
      Type: "Research",
      assemblerSpeed: 10000,
      workEnergyPerTick: 480000,
      idleEnergyPerTick: 24000,
      exchangeEnergyPerTick: 0,
      isPowerConsumer: true,
      isPowerExchanger: false,
      isRaw: false,
    });

    const items = new Map();
    items.set(1104, { id: 1104, name: "Iron Ingot", Type: "0", isRaw: false });
    items.set(1001, {
      id: 1001,
      name: "Iron Ore",
      Type: "0",
      isRaw: true,
      miningFrom: "Iron Vein",
    });
    items.set(1105, { id: 1105, name: "Copper Ingot", Type: "0", isRaw: false });
    items.set(1002, {
      id: 1002,
      name: "Copper Ore",
      Type: "0",
      isRaw: true,
      miningFrom: "Copper Vein",
    });
    items.set(1005, { id: 1005, name: "Stone", Type: "0", isRaw: true, miningFrom: "Stone Vein" });

    const recipes = new Map<number, Recipe>();
    recipes.set(1, {
      SID: 1,
      name: "Iron Ingot",
      TimeSpend: 60,
      Results: [{ id: 1104, name: "Iron Ingot", count: 1, Type: "0", isRaw: false }],
      Items: [{ id: 1001, name: "Iron Ore", count: 1, Type: "0", isRaw: true }],
      Type: "Smelt",
      Explicit: false,
      GridIndex: "1001",
      productive: true,
    });
    recipes.set(2, {
      SID: 2,
      name: "Copper Ingot",
      TimeSpend: 60,
      Results: [{ id: 1105, name: "Copper Ingot", count: 1, Type: "0", isRaw: false }],
      Items: [{ id: 1002, name: "Copper Ore", count: 1, Type: "0", isRaw: true }],
      Type: "Smelt",
      Explicit: false,
      GridIndex: "1002",
      productive: true,
    });

    return {
      recipes,
      machines,
      items,
      allItems: items,
      recipesByItemId: new Map([
        [1104, [recipes.get(1)!]],
        [1105, [recipes.get(2)!]],
      ]),
    };
  };

  const createDefaultSettings = (): GlobalSettings => ({
    proliferator: { ...PROLIFERATOR_DATA.none, mode: "speed" },
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
    alternativeRecipes: new Map(),
    miningSpeedResearch: 100,
    proliferatorMultiplier: { production: 1, speed: 1 },
  });

  it("should build a simple recipe tree with one input", () => {
    const gameData = createMockGameData();
    const recipe = gameData.recipes.get(1)!; // Iron Ingot
    const settings = createDefaultSettings();
    const nodeOverrides = new Map();

    const tree = buildRecipeTree(recipe, 1, gameData, settings, nodeOverrides);

    expect(tree.recipe).toEqual(recipe);
    expect(tree.targetOutputRate).toBe(1);
    expect(tree.machineCount).toBeGreaterThan(0);
    expect(tree.children).toHaveLength(1);
    expect(tree.children[0].isRawMaterial).toBe(true);
    expect(tree.children[0].itemId).toBe(1001); // Iron Ore
  });

  it("should calculate machine count correctly", () => {
    const gameData = createMockGameData();
    const recipe = gameData.recipes.get(1)!;
    const settings = createDefaultSettings();
    const nodeOverrides = new Map();

    const tree = buildRecipeTree(recipe, 10, gameData, settings, nodeOverrides);

    // Rate per machine = 1 item/s, so need 10 machines for 10 items/s
    expect(tree.machineCount).toBe(10);
  });

  it("should apply proliferator speed bonus", () => {
    const gameData = createMockGameData();
    const recipe = gameData.recipes.get(1)!;
    const settings = createDefaultSettings();
    settings.proliferator = { ...PROLIFERATOR_DATA.mk3, mode: "speed" };
    const nodeOverrides = new Map();

    const tree = buildRecipeTree(recipe, 10, gameData, settings, nodeOverrides);

    // Recipe is productive, but we respect user's choice of speed mode
    // Speed mode: +25% speed bonus, needs 5 machines (10 / 2.0)
    expect(tree.machineCount).toBe(5);
    expect(tree.proliferator.mode).toBe("speed"); // User's choice is respected
  });

  it("should apply proliferator production bonus and reduce inputs", () => {
    const gameData = createMockGameData();
    const recipe = gameData.recipes.get(1)!;
    const settings = createDefaultSettings();
    settings.proliferator = { ...PROLIFERATOR_DATA.mk3, mode: "production" };
    const nodeOverrides = new Map();

    const tree = buildRecipeTree(recipe, 10, gameData, settings, nodeOverrides);

    // Production mode: 25% bonus means 80% input (1/1.25 = 0.8)
    expect(tree.inputs[0].requiredRate).toBe(8);
    expect(tree.proliferator.mode).toBe("production");
  });

  it("should respect node overrides for proliferator", () => {
    const gameData = createMockGameData();
    const recipe = gameData.recipes.get(1)!;
    const settings = createDefaultSettings();
    settings.proliferator = { ...PROLIFERATOR_DATA.none, mode: "speed" };

    const nodeOverrides = new Map();
    nodeOverrides.set("r-1", {
      proliferator: { ...PROLIFERATOR_DATA.mk2, mode: "production" },
    });

    const tree = buildRecipeTree(recipe, 10, gameData, settings, nodeOverrides);

    expect(tree.proliferator.type).toBe("mk2");
    expect(tree.proliferator.mode).toBe("production");
  });

  it("should respect node overrides for machine rank", () => {
    const gameData = createMockGameData();
    const recipe = gameData.recipes.get(1)!;
    const settings = createDefaultSettings();

    const nodeOverrides = new Map();
    nodeOverrides.set("r-1", {
      machineRank: "plane", // Plane Smelter (different from default 'arc')
    });

    const tree = buildRecipeTree(recipe, 10, gameData, settings, nodeOverrides);

    // Machine should be selected based on override
    expect(tree.machine).toBeDefined();
  });

  it("should calculate power consumption correctly", () => {
    const gameData = createMockGameData();
    const recipe = gameData.recipes.get(1)!;
    const settings = createDefaultSettings();
    const nodeOverrides = new Map();

    const tree = buildRecipeTree(recipe, 1, gameData, settings, nodeOverrides);

    expect(tree.power.machines).toBeGreaterThan(0);
    expect(tree.power.sorters).toBeGreaterThan(0);
    expect(tree.power.total).toBe(tree.power.machines + tree.power.sorters);
  });

  it("should calculate conveyor belts", () => {
    const gameData = createMockGameData();
    const recipe = gameData.recipes.get(1)!;
    const settings = createDefaultSettings();
    const nodeOverrides = new Map();

    const tree = buildRecipeTree(recipe, 10, gameData, settings, nodeOverrides);

    expect(tree.conveyorBelts.inputs).toBeGreaterThan(0);
    expect(tree.conveyorBelts.outputs).toBeGreaterThan(0);
    expect(tree.conveyorBelts.total).toBe(tree.conveyorBelts.inputs + tree.conveyorBelts.outputs);
  });

  it("should handle raw material leaf nodes", () => {
    const gameData = createMockGameData();
    const recipe = gameData.recipes.get(1)!;
    const settings = createDefaultSettings();
    const nodeOverrides = new Map();

    const tree = buildRecipeTree(recipe, 1, gameData, settings, nodeOverrides);

    const rawNode = tree.children[0];
    expect(rawNode.isRawMaterial).toBe(true);
    expect(rawNode.itemId).toBe(1001);
    expect(rawNode.itemName).toBe("Iron Ore");
    expect(rawNode.miningFrom).toBe("Iron Vein");
    expect(rawNode.machineCount).toBe(0);
    expect(rawNode.children).toHaveLength(0);
  });

  it("should generate unique node IDs based on path", () => {
    const gameData = createMockGameData();
    const recipe = gameData.recipes.get(1)!;
    const settings = createDefaultSettings();
    const nodeOverrides = new Map();

    const tree = buildRecipeTree(
      recipe,
      1,
      gameData,
      settings,
      nodeOverrides,
      0,
      20,
      "custom-path"
    );

    expect(tree.nodeId).toBe("custom-path");
    expect(tree.children[0].nodeId).toContain("custom-path/raw-");
  });

  it("should throw error when max depth is exceeded", () => {
    const gameData = createMockGameData();
    const recipe = gameData.recipes.get(1)!;
    const settings = createDefaultSettings();
    const nodeOverrides = new Map();

    expect(() => {
      buildRecipeTree(recipe, 1, gameData, settings, nodeOverrides, 25, 20);
    }).toThrow("Maximum recursion depth reached");
  });

  it("should handle alternative recipe preferences", () => {
    const gameData = createMockGameData();
    const recipe = gameData.recipes.get(1)!;
    const settings = createDefaultSettings();
    settings.alternativeRecipes.set(1001, -1); // Force mining for Iron Ore
    const nodeOverrides = new Map();

    const tree = buildRecipeTree(recipe, 1, gameData, settings, nodeOverrides);

    // Should create raw material node even if recipes exist
    expect(tree.children[0].isRawMaterial).toBe(true);
  });

  it("should apply proliferator multiplier to production bonus", () => {
    const gameData = createMockGameData();
    const recipe = gameData.recipes.get(1)!;
    const settings = createDefaultSettings();
    settings.proliferator = { ...PROLIFERATOR_DATA.mk3, mode: "production" };
    settings.proliferatorMultiplier = { production: 2, speed: 1 }; // 2x multiplier
    const nodeOverrides = new Map();

    const tree = buildRecipeTree(recipe, 10, gameData, settings, nodeOverrides);

    // With 2x multiplier: 25% * 2 = 50% bonus, input = 1/(1+0.5) = 0.667 ≈ 6.67
    expect(tree.inputs[0].requiredRate).toBeCloseTo(6.67, 1);
  });

  it("should create stable node structure", () => {
    const gameData = createMockGameData();
    const recipe = gameData.recipes.get(1)!;
    const settings = createDefaultSettings();
    const nodeOverrides = new Map();

    const tree = buildRecipeTree(recipe, 1, gameData, settings, nodeOverrides);

    expect(tree).toHaveProperty("recipe");
    expect(tree).toHaveProperty("targetOutputRate");
    expect(tree).toHaveProperty("machineCount");
    expect(tree).toHaveProperty("proliferator");
    expect(tree).toHaveProperty("machine");
    expect(tree).toHaveProperty("power");
    expect(tree).toHaveProperty("inputs");
    expect(tree).toHaveProperty("children");
    expect(tree).toHaveProperty("conveyorBelts");
    expect(tree).toHaveProperty("nodeId");
  });

  it("should switch to speed mode when production mode is not supported", () => {
    const gameData = createMockGameData();
    // Create a recipe that doesn't support production mode (productive: false)
    const nonProductiveRecipe: Recipe = {
      SID: 999,
      name: "Non-Productive Item",
      TimeSpend: 60,
      Results: [{ id: 9999, name: "Test Item", count: 1, Type: "0", isRaw: false }],
      Items: [{ id: 1001, name: "Iron Ore", count: 1, Type: "0", isRaw: true }],
      Type: "Assemble",
      Explicit: false,
      GridIndex: "9999",
      productive: false, // Does NOT support production mode
    };
    gameData.recipes.set(999, nonProductiveRecipe);

    const settings = createDefaultSettings();
    settings.proliferator = { ...PROLIFERATOR_DATA.mk1, mode: "production" };
    const nodeOverrides = new Map();

    const tree = buildRecipeTree(nonProductiveRecipe, 1, gameData, settings, nodeOverrides);

    // Should automatically switch to speed mode
    expect(tree.proliferator.mode).toBe("speed");
  });

  it("should switch to production mode when recipe supports it and global is speed mode", () => {
    const gameData = createMockGameData();
    const recipe = gameData.recipes.get(1)!; // productive: true
    const settings = createDefaultSettings();
    settings.proliferator = { ...PROLIFERATOR_DATA.mk2, mode: "speed" };
    const nodeOverrides = new Map();

    const tree = buildRecipeTree(recipe, 1, gameData, settings, nodeOverrides);

    // User's choice of speed mode is respected (no auto-switching)
    expect(tree.proliferator.mode).toBe("speed");
  });

  it("should apply machineRank override for Smelt type (arc)", () => {
    const gameData = createMockGameData();
    const recipe = gameData.recipes.get(1)!; // Smelt type
    const settings = createDefaultSettings();
    const nodeOverrides = new Map();
    nodeOverrides.set("r-1", {
      proliferator: { ...PROLIFERATOR_DATA.none, mode: "speed" },
      machineRank: "arc",
    });

    const tree = buildRecipeTree(recipe, 1, gameData, settings, nodeOverrides, 0, 20, "r-1");

    // Should use Arc Smelter (id: 2302)
    expect(tree.machine).toBeDefined();
    expect(tree.machine?.id).toBe(2302);
  });

  it("should apply machineRank override for Smelt type (plane)", () => {
    const gameData = createMockGameData();
    const recipe = gameData.recipes.get(1)!; // Smelt type
    const settings = createDefaultSettings();
    const nodeOverrides = new Map();
    nodeOverrides.set("r-1", {
      proliferator: { ...PROLIFERATOR_DATA.none, mode: "speed" },
      machineRank: "plane",
    });

    const tree = buildRecipeTree(recipe, 1, gameData, settings, nodeOverrides, 0, 20, "r-1");

    // Should use Plane Smelter (id: 2315)
    expect(tree.machine).toBeDefined();
    expect(tree.machine?.id).toBe(2315);
  });

  it("should apply machineRank override for Assemble type (mk1, mk2, mk3)", () => {
    const gameData = createMockGameData();
    const assembleRecipe: Recipe = {
      SID: 2,
      name: "Gear",
      TimeSpend: 60,
      Results: [{ id: 1201, name: "Gear", count: 1, Type: "0", isRaw: false }],
      Items: [{ id: 1101, name: "Iron Ingot", count: 1, Type: "0", isRaw: false }],
      Type: "Assemble",
      Explicit: false,
      GridIndex: "1201",
      productive: true,
    };
    gameData.recipes.set(2, assembleRecipe);

    const settings = createDefaultSettings();
    const nodeOverrides = new Map();

    // Test mk1
    nodeOverrides.set("r-2-mk1", {
      proliferator: { ...PROLIFERATOR_DATA.none, mode: "speed" },
      machineRank: "mk1",
    });
    const tree1 = buildRecipeTree(
      assembleRecipe,
      1,
      gameData,
      settings,
      nodeOverrides,
      0,
      20,
      "r-2-mk1"
    );
    expect(tree1.machine).toBeDefined();
    expect(tree1.machine?.id).toBe(2303); // Assembler Mk.I

    // Test mk2
    nodeOverrides.set("r-2-mk2", {
      proliferator: { ...PROLIFERATOR_DATA.none, mode: "speed" },
      machineRank: "mk2",
    });
    const tree2 = buildRecipeTree(
      assembleRecipe,
      1,
      gameData,
      settings,
      nodeOverrides,
      0,
      20,
      "r-2-mk2"
    );
    expect(tree2.machine).toBeDefined();
    expect(tree2.machine?.id).toBe(2304); // Assembler Mk.II

    // Test mk3
    nodeOverrides.set("r-2-mk3", {
      proliferator: { ...PROLIFERATOR_DATA.none, mode: "speed" },
      machineRank: "mk3",
    });
    const tree3 = buildRecipeTree(
      assembleRecipe,
      1,
      gameData,
      settings,
      nodeOverrides,
      0,
      20,
      "r-2-mk3"
    );
    expect(tree3.machine).toBeDefined();
    expect(tree3.machine?.id).toBe(2305); // Assembler Mk.III
  });

  it("should apply machineRank override for Chemical type", () => {
    const gameData = createMockGameData();
    const chemicalRecipe: Recipe = {
      SID: 3,
      name: "Plastic",
      TimeSpend: 180,
      Results: [{ id: 1115, name: "Plastic", count: 1, Type: "0", isRaw: false }],
      Items: [{ id: 1114, name: "Refined Oil", count: 2, Type: "0", isRaw: false }],
      Type: "Chemical",
      Explicit: false,
      GridIndex: "1115",
      productive: true,
    };
    gameData.recipes.set(3, chemicalRecipe);

    const settings = createDefaultSettings();
    const nodeOverrides = new Map();

    // Test standard
    nodeOverrides.set("r-3-std", {
      proliferator: { ...PROLIFERATOR_DATA.none, mode: "speed" },
      machineRank: "standard",
    });
    const tree1 = buildRecipeTree(
      chemicalRecipe,
      1,
      gameData,
      settings,
      nodeOverrides,
      0,
      20,
      "r-3-std"
    );
    expect(tree1.machine).toBeDefined();
    expect(tree1.machine?.id).toBe(2309); // Chemical Plant

    // Test quantum
    nodeOverrides.set("r-3-quantum", {
      proliferator: { ...PROLIFERATOR_DATA.none, mode: "speed" },
      machineRank: "quantum",
    });
    const tree2 = buildRecipeTree(
      chemicalRecipe,
      1,
      gameData,
      settings,
      nodeOverrides,
      0,
      20,
      "r-3-quantum"
    );
    expect(tree2.machine).toBeDefined();
    expect(tree2.machine?.id).toBe(2317); // Quantum Chemical Plant
  });

  it("should apply machineRank override for Research type", () => {
    const gameData = createMockGameData();
    const researchRecipe: Recipe = {
      SID: 4,
      name: "Matrix Lab",
      TimeSpend: 180,
      Results: [{ id: 6001, name: "EM Matrix", count: 1, Type: "0", isRaw: false }],
      Items: [],
      Type: "Research",
      Explicit: false,
      GridIndex: "6001",
      productive: false,
    };
    gameData.recipes.set(4, researchRecipe);

    const settings = createDefaultSettings();
    const nodeOverrides = new Map();

    // Test standard (Matrix Lab)
    nodeOverrides.set("r-4-std", {
      proliferator: { ...PROLIFERATOR_DATA.none, mode: "speed" },
      machineRank: "standard",
    });
    const tree1 = buildRecipeTree(
      researchRecipe,
      1,
      gameData,
      settings,
      nodeOverrides,
      0,
      20,
      "r-4-std"
    );
    expect(tree1.machine).toBeDefined();
    expect(tree1.machine?.id).toBe(2901); // Matrix Lab
  });

  it("should apply machineRank override for Smelt type (negentropy)", () => {
    const gameData = createMockGameData();

    // Add Negentropy Smelter (ID 2319 based on MACHINE_IDS_BY_RECIPE_TYPE)
    gameData.machines.set(2319, {
      id: 2319,
      name: "Negentropy Smelter",
      Type: "Smelt",
      assemblerSpeed: 20000,
      workEnergyPerTick: 720000,
      idleEnergyPerTick: 36000,
      exchangeEnergyPerTick: 0,
      isPowerConsumer: true,
      isPowerExchanger: false,
      isRaw: false,
    });

    const smeltRecipe: Recipe = {
      SID: 1,
      name: "Iron Ingot",
      TimeSpend: 60,
      Results: [{ id: 1104, name: "Iron Ingot", count: 1, Type: "0", isRaw: false }],
      Items: [{ id: 1001, name: "Iron Ore", count: 1, Type: "0", isRaw: true }],
      Type: "Smelt",
      Explicit: false,
      GridIndex: "1104",
      productive: true,
    };
    gameData.recipes.set(1, smeltRecipe);

    const settings = createDefaultSettings();
    const nodeOverrides = new Map();

    nodeOverrides.set("r-1-negentropy", {
      proliferator: { ...PROLIFERATOR_DATA.none, mode: "speed" },
      machineRank: "negentropy",
    });
    const tree = buildRecipeTree(
      smeltRecipe,
      1,
      gameData,
      settings,
      nodeOverrides,
      0,
      20,
      "r-1-negentropy"
    );
    expect(tree.machine).toBeDefined();
    expect(tree.machine?.id).toBe(2319); // Negentropy Smelter
  });

  it("should apply machineRank override for Assemble type (recomposing)", () => {
    const gameData = createMockGameData();

    // Add Recomposing Assembler
    gameData.machines.set(2318, {
      id: 2318,
      name: "Recomposing Assembler",
      Type: "Assemble",
      assemblerSpeed: 20000,
      workEnergyPerTick: 1080000,
      idleEnergyPerTick: 54000,
      exchangeEnergyPerTick: 0,
      isPowerConsumer: true,
      isPowerExchanger: false,
      isRaw: false,
    });

    const assembleRecipe: Recipe = {
      SID: 2,
      name: "Gear",
      TimeSpend: 60,
      Results: [{ id: 1201, name: "Gear", count: 1, Type: "0", isRaw: false }],
      Items: [{ id: 1104, name: "Iron Ingot", count: 1, Type: "0", isRaw: false }],
      Type: "Assemble",
      Explicit: false,
      GridIndex: "1201",
      productive: true,
    };
    gameData.recipes.set(2, assembleRecipe);

    const settings = createDefaultSettings();
    const nodeOverrides = new Map();

    nodeOverrides.set("r-2-recomp", {
      proliferator: { ...PROLIFERATOR_DATA.none, mode: "speed" },
      machineRank: "recomposing",
    });
    const tree = buildRecipeTree(
      assembleRecipe,
      1,
      gameData,
      settings,
      nodeOverrides,
      0,
      20,
      "r-2-recomp"
    );
    expect(tree.machine).toBeDefined();
    expect(tree.machine?.id).toBe(2318); // Recomposing Assembler
  });

  it("should apply machineRank override for Chemical type (quantum)", () => {
    const gameData = createMockGameData();

    // Add Quantum Chemical Plant
    gameData.machines.set(2317, {
      id: 2317,
      name: "Quantum Chemical Plant",
      Type: "Chemical",
      assemblerSpeed: 15000,
      workEnergyPerTick: 720000,
      idleEnergyPerTick: 36000,
      exchangeEnergyPerTick: 0,
      isPowerConsumer: true,
      isPowerExchanger: false,
      isRaw: false,
    });

    const chemicalRecipe: Recipe = {
      SID: 3,
      name: "Graphene",
      TimeSpend: 180,
      Results: [{ id: 1123, name: "Graphene", count: 2, Type: "0", isRaw: false }],
      Items: [],
      Type: "Chemical",
      Explicit: false,
      GridIndex: "1123",
      productive: true,
    };
    gameData.recipes.set(3, chemicalRecipe);

    const settings = createDefaultSettings();
    const nodeOverrides = new Map();

    nodeOverrides.set("r-3-quantum", {
      proliferator: { ...PROLIFERATOR_DATA.none, mode: "speed" },
      machineRank: "quantum",
    });
    const tree = buildRecipeTree(
      chemicalRecipe,
      1,
      gameData,
      settings,
      nodeOverrides,
      0,
      20,
      "r-3-quantum"
    );
    expect(tree.machine).toBeDefined();
    expect(tree.machine?.id).toBe(2317); // Quantum Chemical Plant
  });

  it("should apply machineRank override for Research type (self-evolution)", () => {
    const gameData = createMockGameData();

    // Add Self-Evolution Lab
    gameData.machines.set(2902, {
      id: 2902,
      name: "Self-Evolution Lab",
      Type: "Research",
      assemblerSpeed: 20000,
      workEnergyPerTick: 2400000,
      idleEnergyPerTick: 120000,
      exchangeEnergyPerTick: 0,
      isPowerConsumer: true,
      isPowerExchanger: false,
      isRaw: false,
    });

    const researchRecipe: Recipe = {
      SID: 4,
      name: "EM Matrix",
      TimeSpend: 180,
      Results: [{ id: 6001, name: "EM Matrix", count: 1, Type: "0", isRaw: false }],
      Items: [],
      Type: "Research",
      Explicit: false,
      GridIndex: "6001",
      productive: false,
    };
    gameData.recipes.set(4, researchRecipe);

    const settings = createDefaultSettings();
    const nodeOverrides = new Map();

    nodeOverrides.set("r-4-selfevo", {
      proliferator: { ...PROLIFERATOR_DATA.none, mode: "speed" },
      machineRank: "self-evolution",
    });
    const tree = buildRecipeTree(
      researchRecipe,
      1,
      gameData,
      settings,
      nodeOverrides,
      0,
      20,
      "r-4-selfevo"
    );
    expect(tree.machine).toBeDefined();
    expect(tree.machine?.id).toBe(2902); // Self-Evolution Lab
  });

  it("should use preferred recipe when specified in alternativeRecipes", () => {
    const gameData = createMockGameData();

    // Create two recipes for the same output
    const recipe1: Recipe = {
      SID: 101,
      name: "Iron Ingot (Basic)",
      TimeSpend: 60,
      Results: [{ id: 1104, name: "Iron Ingot", count: 1, Type: "0", isRaw: false }],
      Items: [{ id: 1001, name: "Iron Ore", count: 1, Type: "0", isRaw: true }],
      Type: "Smelt",
      Explicit: false,
      GridIndex: "1104",
      productive: true,
    };

    const recipe2: Recipe = {
      SID: 102,
      name: "Iron Ingot (Advanced)",
      TimeSpend: 30,
      Results: [{ id: 1104, name: "Iron Ingot", count: 2, Type: "0", isRaw: false }],
      Items: [{ id: 1001, name: "Iron Ore", count: 1, Type: "0", isRaw: true }],
      Type: "Smelt",
      Explicit: false,
      GridIndex: "1104",
      productive: true,
    };

    gameData.recipes.set(101, recipe1);
    gameData.recipes.set(102, recipe2);
    gameData.recipesByItemId.set(1104, [recipe1, recipe2]);

    const settings = createDefaultSettings();
    settings.alternativeRecipes.set(1104, 102); // Prefer recipe 102

    const parentRecipe: Recipe = {
      SID: 200,
      name: "Test Product",
      TimeSpend: 60,
      Results: [{ id: 9999, name: "Test Product", count: 1, Type: "0", isRaw: false }],
      Items: [{ id: 1104, name: "Iron Ingot", count: 1, Type: "0", isRaw: false }],
      Type: "Assemble",
      Explicit: false,
      GridIndex: "9999",
      productive: true,
    };
    gameData.recipes.set(200, parentRecipe);

    const tree = buildRecipeTree(parentRecipe, 1, gameData, settings, new Map(), 0, 20, "r-200");

    // Should use recipe 102 (preferred)
    expect(tree.children).toHaveLength(1);
    expect(tree.children[0]).toBeDefined();
    const child = tree.children[0]!;
    expect(child.recipe).toBeDefined();
    expect(child.recipe!.SID).toBe(102);
    expect(child.recipe!.name).toBe("Iron Ingot (Advanced)");
  });

  it("should fallback to first recipe when preferred recipe not found", () => {
    const gameData = createMockGameData();

    const recipe1: Recipe = {
      SID: 101,
      name: "Iron Ingot (Basic)",
      TimeSpend: 60,
      Results: [{ id: 1104, name: "Iron Ingot", count: 1, Type: "0", isRaw: false }],
      Items: [{ id: 1001, name: "Iron Ore", count: 1, Type: "0", isRaw: true }],
      Type: "Smelt",
      Explicit: false,
      GridIndex: "1104",
      productive: true,
    };

    gameData.recipes.set(101, recipe1);
    gameData.recipesByItemId.set(1104, [recipe1]);

    const settings = createDefaultSettings();
    settings.alternativeRecipes.set(1104, 999); // Non-existent recipe

    const parentRecipe: Recipe = {
      SID: 200,
      name: "Test Product",
      TimeSpend: 60,
      Results: [{ id: 9999, name: "Test Product", count: 1, Type: "0", isRaw: false }],
      Items: [{ id: 1104, name: "Iron Ingot", count: 1, Type: "0", isRaw: false }],
      Type: "Assemble",
      Explicit: false,
      GridIndex: "9999",
      productive: true,
    };
    gameData.recipes.set(200, parentRecipe);

    const tree = buildRecipeTree(parentRecipe, 1, gameData, settings, new Map(), 0, 20, "r-200");

    // Should fallback to recipe 101
    expect(tree.children).toHaveLength(1);
    expect(tree.children[0]).toBeDefined();
    expect(tree.children[0]!.recipe).toBeDefined();
    expect(tree.children[0]!.recipe!.SID).toBe(101);
  });
});

describe("calculateProductionChain", () => {
  const createMockGameData = (): GameData => {
    const machines = new Map<number, Machine>();
    machines.set(2302, {
      id: 2302,
      name: "Arc Smelter",
      Type: "Smelt",
      assemblerSpeed: 10000,
      workEnergyPerTick: 360000,
      idleEnergyPerTick: 18000,
      exchangeEnergyPerTick: 0,
      isPowerConsumer: true,
      isPowerExchanger: false,
      isRaw: false,
    });
    machines.set(2303, {
      id: 2303,
      name: "Assembling Machine Mk.I",
      Type: "Assemble",
      assemblerSpeed: 7500,
      workEnergyPerTick: 270000,
      idleEnergyPerTick: 18000,
      exchangeEnergyPerTick: 0,
      isPowerConsumer: true,
      isPowerExchanger: false,
      isRaw: false,
    });

    const items = new Map();
    items.set(1104, { id: 1104, name: "Iron Ingot", Type: "0", isRaw: false });
    items.set(1001, {
      id: 1001,
      name: "Iron Ore",
      Type: "0",
      isRaw: true,
      miningFrom: "Iron Vein",
    });
    items.set(1105, { id: 1105, name: "Copper Ingot", Type: "0", isRaw: false });
    items.set(1002, {
      id: 1002,
      name: "Copper Ore",
      Type: "0",
      isRaw: true,
      miningFrom: "Copper Vein",
    });
    items.set(1201, { id: 1201, name: "Gear", Type: "0", isRaw: false });

    const recipes = new Map<number, Recipe>();

    // Iron Ingot recipe
    recipes.set(1, {
      SID: 1,
      name: "Iron Ingot",
      TimeSpend: 60,
      Results: [{ id: 1104, name: "Iron Ingot", count: 1, Type: "0", isRaw: false }],
      Items: [{ id: 1001, name: "Iron Ore", count: 1, Type: "0", isRaw: true }],
      Type: "Smelt",
      Explicit: false,
      GridIndex: "1104",
      productive: true,
    });

    // Copper Ingot recipe
    recipes.set(2, {
      SID: 2,
      name: "Copper Ingot",
      TimeSpend: 60,
      Results: [{ id: 1105, name: "Copper Ingot", count: 1, Type: "0", isRaw: false }],
      Items: [{ id: 1002, name: "Copper Ore", count: 1, Type: "0", isRaw: true }],
      Type: "Smelt",
      Explicit: false,
      GridIndex: "1105",
      productive: true,
    });

    // Gear recipe (requires iron ingot)
    recipes.set(3, {
      SID: 3,
      name: "Gear",
      TimeSpend: 60,
      Results: [{ id: 1201, name: "Gear", count: 1, Type: "0", isRaw: false }],
      Items: [{ id: 1104, name: "Iron Ingot", count: 1, Type: "0", isRaw: false }],
      Type: "Assemble",
      Explicit: false,
      GridIndex: "1201",
      productive: true,
    });

    return {
      recipes,
      machines,
      items,
      allItems: items,
      recipesByItemId: new Map([
        [1104, [recipes.get(1)!]],
        [1105, [recipes.get(2)!]],
        [1201, [recipes.get(3)!]],
      ]),
    };
  };

  const createDefaultSettings = (): GlobalSettings => ({
    proliferator: { ...PROLIFERATOR_DATA.none, mode: "speed" },
    machineRank: {
      Smelt: "arc",
      Assemble: "mk1",
      Chemical: "standard",
      Research: "standard",
      Refine: "standard",
      Particle: "standard",
    },
    conveyorBelt: { ...CONVEYOR_BELT_DATA.mk1 },
    sorter: { ...SORTER_DATA.mk1 },
    alternativeRecipes: new Map(),
    miningSpeedResearch: 100,
    proliferatorMultiplier: { production: 1, speed: 1 },
  });

  it("should calculate complete production chain", () => {
    const gameData = createMockGameData();
    const recipe = gameData.recipes.get(1)!; // Iron Ingot
    const settings = createDefaultSettings();

    const result = calculateProductionChain(recipe, 10, gameData, settings);

    expect(result).toBeDefined();
    expect(result.rootNode).toBeDefined();
    expect(result.rootNode.recipe).toBeDefined();
    expect(result.rootNode.recipe!.SID).toBe(1);
    expect(result.rootNode.targetOutputRate).toBe(10);
  });

  it("should calculate total power consumption across tree", () => {
    const gameData = createMockGameData();
    const gearRecipe = gameData.recipes.get(3)!; // Gear (requires Iron Ingot)
    const settings = createDefaultSettings();

    const result = calculateProductionChain(gearRecipe, 1, gameData, settings);

    expect(result.totalPower).toBeDefined();
    expect(result.totalPower.machines).toBeGreaterThan(0);
    expect(result.totalPower.sorters).toBeGreaterThan(0);
    expect(result.totalPower.total).toBe(result.totalPower.machines + result.totalPower.sorters);
  });

  it("should calculate total machine count across tree", () => {
    const gameData = createMockGameData();
    const gearRecipe = gameData.recipes.get(3)!; // Gear
    const settings = createDefaultSettings();

    const result = calculateProductionChain(gearRecipe, 10, gameData, settings);

    expect(result.totalMachines).toBeGreaterThan(0);
    // Should include machines for Gear production + Iron Ingot production
    expect(result.totalMachines).toBeGreaterThanOrEqual(2);
  });

  it("should collect raw materials from entire tree", () => {
    const gameData = createMockGameData();
    const gearRecipe = gameData.recipes.get(3)!; // Gear
    const settings = createDefaultSettings();

    const result = calculateProductionChain(gearRecipe, 1, gameData, settings);

    expect(result.rawMaterials).toBeInstanceOf(Map);
    expect(result.rawMaterials.size).toBeGreaterThan(0);

    // Should have Iron Ore as raw material
    expect(result.rawMaterials.has(1001)).toBe(true);
    expect(result.rawMaterials.get(1001)).toBeGreaterThan(0);
  });

  it("should handle multiple raw material types", () => {
    const gameData = createMockGameData();

    // Create a recipe that needs both iron and copper
    const complexRecipe: Recipe = {
      SID: 99,
      name: "Complex Item",
      TimeSpend: 120,
      Results: [{ id: 9999, name: "Complex Item", count: 1, Type: "0", isRaw: false }],
      Items: [
        { id: 1104, name: "Iron Ingot", count: 2, Type: "0", isRaw: false },
        { id: 1105, name: "Copper Ingot", count: 1, Type: "0", isRaw: false },
      ],
      Type: "Assemble",
      Explicit: false,
      GridIndex: "9999",
      productive: true,
    };

    gameData.recipes.set(99, complexRecipe);
    const settings = createDefaultSettings();

    const result = calculateProductionChain(complexRecipe, 1, gameData, settings);

    // Should have both Iron Ore and Copper Ore
    expect(result.rawMaterials.has(1001)).toBe(true); // Iron Ore
    expect(result.rawMaterials.has(1002)).toBe(true); // Copper Ore
    expect(result.rawMaterials.size).toBe(2);
  });

  it("should respect node overrides in production chain", () => {
    const gameData = createMockGameData();
    const recipe = gameData.recipes.get(1)!;
    const settings = createDefaultSettings();

    const nodeOverrides = new Map();
    nodeOverrides.set("r-1", {
      proliferator: { ...PROLIFERATOR_DATA.mk3, mode: "production" },
      machineRank: "arc",
    });

    const result = calculateProductionChain(recipe, 1, gameData, settings, nodeOverrides);

    expect(result.rootNode.proliferator.type).toBe("mk3");
    expect(result.rootNode.proliferator.mode).toBe("production");
  });

  it("should calculate deep production chains correctly", () => {
    const gameData = createMockGameData();
    const gearRecipe = gameData.recipes.get(3)!; // Gear -> Iron Ingot -> Iron Ore
    const settings = createDefaultSettings();

    const result = calculateProductionChain(gearRecipe, 1, gameData, settings);

    // Root is Gear
    expect(result.rootNode.recipe).toBeDefined();
    expect(result.rootNode.recipe!.SID).toBe(3);

    // Child should be Iron Ingot
    expect(result.rootNode.children).toHaveLength(1);
    expect(result.rootNode.children[0]).toBeDefined();
    expect(result.rootNode.children[0]!.recipe).toBeDefined();
    expect(result.rootNode.children[0]!.recipe!.SID).toBe(1);

    // Grandchild should be raw material (Iron Ore)
    expect(result.rootNode.children[0].children).toHaveLength(1);
    expect(result.rootNode.children[0].children[0].isRawMaterial).toBe(true);
    expect(result.rootNode.children[0].children[0].itemId).toBe(1001);
  });

  it("should handle circular dependencies (recipe with same item as input and output)", () => {
    const machines = new Map<number, Machine>();
    machines.set(2309, {
      id: 2309,
      name: "Chemical Plant",
      Type: "Chemical",
      assemblerSpeed: 10000,
      workEnergyPerTick: 720000,
      idleEnergyPerTick: 36000,
      exchangeEnergyPerTick: 0,
      isPowerConsumer: true,
      isPowerExchanger: false,
      isRaw: false,
    });

    const items = new Map();
    items.set(1114, { id: 1114, name: "Refined Oil", Type: "0", isRaw: false });
    items.set(1121, { id: 1121, name: "Hydrogen", Type: "0", isRaw: false });

    const recipes = new Map<number, Recipe>();

    // Reforming Refine recipe: Refined Oil + Hydrogen -> Refined Oil (circular)
    recipes.set(120, {
      SID: 120,
      name: "X-ray Cracking",
      TimeSpend: 240, // 4 seconds
      Results: [{ id: 1114, name: "Refined Oil", count: 3, Type: "0", isRaw: false }],
      Items: [
        { id: 1114, name: "Refined Oil", count: 2, Type: "0", isRaw: false },
        { id: 1121, name: "Hydrogen", count: 1, Type: "0", isRaw: false },
      ],
      Type: "Chemical",
      Explicit: false,
      GridIndex: "1114",
      productive: false,
    });

    const recipesByItemId = new Map<number, Recipe[]>();
    recipesByItemId.set(1114, [recipes.get(120)!]);

    const gameData: GameData = {
      machines,
      items,
      allItems: items,
      recipes,
      recipesByItemId,
    };

    const settings = createDefaultSettings();

    // Should not throw "Maximum recursion depth reached"
    const result = calculateProductionChain(recipes.get(120)!, 1, gameData, settings);

    expect(result.rootNode.recipe).toBeDefined();
    expect(result.rootNode.recipe!.SID).toBe(120);

    // Should have 2 children (Refined Oil and Hydrogen)
    expect(result.rootNode.children).toHaveLength(2);

    // The Refined Oil input should be treated as raw material (circular dependency)
    const refinedOilChild = result.rootNode.children.find(c => c.itemId === 1114);
    expect(refinedOilChild).toBeDefined();
    expect(refinedOilChild!.isRawMaterial).toBe(true);
    expect(refinedOilChild!.isCircularDependency).toBe(true);
    expect(refinedOilChild!.miningFrom).toBe("externalSupplyCircular");
    expect(refinedOilChild!.sourceRecipe).toBeDefined();
    expect(refinedOilChild!.sourceRecipe!.SID).toBe(120);
  });
});
