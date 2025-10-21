import { describe, it, expect, beforeEach } from 'vitest';
import { useSettingsStore } from '../settingsStore';
import { PROLIFERATOR_DATA, CONVEYOR_BELT_DATA, SORTER_DATA, SETTINGS_TEMPLATES } from '../../types/settings';

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

describe('settingsStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    useSettingsStore.getState().resetSettings();
    localStorage.clear();
  });

  describe('Initial State', () => {
    it('should have default settings', () => {
      const { settings } = useSettingsStore.getState();
      
      expect(settings.proliferator.type).toBe('none');
      expect(settings.proliferator.mode).toBe('speed');
      expect(settings.machineRank.Smelt).toBe('arc');
      expect(settings.machineRank.Assemble).toBe('mk1');
      expect(settings.conveyorBelt.tier).toBe('mk3');
      expect(settings.sorter.tier).toBe('pile');
      expect(settings.miningSpeedResearch).toBe(100);
      expect(settings.proliferatorMultiplier).toEqual({ production: 1, speed: 1 });
    });

    it('should have alternativeRecipes as Map', () => {
      const { settings } = useSettingsStore.getState();
      
      expect(settings.alternativeRecipes).toBeInstanceOf(Map);
    });

    it('should have default alternative recipes including hydrogen as mining', () => {
      const { settings } = useSettingsStore.getState();
      
      // Hydrogen (1120) should be set to -1 (mining)
      expect(settings.alternativeRecipes.get(1120)).toBe(-1);
      
      // Other default alternative recipes should also be set
      expect(settings.alternativeRecipes.get(1116)).toBe(1406); // Sulfuric Acid
      expect(settings.alternativeRecipes.get(1109)).toBe(1106); // Energetic Graphite
      expect(settings.alternativeRecipes.get(1112)).toBe(1206); // Diamond
      expect(settings.alternativeRecipes.get(1121)).toBe(1507); // Deuterium
    });
  });

  describe('setProliferator', () => {
    it('should update proliferator type and mode', () => {
      const { setProliferator } = useSettingsStore.getState();
      
      setProliferator('mk3', 'production');
      
      const { settings } = useSettingsStore.getState();
      expect(settings.proliferator.type).toBe('mk3');
      expect(settings.proliferator.mode).toBe('production');
      expect(settings.proliferator.speedBonus).toBe(PROLIFERATOR_DATA.mk3.speedBonus);
      expect(settings.proliferator.productionBonus).toBe(PROLIFERATOR_DATA.mk3.productionBonus);
    });

    it('should maintain mode when changing type', () => {
      const { setProliferator } = useSettingsStore.getState();
      
      setProliferator('mk1', 'production');
      setProliferator('mk2', 'production');
      
      const { settings } = useSettingsStore.getState();
      expect(settings.proliferator.type).toBe('mk2');
      expect(settings.proliferator.mode).toBe('production');
    });
  });

  describe('setMachineRank', () => {
    it('should update machine rank for specific recipe type', () => {
      const { setMachineRank } = useSettingsStore.getState();
      
      setMachineRank('Assemble', 'mk3');
      
      const { settings } = useSettingsStore.getState();
      expect(settings.machineRank.Assemble).toBe('mk3');
      expect(settings.machineRank.Smelt).toBe('arc'); // Other ranks unchanged
    });

    it('should handle multiple rank updates', () => {
      const { setMachineRank } = useSettingsStore.getState();
      
      setMachineRank('Chemical', 'quantum');
      setMachineRank('Research', 'mk2');
      
      const { settings } = useSettingsStore.getState();
      expect(settings.machineRank.Chemical).toBe('quantum');
      expect(settings.machineRank.Research).toBe('mk2');
    });
  });

  describe('setConveyorBelt', () => {
    it('should update conveyor belt tier', () => {
      const { setConveyorBelt } = useSettingsStore.getState();
      
      setConveyorBelt('mk1');
      
      const { settings } = useSettingsStore.getState();
      expect(settings.conveyorBelt.tier).toBe('mk1');
      expect(settings.conveyorBelt.speed).toBe(CONVEYOR_BELT_DATA.mk1.speed);
    });

    it('should update stack count when provided', () => {
      const { setConveyorBelt } = useSettingsStore.getState();
      
      setConveyorBelt('mk2', 4);
      
      const { settings } = useSettingsStore.getState();
      expect(settings.conveyorBelt.tier).toBe('mk2');
      expect(settings.conveyorBelt.stackCount).toBe(4);
    });

    it('should preserve stack count when not provided', () => {
      const { setConveyorBelt } = useSettingsStore.getState();
      
      setConveyorBelt('mk3', 3);
      setConveyorBelt('mk2'); // Change tier without specifying stackCount
      
      const { settings } = useSettingsStore.getState();
      expect(settings.conveyorBelt.stackCount).toBe(3); // Preserved
    });

    it('should default to 1 when stackCount is not a number type', () => {
      const { setConveyorBelt } = useSettingsStore.getState();
      
      // Manually set state with non-number stackCount
      useSettingsStore.setState({
        settings: {
          ...useSettingsStore.getState().settings,
          conveyorBelt: {
            tier: 'mk1',
            speed: 6,
            stackCount: 'invalid' as any, // Non-number type
          },
        },
      });
      
      // Call setConveyorBelt without stackCount parameter
      setConveyorBelt('mk2');
      
      const { settings } = useSettingsStore.getState();
      expect(settings.conveyorBelt.stackCount).toBe(1); // Defaulted to 1
    });
  });

  describe('setSorter', () => {
    it('should update sorter tier', () => {
      const { setSorter } = useSettingsStore.getState();
      
      setSorter('pile');
      
      const { settings } = useSettingsStore.getState();
      expect(settings.sorter.tier).toBe('pile');
      expect(settings.sorter.powerConsumption).toBe(SORTER_DATA.pile.powerConsumption);
    });
  });

  describe('setAlternativeRecipe', () => {
    it('should add new alternative recipe', () => {
      const { setAlternativeRecipe } = useSettingsStore.getState();
      
      setAlternativeRecipe(1001, 2001);
      
      const { settings } = useSettingsStore.getState();
      expect(settings.alternativeRecipes.get(1001)).toBe(2001);
    });

    it('should update existing alternative recipe', () => {
      const { setAlternativeRecipe } = useSettingsStore.getState();
      
      setAlternativeRecipe(1001, 2001);
      setAlternativeRecipe(1001, 3001); // Update
      
      const { settings } = useSettingsStore.getState();
      expect(settings.alternativeRecipes.get(1001)).toBe(3001);
    });

    it('should maintain Map structure', () => {
      const { setAlternativeRecipe } = useSettingsStore.getState();
      
      setAlternativeRecipe(1001, 2001);
      setAlternativeRecipe(1002, 2002);
      
      const { settings } = useSettingsStore.getState();
      expect(settings.alternativeRecipes).toBeInstanceOf(Map);
      expect(settings.alternativeRecipes.size).toBeGreaterThanOrEqual(2);
    });
  });

  describe('setMiningSpeedResearch', () => {
    it('should update mining speed research bonus', () => {
      const { setMiningSpeedResearch } = useSettingsStore.getState();
      
      setMiningSpeedResearch(150);
      
      const { settings } = useSettingsStore.getState();
      expect(settings.miningSpeedResearch).toBe(150);
    });
  });

  describe('setProliferatorMultiplier', () => {
    it('should update proliferator multipliers', () => {
      const { setProliferatorMultiplier } = useSettingsStore.getState();
      
      setProliferatorMultiplier(1.25, 1.5);
      
      const { settings } = useSettingsStore.getState();
      expect(settings.proliferatorMultiplier.production).toBe(1.25);
      expect(settings.proliferatorMultiplier.speed).toBe(1.5);
    });
  });

  describe('applyTemplate', () => {
    it('should apply early game template', () => {
      const { applyTemplate } = useSettingsStore.getState();
      
      applyTemplate('earlyGame');
      
      const { settings } = useSettingsStore.getState();
      expect(settings.proliferator.type).toBe(SETTINGS_TEMPLATES.earlyGame.settings.proliferator.type);
      expect(settings.machineRank.Assemble).toBe(SETTINGS_TEMPLATES.earlyGame.settings.machineRank.Assemble);
    });

    it('should apply late game template', () => {
      const { applyTemplate } = useSettingsStore.getState();
      
      applyTemplate('lateGame');
      
      const { settings } = useSettingsStore.getState();
      expect(settings.proliferator.type).toBe(SETTINGS_TEMPLATES.lateGame.settings.proliferator.type);
      expect(settings.conveyorBelt.tier).toBe(SETTINGS_TEMPLATES.lateGame.settings.conveyorBelt.tier);
    });

    it('should clone alternativeRecipes Map', () => {
      const { applyTemplate } = useSettingsStore.getState();
      
      applyTemplate('midGame');
      const { settings: settings1 } = useSettingsStore.getState();
      const mapRef1 = settings1.alternativeRecipes;
      
      applyTemplate('lateGame');
      const { settings: settings2 } = useSettingsStore.getState();
      const mapRef2 = settings2.alternativeRecipes;
      
      expect(mapRef1).not.toBe(mapRef2); // Different Map instances
    });

    it('should include hydrogen as mining in all templates', () => {
      const templates: Array<keyof typeof SETTINGS_TEMPLATES> = ['earlyGame', 'midGame', 'lateGame', 'endGame', 'powerSaver'];
      
      templates.forEach(templateId => {
        const { applyTemplate } = useSettingsStore.getState();
        applyTemplate(templateId);
        
        const { settings } = useSettingsStore.getState();
        expect(settings.alternativeRecipes.get(1120)).toBe(-1); // Hydrogen should be mining
      });
    });
  });

  describe('updateSettings', () => {
    it('should partially update settings', () => {
      const { updateSettings } = useSettingsStore.getState();
      
      updateSettings({ miningSpeedResearch: 200 });
      
      const { settings } = useSettingsStore.getState();
      expect(settings.miningSpeedResearch).toBe(200);
      expect(settings.proliferator.type).toBe('none'); // Other settings unchanged
    });

    it('should convert object to Map for alternativeRecipes', () => {
      const { updateSettings } = useSettingsStore.getState();
      
      // Simulate loading from JSON where Map becomes object
      updateSettings({ 
        alternativeRecipes: { '1001': 2001, '1002': 2002 } as any 
      });
      
      const { settings } = useSettingsStore.getState();
      expect(settings.alternativeRecipes).toBeInstanceOf(Map);
      expect(settings.alternativeRecipes.get(1001)).toBe(2001);
      expect(settings.alternativeRecipes.get(1002)).toBe(2002);
    });
  });

  describe('resetSettings', () => {
    it('should reset all settings to defaults', () => {
      const { setProliferator, setMachineRank, resetSettings } = useSettingsStore.getState();
      
      // Make some changes
      setProliferator('mk3', 'production');
      setMachineRank('Assemble', 'mk3');
      
      // Reset
      resetSettings();
      
      const { settings } = useSettingsStore.getState();
      expect(settings.proliferator.type).toBe('none');
      expect(settings.machineRank.Assemble).toBe('mk1');
    });

    it('should reset alternative recipes including hydrogen to mining', () => {
      const { setAlternativeRecipe, resetSettings } = useSettingsStore.getState();
      
      // Change hydrogen to a recipe instead of mining
      setAlternativeRecipe(1120, 1107);
      
      // Verify change
      let { settings } = useSettingsStore.getState();
      expect(settings.alternativeRecipes.get(1120)).toBe(1107);
      
      // Reset
      resetSettings();
      
      // Should be back to mining (-1)
      settings = useSettingsStore.getState().settings;
      expect(settings.alternativeRecipes.get(1120)).toBe(-1);
    });
  });

  describe('Persistence (localStorage)', () => {
    it('should serialize alternativeRecipes Map to array', () => {
      const { setAlternativeRecipe } = useSettingsStore.getState();
      
      setAlternativeRecipe(1001, 2001);
      
      // Manually trigger persistence
      const stored = localStorage.getItem('dsp-calculator-settings');
      expect(stored).toBeTruthy();
      
      const parsed = JSON.parse(stored!);
      expect(Array.isArray(parsed.state.settings.alternativeRecipes)).toBe(true);
    });

    it('should deserialize array back to Map', () => {
      // Clear all beforeEach state and create fresh
      useSettingsStore.persist.clearStorage();
      
      // Simulate stored data
      const mockData = {
        state: {
          settings: {
            proliferator: { ...PROLIFERATOR_DATA.none, mode: 'speed' as const },
            machineRank: { 
              Smelt: 'arc', 
              Assemble: 'mk1', 
              Chemical: 'standard', 
              Research: 'standard', 
              Refine: 'standard', 
              Particle: 'standard' 
            },
            conveyorBelt: CONVEYOR_BELT_DATA.mk3,
            sorter: SORTER_DATA.pile,
            alternativeRecipes: [[1001, 2001], [1002, 2002]], // Array format
            miningSpeedResearch: 100,
            proliferatorMultiplier: { production: 1, speed: 1 },
          },
        },
      };
      
      localStorage.setItem('dsp-calculator-settings', JSON.stringify(mockData));
      
      // Force rehydration by calling storage.getItem
      const storage = (useSettingsStore.persist as any).getOptions().storage;
      const rehydratedData = storage.getItem('dsp-calculator-settings');
      
      if (rehydratedData) {
        const alternativeRecipes = rehydratedData.state.settings.alternativeRecipes;
        expect(alternativeRecipes).toBeInstanceOf(Map);
        expect(alternativeRecipes.get(1001)).toBe(2001);
      } else {
        throw new Error('Failed to rehydrate data');
      }
    });

    it('should handle missing stackCount on load', () => {
      // Simulate old data without stackCount
      const mockData = {
        state: {
          settings: {
            proliferator: PROLIFERATOR_DATA.none,
            machineRank: { Smelt: 'arc', Assemble: 'mk1', Chemical: 'standard', Research: 'standard', Refine: 'standard', Particle: 'standard' },
            conveyorBelt: { tier: 'mk2', speed: 12 }, // Missing stackCount
            sorter: SORTER_DATA.pile,
            alternativeRecipes: [],
            miningSpeedResearch: 100,
            proliferatorMultiplier: { production: 1, speed: 1 },
          },
        },
      };
      
      localStorage.setItem('dsp-calculator-settings', JSON.stringify(mockData));
      
      const newStore = useSettingsStore.getState();
      
      expect(newStore.settings.conveyorBelt.stackCount).toBe(1); // Default value
    });

    it('should handle invalid stackCount (non-number) on load', () => {
      // Simulate corrupted data with invalid stackCount
      const mockData = {
        state: {
          settings: {
            proliferator: PROLIFERATOR_DATA.none,
            machineRank: { Smelt: 'arc', Assemble: 'mk1', Chemical: 'standard', Research: 'standard', Refine: 'standard', Particle: 'standard' },
            conveyorBelt: { tier: 'mk3', speed: 30, stackCount: 'invalid' as any }, // Invalid stackCount
            sorter: SORTER_DATA.pile,
            alternativeRecipes: [],
            miningSpeedResearch: 100,
            proliferatorMultiplier: { production: 1, speed: 1 },
          },
        },
      };
      
      localStorage.setItem('dsp-calculator-settings', JSON.stringify(mockData));
      
      // Create new store instance to trigger rehydration
      const storage = (useSettingsStore.persist as any).getOptions().storage;
      const rehydratedData = storage.getItem('dsp-calculator-settings');
      
      if (rehydratedData) {
        expect(rehydratedData.state.settings.conveyorBelt.stackCount).toBe(1); // Fixed to 1
      } else {
        throw new Error('Failed to rehydrate data');
      }
    });
  });
});
