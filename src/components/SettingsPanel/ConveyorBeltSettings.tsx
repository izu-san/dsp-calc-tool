import { useEffect } from 'react';
import { useSettingsStore } from '../../stores/settingsStore';
import { ICONS } from '../../constants/icons';
import { useTranslation } from 'react-i18next';
import type { ConveyorBeltTier, SorterTier } from '../../types/settings';
import { ItemIcon } from '../ItemIcon';
import { createLogger } from '../../utils/logger';
import { cn } from '../../utils/classNames';

const logger = createLogger('ConveyorBeltSettings');

const CONVEYOR_BELT_OPTIONS = [
  { tier: 'mk1' as ConveyorBeltTier, label: 'Mk.I', speed: '6/s', color: 'yellow', iconId: ICONS.belt.mk1 },
  { tier: 'mk2' as ConveyorBeltTier, label: 'Mk.II', speed: '12/s', color: 'blue', iconId: ICONS.belt.mk2 },
  { tier: 'mk3' as ConveyorBeltTier, label: 'Mk.III', speed: '30/s', color: 'purple', iconId: ICONS.belt.mk3 },
];

const SORTER_OPTIONS = [
  { tier: 'mk1' as SorterTier, labelKey: 'sorterMkI', power: '18kW', color: 'yellow', iconId: ICONS.sorter.mk1 },
  { tier: 'mk2' as SorterTier, labelKey: 'sorterMkII', power: '36kW', color: 'blue', iconId: ICONS.sorter.mk2 },
  { tier: 'mk3' as SorterTier, labelKey: 'sorterMkIII', power: '72kW', color: 'purple', iconId: ICONS.sorter.mk3 },
  { tier: 'pile' as SorterTier, labelKey: 'pilingSorter', power: '144kW', color: 'green', iconId: ICONS.sorter.pile },
];

export function ConveyorBeltSettings() {
  const { t } = useTranslation();
  const { settings, setConveyorBelt, setSorter } = useSettingsStore();
  const { conveyorBelt, sorter } = settings;

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

  // Debug: Log values if they're invalid
  if (typeof conveyorBelt.speed !== 'number' || typeof conveyorBelt.stackCount !== 'number') {
    logger.warn('Invalid values detected', {
      speed: conveyorBelt.speed,
      stackCount: conveyorBelt.stackCount,
      conveyorBelt
    });
  }

  return (
    <div className="space-y-3">
      <div className="text-sm text-space-200">
        {t('selectConveyorBeltDesc')}
      </div>

      {/* Belt Tier Selection */}
      <div>
        <label className="block text-sm font-medium text-neon-cyan mb-2">{t('beltTier')}</label>
        <div className="grid grid-cols-3 gap-2">
          {CONVEYOR_BELT_OPTIONS.map((option) => (
            <button
              key={option.tier}
              data-testid={`conveyor-belt-button-${option.tier}`}
              onClick={() => setConveyorBelt(option.tier, conveyorBelt.stackCount)}
              className={cn(
                'px-2 py-3 text-xs font-medium rounded-lg border-2 transition-all duration-200 hover:scale-105',
                {
                  // Selected state
                  'bg-neon-yellow/30 text-white border-neon-yellow shadow-[0_0_20px_rgba(255,215,0,0.6),inset_0_0_20px_rgba(255,215,0,0.2)] backdrop-blur-sm font-bold scale-105': 
                    conveyorBelt.tier === option.tier && option.color === 'yellow',
                  'bg-neon-blue/30 text-white border-neon-blue shadow-[0_0_20px_rgba(0,136,255,0.6),inset_0_0_20px_rgba(0,136,255,0.2)] backdrop-blur-sm font-bold scale-105': 
                    conveyorBelt.tier === option.tier && option.color === 'blue',
                  'bg-neon-purple/30 text-white border-neon-purple shadow-[0_0_20px_rgba(168,85,247,0.6),inset_0_0_20px_rgba(168,85,247,0.2)] backdrop-blur-sm font-bold scale-105': 
                    conveyorBelt.tier === option.tier && option.color === 'purple',
                  // Unselected state
                  'bg-dark-700/50 text-space-200 border-neon-cyan/20 hover:bg-neon-cyan/10 hover:border-neon-cyan/50 hover:text-neon-cyan': 
                    conveyorBelt.tier !== option.tier,
                }
              )}
            >
              <div className="flex flex-col items-center gap-1">
                <ItemIcon itemId={option.iconId} size={28} />
                <span className="font-semibold text-[10px]">{option.label}</span>
                <span className="text-[10px] font-medium opacity-80">{option.speed}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Stack Count Selection */}
      <div>
        <label className="block text-sm font-medium text-neon-green mb-2">{t('stackCount')}</label>
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((count) => (
            <button
              key={count}
              data-testid={`conveyor-belt-stack-button-${count}`}
              onClick={() => handleStackCountChange(count)}
              className={cn(
                'px-3 py-2 text-sm font-medium rounded-lg border-2 transition-all duration-200 hover:scale-110',
                {
                  'bg-neon-green/30 text-white border-neon-green shadow-[0_0_20px_rgba(0,255,136,0.6),inset_0_0_20px_rgba(0,255,136,0.2)] backdrop-blur-sm font-bold scale-110': 
                    conveyorBelt.stackCount === count,
                  'bg-dark-700/50 text-space-200 border-neon-green/20 hover:bg-neon-green/10 hover:border-neon-green/50 hover:text-neon-green': 
                    conveyorBelt.stackCount !== count,
                }
              )}
            >
              ×{count}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-neon-cyan/10 rounded-lg p-3 border border-neon-cyan/40 backdrop-blur-sm shadow-[0_0_15px_rgba(0,217,255,0.2)]">
        <div className="text-xs font-semibold text-neon-cyan mb-1">{t('totalBeltSpeed')}</div>
        <div className="text-sm text-white">
          <span className="font-bold text-neon-cyan">{totalSpeed}</span> {t('itemsPerSecond')}
          {stackCount > 1 && (
            <span className="text-xs ml-2 text-space-200">({speed}/s × {stackCount})</span>
          )}
        </div>
      </div>

      {/* Sorter Rank Selection */}
      <div>
        <label className="block text-sm font-medium text-neon-orange mb-2">{t('sorterRank')}</label>
        <div className="grid grid-cols-4 gap-2">
          {SORTER_OPTIONS.map((option) => (
            <button
              key={option.tier}
              data-testid={`sorter-button-${option.tier}`}
              onClick={() => setSorter(option.tier)}
              className={cn(
                'px-2 py-3 text-xs font-medium rounded-lg border-2 transition-all duration-200 hover:scale-105',
                {
                  // Selected state
                  'bg-neon-yellow/30 text-white border-neon-yellow shadow-[0_0_20px_rgba(255,215,0,0.6),inset_0_0_20px_rgba(255,215,0,0.2)] backdrop-blur-sm font-bold scale-105': 
                    sorter.tier === option.tier && option.color === 'yellow',
                  'bg-neon-blue/30 text-white border-neon-blue shadow-[0_0_20px_rgba(0,136,255,0.6),inset_0_0_20px_rgba(0,136,255,0.2)] backdrop-blur-sm font-bold scale-105': 
                    sorter.tier === option.tier && option.color === 'blue',
                  'bg-neon-purple/30 text-white border-neon-purple shadow-[0_0_20px_rgba(168,85,247,0.6),inset_0_0_20px_rgba(168,85,247,0.2)] backdrop-blur-sm font-bold scale-105': 
                    sorter.tier === option.tier && option.color === 'purple',
                  'bg-neon-green/30 text-white border-neon-green shadow-[0_0_20px_rgba(0,255,136,0.6),inset_0_0_20px_rgba(0,255,136,0.2)] backdrop-blur-sm font-bold scale-105': 
                    sorter.tier === option.tier && option.color === 'green',
                  // Unselected state
                  'bg-dark-700/50 text-space-200 border-neon-orange/20 hover:bg-neon-orange/10 hover:border-neon-orange/50 hover:text-neon-orange': 
                    sorter.tier !== option.tier,
                }
              )}
            >
              <div className="flex flex-col items-center gap-1">
                <ItemIcon itemId={option.iconId} size={24} />
                <span className="font-semibold text-[10px]">{t(option.labelKey)}</span>
                <span className="text-[10px] font-medium opacity-80">{option.power}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
