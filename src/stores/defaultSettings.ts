/**
 * Default settings for the application
 * Centralized definition to avoid duplication
 */

import type { GlobalSettings } from "../types";
import {
  PROLIFERATOR_DATA,
  CONVEYOR_BELT_DATA,
  SORTER_DATA,
  DEFAULT_ALTERNATIVE_RECIPES,
  DEFAULT_PHOTON_GENERATION_SETTINGS,
} from "../types/settings";

export const defaultSettings: GlobalSettings = {
  proliferator: {
    ...PROLIFERATOR_DATA.none,
    mode: "speed",
  },
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
  alternativeRecipes: new Map(
    Object.entries(DEFAULT_ALTERNATIVE_RECIPES).map(([k, v]) => [Number(k), v])
  ),
  miningSpeedResearch: 100, // Default: +0% (no research bonus)
  proliferatorMultiplier: { production: 1, speed: 1 }, // Default: 1x (no multiplier)
  photonGeneration: DEFAULT_PHOTON_GENERATION_SETTINGS,
};
