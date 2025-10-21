import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface FavoritesStore {
  favoriteRecipes: Set<number>;
  toggleFavorite: (recipeId: number) => void;
  isFavorite: (recipeId: number) => boolean;
  clearFavorites: () => void;
}

// 永続化用の型（SetをJSON化できる形式に）
interface PersistedFavoritesStore {
  favoriteRecipes: number[];
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
      storage: createJSONStorage(() => localStorage),
      // SetをJSON保存用に配列に変換
      partialize: (state): PersistedFavoritesStore => ({
        favoriteRecipes: Array.from(state.favoriteRecipes),
      }),
      // localStorageから読み込んだ配列をSetに変換
      merge: (persistedState, currentState) => {
        const persisted = persistedState as PersistedFavoritesStore | undefined;
        return {
          ...currentState,
          favoriteRecipes: persisted?.favoriteRecipes 
            ? new Set(persisted.favoriteRecipes)
            : new Set<number>(),
        };
      },
    }
  )
);
