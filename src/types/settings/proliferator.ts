// Proliferator (増産剤) related types and constants

export type ProliferatorType = "none" | "mk1" | "mk2" | "mk3";
export type ProliferatorMode = "production" | "speed"; // Exclusive choice

export interface ProliferatorConfig {
  type: ProliferatorType;
  mode: ProliferatorMode;
  productionBonus: number; // 0.125 for Mk.I, 0.20 for Mk.II, 0.25 for Mk.III
  speedBonus: number; // 0.25 for Mk.I, 0.50 for Mk.II, 1.00 for Mk.III
  powerIncrease: number; // 0.30 for Mk.I, 0.70 for Mk.II, 1.50 for Mk.III
}

export const PROLIFERATOR_DATA: Record<ProliferatorType, Omit<ProliferatorConfig, "mode">> = {
  none: {
    type: "none",
    productionBonus: 0,
    speedBonus: 0,
    powerIncrease: 0,
  },
  mk1: {
    type: "mk1",
    productionBonus: 0.125,
    speedBonus: 0.25,
    powerIncrease: 0.3,
  },
  mk2: {
    type: "mk2",
    productionBonus: 0.2,
    speedBonus: 0.5,
    powerIncrease: 0.7,
  },
  mk3: {
    type: "mk3",
    productionBonus: 0.25,
    speedBonus: 1.0,
    powerIncrease: 1.5,
  },
};
