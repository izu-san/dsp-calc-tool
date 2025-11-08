import type { GlobalSettings, RecipeTreeNode } from "../../types";

/**
 * シナリオ定義
 */
export interface Scenario {
  id: string;
  name: string;
  description: string;
  settings: Partial<GlobalSettings>;
  isBottleneckFix?: boolean;
}

/**
 * ボトルネック提案
 */
export interface BottleneckSuggestion {
  nodeId?: string;
  issue: string;
  severity: "high" | "medium" | "low";
  suggestion: string;
  scenarioId: string;
}

/**
 * 最適化目標
 */
export type OptimizationGoal = "power" | "machines" | "efficiency" | "balanced" | null;

/**
 * シナリオ計算結果
 */
export interface ScenarioResult {
  scenario: Scenario;
  result: {
    rootNode: RecipeTreeNode;
    totalPower: { total: number };
    totalMachines: number;
  };
  baseResult: {
    rootNode: RecipeTreeNode;
    totalPower: { total: number };
    totalMachines: number;
  };
  diff: {
    power: number;
    powerPercent: number;
    machines: number;
    machinePercent: number;
    belts: number;
    beltPercent: number;
  };
}
