import { describe, it, expect } from "vitest";
import { MACHINE_IDS_BY_RECIPE_TYPE, MINING_EQUIPMENT_IDS, getMachineForRecipe } from "../machines";
import type { GlobalSettings } from "../../types";
import { createMachineByType } from "../../test/factories/testDataFactory";

describe("machines", () => {
  // Mock machines data
  const mockMachines = new Map([
    // Smelt machines
    [
      2302,
      createMachineByType({
        id: 2302,
        name: "Arc Smelter",
        type: "Smelt",
        assemblerSpeed: 1,
        workEnergyPerTick: 360,
        idleEnergyPerTick: 12,
      }),
    ],
    [
      2315,
      createMachineByType({
        id: 2315,
        name: "Plane Smelter",
        type: "Smelt",
        assemblerSpeed: 2,
        workEnergyPerTick: 720,
        idleEnergyPerTick: 24,
      }),
    ],
    [
      2319,
      createMachineByType({
        id: 2319,
        name: "Negentropy Smelter",
        type: "Smelt",
        assemblerSpeed: 3,
        workEnergyPerTick: 1080,
        idleEnergyPerTick: 36,
      }),
    ],
    // Assemble machines
    [
      2303,
      createMachineByType({
        id: 2303,
        name: "Assembling Machine Mk.I",
        type: "Assemble",
        assemblerSpeed: 0.75,
        workEnergyPerTick: 270,
        idleEnergyPerTick: 9,
      }),
    ],
    [
      2304,
      createMachineByType({
        id: 2304,
        name: "Assembling Machine Mk.II",
        type: "Assemble",
        assemblerSpeed: 1,
        workEnergyPerTick: 360,
        idleEnergyPerTick: 12,
      }),
    ],
    [
      2305,
      createMachineByType({
        id: 2305,
        name: "Assembling Machine Mk.III",
        type: "Assemble",
        assemblerSpeed: 1.5,
        workEnergyPerTick: 540,
        idleEnergyPerTick: 18,
      }),
    ],
    [
      2318,
      createMachineByType({
        id: 2318,
        name: "Re-composing Assembler",
        type: "Assemble",
        assemblerSpeed: 3,
        workEnergyPerTick: 1080,
        idleEnergyPerTick: 36,
      }),
    ],
    // Chemical machines
    [
      2309,
      createMachineByType({
        id: 2309,
        name: "Chemical Plant",
        type: "Chemical",
        assemblerSpeed: 1,
        workEnergyPerTick: 360,
        idleEnergyPerTick: 12,
      }),
    ],
    [
      2317,
      createMachineByType({
        id: 2317,
        name: "Quantum Chemical Plant",
        type: "Chemical",
        assemblerSpeed: 2,
        workEnergyPerTick: 720,
        idleEnergyPerTick: 24,
      }),
    ],
    // Research machines
    [
      2901,
      createMachineByType({
        id: 2901,
        name: "Matrix Lab",
        type: "Research",
        assemblerSpeed: 1,
        workEnergyPerTick: 480,
        idleEnergyPerTick: 16,
      }),
    ],
    [
      2902,
      createMachineByType({
        id: 2902,
        name: "Self-evolution Lab",
        type: "Research",
        assemblerSpeed: 3,
        workEnergyPerTick: 1440,
        idleEnergyPerTick: 48,
      }),
    ],
    // Refine machines
    [
      2308,
      createMachineByType({
        id: 2308,
        name: "Oil Refinery",
        type: "Refine",
        assemblerSpeed: 1,
        workEnergyPerTick: 480,
        idleEnergyPerTick: 16,
      }),
    ],
    // Particle machines
    [
      2310,
      createMachineByType({
        id: 2310,
        name: "Miniature Particle Collider",
        type: "Particle",
        assemblerSpeed: 1,
        workEnergyPerTick: 12000,
        idleEnergyPerTick: 400,
      }),
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
        const emptyMachines = new Map<number, ReturnType<typeof createMachineByType>>();
        emptyMachines.set(
          9999,
          createMachineByType({
            id: 9999,
            name: "Fallback Machine",
            type: "Smelt",
            assemblerSpeed: 1,
            workEnergyPerTick: 100,
            idleEnergyPerTick: 10,
          })
        );

        const settings = createMockSettings();
        const machine = getMachineForRecipe("Smelt", emptyMachines, settings);

        expect(machine.id).toBe(9999);
        expect(machine.name).toBe("Fallback Machine");
      });

      it("機械マップが完全に空の場合エラーをthrow", () => {
        const emptyMachines = new Map<number, ReturnType<typeof createMachineByType>>();
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
