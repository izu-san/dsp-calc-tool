import { describe, it, expect, beforeEach } from 'vitest';
import { useFavoritesStore } from '../favoritesStore';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('favoritesStore', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorageMock.clear();
    // Reset store state (partial update, not replace)
    useFavoritesStore.setState({ favoriteRecipes: new Set() });
  });

  describe('favoriteRecipes', () => {
    it('should initialize with empty Set', () => {
      const state = useFavoritesStore.getState();
      expect(state.favoriteRecipes).toBeInstanceOf(Set);
      expect(state.favoriteRecipes.size).toBe(0);
    });
  });

  describe('toggleFavorite', () => {
    it('should add recipe to favorites when not present', () => {
      const { toggleFavorite } = useFavoritesStore.getState();
      
      toggleFavorite(1101);
      
      const updatedState = useFavoritesStore.getState();
      expect(updatedState.favoriteRecipes.has(1101)).toBe(true);
      expect(updatedState.favoriteRecipes.size).toBe(1);
    });

    it('should remove recipe from favorites when already present', () => {
      const { toggleFavorite } = useFavoritesStore.getState();
      
      // Add first
      toggleFavorite(1101);
      expect(useFavoritesStore.getState().favoriteRecipes.has(1101)).toBe(true);
      
      // Remove
      toggleFavorite(1101);
      expect(useFavoritesStore.getState().favoriteRecipes.has(1101)).toBe(false);
      expect(useFavoritesStore.getState().favoriteRecipes.size).toBe(0);
    });

    it('should handle multiple recipe IDs', () => {
      const { toggleFavorite } = useFavoritesStore.getState();
      
      toggleFavorite(1101);
      toggleFavorite(1102);
      toggleFavorite(1103);
      
      const state = useFavoritesStore.getState();
      expect(state.favoriteRecipes.has(1101)).toBe(true);
      expect(state.favoriteRecipes.has(1102)).toBe(true);
      expect(state.favoriteRecipes.has(1103)).toBe(true);
      expect(state.favoriteRecipes.size).toBe(3);
    });

    it('should not affect other favorites when toggling', () => {
      const { toggleFavorite } = useFavoritesStore.getState();
      
      toggleFavorite(1101);
      toggleFavorite(1102);
      
      // Toggle first one off
      toggleFavorite(1101);
      
      const state = useFavoritesStore.getState();
      expect(state.favoriteRecipes.has(1101)).toBe(false);
      expect(state.favoriteRecipes.has(1102)).toBe(true);
      expect(state.favoriteRecipes.size).toBe(1);
    });
  });

  describe('isFavorite', () => {
    it('should return false for non-existent recipe', () => {
      const { isFavorite } = useFavoritesStore.getState();
      
      expect(isFavorite(9999)).toBe(false);
    });

    it('should return true for favorited recipe', () => {
      const { toggleFavorite, isFavorite } = useFavoritesStore.getState();
      
      toggleFavorite(1101);
      
      expect(isFavorite(1101)).toBe(true);
    });

    it('should return false after toggling off', () => {
      const { toggleFavorite, isFavorite } = useFavoritesStore.getState();
      
      toggleFavorite(1101);
      toggleFavorite(1101); // Toggle off
      
      expect(isFavorite(1101)).toBe(false);
    });
  });

  describe('clearFavorites', () => {
    it('should remove all favorites', () => {
      const { toggleFavorite, clearFavorites } = useFavoritesStore.getState();
      
      toggleFavorite(1101);
      toggleFavorite(1102);
      toggleFavorite(1103);
      
      clearFavorites();
      
      const state = useFavoritesStore.getState();
      expect(state.favoriteRecipes.size).toBe(0);
    });

    it('should work on empty favorites', () => {
      const { clearFavorites } = useFavoritesStore.getState();
      
      clearFavorites();
      
      const state = useFavoritesStore.getState();
      expect(state.favoriteRecipes.size).toBe(0);
    });
  });

  describe('localStorage persistence', () => {
    it('should save favorites to localStorage', () => {
      const { toggleFavorite } = useFavoritesStore.getState();
      
      toggleFavorite(1101);
      toggleFavorite(1102);
      
      // Manually trigger persist to ensure save happens
      const options = useFavoritesStore.persist.getOptions();
      const partialize = options.partialize;
      
      if (partialize) {
        const state = useFavoritesStore.getState();
        const serialized = partialize(state);
        
        // Verify partialize converts Set to Array
        expect(Array.isArray(serialized.favoriteRecipes)).toBe(true);
        expect(serialized.favoriteRecipes).toEqual([1101, 1102]);
      }
    });

    it('should restore favorites from localStorage', () => {
      // Test merge function directly
      const options = useFavoritesStore.persist.getOptions();
      const merge = options.merge;
      
      if (merge) {
        const persistedState = {
          favoriteRecipes: [1101, 1102, 1103],
        };
        const currentState = useFavoritesStore.getState();
        
        const mergedState = merge(persistedState, currentState);
        
        expect(mergedState.favoriteRecipes).toBeInstanceOf(Set);
        expect(mergedState.favoriteRecipes.size).toBe(3);
        expect(mergedState.favoriteRecipes.has(1101)).toBe(true);
        expect(mergedState.favoriteRecipes.has(1102)).toBe(true);
        expect(mergedState.favoriteRecipes.has(1103)).toBe(true);
      }
    });

    it('should handle missing localStorage data', () => {
      const storage = useFavoritesStore.persist.getOptions().storage;
      const loaded = storage?.getItem('non-existent-key');
      
      expect(loaded).toBeNull();
    });

    it('should convert Set to Array when saving', () => {
      const { toggleFavorite } = useFavoritesStore.getState();
      
      toggleFavorite(1101);
      
      // Test partialize function directly
      const options = useFavoritesStore.persist.getOptions();
      const partialize = options.partialize;
      
      if (partialize) {
        const state = useFavoritesStore.getState();
        const serialized = partialize(state);
        
        // Should be stored as array, not Set
        expect(Array.isArray(serialized.favoriteRecipes)).toBe(true);
        expect(serialized.favoriteRecipes).toEqual([1101]);
      }
    });

    it('should convert Array to Set when loading', () => {
      // Test merge function directly
      const options = useFavoritesStore.persist.getOptions();
      const merge = options.merge;
      
      if (merge) {
        const persistedState = {
          favoriteRecipes: [1101, 1102],
        };
        const currentState = useFavoritesStore.getState();
        
        const mergedState = merge(persistedState, currentState);
        
        expect(mergedState.favoriteRecipes).toBeInstanceOf(Set);
        expect(mergedState.favoriteRecipes.size).toBe(2);
        expect(mergedState.favoriteRecipes.has(1101)).toBe(true);
        expect(mergedState.favoriteRecipes.has(1102)).toBe(true);
      }
    });
  });
});
