import { create } from 'zustand';
import type { Recipe, CalculationResult } from '../types';

interface RecipeSelectionStore {
  selectedRecipe: Recipe | null;
  targetQuantity: number;
  calculationResult: CalculationResult | null;
  setSelectedRecipe: (recipe: Recipe | null) => void;
  setTargetQuantity: (quantity: number) => void;
  setCalculationResult: (result: CalculationResult | null) => void;
}

export const useRecipeSelectionStore = create<RecipeSelectionStore>((set) => ({
  selectedRecipe: null,
  targetQuantity: 1,
  calculationResult: null,
  
  setSelectedRecipe: (recipe) => set({ selectedRecipe: recipe, calculationResult: null }),
  setTargetQuantity: (quantity) => set({ targetQuantity: Math.max(0.1, quantity) }),
  setCalculationResult: (result) => set({ calculationResult: result }),
}));
