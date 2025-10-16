interface ItemIconProps {
  itemId: number;
  size?: number;
  className?: string;
  alt?: string;
}

export function ItemIcon({ itemId, size = 32, className = '', alt = '' }: ItemIconProps) {
  // Try Items folder first, then Machines folder
  const itemIconPath = `/data/Items/Icons/${itemId}.png`;
  const machineIconPath = `/data/Machines/Icons/${itemId}.png`;
  
  return (
    <picture>
      <source srcSet={itemIconPath} type="image/png" />
      <img
        src={machineIconPath}
        alt={alt}
        width={size}
        height={size}
        className={`inline-block ${className}`}
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
