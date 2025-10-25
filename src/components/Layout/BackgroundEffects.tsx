/**
 * 背景のアニメーションエフェクトコンポーネント
 */
export function BackgroundEffects() {
  return (
    <div className="fixed inset-0 pointer-events-none">
      <div className="absolute inset-0 bg-nebula-gradient opacity-40"></div>
      <div className="absolute top-0 left-0 w-full h-full grid-bg opacity-30"></div>
    </div>
  );
}

