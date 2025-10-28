// Conveyor belt and sorter related types and constants

export type ConveyorBeltTier = "mk1" | "mk2" | "mk3";
export type SorterTier = "mk1" | "mk2" | "mk3" | "pile";

export interface ConveyorBeltConfig {
  tier: ConveyorBeltTier;
  speed: number; // items per second (base speed)
  stackCount: number; // 1-4 stacks
}

export interface SorterConfig {
  tier: SorterTier;
  powerConsumption: number; // kW
}

export const CONVEYOR_BELT_DATA: Record<ConveyorBeltTier, ConveyorBeltConfig> = {
  mk1: { tier: "mk1", speed: 6, stackCount: 1 },
  mk2: { tier: "mk2", speed: 12, stackCount: 1 },
  mk3: { tier: "mk3", speed: 30, stackCount: 1 },
};

export const SORTER_DATA: Record<SorterTier, SorterConfig> = {
  mk1: { tier: "mk1", powerConsumption: (300 * 60) / 1000 }, // 18 kW
  mk2: { tier: "mk2", powerConsumption: (600 * 60) / 1000 }, // 36 kW
  mk3: { tier: "mk3", powerConsumption: (1200 * 60) / 1000 }, // 72 kW
  pile: { tier: "pile", powerConsumption: (2400 * 60) / 1000 }, // 144 kW
};
