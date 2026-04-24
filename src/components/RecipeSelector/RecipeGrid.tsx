import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { Recipe } from "../../types";
import { parseGridIndex } from "../../utils/grid";
import { useFavoritesStore } from "../../stores/favoritesStore";
import { ItemIcon } from "../ItemIcon";
import { cn } from "../../utils/classNames";
import { NEON_GLOW } from "../../constants/theme";

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

  // Recipe grid cells represent recipes, so use recipe SID for the icon.
  const itemId = recipe.SID;

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    toggleFavorite(recipe.SID);
  };

  return (
    <div className="relative aspect-square group">
      {/* Favorite Star Button */}
      <button
        type="button"
        data-testid={`favorite-button-${recipe.SID}`}
        onClick={handleFavoriteClick}
        aria-pressed={isFavorite(recipe.SID)}
        aria-label={isFavorite(recipe.SID) ? t("removeFromFavorites") : t("addToFavorites")}
        className={cn(
          "absolute top-0 right-0 w-6 h-6 flex items-center justify-center z-10 rounded-bl text-xs transition-colors cursor-pointer",
          {
            "bg-space-500/90 text-white opacity-100": isFavorite(recipe.SID),
            "bg-dark-700/80 text-space-300 opacity-0 group-hover:opacity-100 focus:opacity-100":
              !isFavorite(recipe.SID),
          }
        )}
        title={isFavorite(recipe.SID) ? t("removeFromFavorites") : t("addToFavorites")}
      >
        <span aria-hidden="true">★</span>
      </button>

      {/* Recipe Button */}
      <button
        data-testid={`recipe-button-${recipe.SID}`}
        onClick={onClick}
        aria-pressed={isSelected}
        className={cn(
          "w-full h-full rounded-md border transition-colors focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-1 focus:ring-offset-dark-800",
          {
            "border-primary-300 bg-primary-900/35": isSelected,
            "border-space-700 bg-dark-700/60": !isSelected,
          },
          isSelected ? NEON_GLOW.cyan : "",
          !isSelected && "hover:border-space-500 hover:bg-dark-600/70"
        )}
        title={recipe.name}
      >
        <div className="w-full h-full flex items-center justify-center p-1">
          <ItemIcon itemId={itemId} alt={recipe.name} preferRecipes={true} size="auto" />
        </div>
      </button>
    </div>
  );
}
