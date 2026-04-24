import { Suspense, lazy } from "react";
import { useTranslation } from "react-i18next";
import type { Recipe } from "../../types";

const RecipeSelector = lazy(() =>
  import("../RecipeSelector").then(m => ({ default: m.RecipeSelector }))
);

interface RecipeSelectorSectionProps {
  recipes: Recipe[];
  selectedRecipeId?: number;
  onRecipeSelect: (recipe: Recipe) => void;
}

/**
 * レシピ選択セクション
 */
export function RecipeSelectorSection({
  recipes,
  selectedRecipeId,
  onRecipeSelect,
}: RecipeSelectorSectionProps) {
  const { t } = useTranslation();

  return (
    <section
      className="hologram-panel rounded-md p-6 hover-lift"
      aria-labelledby="recipe-select-heading"
    >
      <h2 id="recipe-select-heading" className="text-lg font-semibold text-space-50 mb-4">
        {t("selectRecipe")}
      </h2>
      <Suspense fallback={<div className="text-center py-4">{t("loading")}</div>}>
        <RecipeSelector
          recipes={recipes}
          onRecipeSelect={onRecipeSelect}
          selectedRecipeId={selectedRecipeId}
        />
      </Suspense>
    </section>
  );
}
