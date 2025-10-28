// Central export point for settings-related types

// Re-export all types and constants
export * from "./proliferator";
export * from "./machine";
export * from "./conveyor";
export * from "./templates";
export * from "./photonGeneration";

// Import types for GlobalSettings
import type { ProliferatorConfig } from "./proliferator";
import type { MachineRankSettings } from "./machine";
import type { ConveyorBeltConfig, SorterConfig } from "./conveyor";
import type { PhotonGenerationSettings } from "./photonGeneration";

// Global settings interface
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
  photonGeneration: PhotonGenerationSettings; // 光子生成設定
}
