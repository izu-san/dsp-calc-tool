import { memo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { RecipeTreeNode } from "../../types";
import { cn } from "../../utils/classNames";
import { formatBuildingCount, formatPower, formatRate } from "../../utils/format";
import { ItemIcon } from "../ItemIcon";
import { NodeSettingsModal } from "../NodeSettingsModal";
import { CompactNodeSettings } from "./CompactNodeSettings";
import { RawMaterialNode } from "./RawMaterialNode";
import {
  TEXT_GLOW,
  ICON_GLOW,
  BADGE_GLOW,
  BORDER_COLOR,
  HOVER_SHADOW,
  NODE_STYLES,
  getSaturationColor,
} from "../../constants/theme";

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
  nodeId = "root",
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
    return <RawMaterialNode node={node} depth={depth} />;
  }

  // Handle regular recipe nodes
  const isBottleneck = node.conveyorBelts.saturation && node.conveyorBelts.saturation > 80;

  return (
    <div className={cn({ "ml-6 mt-2": depth > 0 })} data-testid="production-tree">
      {/* Tree Node */}
      <div
        data-testid={`recipe-node-${node.recipe!.SID}`}
        className={cn(
          "border rounded-lg p-3 bg-dark-700/50 backdrop-blur-sm relative overflow-hidden animate-fadeIn transition-all",
          HOVER_SHADOW,
          {
            [NODE_STYLES.root.bottleneck]: isRoot && isBottleneck,
            [NODE_STYLES.root.normal]: isRoot && !isBottleneck,
            [NODE_STYLES.child.bottleneck]: !isRoot && isBottleneck,
            [NODE_STYLES.child.normal]: !isRoot && !isBottleneck,
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
          aria-label={isCollapsed ? t("expand") : t("collapse")}
          onClick={handleToggle}
          onKeyDown={e => {
            if (e.key === "Enter" || e.key === " ") handleToggle(e);
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
                {isCollapsed ? "▶" : "▼"}
              </div>
            )}

            {/* Recipe Icon */}
            <div
              className={cn(
                "w-10 h-10 flex-shrink-0 border rounded bg-dark-800/50 backdrop-blur-sm p-1",
                BORDER_COLOR.cyan,
                ICON_GLOW.cyan
              )}
            >
              <ItemIcon
                itemId={(() => {
                  // For multi-output recipes, show the target item icon
                  if (node.targetItemId) {
                    return node.targetItemId;
                  }
                  // For explicit recipes, prefer recipe SID over first result
                  if (node.recipe!.Explicit && node.recipe!.SID > 0) {
                    return node.recipe!.SID;
                  }
                  // Fallback to first result or recipe SID
                  return node.recipe!.Results[0]?.id || node.recipe!.SID;
                })()}
                alt={node.recipe!.name}
                size={32}
                preferRecipes={node.recipe!.Explicit && node.recipe!.SID > 0 && !node.targetItemId}
                data-testid={`item-icon-${node.recipe!.SID}`}
              />
            </div>

            {/* Recipe Info */}
            <div className="flex-1 min-w-0">
              <h4 className={cn("font-semibold text-white truncate", TEXT_GLOW.cyan)}>
                {(() => {
                  // For multi-output recipes, show the target item name
                  if (node.targetItemId) {
                    const targetResult = node.recipe!.Results.find(r => r.id === node.targetItemId);
                    if (targetResult) return targetResult.name;
                  }
                  // Fallback to first result or recipe name
                  return node.recipe!.Results[0]?.name || node.recipe!.name;
                })()}
              </h4>
              <p className="text-sm text-space-300">
                <span data-testid={`machine-count-${node.recipe!.SID}`}>
                  {node.machine!.name} × {formatBuildingCount(node.machineCount)}
                </span>
              </p>
              {/* Badges */}
              <div className="mt-1 flex flex-wrap items-center gap-1">
                <span
                  data-testid={`machine-badge-${node.recipe!.SID}`}
                  className={cn(
                    "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-neon-blue/20 text-neon-blue border border-neon-blue/30",
                    BADGE_GLOW.blue
                  )}
                  title={t("machine")}
                >
                  🏭 {node.machine?.name}
                </span>
                {node.proliferator.type !== "none" && (
                  <span
                    data-testid={`proliferator-badge-${node.recipe!.SID}`}
                    className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-neon-magenta/20 text-neon-magenta border border-neon-magenta/30",
                      BADGE_GLOW.purple
                    )}
                    title={t("proliferator")}
                  >
                    🧪 {node.proliferator.type.toUpperCase()} ·{" "}
                    {node.proliferator.mode === "production" ? t("production") : t("speed")}
                  </span>
                )}
              </div>
            </div>

            {/* Output Rate */}
            <div className="text-right pr-8">
              <div
                data-testid={`recipe-output-rate-${node.recipe!.SID}`}
                className={cn("text-lg font-bold text-neon-cyan", TEXT_GLOW.cyan)}
              >
                {formatRate(node.targetOutputRate)}
              </div>
              <div
                data-testid={`recipe-power-${node.recipe!.SID}`}
                className="text-xs text-space-300"
              >
                {formatPower(node.power.total)}
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div
            id={`node-${nodeId}`}
            className="grid grid-cols-3 gap-2 text-sm border-t border-neon-cyan/20 pt-2 mt-2 relative z-10"
          >
            {/* Inputs */}
            <div>
              <div className="text-xs font-medium text-neon-green mb-1">{t("inputs")}</div>
              <div className="space-y-1">
                {node.inputs.map(input => (
                  <div key={input.itemId} className="flex justify-between text-xs">
                    <span className="text-space-200 truncate">{input.itemName}</span>
                    <span
                      data-testid={`recipe-input-rate-${node.recipe!.SID}-${input.itemId}`}
                      className="font-medium text-neon-orange ml-2 flex-shrink-0"
                    >
                      {formatRate(input.requiredRate)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Power Breakdown */}
            <div>
              <div className="text-xs font-medium text-neon-yellow mb-1">{t("power")}</div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-space-200">{t("machines")}:</span>
                  <span
                    data-testid={`recipe-power-machines-${node.recipe!.SID}`}
                    className="font-medium text-white"
                  >
                    {formatPower(node.power.machines)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-space-200">{t("sorters")}:</span>
                  <span
                    data-testid={`recipe-power-sorters-${node.recipe!.SID}`}
                    className="font-medium text-white"
                  >
                    {formatPower(node.power.sorters)}
                  </span>
                </div>
                {node.power.dysonSphere > 0 && (
                  <div className="flex justify-between border-t border-yellow-500/20 pt-1">
                    <span className="text-yellow-400">
                      ⚡ {t("dysonSpherePower").split(" ")[0]}:
                    </span>
                    <span
                      data-testid={`recipe-power-dyson-${node.recipe!.SID}`}
                      className="font-medium text-yellow-400"
                    >
                      {formatPower(node.power.dysonSphere)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Conveyor Belts */}
            <div>
              <div className="text-xs font-medium text-neon-cyan mb-1">🛤️ {t("belts")}</div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-space-200">{t("inputs")}:</span>
                  <span
                    data-testid={`recipe-belts-inputs-${node.recipe!.SID}`}
                    className={cn("font-medium", {
                      "text-neon-orange": node.conveyorBelts.bottleneckType === "input",
                      "text-neon-yellow": node.conveyorBelts.bottleneckType !== "input",
                    })}
                  >
                    {node.conveyorBelts.inputs}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-space-200">{t("outputs")}:</span>
                  <span
                    data-testid={`recipe-belts-outputs-${node.recipe!.SID}`}
                    className={cn("font-medium", {
                      "text-neon-orange": node.conveyorBelts.bottleneckType === "output",
                      "text-neon-blue": node.conveyorBelts.bottleneckType !== "output",
                    })}
                  >
                    {node.conveyorBelts.outputs}
                  </span>
                </div>
                <div className="flex justify-between border-t border-neon-cyan/20 pt-1">
                  <span className="text-space-200 font-medium">{t("total")}:</span>
                  <span
                    data-testid={`recipe-belts-total-${node.recipe!.SID}`}
                    className="font-bold text-white"
                  >
                    {node.conveyorBelts.total}
                  </span>
                </div>
                {node.conveyorBelts.saturation && (
                  <div className="flex justify-between pt-1 border-t border-neon-cyan/20">
                    <span className="text-space-200">{t("saturation")}:</span>
                    <span
                      data-testid={`recipe-belts-saturation-${node.recipe!.SID}`}
                      className="font-medium"
                      style={{
                        color: getSaturationColor(node.conveyorBelts.saturation),
                      }}
                    >
                      {node.conveyorBelts.saturation.toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Proliferator Info */}
          {node.proliferator.type !== "none" && (
            <div className="mt-2 pt-2 border-t border-neon-magenta/20 relative z-10">
              <div className="text-xs text-neon-magenta font-medium">
                🧪 {node.proliferator.type.toUpperCase()} -{" "}
                {node.proliferator.mode === "production" ? t("production") : t("speed")}{" "}
                {t("boost")}
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
      <NodeSettingsModal node={node} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

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
