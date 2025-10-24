import { useState, memo } from 'react';
import { useTranslation } from 'react-i18next';
import type { RecipeTreeNode } from '../../types';
import { formatRate, formatNumber, formatPower } from '../../utils/format';
import { parseColorTags } from '../../utils/html';
import { NodeSettingsModal } from '../NodeSettingsModal';
import { CompactNodeSettings } from './CompactNodeSettings';
import { ItemIcon } from '../ItemIcon';
import { cn } from '../../utils/classNames';

interface ProductionTreeProps {
  node: RecipeTreeNode;
  depth?: number;
  collapsedNodes?: Set<string>;
  onToggleCollapse?: (nodeId: string) => void;
  nodeId?: string;
}

// Generate a unique ID for each node based on its position in the tree
// Must match the ID generation in calculator.ts
function generateNodeId(node: RecipeTreeNode, parentNodeId: string, depth: number): string {
  if (node.isRawMaterial) {
    return `${parentNodeId}-raw-${node.itemId}-${depth}`;
  }
  return `${parentNodeId}-${node.recipe?.SID}-${depth}`;
}

export const ProductionTree = memo(function ProductionTree({ 
  node, 
  depth = 0,
  collapsedNodes = new Set(),
  onToggleCollapse = () => {},
  nodeId = 'root'
}: ProductionTreeProps) {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isRoot = depth === 0;
  const hasChildren = node.children.length > 0;
  const isCollapsed = collapsedNodes.has(nodeId);

  const handleToggle = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    if (hasChildren) {
      onToggleCollapse(nodeId);
    }
  };



  // Handle raw material leaf nodes
  if (node.isRawMaterial) {
    // Determine if this is a circular dependency
    const isCircular = node.isCircularDependency;
    // For circular dependencies, always show the item (not the recipe)
    // because we want to display which item needs external supply
    const iconId = node.itemId!;
    const displayName = node.itemName;
    
    return (
      <div className={cn({ 'ml-6 mt-2': depth > 0 })}>
        <div className={cn(
          'border rounded-lg p-3 backdrop-blur-sm relative overflow-hidden animate-fadeIn',
          {
            'bg-neon-purple/20 border-neon-purple/50 shadow-[0_0_20px_rgba(168,85,247,0.3)]': isCircular,
            'bg-neon-green/20 border-neon-green/50 shadow-[0_0_20px_rgba(0,255,136,0.3)]': !isCircular,
          }
        )}>
          {/* Data stream effect */}
          <div className="absolute inset-0 data-stream opacity-20 pointer-events-none"></div>
          <div className="relative z-10">
          <div className="flex items-center gap-3">
            {/* Icon (Recipe or Item) */}
            <div className={cn(
              'w-10 h-10 flex-shrink-0 border rounded bg-dark-800/50 backdrop-blur-sm p-1',
              {
                'border-neon-purple/50 shadow-[0_0_10px_rgba(168,85,247,0.3)]': isCircular,
                'border-neon-green/50 shadow-[0_0_10px_rgba(0,255,136,0.3)]': !isCircular,
              }
            )}>
              <ItemIcon
                itemId={iconId}
                alt={displayName}
                size={32}
              />
            </div>

            {/* Raw Material / Circular Dependency Info */}
            <div className="flex-1 min-w-0">
              <h4 className={cn(
                'font-semibold text-white truncate',
                {
                  'drop-shadow-[0_0_4px_rgba(168,85,247,0.6)]': isCircular,
                  'drop-shadow-[0_0_4px_rgba(0,255,136,0.6)]': !isCircular,
                }
              )}>
                {displayName}
              </h4>
              <p className="text-xs text-space-200">
                {isCircular ? '🔄 ' : '⛏️ '}
                {node.miningFrom === 'externalSupplyCircular' 
                  ? t('externalSupplyCircular')
                  : parseColorTags(node.miningFrom || '')
                }
              </p>
            </div>

            {/* Required Rate */}
            <div className="text-right">
              <div className={cn(
                'text-sm font-bold',
                {
                  'text-neon-purple drop-shadow-[0_0_4px_rgba(168,85,247,0.6)]': isCircular,
                  'text-neon-green drop-shadow-[0_0_4px_rgba(0,255,136,0.6)]': !isCircular,
                }
              )}>
                {formatRate(node.targetOutputRate)}
              </div>
              <div className="text-xs text-space-200">
                🛤️ {node.conveyorBelts.outputs} {node.conveyorBelts.outputs !== 1 ? t('belts') : t('belt')}
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>
    );
  }

  // Handle regular recipe nodes
  const isBottleneck = node.conveyorBelts.saturation && node.conveyorBelts.saturation > 80;
  
  return (
    <div className={cn({ 'ml-6 mt-2': depth > 0 })}>
      {/* Tree Node */}
      <div 
        className={cn(
          'border rounded-lg p-3 bg-dark-700/50 backdrop-blur-sm relative overflow-hidden animate-fadeIn hover:shadow-[0_0_20px_rgba(0,217,255,0.3)] transition-all',
          {
            'border-neon-orange/60 border-2 shadow-[0_0_25px_rgba(255,107,53,0.4)]': isRoot && isBottleneck,
            'border-neon-blue/60 border-2 shadow-[0_0_25px_rgba(0,136,255,0.4)]': isRoot && !isBottleneck,
            'border-neon-orange/40 border-2 shadow-[0_0_20px_rgba(255,107,53,0.3)]': !isRoot && isBottleneck,
            'border-neon-cyan/30 shadow-[0_0_15px_rgba(0,217,255,0.2)]': !isRoot && !isBottleneck,
          }
        )}
      >
        {/* Data stream effect */}
        <div className="absolute inset-0 data-stream opacity-20 pointer-events-none"></div>


        <div
          role="button"
          tabIndex={0}
          aria-expanded={!isCollapsed}
          aria-controls={`node-${nodeId}`}
          aria-label={isCollapsed ? t('expand') : t('collapse')}
          onClick={handleToggle}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') handleToggle(e);
          }}
          className="cursor-pointer"
        >
        {/* Header */}
        <div className="flex items-center gap-3 mb-2 relative z-10">
          {/* Collapse/Expand Icon */}
          {hasChildren && (
            <div
              className="w-5 h-5 flex-shrink-0 flex items-center justify-center text-neon-cyan hover:text-white transition-colors cursor-pointer"
              aria-hidden="true"
            >
              {isCollapsed ? '▶' : '▼'}
            </div>
          )}
          
          {/* Recipe Icon */}
          <div className="w-10 h-10 flex-shrink-0 border border-neon-cyan/50 rounded bg-dark-800/50 backdrop-blur-sm p-1 shadow-[0_0_10px_rgba(0,217,255,0.3)]">
            <ItemIcon
              itemId={node.recipe!.Explicit ? node.recipe!.SID : (node.recipe!.Results[0]?.id || node.recipe!.SID)}
              alt={node.recipe!.name}
              size={32}
              preferRecipes={node.recipe!.Explicit}
            />
          </div>

          {/* Recipe Info */}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-white truncate drop-shadow-[0_0_4px_rgba(0,217,255,0.6)]">{node.recipe!.name}</h4>
            <p className="text-sm text-space-300">
              {node.machine!.name} × {formatNumber(node.machineCount)}
            </p>
            {/* Badges */}
            <div className="mt-1 flex flex-wrap items-center gap-1">
              <span
                className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-neon-blue/20 text-neon-blue border border-neon-blue/30 shadow-[0_0_5px_rgba(0,136,255,0.3)]"
                title={t('machine')}
              >
                🏭 {node.machine?.name}
              </span>
              {node.proliferator.type !== 'none' && (
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-neon-magenta/20 text-neon-magenta border border-neon-magenta/30 shadow-[0_0_5px_rgba(233,53,255,0.3)]"
                  title={t('proliferator')}
                >
                  🧪 {node.proliferator.type.toUpperCase()} · {node.proliferator.mode === 'production' ? t('production') : t('speed')}
                </span>
              )}
            </div>
          </div>

          {/* Output Rate */}
          <div className="text-right pr-8">
            <div className="text-lg font-bold text-neon-cyan drop-shadow-[0_0_4px_rgba(0,217,255,0.6)]">
              {formatRate(node.targetOutputRate)}
            </div>
            <div className="text-xs text-space-300">
              {formatPower(node.power.total)}
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div id={`node-${nodeId}`} className="grid grid-cols-3 gap-2 text-sm border-t border-neon-cyan/20 pt-2 mt-2 relative z-10">
          {/* Inputs */}
          <div>
            <div className="text-xs font-medium text-neon-green mb-1">{t('inputs')}</div>
            <div className="space-y-1">
              {node.inputs.map((input) => (
                <div key={input.itemId} className="flex justify-between text-xs">
                  <span className="text-space-200 truncate">{input.itemName}</span>
                  <span className="font-medium text-neon-orange ml-2 flex-shrink-0">
                    {formatRate(input.requiredRate)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Power Breakdown */}
          <div>
            <div className="text-xs font-medium text-neon-yellow mb-1">{t('power')}</div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-space-200">{t('machines')}:</span>
                <span className="font-medium text-white">{formatPower(node.power.machines)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-space-200">{t('sorters')}:</span>
                <span className="font-medium text-white">{formatPower(node.power.sorters)}</span>
              </div>
            </div>
          </div>

          {/* Conveyor Belts */}
          <div>
            <div className="text-xs font-medium text-neon-cyan mb-1">
              🛤️ {t('belts')}
              {node.conveyorBelts.saturation && node.conveyorBelts.saturation > 80 && (
                <span className="ml-1 text-neon-orange" title={t('bottleneckDetected')}>⚠️</span>
              )}
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-space-200">{t('inputs')}:</span>
                <span className={cn('font-medium', {
                  'text-neon-orange': node.conveyorBelts.bottleneckType === 'input',
                  'text-neon-yellow': node.conveyorBelts.bottleneckType !== 'input',
                })}>
                  {node.conveyorBelts.inputs}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-space-200">{t('outputs')}:</span>
                <span className={cn('font-medium', {
                  'text-neon-orange': node.conveyorBelts.bottleneckType === 'output',
                  'text-neon-blue': node.conveyorBelts.bottleneckType !== 'output',
                })}>
                  {node.conveyorBelts.outputs}
                </span>
              </div>
              <div className="flex justify-between border-t border-neon-cyan/20 pt-1">
                <span className="text-space-200 font-medium">{t('total')}:</span>
                <span className="font-bold text-white">{node.conveyorBelts.total}</span>
              </div>
              {node.conveyorBelts.saturation && (
                <div className="flex justify-between pt-1 border-t border-neon-cyan/20">
                  <span className="text-space-200">{t('saturation')}:</span>
                  <span className={`font-medium`}
                        style={{
                          color: node.conveyorBelts.saturation > 90 ? '#FF6B35' :
                                 node.conveyorBelts.saturation > 80 ? '#FFD700' :
                                 '#00FF88'
                        }}>
                    {node.conveyorBelts.saturation.toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Proliferator Info */}
        {node.proliferator.type !== 'none' && (
          <div className="mt-2 pt-2 border-t border-neon-magenta/20 relative z-10">
            <div className="text-xs text-neon-magenta font-medium">
              🧪 {node.proliferator.type.toUpperCase()} - {node.proliferator.mode === 'production' ? t('production') : t('speed')} {t('boost')}
            </div>
          </div>
        )}
        </div>

        {/* Compact Node Settings - Always visible */}
        {!node.isRawMaterial && (
          <div className="mt-3 relative z-10">
            <CompactNodeSettings node={node} />
          </div>
        )}
      </div>

      {/* Node Settings Modal (fallback) */}
      <NodeSettingsModal
        node={node}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      {/* Child Nodes */}
      {hasChildren && !isCollapsed && (
        <div className="relative">
          {/* Connector Line */}
          <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-neon-cyan/60 via-neon-cyan/30 to-neon-cyan/60 ml-3 animate-pulse-slow" />
          
          <div className="space-y-2">
            {node.children.map((child, index) => {
              const childNodeId = generateNodeId(child, nodeId, depth + 1);
              return (
                <div key={index} className="relative">
                  {/* Horizontal connector */}
                  <div className="absolute left-3 top-6 w-3 h-px bg-gradient-to-r from-neon-cyan/60 to-neon-cyan/30" />
                  
                  <ProductionTree 
                    node={child} 
                    depth={depth + 1} 
                    collapsedNodes={collapsedNodes}
                    onToggleCollapse={onToggleCollapse}
                    nodeId={childNodeId}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});
