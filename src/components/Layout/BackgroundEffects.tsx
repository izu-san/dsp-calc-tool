/**
 * 背景のアニメーションエフェクトコンポーネント
 */
export function BackgroundEffects() {
  return (
    <div className="fixed inset-0 pointer-events-none">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_18%,rgba(64,107,148,0.12),transparent_32%)]"></div>
      <div className="absolute top-0 left-0 w-full h-full grid-bg opacity-45"></div>
      <div className="absolute inset-x-0 top-0 h-px bg-space-400/20"></div>
    </div>
  );
}
