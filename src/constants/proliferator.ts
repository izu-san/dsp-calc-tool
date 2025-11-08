import type { ProliferatorType, ProliferatorMode } from "../types/settings";

/**
 * 増産剤の種類一覧
 */
export const PROLIFERATOR_TYPES: readonly ProliferatorType[] = [
  "none",
  "mk1",
  "mk2",
  "mk3",
] as const;

/**
 * 増産剤のモード一覧
 */
export const PROLIFERATOR_MODES: readonly ProliferatorMode[] = ["production", "speed"] as const;
