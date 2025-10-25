import { Suspense, lazy } from 'react';
import { useTranslation } from 'react-i18next';
import type { Recipe } from '../../types';

const RecipeSelector = lazy(() => import('../RecipeSelector').then(m => ({ default: m.RecipeSelector })));

interface RecipeSelectorSectionProps {
  recipes: Recipe[];
  selectedRecipeId?: number;
  onRecipeSelect: (recipe: Recipe) => void;
}

/**
 * レシピ選択セクション
 */
export function RecipeSelectorSection({ recipes, selectedRecipeId, onRecipeSelect }: RecipeSelectorSectionProps) {
  const { t } = useTranslation();

  return (
    <div className="hologram-panel rounded-lg shadow-panel p-6 border border-neon-blue/20 hover-lift">
      <h2 className="text-lg font-semibold text-neon-cyan mb-4">{t('selectRecipe')}</h2>
      <Suspense fallback={<div className="text-center py-4">{t('loading')}</div>}>
        <RecipeSelector
          recipes={recipes}
          onRecipeSelect={onRecipeSelect}
          selectedRecipeId={selectedRecipeId}
        />
      </Suspense>
    </div>
  );
}

