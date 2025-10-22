import { useSpriteData } from '../hooks/useSpriteData';
import { getDataPath } from '../utils/paths';
import { getOptimalImagePath, getImageSourceSet } from '../utils/imageFormat';

interface ItemIconProps {
  itemId: number;
  size?: number;
  className?: string;
  alt?: string;
  preferRecipes?: boolean; // Prefer recipes sprite over items sprite
}

export function ItemIcon({ itemId, size = 32, className = '', alt = '', preferRecipes = false }: ItemIconProps) {
  const spriteInfo = useSpriteData(itemId, preferRecipes);

  // スプライトが使える場合
  if (spriteInfo) {
    const { coords, spriteUrl, spriteData } = spriteInfo;
    
    // 元のアイコンサイズに対するスケール比率を計算
    const scale = size / coords.width;
    
    return (
      <div
        className={`inline-block ${className}`}
        style={{
          width: size,
          height: size,
          backgroundImage: `url(${spriteUrl})`,
          backgroundPosition: `${-coords.x * scale}px ${-coords.y * scale}px`,
          backgroundSize: `${spriteData.width * scale}px ${spriteData.height * scale}px`,
          backgroundRepeat: 'no-repeat',
          imageRendering: 'auto', // 高品質なスケーリング
        }}
        role="img"
        aria-label={alt}
        title={alt}
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
        width={size}
        height={size}
        className={`inline-block ${className}`}
        loading="lazy"
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
