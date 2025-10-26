import { useSpriteData } from '../hooks/useSpriteData';
import { getDataPath } from '../utils/paths';
import { getOptimalImagePath, getImageSourceSet } from '../utils/imageFormat';
import { cn } from '../utils/classNames';

interface ItemIconProps {
  itemId: number;
  size?: number | 'auto';
  className?: string;
  alt?: string;
  preferRecipes?: boolean; // Prefer recipes sprite over items sprite
  'data-testid'?: string;
}

export function ItemIcon({ itemId, size = 32, className = '', alt = '', preferRecipes = false, 'data-testid': dataTestId }: ItemIconProps) {
  const spriteInfo = useSpriteData(itemId, preferRecipes);

  // スプライトが使える場合
  if (spriteInfo) {
    const { coords, spriteUrl, spriteData } = spriteInfo;
    
    // レスポンシブサイズの場合は、スケール計算をスキップ
    const isAutoSize = size === 'auto';
    const scale = isAutoSize ? 1 : size / coords.width;
    
    return (
      <div
        className={cn('inline-block', className)}
        style={{
          width: isAutoSize ? '100%' : size,
          height: isAutoSize ? '100%' : size,
          backgroundImage: `url(${spriteUrl})`,
          backgroundPosition: `${-coords.x * scale}px ${-coords.y * scale}px`,
          backgroundSize: `${spriteData.width * scale}px ${spriteData.height * scale}px`,
          backgroundRepeat: 'no-repeat',
          imageRendering: 'auto', // 高品質なスケーリング
        }}
        role="img"
        aria-label={alt}
        title={alt}
        data-testid={dataTestId}
        data-prefer-recipes={preferRecipes ? 'true' : 'false'}
        data-alt={alt}
      />
    );
  }

  // フォールバック: 個別画像（スプライトがロード中または利用不可の場合）
  const itemIconPathPng = getDataPath(`data/Items/Icons/${itemId}.png`);
  const machineIconPathPng = getDataPath(`data/Machines/Icons/${itemId}.png`);
  
  // WebP対応のソースセットを取得
  const itemSources = getImageSourceSet(itemIconPathPng);
  const machineSources = getImageSourceSet(machineIconPathPng);
  
  return (
    <picture>
      {/* WebP形式を優先 */}
      <source srcSet={itemSources.webp} type="image/webp" />
      <source srcSet={itemSources.png} type="image/png" />
      <img
        src={getOptimalImagePath(itemIconPathPng)}
        alt={alt}
        width={size === 'auto' ? undefined : size}
        height={size === 'auto' ? undefined : size}
        className={cn('inline-block', className)}
        loading="lazy"
        data-testid={dataTestId}
        data-prefer-recipes={preferRecipes ? 'true' : 'false'}
        data-alt={alt}
        onError={(e) => {
          // アイテム画像が失敗したらマシン画像を試す
          const target = e.target as HTMLImageElement;
          const currentSrc = target.src;
          
          // まだマシン画像を試していない場合
          if (!currentSrc.includes(machineIconPathPng) && !currentSrc.includes(machineSources.webp)) {
            target.src = getOptimalImagePath(machineIconPathPng);
          }
        }}
      />
    </picture>
  );
}
