import { useEffect } from 'react';
import { useSettingsStore } from '../../stores/settingsStore';
import { ICONS } from '../../constants/icons';
import { useTranslation } from 'react-i18next';
import type { ConveyorBeltTier } from '../../types/settings';
import { ItemIcon } from '../ItemIcon';

const CONVEYOR_BELT_OPTIONS = [
  { tier: 'mk1' as ConveyorBeltTier, label: 'Mk.I', speed: '6/s', color: 'yellow', iconId: ICONS.belt.mk1 },
  { tier: 'mk2' as ConveyorBeltTier, label: 'Mk.II', speed: '12/s', color: 'blue', iconId: ICONS.belt.mk2 },
  { tier: 'mk3' as ConveyorBeltTier, label: 'Mk.III', speed: '30/s', color: 'purple', iconId: ICONS.belt.mk3 },
];

export function ConveyorBeltSettings() {
  const { t } = useTranslation();
  const { settings, setConveyorBelt } = useSettingsStore();
  const { conveyorBelt } = settings;

  // Ensure stackCount is initialized on component mount
  useEffect(() => {
    if (typeof conveyorBelt.stackCount !== 'number' || conveyorBelt.stackCount < 1 || conveyorBelt.stackCount > 4) {
      setConveyorBelt(conveyorBelt.tier, 1);
    }
  }, [conveyorBelt.stackCount, conveyorBelt.tier, setConveyorBelt]);

  const handleStackCountChange = (count: number) => {
    setConveyorBelt(conveyorBelt.tier, count);
  };

  // Calculate total throughput (items/second) with null checks to prevent NaN
  const speed = typeof conveyorBelt.speed === 'number' ? conveyorBelt.speed : 0;
  const stackCount = typeof conveyorBelt.stackCount === 'number' ? conveyorBelt.stackCount : 1;
  const totalSpeed = speed * stackCount;

  // Debug: Log values if they're invalid (remove in production)
  if (typeof conveyorBelt.speed !== 'number' || typeof conveyorBelt.stackCount !== 'number') {
    console.warn('ConveyorBeltSettings: Invalid values detected', {
      speed: conveyorBelt.speed,
      stackCount: conveyorBelt.stackCount,
      conveyorBelt
    });
  }

  return (
    <div className="space-y-3">
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {t('selectConveyorBeltDesc')}
      </div>

      {/* Belt Tier Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('beltTier')}</label>
        <div className="grid grid-cols-3 gap-2">
          {CONVEYOR_BELT_OPTIONS.map((option) => (
            <button
              key={option.tier}
              onClick={() => setConveyorBelt(option.tier, conveyorBelt.stackCount)}
              className={`
                px-2 py-3 text-xs font-medium rounded-lg border transition-all duration-200
                ${conveyorBelt.tier === option.tier
                  ? option.color === 'yellow'
                    ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-400 dark:border-yellow-600 ring-2 ring-yellow-300 dark:ring-yellow-700'
                    : option.color === 'blue'
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-400 dark:border-blue-600 ring-2 ring-blue-300 dark:ring-blue-700'
                    : 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-purple-400 dark:border-purple-600 ring-2 ring-purple-300 dark:ring-purple-700'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                }
              `}
            >
              <div className="flex flex-col items-center gap-1">
                <ItemIcon itemId={option.iconId} size={28} />
                <span className="font-semibold text-[10px]">{option.label}</span>
                <span className="text-[9px] opacity-70">{option.speed}/s</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Stack Count Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('stackCount')}</label>
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((count) => (
            <button
              key={count}
              onClick={() => handleStackCountChange(count)}
              className={`
                px-3 py-2 text-sm font-medium rounded-lg border transition-all duration-200
                ${conveyorBelt.stackCount === count
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-400 dark:border-green-600 ring-2 ring-green-300 dark:ring-green-700'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                }
              `}
            >
              ×{count}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
        <div className="text-xs font-semibold text-blue-800 dark:text-blue-300 mb-1">{t('totalBeltSpeed')}</div>
        <div className="text-sm text-blue-700 dark:text-blue-400">
          <span className="font-bold">{totalSpeed}</span> {t('itemsPerSecond')}
          {stackCount > 1 && (
            <span className="text-xs ml-2">({speed}/s × {stackCount})</span>
          )}
        </div>
      </div>
    </div>
  );
}
