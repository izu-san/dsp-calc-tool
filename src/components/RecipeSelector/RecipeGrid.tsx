import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Recipe } from '../../types';
import { parseGridIndex, getRecipeIconPath } from '../../utils/grid';
import { useFavoritesStore } from '../../stores/favoritesStore';

interface RecipeGridProps {
  recipes: Recipe[];
  tab: 1 | 2; // 1=Items, 2=Buildings
  onRecipeSelect: (recipe: Recipe) => void;
  selectedRecipeId?: number;
}

const GRID_COLS = 14;
const GRID_ROWS = 8;

export function RecipeGrid({ recipes, tab, onRecipeSelect, selectedRecipeId }: RecipeGridProps) {
  // Filter and organize recipes by grid position
  const gridRecipes = useMemo(() => {
    const grid: (Recipe | null)[][] = Array.from({ length: GRID_ROWS }, () =>
      Array.from({ length: GRID_COLS }, () => null)
    );

    recipes.forEach((recipe) => {
      const pos = parseGridIndex(recipe.GridIndex);
      // GridIndex is 1-indexed, convert to 0-indexed for array
      if (pos.z === tab && pos.y > 0 && pos.x > 0 && pos.y <= GRID_ROWS && pos.x <= GRID_COLS) {
        grid[pos.y - 1][pos.x - 1] = recipe;
      }
    });

    return grid;
  }, [recipes, tab]);

  return (
    <div className="w-full overflow-auto">
      <div className="grid gap-1 p-4" style={{ gridTemplateColumns: `repeat(${GRID_COLS}, minmax(0, 1fr))` }}>
        {gridRecipes.map((row, rowIndex) =>
          row.map((recipe, colIndex) => (
            <RecipeCell
              key={`${rowIndex}-${colIndex}`}
              recipe={recipe}
              isSelected={recipe?.SID === selectedRecipeId}
              onClick={() => recipe && onRecipeSelect(recipe)}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface RecipeCellProps {
  recipe: Recipe | null;
  isSelected: boolean;
  onClick: () => void;
}

function RecipeCell({ recipe, isSelected, onClick }: RecipeCellProps) {
  const { t } = useTranslation();
  const { isFavorite, toggleFavorite } = useFavoritesStore();

  if (!recipe) {
    return <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700" />;
  }

  const iconPath = getRecipeIconPath(
    recipe.SID,
    recipe.Explicit,
    recipe.Results[0]?.id
  );

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    toggleFavorite(recipe.SID);
  };

  return (
    <div className="relative aspect-square group">
      {/* Favorite Star Button */}
      <div
        onClick={handleFavoriteClick}
        className={`
          absolute top-0 right-0 w-6 h-6 flex items-center justify-center z-10
          rounded-bl text-xs transition-all cursor-pointer
          ${isFavorite(recipe.SID)
            ? 'bg-yellow-500 dark:bg-yellow-600 text-white opacity-100'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-100'
          }
          hover:scale-110
        `}
        title={isFavorite(recipe.SID) ? t('removeFromFavorites') : t('addToFavorites')}
      >
        ⭐
      </div>

      {/* Recipe Button */}
      <button
        onClick={onClick}
        className={`
          w-full h-full rounded border-2 transition-all
          hover:border-blue-400 dark:hover:border-blue-500 hover:scale-105
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
          ${isSelected 
            ? 'border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-lg' 
            : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
          }
        `}
        title={recipe.name}
      >
        <div className="w-full h-full flex items-center justify-center p-1">
          <img
            src={iconPath}
            alt={recipe.name}
            className="w-full h-full object-contain"
            onError={(e) => {
              // Fallback if image fails to load
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      </button>
    </div>
  );
}
