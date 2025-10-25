import { Suspense, lazy } from 'react';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '../LanguageSwitcher';

// Lazy load heavy components
const PlanManager = lazy(() => import('../PlanManager').then(m => ({ default: m.PlanManager })));

/**
 * アプリケーションのヘッダーコンポーネント
 */
export function Header() {
  const { t } = useTranslation();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-dark-600/90 shadow-panel border-b border-neon-blue/30">
      {/* Animated background line */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-neon-cyan to-transparent opacity-50 animate-pulse-slow"></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white drop-shadow-[0_0_8px_rgba(0,217,255,0.6)] animate-fadeIn">
              {t('title')}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <Suspense fallback={<div className="w-8 h-8"></div>}>
              <PlanManager />
            </Suspense>
          </div>
        </div>
      </div>
    </header>
  );
}

