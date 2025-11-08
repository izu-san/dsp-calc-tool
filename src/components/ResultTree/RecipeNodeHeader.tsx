import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { RecipeTreeNode } from "../../types";
import { cn } from "../../utils/classNames";
import { ItemIcon } from "../ItemIcon";
import { TEXT_GLOW, ICON_GLOW, BORDER_COLOR } from "../../constants/theme";

interface RecipeNodeHeaderProps {
  node: RecipeTreeNode;
  isCollapsed: boolean;
  hasChildren: boolean;
  onToggle: (e: React.MouseEvent | React.KeyboardEvent) => void;
}

/**
 * Header section of a recipe node
 */
export function RecipeNodeHeader({
  node,
  isCollapsed,
  hasChildren,
  onToggle,
}: RecipeNodeHeaderProps) {
  const { t } = useTranslation();

  const itemId = useMemo(() => {
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
  }, [node]);

  const itemName = useMemo(() => {
    // For multi-output recipes, show the target item name
    if (node.targetItemId) {
      const targetResult = node.recipe!.Results.find(r => r.id === node.targetItemId);
      if (targetResult) return targetResult.name;
    }
    // Fallback to first result or recipe name
    return node.recipe!.Results[0]?.name || node.recipe!.name;
  }, [node]);

  const preferRecipes = useMemo(
    () => node.recipe!.Explicit && node.recipe!.SID > 0 && !node.targetItemId,
    [node]
  );

  return (
    <div
      role="button"
      tabIndex={0}
      aria-expanded={!isCollapsed}
      aria-controls={`node-${node.nodeId}`}
      aria-label={isCollapsed ? t("expand") : t("collapse")}
      onClick={onToggle}
      onKeyDown={e => {
        if (e.key === "Enter" || e.key === " ") onToggle(e);
      }}
      className="flex items-center gap-3 cursor-pointer"
    >
      {/* Collapse/Expand Icon */}
      {hasChildren && (
        <div
          className="w-5 h-5 flex-shrink-0 flex items-center justify-center text-neon-cyan hover:text-white transition-colors"
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
          itemId={itemId}
          alt={node.recipe!.name}
          size={32}
          preferRecipes={preferRecipes}
          data-testid={`item-icon-${node.recipe!.SID}`}
        />
      </div>

      {/* Recipe Info */}
      <div className="flex-1 min-w-0">
        <h4 className={cn("font-semibold text-white truncate", TEXT_GLOW.cyan)}>{itemName}</h4>
        <p className="text-sm text-space-300">
          <span data-testid={`machine-count-${node.recipe!.SID}`}>
            {node.machine!.name} × {Math.ceil(node.machineCount)}
          </span>
        </p>
      </div>
    </div>
  );
}
