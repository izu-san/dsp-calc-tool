/**
 * Tab state types for UI components
 */

/**
 * Production results panel tab types
 */
export const ProductionResultsTab = {
  ProductionTree: "production-tree",
  Statistics: "statistics",
  BuildingCost: "building-cost",
  PowerGeneration: "power-generation",
  MiningCalculator: "mining-calculator",
  Roadmap: "roadmap",
  Visualization: "visualization",
} as const;

export type ProductionResultsTab = (typeof ProductionResultsTab)[keyof typeof ProductionResultsTab];

/**
 * Recipe selector tab types
 */
export const RecipeSelectorTab = {
  RecipeList: "recipe-list",
  Favorites: "favorites",
} as const;

export type RecipeSelectorTab = (typeof RecipeSelectorTab)[keyof typeof RecipeSelectorTab];

/**
 * Main application view types
 */
export const MainView = {
  Calculator: "calculator",
  WhatIfSimulator: "what-if-simulator",
} as const;

export type MainView = (typeof MainView)[keyof typeof MainView];
