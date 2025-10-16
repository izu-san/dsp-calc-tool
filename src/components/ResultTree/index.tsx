import { useState, memo } from 'react';
import { useTranslation } from 'react-i18next';
import type { RecipeTreeNode } from '../../types';
import { getItemIconPath } from '../../utils/grid';
import { formatRate, formatNumber, formatPower } from '../../utils/format';
import { parseColorTags } from '../../utils/html';
import { NodeSettingsModal } from '../NodeSettingsModal';
import { CompactNodeSettings } from './CompactNodeSettings';

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
    return (
      <div className={`${depth > 0 ? 'ml-6 mt-2' : ''}`}>
        <div className="border rounded-lg p-3 bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-800">
          <div className="flex items-center gap-3">
            {/* Item Icon */}
            <div className="w-10 h-10 flex-shrink-0 border border-green-200 dark:border-green-700 rounded bg-white dark:bg-gray-800 p-1">
              <img
                src={getItemIconPath(node.itemId!)}
                alt={node.itemName}
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>

            {/* Raw Material Info */}
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-green-800 dark:text-green-300 truncate">{node.itemName}</h4>
              <p className="text-xs text-green-600 dark:text-green-400">
                ⛏️ {parseColorTags(node.miningFrom || '')}
              </p>
            </div>

            {/* Required Rate */}
            <div className="text-right">
              <div className="text-sm font-bold text-green-700 dark:text-green-400">
                {formatRate(node.targetOutputRate)}
              </div>
              <div className="text-xs text-green-600 dark:text-green-500">
                🛤️ {node.conveyorBelts.outputs} {node.conveyorBelts.outputs !== 1 ? t('belts') : t('belt')}
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
    <div className={`${depth > 0 ? 'ml-6 mt-2' : ''}`}>
      {/* Tree Node */}
      <div 
        className={`
          border rounded-lg p-3 bg-white dark:bg-gray-800 relative
          ${isRoot 
            ? isBottleneck 
              ? 'border-red-500 dark:border-red-600 border-2 shadow-md' 
              : 'border-blue-500 dark:border-blue-600 border-2 shadow-md'
            : isBottleneck
              ? 'border-red-400 dark:border-red-600 border-2'
              : 'border-gray-300 dark:border-gray-600'
          }
          hover:shadow-md transition-shadow
        `}
      >


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
        <div className="flex items-center gap-3 mb-2">
          {/* Collapse/Expand Icon */}
          {hasChildren && (
            <div
              className="w-5 h-5 flex-shrink-0 flex items-center justify-center text-gray-500 dark:text-gray-400"
              aria-hidden="true"
            >
              {isCollapsed ? '▶' : '▼'}
            </div>
          )}
          
          {/* Recipe Icon */}
          <div className="w-12 h-12 flex-shrink-0 border border-gray-200 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 p-1">
            <img
              src={getItemIconPath(node.recipe!.Results[0]?.id)}
              alt={node.recipe!.name}
              className="w-full h-full object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>

          {/* Recipe Info */}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-900 dark:text-white truncate">{node.recipe!.name}</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {node.machine!.name} × {formatNumber(node.machineCount)}
            </p>
            {/* Badges */}
            <div className="mt-1 flex flex-wrap items-center gap-1">
              <span
                className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                title={t('machine')}
              >
                🏭 {node.machine?.name}
              </span>
              {node.proliferator.type !== 'none' && (
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                  title={t('proliferator')}
                >
                  🧪 {node.proliferator.type.toUpperCase()} · {node.proliferator.mode === 'production' ? t('production') : t('speed')}
                </span>
              )}
            </div>
          </div>

          {/* Output Rate */}
          <div className="text-right pr-8">
            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {formatRate(node.targetOutputRate)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {formatPower(node.power.total)}
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div id={`node-${nodeId}`} className="grid grid-cols-3 gap-2 text-sm border-t dark:border-gray-700 pt-2 mt-2">
          {/* Inputs */}
          <div>
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('inputs')}</div>
            <div className="space-y-1">
              {node.inputs.map((input) => (
                <div key={input.itemId} className="flex justify-between text-xs">
                  <span className="text-gray-700 dark:text-gray-300 truncate">{input.itemName}</span>
                  <span className="font-medium text-gray-900 dark:text-white ml-2 flex-shrink-0">
                    {formatRate(input.requiredRate)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Power Breakdown */}
          <div>
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('power')}</div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-700 dark:text-gray-300">{t('machines')}:</span>
                <span className="font-medium dark:text-white">{formatPower(node.power.machines)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700 dark:text-gray-300">{t('sorters')}:</span>
                <span className="font-medium dark:text-white">{formatPower(node.power.sorters)}</span>
              </div>
            </div>
          </div>

          {/* Conveyor Belts */}
          <div>
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              🛤️ {t('belts')}
              {node.conveyorBelts.saturation && node.conveyorBelts.saturation > 80 && (
                <span className="ml-1 text-red-500 dark:text-red-400" title={t('bottleneckDetected')}>⚠️</span>
              )}
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-700 dark:text-gray-300">{t('inputs')}:</span>
                <span className={`font-medium ${node.conveyorBelts.bottleneckType === 'input' ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'}`}>
                  {node.conveyorBelts.inputs}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700 dark:text-gray-300">{t('outputs')}:</span>
                <span className={`font-medium ${node.conveyorBelts.bottleneckType === 'output' ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}>
                  {node.conveyorBelts.outputs}
                </span>
              </div>
              <div className="flex justify-between border-t dark:border-gray-700 pt-1">
                <span className="text-gray-700 dark:text-gray-300 font-medium">{t('total')}:</span>
                <span className="font-bold text-gray-900 dark:text-white">{node.conveyorBelts.total}</span>
              </div>
              {node.conveyorBelts.saturation && (
                <div className="flex justify-between pt-1 border-t dark:border-gray-700">
                  <span className="text-gray-700 dark:text-gray-300">{t('saturation')}:</span>
                  <span className={`font-medium ${
                    node.conveyorBelts.saturation > 90 ? 'text-red-600 dark:text-red-400' :
                    node.conveyorBelts.saturation > 80 ? 'text-yellow-600 dark:text-yellow-400' :
                    'text-green-600 dark:text-green-400'
                  }`}>
                    {node.conveyorBelts.saturation.toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Proliferator Info */}
        {node.proliferator.type !== 'none' && (
          <div className="mt-2 pt-2 border-t">
            <div className="text-xs text-purple-600 font-medium">
              🧪 {node.proliferator.type.toUpperCase()} - {node.proliferator.mode === 'production' ? t('production') : t('speed')} {t('boost')}
            </div>
          </div>
        )}
        </div>

        {/* Compact Node Settings - Always visible */}
        {!node.isRawMaterial && (
          <div className="mt-3">
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
          <div className="absolute left-0 top-0 bottom-0 w-px bg-gray-300 ml-3" />
          
          <div className="space-y-2">
            {node.children.map((child, index) => {
              const childNodeId = generateNodeId(child, nodeId, depth + 1);
              return (
                <div key={index} className="relative">
                  {/* Horizontal connector */}
                  <div className="absolute left-3 top-6 w-3 h-px bg-gray-300" />
                  
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
