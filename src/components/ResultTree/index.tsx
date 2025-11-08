import { memo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { RecipeTreeNode } from "../../types";
import { cn } from "../../utils/classNames";
import { NodeSettingsModal } from "../NodeSettingsModal";
import { CompactNodeSettings } from "./CompactNodeSettings";
import { RawMaterialNode } from "./RawMaterialNode";
import { RecipeNodeHeader } from "./RecipeNodeHeader";
import { RecipeNodeBadges } from "./RecipeNodeBadges";
import { RecipeNodeOutput } from "./RecipeNodeOutput";
import { RecipeNodeDetails } from "./RecipeNodeDetails";
import { HOVER_SHADOW, NODE_STYLES } from "../../constants/theme";

interface ProductionTreeProps {
  node: RecipeTreeNode;
  depth?: number;
  collapsedNodes?: Set<string>;
  onToggleCollapse?: (nodeId: string) => void;
}

export const ProductionTree = memo(function ProductionTree({
  node,
  depth = 0,
  collapsedNodes = new Set(),
  onToggleCollapse = () => {},
}: ProductionTreeProps) {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isRoot = depth === 0;
  const hasChildren = node.children.length > 0;
  const nodeId = node.nodeId;
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

        {/* Header */}
        <div className="mb-2 relative z-10">
          <RecipeNodeHeader
            node={node}
            isCollapsed={isCollapsed}
            hasChildren={hasChildren}
            onToggle={handleToggle}
          />

          {/* Badges */}
          <div className="mt-1">
            <RecipeNodeBadges node={node} />
          </div>

          {/* Output Rate */}
          <div className="absolute top-3 right-3">
            <RecipeNodeOutput node={node} />
          </div>
        </div>

        {/* Details Grid */}
        <RecipeNodeDetails node={node} />

        {/* Proliferator Info */}
        {node.proliferator.type !== "none" && (
          <div className="mt-2 pt-2 border-t border-neon-magenta/20 relative z-10">
            <div className="text-xs text-neon-magenta font-medium">
              🧪 {node.proliferator.type.toUpperCase()} -{" "}
              {node.proliferator.mode === "production" ? t("production") : t("speed")} {t("boost")}
            </div>
          </div>
        )}

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
            {node.children.map(child => (
              <div key={child.nodeId} className="relative">
                {/* Horizontal connector */}
                <div className="absolute left-3 top-6 w-3 h-px bg-gradient-to-r from-neon-cyan/60 to-neon-cyan/30" />

                <ProductionTree
                  node={child}
                  depth={depth + 1}
                  collapsedNodes={collapsedNodes}
                  onToggleCollapse={onToggleCollapse}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
