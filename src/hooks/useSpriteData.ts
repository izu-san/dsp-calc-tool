import { useEffect, useMemo, useState } from 'react';
import { getDataPath } from '../utils/paths';
import { getOptimalImagePath } from '../utils/imageFormat';

interface SpriteCoordinates {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface SpriteData {
  width: number;
  height: number;
  coordinates: Record<string, SpriteCoordinates>;
}

interface SpriteInfo {
  spriteUrl: string;
  coords: SpriteCoordinates;
  spriteData: SpriteData;
}

// スプライトデータのキャッシュ
const spriteCache = new Map<string, SpriteData>();

// スプライトデータの事前ロード関数（アプリ起動時に呼び出す）
export async function preloadSpriteData(): Promise<void> {
  await Promise.all([
    loadSpriteData('items'),
    loadSpriteData('recipes'),
  ]);
}

async function loadSpriteData(type: 'items' | 'recipes'): Promise<SpriteData | null> {
  // キャッシュをチェック
  if (spriteCache.has(type)) {
    return spriteCache.get(type)!;
  }

  try {
    const path = getDataPath(`data/sprites/${type}-sprite.json`);
    const response = await fetch(path);
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    spriteCache.set(type, data);
    return data;
  } catch {
    return null;
  }
}

export function useSpriteData(itemId: number, preferRecipes = false): SpriteInfo | null {
  // state は非同期ロード結果を保持するために使う
  const [spriteInfo, setSpriteInfo] = useState<SpriteInfo | null>(null);

  // itemId を文字列に変換（JSONキーは文字列）
  const itemKey = String(itemId);
  // preferRecipes に基づいてチェック順を決める（安定化のため useMemo を使用）
  const spritesToCheck = useMemo(
    () => (preferRecipes ? (['recipes', 'items'] as const) : (['items', 'recipes'] as const)),
    [preferRecipes]
  );

  // キャッシュを同期的にチェックして即時に返せる結果を準備
  let immediateResult: SpriteInfo | null = null;
  for (const spriteType of spritesToCheck) {
    const spriteData = spriteCache.get(spriteType);
    if (spriteData?.coordinates[itemKey]) {
      const spritePngPath = getDataPath(`data/sprites/${spriteType}-sprite.png`);
      immediateResult = {
        spriteUrl: getOptimalImagePath(spritePngPath),
        coords: spriteData.coordinates[itemKey],
        spriteData: spriteData,
      };
      break;
    }
  }

  // キャッシュになければ非同期でロードして state を更新する（effect 内では同期的な setState は行わない）
  useEffect(() => {
    let mounted = true;

    async function loadSprites() {
      for (const spriteType of spritesToCheck) {
        const spriteData = await loadSpriteData(spriteType);
        if (mounted && spriteData?.coordinates[itemKey]) {
          const spritePngPath = getDataPath(`data/sprites/${spriteType}-sprite.png`);
          setSpriteInfo({
            spriteUrl: getOptimalImagePath(spritePngPath),
            coords: spriteData.coordinates[itemKey],
            spriteData: spriteData,
          });
          return;
        }
      }

      if (mounted) {
        setSpriteInfo(null);
      }
    }

    loadSprites();

    return () => {
      mounted = false;
    };
  }, [itemId, preferRecipes, itemKey, spritesToCheck]);

  // 即時結果があればそれを返し、なければ state の結果を返す
  return immediateResult ?? spriteInfo;
}

