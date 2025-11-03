/**
 * Tab state types for UI components
 */

/**
 * Production results panel tab types
 */
export enum ProductionResultsTab {
  ProductionTree = "production-tree",
  Statistics = "statistics",
  BuildingCost = "building-cost",
  PowerGeneration = "power-generation",
  MiningCalculator = "mining-calculator",
  Roadmap = "roadmap",
}

/**
 * Recipe selector tab types
 */
export enum RecipeSelectorTab {
  RecipeList = "recipe-list",
  Favorites = "favorites",
}

/**
 * Main application view types
 */
export enum MainView {
  Calculator = "calculator",
  WhatIfSimulator = "what-if-simulator",
}
