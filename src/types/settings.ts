// Settings and configuration types

export type ProliferatorType = 'none' | 'mk1' | 'mk2' | 'mk3';
export type ProliferatorMode = 'production' | 'speed'; // Exclusive choice
export type ConveyorBeltTier = 'mk1' | 'mk2' | 'mk3';
export type SorterTier = 'mk1' | 'mk2' | 'mk3' | 'pile';

// Machine rank types
export type SmelterRank = 'arc' | 'plane' | 'negentropy';
export type AssemblerRank = 'mk1' | 'mk2' | 'mk3' | 'recomposing';
export type ChemicalPlantRank = 'standard' | 'quantum';
export type MatrixLabRank = 'standard' | 'self-evolution';

export interface ProliferatorConfig {
  type: ProliferatorType;
  mode: ProliferatorMode;
  productionBonus: number; // 0.125 for Mk.I, 0.20 for Mk.II, 0.25 for Mk.III
  speedBonus: number; // 0.25 for Mk.I, 0.50 for Mk.II, 1.00 for Mk.III
  powerIncrease: number; // 0.30 for Mk.I, 0.70 for Mk.II, 1.50 for Mk.III
}

export interface ConveyorBeltConfig {
  tier: ConveyorBeltTier;
  speed: number; // items per second (base speed)
  stackCount: number; // 1-4 stacks
}

export interface SorterConfig {
  tier: SorterTier;
  powerConsumption: number; // kW
}

export interface MachineRankSettings {
  Smelt: SmelterRank;
  Assemble: AssemblerRank;
  Chemical: ChemicalPlantRank;
  Research: MatrixLabRank;
  Refine: string; // Oil Refinery (usually only one type)
  Particle: string; // Miniature Particle Collider (usually only one type)
}

export interface GlobalSettings {
  proliferator: ProliferatorConfig;
  machineRank: MachineRankSettings;
  conveyorBelt: ConveyorBeltConfig;
  sorter: SorterConfig;
  alternativeRecipes: Map<number, number>; // itemId -> preferred recipeId
  miningSpeedResearch: number; // Mining Speed Research bonus (100 = +0%, 200 = +100%)
  proliferatorMultiplier: {
    production: number; // Multiplier for production bonus (1 = default, 2 = 2x, etc.)
    speed: number; // Multiplier for speed bonus (1 = default, 2 = 2x, etc.)
  };
}

// Constants
export const PROLIFERATOR_DATA: Record<ProliferatorType, Omit<ProliferatorConfig, 'mode'>> = {
  none: {
    type: 'none',
    productionBonus: 0,
    speedBonus: 0,
    powerIncrease: 0,
  },
  mk1: {
    type: 'mk1',
    productionBonus: 0.125,
    speedBonus: 0.25,
    powerIncrease: 0.30,
  },
  mk2: {
    type: 'mk2',
    productionBonus: 0.20,
    speedBonus: 0.50,
    powerIncrease: 0.70,
  },
  mk3: {
    type: 'mk3',
    productionBonus: 0.25,
    speedBonus: 1.00,
    powerIncrease: 1.50,
  },
};

export const CONVEYOR_BELT_DATA: Record<ConveyorBeltTier, ConveyorBeltConfig> = {
  mk1: { tier: 'mk1', speed: 6, stackCount: 1 },
  mk2: { tier: 'mk2', speed: 12, stackCount: 1 },
  mk3: { tier: 'mk3', speed: 30, stackCount: 1 },
};

export const SORTER_DATA: Record<SorterTier, SorterConfig> = {
  mk1: { tier: 'mk1', powerConsumption: (300 * 60) / 1000 }, // 18 kW
  mk2: { tier: 'mk2', powerConsumption: (600 * 60) / 1000 }, // 36 kW
  mk3: { tier: 'mk3', powerConsumption: (1200 * 60) / 1000 }, // 72 kW
  pile: { tier: 'pile', powerConsumption: (3000 * 60) / 1000 }, // 180 kW
};

// Default alternative recipes (marked with ★ in specs)
export const DEFAULT_ALTERNATIVE_RECIPES: Record<number, number> = {
  1116: 1406, // Sulfuric Acid -> SID 1406
  1109: 1106, // Energetic Graphite -> SID 1106
  1112: 1206, // Diamond -> SID 1206
  1208: 1506, // Particle Container -> SID 1506
  1114: 1107, // Refined Oil -> SID 1107
  1121: 1507, // Deuterium -> SID 1507
  1123: 1108, // Graphene -> SID 1108
  1117: 1209, // Organic Crystal -> SID 1209
  1126: 1505, // Casimir Crystal -> SID 1505
  1120: -1, // Hydrogen -> -1 (mining)
};

// Setting Templates for different game stages
export interface SettingsTemplate {
  name: string;
  description: string;
  icon: string;
  settings: GlobalSettings;
}

export const SETTINGS_TEMPLATES: Record<string, SettingsTemplate> = {
  earlyGame: {
    name: 'Early Game',
    description: 'Basic setup for starting production',
    icon: '🌱',
    settings: {
      proliferator: {
        ...PROLIFERATOR_DATA.none,
        mode: 'speed',
      },
      machineRank: {
        Smelt: 'arc',
        Assemble: 'mk1',
        Chemical: 'standard',
        Research: 'standard',
        Refine: 'standard',
        Particle: 'standard',
      },
      conveyorBelt: CONVEYOR_BELT_DATA.mk1,
      sorter: SORTER_DATA.mk1,
      alternativeRecipes: new Map(Object.entries(DEFAULT_ALTERNATIVE_RECIPES).map(([k, v]) => [Number(k), v])),
      miningSpeedResearch: 100, // +0%
      proliferatorMultiplier: { production: 1, speed: 1 },
    },
  },
  midGame: {
    name: 'Mid Game',
    description: 'Improved belts and basic proliferator',
    icon: '⚙️',
    settings: {
      proliferator: {
        ...PROLIFERATOR_DATA.mk1,
        mode: 'speed',
      },
      machineRank: {
        Smelt: 'arc',
        Assemble: 'mk2',
        Chemical: 'standard',
        Research: 'standard',
        Refine: 'standard',
        Particle: 'standard',
      },
      conveyorBelt: CONVEYOR_BELT_DATA.mk2,
      sorter: SORTER_DATA.mk2,
      alternativeRecipes: new Map(Object.entries(DEFAULT_ALTERNATIVE_RECIPES).map(([k, v]) => [Number(k), v])),
      miningSpeedResearch: 120, // +20% (Lv2)
      proliferatorMultiplier: { production: 1, speed: 1 },
    },
  },
  lateGame: {
    name: 'Late Game',
    description: 'Advanced production with Mk.III machines',
    icon: '🚀',
    settings: {
      proliferator: {
        ...PROLIFERATOR_DATA.mk2,
        mode: 'speed',
      },
      machineRank: {
        Smelt: 'arc',
        Assemble: 'mk3',
        Chemical: 'quantum',
        Research: 'standard',
        Refine: 'standard',
        Particle: 'standard',
      },
      conveyorBelt: CONVEYOR_BELT_DATA.mk3,
      sorter: SORTER_DATA.mk3,
      alternativeRecipes: new Map(Object.entries(DEFAULT_ALTERNATIVE_RECIPES).map(([k, v]) => [Number(k), v])),
      miningSpeedResearch: 150, // +50% (Lv5)
      proliferatorMultiplier: { production: 1, speed: 1 },
    },
  },
  endGame: {
    name: 'End Game',
    description: 'Maximum efficiency with all upgrades',
    icon: '⭐',
    settings: {
      proliferator: {
        ...PROLIFERATOR_DATA.mk3,
        mode: 'speed',
      },
      machineRank: {
        Smelt: 'negentropy',
        Assemble: 'recomposing',
        Chemical: 'quantum',
        Research: 'self-evolution',
        Refine: 'standard',
        Particle: 'standard',
      },
      conveyorBelt: { ...CONVEYOR_BELT_DATA.mk3, stackCount: 4 },
      sorter: SORTER_DATA.pile,
      alternativeRecipes: new Map(Object.entries(DEFAULT_ALTERNATIVE_RECIPES).map(([k, v]) => [Number(k), v])),
      miningSpeedResearch: 200, // +100% (Lv10)
      proliferatorMultiplier: { production: 1, speed: 1 },
    },
  },
  powerSaver: {
    name: 'Power Saver',
    description: 'Minimize machines with production boost',
    icon: '💡',
    settings: {
      proliferator: {
        ...PROLIFERATOR_DATA.mk3,
        mode: 'production',
      },
      machineRank: {
        Smelt: 'negentropy',
        Assemble: 'recomposing',
        Chemical: 'quantum',
        Research: 'self-evolution',
        Refine: 'standard',
        Particle: 'standard',
      },
      conveyorBelt: { ...CONVEYOR_BELT_DATA.mk3, stackCount: 4 },
      sorter: SORTER_DATA.pile,
      alternativeRecipes: new Map(Object.entries(DEFAULT_ALTERNATIVE_RECIPES).map(([k, v]) => [Number(k), v])),
      miningSpeedResearch: 200, // +100% (Lv10)
      proliferatorMultiplier: { production: 1, speed: 1 },
    },
  },
};
