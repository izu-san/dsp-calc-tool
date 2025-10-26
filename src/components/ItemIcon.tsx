import { useRef, useEffect, useState } from 'react';
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [actualSize, setActualSize] = useState(80);

  // レスポンシブサイズの場合、親コンテナのサイズを監視
  useEffect(() => {
    if (size !== 'auto' || !containerRef.current) return;

    const updateSize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        const minSize = Math.min(width, height);
        setActualSize(Math.min(Math.max(minSize, 32), 80));
      }
    };

    updateSize();

    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, [size]);

  // スプライトが使える場合
  if (spriteInfo) {
    const { coords, spriteUrl, spriteData } = spriteInfo;
    
    const isAutoSize = size === 'auto';
    const effectiveSize = isAutoSize ? actualSize : size;
    const scale = effectiveSize / coords.width;
    
    return (
      <div
        ref={isAutoSize ? containerRef : undefined}
        className={cn('inline-block', isAutoSize ? 'w-full h-full max-w-[80px] max-h-[80px] min-w-[32px] min-h-[32px]' : '', className)}
        style={{
          width: isAutoSize ? '100%' : effectiveSize,
          height: isAutoSize ? '100%' : effectiveSize,
          aspectRatio: '1 / 1',
        }}
      >
        <div
          style={{
            width: effectiveSize,
            height: effectiveSize,
            backgroundImage: `url(${spriteUrl})`,
            backgroundPosition: `${-coords.x * scale}px ${-coords.y * scale}px`,
            backgroundSize: `${spriteData.width * scale}px ${spriteData.height * scale}px`,
            backgroundRepeat: 'no-repeat',
            imageRendering: 'auto',
          }}
          role="img"
          aria-label={alt}
          title={alt}
          data-testid={dataTestId}
          data-prefer-recipes={preferRecipes ? 'true' : 'false'}
          data-alt={alt}
          data-size={size}
        />
      </div>
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
        data-size={size}
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
