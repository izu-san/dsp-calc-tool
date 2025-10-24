import { describe, it, expect } from 'vitest';
import { serializeSettings, deserializeSettings } from '../storageSerializer';
import type { GlobalSettings } from '../../types';
import { PROLIFERATOR_DATA, CONVEYOR_BELT_DATA, SORTER_DATA } from '../../types/settings';

describe('storageSerializer', () => {
  const mockSettings: GlobalSettings = {
    proliferator: {
      ...PROLIFERATOR_DATA.mk2,
      mode: 'speed',
    },
    machineRank: {
      Smelt: 'arc',
      Assemble: 'mk2',
      Chemical: 'standard',
      Research: 'standard',
      Refine: 'standard',
      Particle: 'standard',
    },
    conveyorBelt: CONVEYOR_BELT_DATA.mk3,
    sorter: SORTER_DATA.pile,
    alternativeRecipes: new Map([
      [1116, 1406],
      [1109, 1106],
      [1120, -1],
    ]),
    miningSpeedResearch: 150,
    proliferatorMultiplier: { production: 1, speed: 1 },
  };

  describe('serializeSettings', () => {
    it('should convert Map to Array', () => {
      const serialized = serializeSettings(mockSettings);

      expect(Array.isArray(serialized.alternativeRecipes)).toBe(true);
      expect(serialized.alternativeRecipes).toEqual([
        [1116, 1406],
        [1109, 1106],
        [1120, -1],
      ]);
    });

    it('should preserve other settings', () => {
      const serialized = serializeSettings(mockSettings);

      expect(serialized.proliferator).toEqual(mockSettings.proliferator);
      expect(serialized.machineRank).toEqual(mockSettings.machineRank);
      expect(serialized.conveyorBelt).toEqual(mockSettings.conveyorBelt);
      expect(serialized.sorter).toEqual(mockSettings.sorter);
      expect(serialized.miningSpeedResearch).toBe(150);
      expect(serialized.proliferatorMultiplier).toEqual({ production: 1, speed: 1 });
    });

    it('should be JSON serializable', () => {
      const serialized = serializeSettings(mockSettings);
      
      // JSON.stringify でエラーが出ないことを確認
      expect(() => JSON.stringify(serialized)).not.toThrow();
      
      // JSON roundtrip
      const json = JSON.stringify(serialized);
      const parsed = JSON.parse(json);
      expect(parsed).toEqual(serialized);
    });
  });

  describe('deserializeSettings', () => {
    it('should convert Array back to Map', () => {
      const serialized = serializeSettings(mockSettings);
      const deserialized = deserializeSettings(serialized);

      expect(deserialized).not.toBeNull();
      expect(deserialized!.alternativeRecipes).toBeInstanceOf(Map);
      expect(deserialized!.alternativeRecipes.get(1116)).toBe(1406);
      expect(deserialized!.alternativeRecipes.get(1109)).toBe(1106);
      expect(deserialized!.alternativeRecipes.get(1120)).toBe(-1);
    });

    it('should handle missing alternativeRecipes', () => {
      const serialized = serializeSettings(mockSettings);
      // @ts-expect-error: テストのため意図的に削除
      delete serialized.alternativeRecipes;

      const deserialized = deserializeSettings(serialized);

      expect(deserialized).not.toBeNull();
      expect(deserialized!.alternativeRecipes).toBeInstanceOf(Map);
      expect(deserialized!.alternativeRecipes.size).toBe(0);
    });

    it('should handle missing stackCount in conveyorBelt', () => {
      const serialized = serializeSettings(mockSettings);
      // stackCount を削除
      serialized.conveyorBelt = { 
        tier: 'mk2', 
        speed: 12, 
        stackCount: undefined as unknown as number 
      };

      const deserialized = deserializeSettings(serialized);

      expect(deserialized).not.toBeNull();
      expect(deserialized!.conveyorBelt.stackCount).toBe(1); // デフォルト値
      expect(deserialized!.conveyorBelt.tier).toBe('mk2');
    });

    it('should return null for invalid data', () => {
      expect(deserializeSettings(null)).toBeNull();
      expect(deserializeSettings(undefined)).toBeNull();
      expect(deserializeSettings({})).toBeNull();
      expect(deserializeSettings('invalid')).toBeNull();
      expect(deserializeSettings(123)).toBeNull();
    });

    it('should return null for partially invalid data', () => {
      const invalid = {
        proliferator: { type: 'mk2' }, // OK
        // machineRank: missing
        conveyorBelt: { tier: 'mk3' },
        sorter: { tier: 'pile' },
        miningSpeedResearch: 100,
        proliferatorMultiplier: { production: 1, speed: 1 },
      };

      expect(deserializeSettings(invalid)).toBeNull();
    });

    it('should roundtrip correctly', () => {
      const serialized = serializeSettings(mockSettings);
      const deserialized = deserializeSettings(serialized);

      expect(deserialized).not.toBeNull();
      
      // Map の内容を比較
      expect(deserialized!.alternativeRecipes.size).toBe(mockSettings.alternativeRecipes.size);
      mockSettings.alternativeRecipes.forEach((value, key) => {
        expect(deserialized!.alternativeRecipes.get(key)).toBe(value);
      });

      // 他のフィールドを比較
      expect(deserialized!.proliferator).toEqual(mockSettings.proliferator);
      expect(deserialized!.machineRank).toEqual(mockSettings.machineRank);
      expect(deserialized!.conveyorBelt).toEqual(mockSettings.conveyorBelt);
      expect(deserialized!.sorter).toEqual(mockSettings.sorter);
      expect(deserialized!.miningSpeedResearch).toBe(mockSettings.miningSpeedResearch);
      expect(deserialized!.proliferatorMultiplier).toEqual(mockSettings.proliferatorMultiplier);
    });

    it('should handle JSON roundtrip', () => {
      const serialized = serializeSettings(mockSettings);
      const json = JSON.stringify(serialized);
      const parsed = JSON.parse(json);
      const deserialized = deserializeSettings(parsed);

      expect(deserialized).not.toBeNull();
      expect(deserialized!.alternativeRecipes).toBeInstanceOf(Map);
      expect(deserialized!.alternativeRecipes.size).toBe(3);
    });
  });
});

