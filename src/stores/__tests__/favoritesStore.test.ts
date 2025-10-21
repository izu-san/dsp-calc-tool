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
    // Clear store before each test
    localStorageMock.clear();
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
      
      const stored = localStorage.getItem('dsp-calculator-favorites');
      expect(stored).toBeTruthy();
      
      const parsed = JSON.parse(stored!);
      expect(parsed.state.favoriteRecipes).toEqual([1101, 1102]);
    });

    it('should restore favorites from localStorage', () => {
      // Simulate stored data
      const storedData = {
        state: {
          favoriteRecipes: [1101, 1102, 1103],
        },
      };
      localStorage.setItem('dsp-calculator-favorites', JSON.stringify(storedData));
      
      // Create new store instance to trigger load
      const storage = useFavoritesStore.persist.getOptions().storage;
      const loaded = storage?.getItem('dsp-calculator-favorites') as any;
      
      expect(loaded).toBeTruthy();
      expect(loaded.state.favoriteRecipes).toBeInstanceOf(Set);
      expect(loaded.state.favoriteRecipes.size).toBe(3);
      expect(loaded.state.favoriteRecipes.has(1101)).toBe(true);
      expect(loaded.state.favoriteRecipes.has(1102)).toBe(true);
      expect(loaded.state.favoriteRecipes.has(1103)).toBe(true);
    });

    it('should handle missing localStorage data', () => {
      const storage = useFavoritesStore.persist.getOptions().storage;
      const loaded = storage?.getItem('non-existent-key');
      
      expect(loaded).toBeNull();
    });

    it('should convert Set to Array when saving', () => {
      const { toggleFavorite } = useFavoritesStore.getState();
      
      toggleFavorite(1101);
      
      const stored = localStorage.getItem('dsp-calculator-favorites');
      const parsed = JSON.parse(stored!);
      
      // Should be stored as array, not Set
      expect(Array.isArray(parsed.state.favoriteRecipes)).toBe(true);
      expect(parsed.state.favoriteRecipes).toEqual([1101]);
    });

    it('should convert Array to Set when loading', () => {
      const storedData = {
        state: {
          favoriteRecipes: [1101, 1102],
        },
      };
      localStorage.setItem('dsp-calculator-favorites', JSON.stringify(storedData));
      
      const storage = useFavoritesStore.persist.getOptions().storage;
      const loaded = storage?.getItem('dsp-calculator-favorites') as any;
      
      expect(loaded.state.favoriteRecipes).toBeInstanceOf(Set);
      expect(loaded.state.favoriteRecipes.size).toBe(2);
    });
  });
});
