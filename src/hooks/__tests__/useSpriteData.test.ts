import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { getDataPath } from "../../utils/paths";

// テストセットアップでグローバルにモックされているuseSpriteDataを無効化
vi.unmock("../useSpriteData");

// グローバルfetchのモック
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("useSpriteData", () => {
  beforeEach(() => {
    mockFetch.mockClear();
    // モジュールをリセットしてキャッシュをクリア
    vi.resetModules();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("Items スプライトからアイコンデータを取得できる", async () => {
    const { useSpriteData } = await import("../useSpriteData");

    const mockItemsSprite = {
      width: 1146,
      height: 1064,
      coordinates: {
        "1001": { x: 0, y: 0, width: 80, height: 80 },
        "1002": { x: 80, y: 0, width: 80, height: 80 },
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
      spriteUrl: getDataPath("data/sprites/items-sprite.webp"),
      coords: { x: 0, y: 0, width: 80, height: 80 },
      spriteData: mockItemsSprite,
    });

    // Items スプライトのみがリクエストされることを確認
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(getDataPath("data/sprites/items-sprite.json"));
  });

  it("preferRecipes=true の場合は Recipes スプライトからアイコンデータを取得できる", async () => {
    const { useSpriteData } = await import("../useSpriteData");

    const mockRecipesSprite = {
      width: 1064,
      height: 1064,
      coordinates: {
        "5001": { x: 0, y: 0, width: 80, height: 80 },
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockRecipesSprite,
    });

    const { result } = renderHook(() => useSpriteData(5001, true));

    await waitFor(() => {
      expect(result.current).not.toBeNull();
    });

    expect(result.current).toEqual({
      spriteUrl: getDataPath("data/sprites/recipes-sprite.webp"),
      coords: { x: 0, y: 0, width: 80, height: 80 },
      spriteData: mockRecipesSprite,
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(getDataPath("data/sprites/recipes-sprite.json"));
  });

  it("preferRecipes=false の場合は Recipes スプライトへフォールバックしない", async () => {
    const { useSpriteData } = await import("../useSpriteData");

    const mockItemsSprite = {
      width: 1146,
      height: 1064,
      coordinates: {},
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockItemsSprite,
    });

    const { result } = renderHook(() => useSpriteData(5001));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    expect(result.current).toBeNull();
    expect(mockFetch).toHaveBeenCalledWith(getDataPath("data/sprites/items-sprite.json"));
    expect(mockFetch).not.toHaveBeenCalledWith(getDataPath("data/sprites/recipes-sprite.json"));
  });

  it("アイテム/機械IDとレシピSIDが衝突しても preferRecipes=false では Recipes 座標を返さない", async () => {
    const { useSpriteData } = await import("../useSpriteData");

    const mockItemsSprite = {
      width: 1146,
      height: 1064,
      coordinates: {},
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockItemsSprite,
    });

    const { result } = renderHook(() => useSpriteData(2401));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    expect(result.current).toBeNull();
  });

  it("Machines スプライトへのリクエストが存在しない（Items と統合されている）", async () => {
    const { useSpriteData } = await import("../useSpriteData");

    const mockItemsSprite = {
      width: 1146,
      height: 1064,
      coordinates: {
        // 機械アイコン（2000番台）も Items スプライトに含まれている
        "2303": { x: 160, y: 80, width: 80, height: 80 },
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
    expect(result.current?.spriteUrl).toBe(getDataPath("data/sprites/items-sprite.webp"));

    // machines-sprite.json へのリクエストは一切ない
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).not.toHaveBeenCalledWith(expect.stringContaining("machines-sprite.json"));
  });

  it("存在しないアイコンIDの場合はnullを返す", async () => {
    const { useSpriteData } = await import("../useSpriteData");

    const mockItemsSprite = {
      width: 1146,
      height: 1064,
      coordinates: {
        "1001": { x: 0, y: 0, width: 80, height: 80 },
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockItemsSprite,
    });

    const { result } = renderHook(() => useSpriteData(9999));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    // Items スプライトに存在しない場合はnull
    expect(result.current).toBeNull();
  });

  it("スプライトデータの取得に失敗した場合はnullを返す", async () => {
    const { useSpriteData } = await import("../useSpriteData");

    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useSpriteData(1001));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });

    expect(result.current).toBeNull();
  });

  it("preferRecipes=true で Recipes スプライトが404の場合は Items スプライトを試す", async () => {
    const { useSpriteData } = await import("../useSpriteData");

    const mockItemsSprite = {
      width: 1146,
      height: 1064,
      coordinates: {
        "5001": { x: 0, y: 0, width: 80, height: 80 },
      },
    };

    // Recipes スプライトが404
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    // Items スプライトは成功
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockItemsSprite,
    });

    const { result } = renderHook(() => useSpriteData(5001, true));

    await waitFor(() => {
      expect(result.current).not.toBeNull();
    });

    expect(result.current?.spriteUrl).toBe(getDataPath("data/sprites/items-sprite.webp"));
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("itemIdが変更された場合は再度データを取得する", async () => {
    const { useSpriteData } = await import("../useSpriteData");

    const mockItemsSprite = {
      width: 1146,
      height: 1064,
      coordinates: {
        "1001": { x: 0, y: 0, width: 80, height: 80 },
        "1002": { x: 80, y: 0, width: 80, height: 80 },
      },
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockItemsSprite,
    });

    const { result, rerender } = renderHook(({ itemId }) => useSpriteData(itemId), {
      initialProps: { itemId: 1001 },
    });

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
