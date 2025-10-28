import { describe, it, expect } from "vitest";
import { MACHINE_IDS_BY_RECIPE_TYPE, MINING_EQUIPMENT_IDS, getMachineForRecipe } from "../machines";
import type { Machine, GlobalSettings } from "../../types";

describe("machines", () => {
  // Mock machines data
  const mockMachines = new Map<number, Machine>([
    // Smelt machines
    [
      2302,
      {
        id: 2302,
        name: "Arc Smelter",
        Type: "Smelt",
        count: 0,
        isRaw: false,
        assemblerSpeed: 1,
        workEnergyPerTick: 360,
        idleEnergyPerTick: 12,
        exchangeEnergyPerTick: 0,
        isPowerConsumer: true,
        isPowerExchanger: false,
      },
    ],
    [
      2315,
      {
        id: 2315,
        name: "Plane Smelter",
        Type: "Smelt",
        count: 0,
        isRaw: false,
        assemblerSpeed: 2,
        workEnergyPerTick: 720,
        idleEnergyPerTick: 24,
        exchangeEnergyPerTick: 0,
        isPowerConsumer: true,
        isPowerExchanger: false,
      },
    ],
    [
      2319,
      {
        id: 2319,
        name: "Negentropy Smelter",
        Type: "Smelt",
        count: 0,
        isRaw: false,
        assemblerSpeed: 3,
        workEnergyPerTick: 1080,
        idleEnergyPerTick: 36,
        exchangeEnergyPerTick: 0,
        isPowerConsumer: true,
        isPowerExchanger: false,
      },
    ],

    // Assemble machines
    [
      2303,
      {
        id: 2303,
        name: "Assembling Machine Mk.I",
        Type: "Assemble",
        count: 0,
        isRaw: false,
        assemblerSpeed: 0.75,
        workEnergyPerTick: 270,
        idleEnergyPerTick: 9,
        exchangeEnergyPerTick: 0,
        isPowerConsumer: true,
        isPowerExchanger: false,
      },
    ],
    [
      2304,
      {
        id: 2304,
        name: "Assembling Machine Mk.II",
        Type: "Assemble",
        count: 0,
        isRaw: false,
        assemblerSpeed: 1,
        workEnergyPerTick: 360,
        idleEnergyPerTick: 12,
        exchangeEnergyPerTick: 0,
        isPowerConsumer: true,
        isPowerExchanger: false,
      },
    ],
    [
      2305,
      {
        id: 2305,
        name: "Assembling Machine Mk.III",
        Type: "Assemble",
        count: 0,
        isRaw: false,
        assemblerSpeed: 1.5,
        workEnergyPerTick: 540,
        idleEnergyPerTick: 18,
        exchangeEnergyPerTick: 0,
        isPowerConsumer: true,
        isPowerExchanger: false,
      },
    ],
    [
      2318,
      {
        id: 2318,
        name: "Re-composing Assembler",
        Type: "Assemble",
        count: 0,
        isRaw: false,
        assemblerSpeed: 3,
        workEnergyPerTick: 1080,
        idleEnergyPerTick: 36,
        exchangeEnergyPerTick: 0,
        isPowerConsumer: true,
        isPowerExchanger: false,
      },
    ],

    // Chemical machines
    [
      2309,
      {
        id: 2309,
        name: "Chemical Plant",
        Type: "Chemical",
        count: 0,
        isRaw: false,
        assemblerSpeed: 1,
        workEnergyPerTick: 360,
        idleEnergyPerTick: 12,
        exchangeEnergyPerTick: 0,
        isPowerConsumer: true,
        isPowerExchanger: false,
      },
    ],
    [
      2317,
      {
        id: 2317,
        name: "Quantum Chemical Plant",
        Type: "Chemical",
        count: 0,
        isRaw: false,
        assemblerSpeed: 2,
        workEnergyPerTick: 720,
        idleEnergyPerTick: 24,
        exchangeEnergyPerTick: 0,
        isPowerConsumer: true,
        isPowerExchanger: false,
      },
    ],

    // Research machines
    [
      2901,
      {
        id: 2901,
        name: "Matrix Lab",
        Type: "Research",
        count: 0,
        isRaw: false,
        assemblerSpeed: 1,
        workEnergyPerTick: 480,
        idleEnergyPerTick: 16,
        exchangeEnergyPerTick: 0,
        isPowerConsumer: true,
        isPowerExchanger: false,
      },
    ],
    [
      2902,
      {
        id: 2902,
        name: "Self-evolution Lab",
        Type: "Research",
        count: 0,
        isRaw: false,
        assemblerSpeed: 3,
        workEnergyPerTick: 1440,
        idleEnergyPerTick: 48,
        exchangeEnergyPerTick: 0,
        isPowerConsumer: true,
        isPowerExchanger: false,
      },
    ],

    // Refine machines
    [
      2308,
      {
        id: 2308,
        name: "Oil Refinery",
        Type: "Refine",
        count: 0,
        isRaw: false,
        assemblerSpeed: 1,
        workEnergyPerTick: 480,
        idleEnergyPerTick: 16,
        exchangeEnergyPerTick: 0,
        isPowerConsumer: true,
        isPowerExchanger: false,
      },
    ],

    // Particle machines
    [
      2310,
      {
        id: 2310,
        name: "Miniature Particle Collider",
        Type: "Particle",
        count: 0,
        isRaw: false,
        assemblerSpeed: 1,
        workEnergyPerTick: 12000,
        idleEnergyPerTick: 400,
        exchangeEnergyPerTick: 0,
        isPowerConsumer: true,
        isPowerExchanger: false,
      },
    ],
  ]);

  const createMockSettings = (overrides?: Partial<GlobalSettings>): GlobalSettings => ({
    proliferator: {
      type: "mk3",
      mode: "production",
      productionBonus: 0.25,
      speedBonus: 0,
      powerIncrease: 1.5,
    },
    machineRank: {
      Smelt: "arc",
      Assemble: "mk1",
      Chemical: "standard",
      Research: "standard",
      Refine: "standard",
      Particle: "standard",
    },
    conveyorBelt: { tier: "mk3", speed: 30, stackCount: 4 },
    sorter: { tier: "mk3", powerConsumption: 72 },
    alternativeRecipes: new Map(),
    miningSpeedResearch: 100,
    proliferatorMultiplier: { production: 1, speed: 1 },
    ...overrides,
  });

  describe("MACHINE_IDS_BY_RECIPE_TYPE", () => {
    it("Smelt機械のIDリストが正しい", () => {
      expect(MACHINE_IDS_BY_RECIPE_TYPE.Smelt).toEqual([2302, 2315, 2319]);
    });

    it("Assemble機械のIDリストが正しい", () => {
      expect(MACHINE_IDS_BY_RECIPE_TYPE.Assemble).toEqual([2303, 2304, 2305, 2318]);
    });

    it("Chemical機械のIDリストが正しい", () => {
      expect(MACHINE_IDS_BY_RECIPE_TYPE.Chemical).toEqual([2309, 2317]);
    });

    it("Research機械のIDリストが正しい", () => {
      expect(MACHINE_IDS_BY_RECIPE_TYPE.Research).toEqual([2901, 2902]);
    });

    it("Refine機械のIDリストが正しい", () => {
      expect(MACHINE_IDS_BY_RECIPE_TYPE.Refine).toEqual([2308]);
    });

    it("Particle機械のIDリストが正しい", () => {
      expect(MACHINE_IDS_BY_RECIPE_TYPE.Particle).toEqual([2310]);
    });
  });

  describe("MINING_EQUIPMENT_IDS", () => {
    it("採掘設備のIDが正しい", () => {
      expect(MINING_EQUIPMENT_IDS.WATER_PUMP).toBe(2306);
      expect(MINING_EQUIPMENT_IDS.OIL_EXTRACTOR).toBe(2307);
    });
  });

  describe("getMachineForRecipe", () => {
    describe("Smelt machines", () => {
      it("arc rankでArc Smelterを返す", () => {
        const settings = createMockSettings({
          machineRank: {
            Smelt: "arc",
            Assemble: "mk1",
            Chemical: "standard",
            Research: "standard",
            Refine: "standard",
            Particle: "standard",
          },
        });

        const machine = getMachineForRecipe("Smelt", mockMachines, settings);
        expect(machine.id).toBe(2302);
        expect(machine.name).toBe("Arc Smelter");
      });

      it("plane rankでPlane Smelterを返す", () => {
        const settings = createMockSettings({
          machineRank: {
            Smelt: "plane",
            Assemble: "mk1",
            Chemical: "standard",
            Research: "standard",
            Refine: "standard",
            Particle: "standard",
          },
        });

        const machine = getMachineForRecipe("Smelt", mockMachines, settings);
        expect(machine.id).toBe(2315);
        expect(machine.name).toBe("Plane Smelter");
      });

      it("negentropy rankでNegentropy Smelterを返す", () => {
        const settings = createMockSettings({
          machineRank: {
            Smelt: "negentropy",
            Assemble: "mk1",
            Chemical: "standard",
            Research: "standard",
            Refine: "standard",
            Particle: "standard",
          },
        });

        const machine = getMachineForRecipe("Smelt", mockMachines, settings);
        expect(machine.id).toBe(2319);
        expect(machine.name).toBe("Negentropy Smelter");
      });
    });

    describe("Assemble machines", () => {
      it("mk1 rankでAssembling Machine Mk.Iを返す", () => {
        const settings = createMockSettings({
          machineRank: {
            Smelt: "arc",
            Assemble: "mk1",
            Chemical: "standard",
            Research: "standard",
            Refine: "standard",
            Particle: "standard",
          },
        });

        const machine = getMachineForRecipe("Assemble", mockMachines, settings);
        expect(machine.id).toBe(2303);
        expect(machine.name).toBe("Assembling Machine Mk.I");
      });

      it("mk2 rankでAssembling Machine Mk.IIを返す", () => {
        const settings = createMockSettings({
          machineRank: {
            Smelt: "arc",
            Assemble: "mk2",
            Chemical: "standard",
            Research: "standard",
            Refine: "standard",
            Particle: "standard",
          },
        });

        const machine = getMachineForRecipe("Assemble", mockMachines, settings);
        expect(machine.id).toBe(2304);
        expect(machine.name).toBe("Assembling Machine Mk.II");
      });

      it("mk3 rankでAssembling Machine Mk.IIIを返す", () => {
        const settings = createMockSettings({
          machineRank: {
            Smelt: "arc",
            Assemble: "mk3",
            Chemical: "standard",
            Research: "standard",
            Refine: "standard",
            Particle: "standard",
          },
        });

        const machine = getMachineForRecipe("Assemble", mockMachines, settings);
        expect(machine.id).toBe(2305);
        expect(machine.name).toBe("Assembling Machine Mk.III");
      });

      it("recomposing rankでRe-composing Assemblerを返す", () => {
        const settings = createMockSettings({
          machineRank: {
            Smelt: "arc",
            Assemble: "recomposing",
            Chemical: "standard",
            Research: "standard",
            Refine: "standard",
            Particle: "standard",
          },
        });

        const machine = getMachineForRecipe("Assemble", mockMachines, settings);
        expect(machine.id).toBe(2318);
        expect(machine.name).toBe("Re-composing Assembler");
      });
    });

    describe("Chemical machines", () => {
      it("standard rankでChemical Plantを返す", () => {
        const settings = createMockSettings({
          machineRank: {
            Smelt: "arc",
            Assemble: "mk1",
            Chemical: "standard",
            Research: "standard",
            Refine: "standard",
            Particle: "standard",
          },
        });

        const machine = getMachineForRecipe("Chemical", mockMachines, settings);
        expect(machine.id).toBe(2309);
        expect(machine.name).toBe("Chemical Plant");
      });

      it("quantum rankでQuantum Chemical Plantを返す", () => {
        const settings = createMockSettings({
          machineRank: {
            Smelt: "arc",
            Assemble: "mk1",
            Chemical: "quantum",
            Research: "standard",
            Refine: "standard",
            Particle: "standard",
          },
        });

        const machine = getMachineForRecipe("Chemical", mockMachines, settings);
        expect(machine.id).toBe(2317);
        expect(machine.name).toBe("Quantum Chemical Plant");
      });
    });

    describe("Research machines", () => {
      it("standard rankでMatrix Labを返す", () => {
        const settings = createMockSettings({
          machineRank: {
            Smelt: "arc",
            Assemble: "mk1",
            Chemical: "standard",
            Research: "standard",
            Refine: "standard",
            Particle: "standard",
          },
        });

        const machine = getMachineForRecipe("Research", mockMachines, settings);
        expect(machine.id).toBe(2901);
        expect(machine.name).toBe("Matrix Lab");
      });

      it("self-evolution rankでSelf-evolution Labを返す", () => {
        const settings = createMockSettings({
          machineRank: {
            Smelt: "arc",
            Assemble: "mk1",
            Chemical: "standard",
            Research: "self-evolution",
            Refine: "standard",
            Particle: "standard",
          },
        });

        const machine = getMachineForRecipe("Research", mockMachines, settings);
        expect(machine.id).toBe(2902);
        expect(machine.name).toBe("Self-evolution Lab");
      });
    });

    describe("Refine machines", () => {
      it("Refineタイプは常にOil Refineryを返す", () => {
        const settings = createMockSettings();

        const machine = getMachineForRecipe("Refine", mockMachines, settings);
        expect(machine.id).toBe(2308);
        expect(machine.name).toBe("Oil Refinery");
      });
    });

    describe("Particle machines", () => {
      it("Particleタイプは常にMiniature Particle Colliderを返す", () => {
        const settings = createMockSettings();

        const machine = getMachineForRecipe("Particle", mockMachines, settings);
        expect(machine.id).toBe(2310);
        expect(machine.name).toBe("Miniature Particle Collider");
      });
    });

    describe("エラーハンドリング", () => {
      it("機械が見つからない場合、最初の機械をフォールバック", () => {
        const emptyMachines = new Map<number, Machine>();
        emptyMachines.set(9999, {
          id: 9999,
          name: "Fallback Machine",
          Type: "Smelt",
          count: 0,
          isRaw: false,
          assemblerSpeed: 1,
          workEnergyPerTick: 100,
          idleEnergyPerTick: 10,
          exchangeEnergyPerTick: 0,
          isPowerConsumer: true,
          isPowerExchanger: false,
        });

        const settings = createMockSettings();
        const machine = getMachineForRecipe("Smelt", emptyMachines, settings);

        expect(machine.id).toBe(9999);
        expect(machine.name).toBe("Fallback Machine");
      });

      it("機械マップが完全に空の場合エラーをthrow", () => {
        const emptyMachines = new Map<number, Machine>();
        const settings = createMockSettings();

        expect(() => {
          getMachineForRecipe("Smelt", emptyMachines, settings);
        }).toThrow("No machine found for recipe type: Smelt");
      });

      it("未定義のrecipeTypeの場合も処理できる（フォールバック）", () => {
        const settings = createMockSettings();
        // @ts-expect-error - Testing undefined recipe type
        const machine = getMachineForRecipe(
          "UnknownType" as Recipe["Type"],
          mockMachines,
          settings
        );

        // idsが空配列になり、targetIdがundefinedになるが、machinesから最初の機械を取得
        expect(machine).toBeDefined();
        expect(machine.id).toBeDefined();
      });
    });
  });
});
