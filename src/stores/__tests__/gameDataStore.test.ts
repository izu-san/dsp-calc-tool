import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useGameDataStore, getMachineById } from '../gameDataStore';
import type { GameData } from '../../types';

// Mock i18n
vi.mock('../../i18n', () => ({
  default: {
    changeLanguage: vi.fn(),
  },
}));

// Mock parser
vi.mock('../../lib/parser', () => ({
  loadGameData: vi.fn(),
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

global.localStorage = localStorageMock as Storage;

// Create mock game data
const createMockGameData = (): GameData => ({
  recipes: new Map(),
  machines: new Map(),
  items: new Map(),
  recipesByItemId: new Map(),
  allItems: new Map(),
});

describe('gameDataStore', () => {
  beforeEach(() => {
    // Reset store state
    useGameDataStore.setState({
      data: null,
      isLoading: false,
      error: null,
      locale: 'ja',
    });
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should have null data initially', () => {
      const { data, isLoading, error } = useGameDataStore.getState();
      
      expect(data).toBeNull();
      expect(isLoading).toBe(false);
      expect(error).toBeNull();
    });

    it('should use stored locale or default to ja', () => {
      const { locale } = useGameDataStore.getState();
      
      expect(locale).toBe('ja');
    });
  });

  describe('loadData', () => {
    it('should set loading state while loading', async () => {
      const { loadGameData } = await import('../../lib/parser');
      
      // Make loadGameData hang indefinitely
      vi.mocked(loadGameData).mockImplementation(() => new Promise(() => {}));
      
      const { loadData } = useGameDataStore.getState();
      void loadData(); // fire-and-forget
      
      // Check loading state immediately (should be synchronously set)
      const { isLoading } = useGameDataStore.getState();
      expect(isLoading).toBe(true);
      
      // No cleanup needed as the promise never resolves
    });

    it('should load data successfully', async () => {
      const { loadGameData } = await import('../../lib/parser');
      const mockData = createMockGameData();
      
      vi.mocked(loadGameData).mockResolvedValue(mockData);
      
      const { loadData } = useGameDataStore.getState();
      await loadData();
      
      const { data, isLoading, error } = useGameDataStore.getState();
      expect(data).toEqual(mockData);
      expect(isLoading).toBe(false);
      expect(error).toBeNull();
    });

    it('should save locale to localStorage on success', async () => {
      const { loadGameData } = await import('../../lib/parser');
      const mockData = createMockGameData();
      
      vi.mocked(loadGameData).mockResolvedValue(mockData);
      
      const { loadData } = useGameDataStore.getState();
      await loadData('en');
      
      expect(localStorage.getItem('dsp_locale')).toBe('en');
    });

    it('should handle load errors', async () => {
      const { loadGameData } = await import('../../lib/parser');
      const errorMessage = 'Failed to parse XML';
      
      vi.mocked(loadGameData).mockRejectedValue(new Error(errorMessage));
      
      const { loadData } = useGameDataStore.getState();
      await loadData();
      
      const { data, isLoading, error } = useGameDataStore.getState();
      expect(data).toBeNull();
      expect(isLoading).toBe(false);
      expect(error).toBe(errorMessage);
    });

    it('should handle non-Error rejections', async () => {
      const { loadGameData } = await import('../../lib/parser');
      
      vi.mocked(loadGameData).mockRejectedValue('String error');
      
      const { loadData } = useGameDataStore.getState();
      await loadData();
      
      const { error } = useGameDataStore.getState();
      expect(error).toBe('Failed to load game data');
    });

    it('should use provided locale', async () => {
      const { loadGameData } = await import('../../lib/parser');
      const mockData = createMockGameData();
      
      vi.mocked(loadGameData).mockResolvedValue(mockData);
      
      const { loadData } = useGameDataStore.getState();
      await loadData('en');
      
      const { locale } = useGameDataStore.getState();
      expect(locale).toBe('en');
      expect(loadGameData).toHaveBeenCalledWith(undefined, 'en');
    });

    it('should use current locale if not provided', async () => {
      const { loadGameData } = await import('../../lib/parser');
      const mockData = createMockGameData();
      
      vi.mocked(loadGameData).mockResolvedValue(mockData);
      
      useGameDataStore.setState({ locale: 'ja' });
      
      const { loadData } = useGameDataStore.getState();
      await loadData();
      
      expect(loadGameData).toHaveBeenCalledWith(undefined, 'ja');
    });
  });

  describe('updateData', () => {
    it('should update data directly', () => {
      const mockData = createMockGameData();
      
      const { updateData } = useGameDataStore.getState();
      updateData(mockData);
      
      const { data, error } = useGameDataStore.getState();
      expect(data).toEqual(mockData);
      expect(error).toBeNull();
    });

    it('should clear error when updating data', () => {
      useGameDataStore.setState({ error: 'Previous error' });
      
      const mockData = createMockGameData();
      const { updateData } = useGameDataStore.getState();
      updateData(mockData);
      
      const { error } = useGameDataStore.getState();
      expect(error).toBeNull();
    });
  });

  describe('setLocale', () => {
    it('should update locale and trigger data reload', async () => {
      const { loadGameData } = await import('../../lib/parser');
      const i18n = await import('../../i18n');
      const mockData = createMockGameData();
      
      vi.mocked(loadGameData).mockResolvedValue(mockData);
      
      const { setLocale } = useGameDataStore.getState();
      setLocale('en');
      
      // Wait for loadGameData to be called and completed
      await vi.waitFor(() => {
        expect(loadGameData).toHaveBeenCalledWith(undefined, 'en');
      });
      
      const { locale } = useGameDataStore.getState();
      expect(locale).toBe('en');
      expect(i18n.default.changeLanguage).toHaveBeenCalledWith('en');
      expect(localStorage.getItem('dsp_locale')).toBe('en');
    });

    it('should save locale to localStorage', () => {
      const { setLocale } = useGameDataStore.getState();
      setLocale('zh');
      
      expect(localStorage.getItem('dsp_locale')).toBe('zh');
    });

    it('should update document language', () => {
      const { setLocale } = useGameDataStore.getState();
      setLocale('en');
      
      expect(document.documentElement.lang).toBe('en');
    });
  });

  describe('Error handling', () => {
    it('should clear error on successful load', async () => {
      const { loadGameData } = await import('../../lib/parser');
      
      // First load fails
      vi.mocked(loadGameData).mockRejectedValueOnce(new Error('First error'));
      const { loadData } = useGameDataStore.getState();
      await loadData();
      expect(useGameDataStore.getState().error).toBeTruthy();
      
      // Second load succeeds
      const mockData = createMockGameData();
      vi.mocked(loadGameData).mockResolvedValueOnce(mockData);
      await loadData();
      
      const { error } = useGameDataStore.getState();
      expect(error).toBeNull();
    });

    it('should set error to null when starting new load', async () => {
      const { loadGameData } = await import('../../lib/parser');
      
      useGameDataStore.setState({ error: 'Previous error' });
      
      vi.mocked(loadGameData).mockImplementation(() => new Promise(() => {}));
      
      const { loadData } = useGameDataStore.getState();
      void loadData(); // fire-and-forget
      
      // Error should be synchronously cleared when starting new load
      const { error } = useGameDataStore.getState();
      expect(error).toBeNull();
      
      // No cleanup needed as the promise never resolves
    });
  });

  describe('State transitions', () => {
    it('should handle multiple sequential loads', async () => {
      const { loadGameData } = await import('../../lib/parser');
      const mockData1 = createMockGameData();
      const mockData2 = createMockGameData();
      
      vi.mocked(loadGameData)
        .mockResolvedValueOnce(mockData1)
        .mockResolvedValueOnce(mockData2);
      
      const { loadData } = useGameDataStore.getState();
      
      await loadData('ja');
      expect(useGameDataStore.getState().data).toEqual(mockData1);
      
      await loadData('en');
      expect(useGameDataStore.getState().data).toEqual(mockData2);
    });

    it('should not leave loading state on error', async () => {
      const { loadGameData } = await import('../../lib/parser');
      
      vi.mocked(loadGameData).mockRejectedValue(new Error('Load failed'));
      
      const { loadData } = useGameDataStore.getState();
      await loadData();
      
      const { isLoading } = useGameDataStore.getState();
      expect(isLoading).toBe(false);
    });
  });

  describe('getMachineById', () => {
    it('should return machine when found', () => {
      const mockMachine = {
        id: 2303,
        name: 'Assembling Machine Mk.I',
        Type: 'Assemble' as const,
        assemblerSpeed: 7500,
        workEnergyPerTick: 270000,
        idleEnergyPerTick: 18000,
        exchangeEnergyPerTick: 0,
        isPowerConsumer: true,
        isPowerExchanger: false,
        isRaw: false,
      };

      const gameData = createMockGameData();
      gameData.machines.set(2303, mockMachine);

      useGameDataStore.setState({ data: gameData });

      const result = getMachineById(2303);
      expect(result).toEqual(mockMachine);
    });

    it('should return undefined when machine not found', () => {
      const gameData = createMockGameData();
      useGameDataStore.setState({ data: gameData });

      const result = getMachineById(9999);
      expect(result).toBeUndefined();
    });

    it('should return undefined when game data is null', () => {
      useGameDataStore.setState({ data: null });

      const result = getMachineById(2303);
      expect(result).toBeUndefined();
    });
  });
});
