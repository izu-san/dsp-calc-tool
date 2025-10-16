import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FavoritesStore {
  favoriteRecipes: Set<number>;
  toggleFavorite: (recipeId: number) => void;
  isFavorite: (recipeId: number) => boolean;
  clearFavorites: () => void;
}

export const useFavoritesStore = create<FavoritesStore>()(
  persist(
    (set, get) => ({
      favoriteRecipes: new Set<number>(),

      toggleFavorite: (recipeId) =>
        set((state) => {
          const newFavorites = new Set(state.favoriteRecipes);
          if (newFavorites.has(recipeId)) {
            newFavorites.delete(recipeId);
          } else {
            newFavorites.add(recipeId);
          }
          return { favoriteRecipes: newFavorites };
        }),

      isFavorite: (recipeId) => get().favoriteRecipes.has(recipeId),

      clearFavorites: () => set({ favoriteRecipes: new Set() }),
    }),
    {
      name: 'dsp-calculator-favorites',
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          const { state } = JSON.parse(str);
          // Convert array back to Set
          if (state?.favoriteRecipes && Array.isArray(state.favoriteRecipes)) {
            state.favoriteRecipes = new Set(state.favoriteRecipes);
          }
          return { state };
        },
        setItem: (name, value) => {
          const str = JSON.stringify({
            state: {
              ...value.state,
              favoriteRecipes: Array.from(value.state.favoriteRecipes),
            },
          });
          localStorage.setItem(name, str);
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);
