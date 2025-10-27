import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Mock react-i18next to avoid needing a real i18n instance in smoke tests
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
  initReactI18next: { type: '3rdParty', init: () => {} },
}));

// Mock fetch to prevent network requests during tests
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    text: () => Promise.resolve('<xml>test data</xml>'),
    json: () => Promise.resolve({}),
  } as Response)
);

// Mock sprite data loading with complete mock data
vi.mock('../hooks/useSpriteData', () => ({
  useSpriteData: () => ({
    coords: { x: 0, y: 0, width: 32, height: 32 },
    spriteUrl: 'mock-sprite.png',
    spriteData: { 
      width: 32, 
      height: 32, 
      coordinates: {
        // よく使われるアイテムIDのモック座標
        '100': { x: 0, y: 0, width: 32, height: 32 },
        '1001': { x: 32, y: 0, width: 32, height: 32 },
        '1002': { x: 64, y: 0, width: 32, height: 32 },
        '1101': { x: 96, y: 0, width: 32, height: 32 },
        '1104': { x: 128, y: 0, width: 32, height: 32 },
        '1105': { x: 160, y: 0, width: 32, height: 32 },
        '1141': { x: 192, y: 0, width: 32, height: 32 },
        '1142': { x: 224, y: 0, width: 32, height: 32 },
        '1143': { x: 256, y: 0, width: 32, height: 32 },
        '2001': { x: 288, y: 0, width: 32, height: 32 },
        '2011': { x: 320, y: 0, width: 32, height: 32 },
        '2300': { x: 352, y: 0, width: 32, height: 32 },
        '2302': { x: 384, y: 0, width: 32, height: 32 },
        '2303': { x: 416, y: 0, width: 32, height: 32 },
        '2315': { x: 448, y: 0, width: 32, height: 32 },
      }
    },
  }),
}));

// Cleanup after each test
afterEach(() => {
  cleanup();
});
