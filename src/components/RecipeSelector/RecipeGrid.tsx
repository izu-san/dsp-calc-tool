import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { Recipe } from "../../types";
import { parseGridIndex } from "../../utils/grid";
import { useFavoritesStore } from "../../stores/favoritesStore";
import { ItemIcon } from "../ItemIcon";

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

    recipes.forEach(recipe => {
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
      <div
        className="grid gap-1 p-4"
        style={{ gridTemplateColumns: `repeat(${GRID_COLS}, minmax(0, 1fr))` }}
      >
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
    return <div className="aspect-square bg-dark-800/30 rounded border border-dark-600/50" />;
  }

  // Determine the icon ID based on recipe type
  // Explicit recipes use recipe SID, implicit recipes use first result item ID
  const itemId = recipe.Explicit ? recipe.SID : recipe.Results[0]?.id || recipe.SID;

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    toggleFavorite(recipe.SID);
  };

  return (
    <div className="relative aspect-square group">
      {/* Favorite Star Button */}
      <div
        data-testid={`favorite-button-${recipe.SID}`}
        onClick={handleFavoriteClick}
        className={`
          absolute top-0 right-0 w-6 h-6 flex items-center justify-center z-10
          rounded-bl text-xs transition-all cursor-pointer
          ${
            isFavorite(recipe.SID)
              ? "bg-neon-yellow/80 backdrop-blur-sm text-white opacity-100 shadow-[0_0_10px_rgba(255,215,0,0.5)]"
              : "bg-dark-700/50 text-space-400 opacity-0 group-hover:opacity-100"
          }
          hover:scale-110 hover:shadow-[0_0_15px_rgba(255,215,0,0.6)]
        `}
        title={isFavorite(recipe.SID) ? t("removeFromFavorites") : t("addToFavorites")}
      >
        ⭐
      </div>

      {/* Recipe Button */}
      <button
        data-testid={`recipe-button-${recipe.SID}`}
        onClick={onClick}
        className={`
          w-full h-full rounded border-2 transition-all ripple-effect
          hover:border-neon-cyan hover:scale-105 hover:shadow-[0_0_10px_rgba(0,217,255,0.3)]
          focus:outline-none focus:ring-2 focus:ring-neon-blue focus:ring-offset-1
          ${
            isSelected
              ? "border-neon-cyan bg-neon-cyan/20 backdrop-blur-sm shadow-[0_0_15px_rgba(0,217,255,0.5)] scale-105"
              : "border-neon-blue/20 bg-dark-700/50 backdrop-blur-sm"
          }
        `}
        title={recipe.name}
      >
        <div className="w-full h-full flex items-center justify-center p-1">
          <ItemIcon itemId={itemId} alt={recipe.name} preferRecipes={recipe.Explicit} size="auto" />
        </div>
      </button>
    </div>
  );
}
