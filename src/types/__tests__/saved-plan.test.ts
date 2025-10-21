import { describe, it, expect } from 'vitest';
import type { SavedPlan, SerializedPlan } from '../saved-plan';

describe('saved-plan types', () => {
  describe('SavedPlan', () => {
    it('should have all required properties', () => {
      const plan: SavedPlan = {
        name: 'Iron Production',
        timestamp: 1640995200000,
        recipeSID: 1,
        targetQuantity: 60,
        settings: {
          proliferator: { type: 'none', level: 0 },
          machineRank: 'mk1',
          conveyorBelt: { tier: 'mk1', speed: 6, stackCount: 3 },
          template: 'default'
        },
        alternativeRecipes: { 1101: 2 },
        nodeOverrides: {
          'node-1': {
            proliferator: { type: 'speed', level: 3 },
            machineRank: 'mk2'
          }
        }
      };
      
      expect(plan.name).toBe('Iron Production');
      expect(plan.timestamp).toBe(1640995200000);
      expect(plan.recipeSID).toBe(1);
      expect(plan.targetQuantity).toBe(60);
      expect(plan.settings).toBeDefined();
      expect(plan.alternativeRecipes).toBeDefined();
      expect(plan.nodeOverrides).toBeDefined();
    });

    it('should handle optional description', () => {
      const planWithDescription: SavedPlan = {
        name: 'Iron Production',
        timestamp: 1640995200000,
        recipeSID: 1,
        targetQuantity: 60,
        settings: {
          proliferator: { type: 'none', level: 0 },
          machineRank: 'mk1',
          conveyorBelt: { tier: 'mk1', speed: 6, stackCount: 3 },
          template: 'default'
        },
        alternativeRecipes: {},
        nodeOverrides: {},
        description: 'A basic iron production setup'
      };
      
      expect(planWithDescription.description).toBe('A basic iron production setup');
    });

    it('should handle empty alternative recipes and node overrides', () => {
      const minimalPlan: SavedPlan = {
        name: 'Minimal Plan',
        timestamp: 1640995200000,
        recipeSID: 1,
        targetQuantity: 30,
        settings: {
          proliferator: { type: 'none', level: 0 },
          machineRank: 'mk1',
          conveyorBelt: { tier: 'mk1', speed: 6, stackCount: 3 },
          template: 'default'
        },
        alternativeRecipes: {},
        nodeOverrides: {}
      };
      
      expect(minimalPlan.alternativeRecipes).toEqual({});
      expect(minimalPlan.nodeOverrides).toEqual({});
    });
  });

  describe('SerializedPlan', () => {
    it('should contain version and plan data', () => {
      const serializedPlan: SerializedPlan = {
        version: '1.0.0',
        plan: {
          name: 'Test Plan',
          timestamp: 1640995200000,
          recipeSID: 1,
          targetQuantity: 60,
          settings: {
            proliferator: { type: 'none', level: 0 },
            machineRank: 'mk1',
            conveyorBelt: { tier: 'mk1', speed: 6, stackCount: 3 },
            template: 'default'
          },
          alternativeRecipes: {},
          nodeOverrides: {}
        }
      };
      
      expect(serializedPlan.version).toBe('1.0.0');
      expect(serializedPlan.plan).toBeDefined();
      expect(serializedPlan.plan.name).toBe('Test Plan');
    });
  });
});
