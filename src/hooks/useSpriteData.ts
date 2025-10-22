import { useEffect, useState } from 'react';
import { getDataPath } from '../utils/paths';

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
  } catch (e) {
    return null;
  }
}

export function useSpriteData(itemId: number, preferRecipes = false): SpriteInfo | null {
  const [spriteInfo, setSpriteInfo] = useState<SpriteInfo | null>(() => {
    // 初期状態でキャッシュをチェック（同期）
    const itemKey = String(itemId);
    
    // Check sprites in order based on preferRecipes
    const spritesToCheck = preferRecipes 
      ? ['recipes' as const, 'items' as const] 
      : ['items' as const, 'recipes' as const];
    
    for (const spriteType of spritesToCheck) {
      const spriteData = spriteCache.get(spriteType);
      if (spriteData?.coordinates[itemKey]) {
        return {
          spriteUrl: getDataPath(`data/sprites/${spriteType}-sprite.png`),
          coords: spriteData.coordinates[itemKey],
          spriteData: spriteData,
        };
      }
    }
    
    return null;
  });

  useEffect(() => {
    // itemIdを文字列に変換（JSONキーは文字列）
    const itemKey = String(itemId);
    
    // Check sprites in order based on preferRecipes
    const spritesToCheck = preferRecipes 
      ? ['recipes' as const, 'items' as const] 
      : ['items' as const, 'recipes' as const];
    
    // まずキャッシュから同期的にチェック
    for (const spriteType of spritesToCheck) {
      const spriteData = spriteCache.get(spriteType);
      if (spriteData?.coordinates[itemKey]) {
        setSpriteInfo({
          spriteUrl: getDataPath(`data/sprites/${spriteType}-sprite.png`),
          coords: spriteData.coordinates[itemKey],
          spriteData: spriteData,
        });
        return;
      }
    }

    // キャッシュになければ非同期ロード
    let mounted = true;

    async function loadSprites() {
      for (const spriteType of spritesToCheck) {
        const spriteData = await loadSpriteData(spriteType);
        if (mounted && spriteData?.coordinates[itemKey]) {
          setSpriteInfo({
            spriteUrl: getDataPath(`data/sprites/${spriteType}-sprite.png`),
            coords: spriteData.coordinates[itemKey],
            spriteData: spriteData,
          });
          return;
        }
      }

      // 見つからなかった
      if (mounted) {
        setSpriteInfo(null);
      }
    }

    loadSprites();

    return () => {
      mounted = false;
    };
  }, [itemId, preferRecipes]);

  return spriteInfo;
}

