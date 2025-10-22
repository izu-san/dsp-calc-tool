import { Suspense, lazy } from 'react';
import { useTranslation } from 'react-i18next';
import type { Recipe } from '../../types';
import { ItemIcon } from '../ItemIcon';

const SettingsPanel = lazy(() => import('../SettingsPanel').then(m => ({ default: m.SettingsPanel })));

interface SettingsPanelSectionProps {
  selectedRecipe: Recipe | null;
  targetQuantity: number;
  setTargetQuantity: (quantity: number) => void;
}

/**
 * 設定パネルセクション
 */
export function SettingsPanelSection({ selectedRecipe, targetQuantity, setTargetQuantity }: SettingsPanelSectionProps) {
  const { t } = useTranslation();

  return (
    <div className="xl:col-span-1 animate-slideInLeft">
      <div className="hologram-panel rounded-lg shadow-panel p-4 sticky top-6 max-h-[calc(100vh-8rem)] overflow-y-auto border border-neon-blue/20 hover-lift">
        <h2 className="text-lg font-semibold text-neon-cyan mb-4">{t('settings')}</h2>
        
        {/* Target Quantity Input */}
        {selectedRecipe && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-space-100 mb-2">
              {t('target')}
            </label>
            <div className="flex items-center gap-3 mb-2">
              <ItemIcon itemId={selectedRecipe.Results?.[0]?.id || 0} size={32} />
              <span className="font-medium text-white">
                {selectedRecipe.name}
              </span>
            </div>
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={targetQuantity}
              onChange={(e) => setTargetQuantity(parseFloat(e.target.value) || 0.1)}
              className="w-full px-3 py-2 border border-neon-blue/30 bg-dark-700/50 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-neon-blue focus:border-neon-blue transition-all"
            />
            <p className="text-xs text-space-200 mt-1">{t('itemsPerSecond')}</p>
          </div>
        )}
        
        <Suspense fallback={<div className="text-center py-4">{t('loading')}</div>}>
          <SettingsPanel />
        </Suspense>
      </div>
    </div>
  );
}

