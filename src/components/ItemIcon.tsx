import { useSpriteData } from '../hooks/useSpriteData';
import { getDataPath } from '../utils/paths';

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

  // フォールバック: 個別PNG（スプライトがロード中または利用不可の場合）
  const itemIconPath = getDataPath(`data/Items/Icons/${itemId}.png`);
  const machineIconPath = getDataPath(`data/Machines/Icons/${itemId}.png`);
  
  return (
    <picture>
      <source srcSet={itemIconPath} type="image/png" />
      <img
        src={machineIconPath}
        alt={alt}
        width={size}
        height={size}
        className={`inline-block ${className}`}
        loading="lazy"
        onError={(e) => {
          // Fallback to a placeholder if both fail
          const target = e.target as HTMLImageElement;
          if (target.src !== machineIconPath) {
            target.src = machineIconPath;
          }
        }}
      />
    </picture>
  );
}
