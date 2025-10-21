import { describe, it, expect } from 'vitest';
import {
  parseGridIndex,
  toGridIndex,
  getRecipeIconPath,
  getItemIconPath,
  getMachineIconPath,
} from '../grid';
import { getDataPath } from '../../utils/paths';
import type { GridPosition } from '../../types';

describe('grid', () => {
  describe('parseGridIndex', () => {
    it('4桁のGridIndexを正しくパースする', () => {
      const result = parseGridIndex('1101');

      expect(result).toEqual({
        z: 1, // Item tab
        y: 1, // Row 1
        x: 1, // Column 01
      });
    });

    it('数値のGridIndexを正しくパースする', () => {
      const result = parseGridIndex(1101);

      expect(result).toEqual({
        z: 1,
        y: 1,
        x: 1,
      });
    });

    it('3桁以下の数値を0パディングしてパースする', () => {
      const result = parseGridIndex(5); // "0005"として扱う

      expect(result).toEqual({
        z: 0,
        y: 0,
        x: 5,
      });
    });

    it('2桁のx座標を正しく処理する', () => {
      const result = parseGridIndex('2314');

      expect(result).toEqual({
        z: 2, // Building tab
        y: 3, // Row 3
        x: 14, // Column 14
      });
    });
  });

  describe('toGridIndex', () => {
    it('GridPositionを4桁の文字列に変換する', () => {
      const position: GridPosition = { z: 1, y: 1, x: 1 };
      const result = toGridIndex(position);

      expect(result).toBe('1101');
    });

    it('x座標が2桁の場合も正しく変換する', () => {
      const position: GridPosition = { z: 2, y: 3, x: 14 };
      const result = toGridIndex(position);

      expect(result).toBe('2314');
    });

    it('x座標が1桁の場合、0パディングする', () => {
      const position: GridPosition = { z: 1, y: 0, x: 5 };
      const result = toGridIndex(position);

      expect(result).toBe('1005');
    });

    it('parseGridIndexとtoGridIndexが可逆的', () => {
      const original = '2714';
      const parsed = parseGridIndex(original);
      const converted = toGridIndex(parsed);

      expect(converted).toBe(original);
    });
  });

  describe('境界値テスト', () => {
    it('最小値 (0000) を正しく処理する', () => {
      const result = parseGridIndex('0000');

      expect(result).toEqual({ z: 0, y: 0, x: 0 });
      expect(toGridIndex(result)).toBe('0000');
    });

    it('最大値を想定したテスト（z=2, y=7, x=13）', () => {
      const position: GridPosition = { z: 2, y: 7, x: 13 };
      const result = toGridIndex(position);

      expect(result).toBe('2713');
      expect(parseGridIndex(result)).toEqual(position);
    });
  });

  describe('getRecipeIconPath', () => {
    it('Explicit=trueの場合、レシピIDでアイコンパスを取得', () => {
      const path = getRecipeIconPath(1001, true);

  // BASE_URLが含まれるパスになる
  expect(path).toContain(getDataPath('data/Recipes/Icons/1001.png'));
    });

    it('Explicit=falseかつfirstResultIdありの場合、アイテムアイコンパスを取得', () => {
      const path = getRecipeIconPath(1001, false, 2001);

  expect(path).toContain(getDataPath('data/Items/Icons/2001.png'));
    });

    it('Explicit=falseかつfirstResultIdなしの場合、空文字列を返す', () => {
      const path = getRecipeIconPath(1001, false);

      expect(path).toBe('');
    });
  });

  describe('getItemIconPath', () => {
    it('アイテムIDからアイコンパスを生成する', () => {
      const path = getItemIconPath(1101);

  expect(path).toContain(getDataPath('data/Items/Icons/1101.png'));
    });

    it('異なるアイテムIDでも正しく動作する', () => {
      const path = getItemIconPath(9999);

  expect(path).toContain(getDataPath('data/Items/Icons/9999.png'));
    });
  });

  describe('getMachineIconPath', () => {
    it('機械IDからアイコンパスを生成する', () => {
      const path = getMachineIconPath(2303);

  expect(path).toContain(getDataPath('data/Machines/Icons/2303.png'));
    });

    it('異なる機械IDでも正しく動作する', () => {
      const path = getMachineIconPath(5555);

  expect(path).toContain(getDataPath('data/Machines/Icons/5555.png'));
    });
  });
});
