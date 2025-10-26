// Setting templates for different game stages

import type { GlobalSettings } from './index';
import { PROLIFERATOR_DATA } from './proliferator';
import { CONVEYOR_BELT_DATA, SORTER_DATA } from './conveyor';
import { DEFAULT_PHOTON_GENERATION_SETTINGS } from './photonGeneration';

/**
 * ゲームテンプレートの種類
 */
export type GameTemplate =
  | 'earlyGame'
  | 'midGame'
  | 'lateGame'
  | 'endGame'
  | 'powerSaver';

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
      photonGeneration: DEFAULT_PHOTON_GENERATION_SETTINGS,
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
      photonGeneration: DEFAULT_PHOTON_GENERATION_SETTINGS,
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
      photonGeneration: DEFAULT_PHOTON_GENERATION_SETTINGS,
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
      photonGeneration: DEFAULT_PHOTON_GENERATION_SETTINGS,
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
      photonGeneration: DEFAULT_PHOTON_GENERATION_SETTINGS,
    },
  },
};

