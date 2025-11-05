import { useTranslation } from "react-i18next";
import { useBuildingRoadmapStore } from "../../stores/buildingRoadmapStore";
import type { PhaseNode } from "../../types/roadmap";
import { cn } from "../../utils/classNames";
import { formatBuildingCount, formatNumber } from "../../utils/format";
import { ItemIcon } from "../ItemIcon";

interface PhaseNodeProps {
  node: PhaseNode;
}

export function PhaseNode({ node }: PhaseNodeProps) {
  const { t } = useTranslation();
  const { toggleNodeCompletion } = useBuildingRoadmapStore();

  const handleClick = () => {
    toggleNodeCompletion(node.nodeId);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      toggleNodeCompletion(node.nodeId);
    }
  };

  return (
    <div
      data-testid={`phase-node-${node.nodeId}`}
      data-item-id={node.itemId}
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer",
        node.isCompleted
          ? "bg-neon-green/10 border-neon-green/30"
          : "bg-dark-700/50 border-neon-blue/20 hover:border-neon-blue/40 hover:bg-dark-700/70"
      )}
    >
      {/* Checkbox */}
      <div className="text-xl">{node.isCompleted ? "☑" : "☐"}</div>

      {/* Item Icon */}
      <ItemIcon itemId={node.itemId} size={32} />

      {/* Content */}
      <div className="flex-1">
        <div className="font-medium text-white">{node.itemName}</div>
        <div className="text-sm font-semibold text-neon-cyan mt-1">
          {node.machineType} ×{formatBuildingCount(node.machineCount)}
        </div>
        {node.isMiningNode && node.requiredRate !== undefined && (
          <div className="text-xs text-neon-green mt-1">
            {t("roadmap.miningRate", { rate: formatNumber(node.requiredRate) })}
          </div>
        )}
      </div>
    </div>
  );
}
