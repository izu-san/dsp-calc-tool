import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { getDataPath } from '../../utils/paths';

// グローバルfetchのモック
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('useSpriteData', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    // モジュールをリセットしてキャッシュをクリア
    vi.resetModules();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('Items スプライトからアイコンデータを取得できる', async () => {
    const { useSpriteData } = await import('../useSpriteData');
    
    const mockItemsSprite = {
      width: 1146,
      height: 1064,
      coordinates: {
        '1001': { x: 0, y: 0, width: 80, height: 80 },
        '1002': { x: 80, y: 0, width: 80, height: 80 },
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockItemsSprite,
    });

    const { result } = renderHook(() => useSpriteData(1001));

    await waitFor(() => {
      expect(result.current).not.toBeNull();
    });

    expect(result.current).toEqual({
      spriteUrl: getDataPath('data/sprites/items-sprite.png'),
      coords: { x: 0, y: 0, width: 80, height: 80 },
      spriteData: mockItemsSprite,
    });

    // Items スプライトのみがリクエストされることを確認
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(getDataPath('data/sprites/items-sprite.json'));
  });

  it('Recipes スプライトからアイコンデータを取得できる', async () => {
    const { useSpriteData } = await import('../useSpriteData');
    
    const mockItemsSprite = {
      width: 1146,
      height: 1064,
      coordinates: {
        '1001': { x: 0, y: 0, width: 80, height: 80 },
      },
    };

    const mockRecipesSprite = {
      width: 1064,
      height: 1064,
      coordinates: {
        '5001': { x: 0, y: 0, width: 80, height: 80 },
      },
    };

    // Items スプライトには存在しない
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockItemsSprite,
    });

    // Recipes スプライトに存在する
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockRecipesSprite,
    });

    const { result } = renderHook(() => useSpriteData(5001));

    await waitFor(() => {
      expect(result.current).not.toBeNull();
    });

    expect(result.current).toEqual({
      spriteUrl: getDataPath('data/sprites/recipes-sprite.png'),
      coords: { x: 0, y: 0, width: 80, height: 80 },
      spriteData: mockRecipesSprite,
    });

    // Items と Recipes の両方がリクエストされる（Itemsにない場合）
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenNthCalledWith(1, getDataPath('data/sprites/items-sprite.json'));
    expect(mockFetch).toHaveBeenNthCalledWith(2, getDataPath('data/sprites/recipes-sprite.json'));
  });

  it('Machines スプライトへのリクエストが存在しない（Items と統合されている）', async () => {
    const { useSpriteData } = await import('../useSpriteData');
    
    const mockItemsSprite = {
      width: 1146,
      height: 1064,
      coordinates: {
        // 機械アイコン（2000番台）も Items スプライトに含まれている
        '2303': { x: 160, y: 80, width: 80, height: 80 },
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockItemsSprite,
    });

    const { result } = renderHook(() => useSpriteData(2303));

    await waitFor(() => {
      expect(result.current).not.toBeNull();
    });

    // Items スプライトから取得される
    expect(result.current?.spriteUrl).toBe(getDataPath('data/sprites/items-sprite.png'));

    // machines-sprite.json へのリクエストは一切ない
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).not.toHaveBeenCalledWith(
      expect.stringContaining('machines-sprite.json')
    );
  });

  it('存在しないアイコンIDの場合はnullを返す', async () => {
    const { useSpriteData } = await import('../useSpriteData');
    
    const mockItemsSprite = {
      width: 1146,
      height: 1064,
      coordinates: {
        '1001': { x: 0, y: 0, width: 80, height: 80 },
      },
    };

    const mockRecipesSprite = {
      width: 1064,
      height: 1064,
      coordinates: {
        '5001': { x: 0, y: 0, width: 80, height: 80 },
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockItemsSprite,
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockRecipesSprite,
    });

    const { result } = renderHook(() => useSpriteData(9999));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    // どのスプライトにも存在しない場合はnull
    expect(result.current).toBeNull();
  });

  it('スプライトデータの取得に失敗した場合はnullを返す', async () => {
    const { useSpriteData } = await import('../useSpriteData');
    
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useSpriteData(1001));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });

    expect(result.current).toBeNull();
  });

  it('スプライトファイルが404の場合は次のスプライトを試す', async () => {
    const { useSpriteData } = await import('../useSpriteData');
    
    const mockRecipesSprite = {
      width: 1064,
      height: 1064,
      coordinates: {
        '5001': { x: 0, y: 0, width: 80, height: 80 },
      },
    };

    // Items スプライトが404
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    // Recipes スプライトは成功
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockRecipesSprite,
    });

    const { result } = renderHook(() => useSpriteData(5001));

    await waitFor(() => {
      expect(result.current).not.toBeNull();
    });

    expect(result.current?.spriteUrl).toBe(getDataPath('data/sprites/recipes-sprite.png'));
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('itemIdが変更された場合は再度データを取得する', async () => {
    const { useSpriteData } = await import('../useSpriteData');
    
    const mockItemsSprite = {
      width: 1146,
      height: 1064,
      coordinates: {
        '1001': { x: 0, y: 0, width: 80, height: 80 },
        '1002': { x: 80, y: 0, width: 80, height: 80 },
      },
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockItemsSprite,
    });

    const { result, rerender } = renderHook(
      ({ itemId }) => useSpriteData(itemId),
      { initialProps: { itemId: 1001 } }
    );

    await waitFor(() => {
      expect(result.current).not.toBeNull();
    });

    expect(result.current?.coords).toEqual({ x: 0, y: 0, width: 80, height: 80 });

    // itemIdを変更
    rerender({ itemId: 1002 });

    await waitFor(() => {
      expect(result.current?.coords).toEqual({ x: 80, y: 0, width: 80, height: 80 });
    });
  });
});

