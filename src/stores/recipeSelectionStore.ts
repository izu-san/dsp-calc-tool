import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Recipe, CalculationResult } from "../types";
import { recordHistoryEntry } from "../utils/historyRecorder";
import {
  generateRecipeSelectionDescription,
  generateTargetQuantityDescription,
} from "../utils/historyDescriptionHelper";
import i18n from "../i18n";

interface RecipeSelectionStore {
  selectedRecipe: Recipe | null;
  targetQuantity: number;
  calculationResult: CalculationResult | null;
  setSelectedRecipe: (recipe: Recipe | null) => void;
  setTargetQuantity: (quantity: number) => void;
  setCalculationResult: (result: CalculationResult | null) => void;
}

export const useRecipeSelectionStore = create<RecipeSelectionStore>()(
  persist(
    set => ({
      selectedRecipe: null,
      targetQuantity: 1,
      calculationResult: null,

      setSelectedRecipe: recipe =>
        set(state => {
          const before = state.selectedRecipe;
          const after = recipe;

          // Generate description with before/after values
          const t = (key: string) => i18n.t(key);
          const description = generateRecipeSelectionDescription(before, after, t, i18n.language);

          // Record history (immediate, no debounce)
          recordHistoryEntry(
            "plan",
            description,
            { "selectedRecipe.recipeSID": before?.SID },
            { "selectedRecipe.recipeSID": after?.SID }
          );

          return { selectedRecipe: recipe, calculationResult: null };
        }),
      setTargetQuantity: quantity => {
        const actualQuantity = Math.max(0.1, quantity);

        set(state => {
          const before = state.targetQuantity;
          const after = actualQuantity;

          // Generate description with before/after values
          const t = (key: string) => i18n.t(key);
          const description = generateTargetQuantityDescription(before, after, t, i18n.language);

          // Record history (immediate, no debounce)
          recordHistoryEntry(
            "plan",
            description,
            { targetQuantity: before },
            { targetQuantity: after }
          );

          return { targetQuantity: actualQuantity };
        });
      },
      setCalculationResult: result => set({ calculationResult: result }),
    }),
    {
      name: "dsp-calculator-recipe-selection",
      partialize: state => ({
        // calculationResultは永続化しない（リロード時に再計算が必要）
        selectedRecipe: state.selectedRecipe,
        targetQuantity: state.targetQuantity,
      }),
    }
  )
);
