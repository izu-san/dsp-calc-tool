import { describe, it, expect } from 'vitest';
import type { 
  Item, 
  RecipeItem, 
  Recipe, 
  Machine, 
  GameData 
} from '../game-data';

describe('game-data types', () => {
  describe('Item', () => {
    it('should have required properties', () => {
      const item: Item = {
        id: 1001,
        name: 'Iron Ore',
        Type: 'Ore',
        isRaw: true,
        miningFrom: 'Iron Veins'
      };
      
      expect(item.id).toBe(1001);
      expect(item.name).toBe('Iron Ore');
      expect(item.Type).toBe('Ore');
      expect(item.isRaw).toBe(true);
      expect(item.miningFrom).toBe('Iron Veins');
    });

    it('should handle optional properties', () => {
      const itemWithCount: Item = {
        id: 1001,
        name: 'Iron Ore',
        count: 100,
        Type: 'Ore',
        isRaw: true
      };
      
      expect(itemWithCount.count).toBe(100);
      expect(itemWithCount.miningFrom).toBeUndefined();
    });
  });

  describe('RecipeItem', () => {
    it('should have all required properties', () => {
      const recipeItem: RecipeItem = {
        id: 1001,
        name: 'Iron Ore',
        count: 2,
        Type: 'Ore',
        isRaw: true
      };
      
      expect(recipeItem.id).toBe(1001);
      expect(recipeItem.name).toBe('Iron Ore');
      expect(recipeItem.count).toBe(2);
      expect(recipeItem.Type).toBe('Ore');
      expect(recipeItem.isRaw).toBe(true);
    });
  });

  describe('Recipe', () => {
    it('should have all recipe properties', () => {
      const recipe: Recipe = {
        SID: 1,
        name: 'Iron Ingot',
        Type: 'Smelt',
        Explicit: true,
        TimeSpend: 60,
        Items: [
          { id: 1001, name: 'Iron Ore', count: 1, Type: 'Ore', isRaw: true }
        ],
        Results: [
          { id: 1101, name: 'Iron Ingot', count: 1, Type: 'Ingot', isRaw: false }
        ],
        GridIndex: '1101',
        productive: true
      };
      
      expect(recipe.SID).toBe(1);
      expect(recipe.name).toBe('Iron Ingot');
      expect(recipe.Type).toBe('Smelt');
      expect(recipe.Explicit).toBe(true);
      expect(recipe.TimeSpend).toBe(60);
      expect(recipe.Items).toHaveLength(1);
      expect(recipe.Results).toHaveLength(1);
      expect(recipe.GridIndex).toBe('1101');
      expect(recipe.productive).toBe(true);
    });

    it('should handle different recipe types', () => {
      const assembleRecipe: Recipe = {
        SID: 2,
        name: 'Iron Gear',
        Type: 'Assemble',
        Explicit: false,
        TimeSpend: 120,
        Items: [
          { id: 1101, name: 'Iron Ingot', count: 1, Type: 'Ingot', isRaw: false }
        ],
        Results: [
          { id: 1201, name: 'Iron Gear', count: 1, Type: 'Component', isRaw: false }
        ],
        GridIndex: '1201',
        productive: true
      };
      
      expect(assembleRecipe.Type).toBe('Assemble');
      expect(assembleRecipe.Explicit).toBe(false);
    });
  });

  describe('Machine', () => {
    it('should have all machine properties', () => {
      const machine: Machine = {
        id: 2001,
        name: 'Smelter',
        Type: 'Smelter',
        isRaw: false,
        assemblerSpeed: 10000,
        workEnergyPerTick: 100,
        idleEnergyPerTick: 10,
        exchangeEnergyPerTick: 0,
        isPowerConsumer: true,
        isPowerExchanger: false
      };
      
      expect(machine.id).toBe(2001);
      expect(machine.name).toBe('Smelter');
      expect(machine.Type).toBe('Smelter');
      expect(machine.isRaw).toBe(false);
      expect(machine.assemblerSpeed).toBe(10000);
      expect(machine.workEnergyPerTick).toBe(100);
      expect(machine.idleEnergyPerTick).toBe(10);
      expect(machine.exchangeEnergyPerTick).toBe(0);
      expect(machine.isPowerConsumer).toBe(true);
      expect(machine.isPowerExchanger).toBe(false);
    });

    it('should handle optional properties', () => {
      const machineWithCount: Machine = {
        id: 2001,
        name: 'Smelter',
        count: 5,
        Type: 'Smelter',
        isRaw: false,
        assemblerSpeed: 10000,
        workEnergyPerTick: 100,
        idleEnergyPerTick: 10,
        exchangeEnergyPerTick: 0,
        isPowerConsumer: true,
        isPowerExchanger: false
      };
      
      expect(machineWithCount.count).toBe(5);
    });
  });

  describe('GameData', () => {
    it('should contain all game data collections', () => {
      const gameData: GameData = {
        items: new Map([[1001, { id: 1001, name: 'Iron Ore', Type: 'Ore', isRaw: true }]]),
        recipes: new Map([[1, { SID: 1, name: 'Iron Ingot', Type: 'Smelt', Explicit: true, TimeSpend: 60, Items: [], Results: [], GridIndex: '1101', productive: true }]]),
        machines: new Map([[2001, { id: 2001, name: 'Smelter', Type: 'Smelter', isRaw: false, assemblerSpeed: 10000, workEnergyPerTick: 100, idleEnergyPerTick: 10, exchangeEnergyPerTick: 0, isPowerConsumer: true, isPowerExchanger: false }]]),
        recipesByItemId: new Map([[1101, [{ SID: 1, name: 'Iron Ingot', Type: 'Smelt', Explicit: true, TimeSpend: 60, Items: [], Results: [], GridIndex: '1101', productive: true }]]]),
        allItems: new Map()
      };
      
      expect(gameData.items).toBeInstanceOf(Map);
      expect(gameData.recipes).toBeInstanceOf(Map);
      expect(gameData.machines).toBeInstanceOf(Map);
      expect(gameData.recipesByItemId).toBeInstanceOf(Map);
      expect(gameData.allItems).toBeInstanceOf(Map);
    });
  });
});
