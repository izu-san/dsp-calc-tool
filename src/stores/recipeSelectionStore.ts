import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Recipe, CalculationResult } from "../types";
import { recordPlanHistory } from "../services/history-recording";
import {
  generateRecipeSelectionDescription,
  generateTargetQuantityDescription,
} from "../utils/history/formatters";
import i18n from "../i18n";
import { createSelectors } from "./createSelectors";

interface RecipeSelectionStore {
  selectedRecipe: Recipe | null;
  targetQuantity: number;
  calculationResult: CalculationResult | null;
  setSelectedRecipe: (recipe: Recipe | null) => void;
  setTargetQuantity: (quantity: number) => void;
  setCalculationResult: (result: CalculationResult | null) => void;
}

const useRecipeSelectionStoreBase = create<RecipeSelectionStore>()(
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
          recordPlanHistory({
            description,
            before: { "selectedRecipe.recipeSID": before?.SID },
            after: { "selectedRecipe.recipeSID": after?.SID },
          });

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
          recordPlanHistory({
            description,
            before: { targetQuantity: before },
            after: { targetQuantity: after },
          });

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

export const useRecipeSelectionStore = createSelectors(useRecipeSelectionStoreBase);
