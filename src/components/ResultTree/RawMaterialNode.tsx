/**
 * Raw Material Node Component
 * 原材料ノードを表示するコンポーネント
 */

import { useTranslation } from "react-i18next";
import { NODE_STYLES, BADGE_GLOW, TEXT_GLOW, getSaturationColor } from "../../constants/theme";
import type { RecipeTreeNode } from "../../types";
import { cn } from "../../utils/classNames";
import { formatBuildingCount, formatPower, formatRate } from "../../utils/format";
import { parseColorTags } from "../../utils/html";
import { ItemIcon } from "../ItemIcon";

interface RawMaterialNodeProps {
  node: RecipeTreeNode;
  depth: number;
}

export function RawMaterialNode({ node, depth }: RawMaterialNodeProps) {
  const { t } = useTranslation();

  // Determine if this is a circular dependency
  const isCircular = node.isCircularDependency;
  // For circular dependencies, always show the item (not the recipe)
  // because we want to display which item needs external supply
  const itemId = node.itemId!;
  const displayName = node.itemName;

  return (
    <div className={cn({ "ml-6 mt-2": depth > 0 })} data-testid="production-tree">
      <div
        data-testid={`raw-material-node-${itemId}`}
        className={cn(
          "border rounded-lg p-3 backdrop-blur-sm relative overflow-hidden animate-fadeIn hover:shadow-[0_0_20px_rgba(0,217,255,0.3)] transition-all",
          isCircular ? NODE_STYLES.rawMaterial.circular : NODE_STYLES.rawMaterial.normal
        )}
      >
        {/* Data stream effect */}
        <div className="absolute inset-0 data-stream opacity-20 pointer-events-none"></div>

        {/* Header */}
        <div className="flex items-center gap-3 mb-2 relative z-10">
          {/* Raw Material Icon */}
          <div
            className={cn(
              "w-10 h-10 flex-shrink-0 border rounded bg-dark-800/50 backdrop-blur-sm p-1",
              {
                "border-neon-purple/50": isCircular,
                "border-neon-green/50": !isCircular,
              }
            )}
          >
            <ItemIcon itemId={itemId} alt={displayName} size={32} className="w-full h-full" />
          </div>

          {/* Name and Badge */}
          <div className="flex-1 min-w-0">
            <h4
              className={cn(
                "font-semibold text-white truncate",
                isCircular ? TEXT_GLOW.purple : TEXT_GLOW.green
              )}
            >
              {displayName}
            </h4>
            {/* Mining Equipment Info */}
            {!isCircular && node.miningEquipment && (
              <p className="text-sm text-space-300">
                <span data-testid={`mining-equipment-count-${itemId}`}>
                  {node.miningEquipment.machineName} ×{" "}
                  {formatBuildingCount(node.miningEquipment.machineCount)}
                </span>
              </p>
            )}
            {/* Badges */}
            <div className="mt-1 flex flex-wrap items-center gap-1">
              {!isCircular && node.miningEquipment && (
                <span
                  data-testid={`mining-equipment-badge-${itemId}`}
                  className={cn(
                    "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30",
                    BADGE_GLOW.cyan
                  )}
                  title={t("miningEquipment")}
                >
                  🏭 {node.miningEquipment.machineName}
                </span>
              )}
            </div>
          </div>

          {/* Output Rate */}
          <div className="text-right pr-8">
            <div
              data-testid={`raw-material-output-rate-${itemId}`}
              className={cn(
                "text-lg font-bold",
                isCircular
                  ? cn("text-neon-purple", TEXT_GLOW.purple)
                  : cn("text-neon-green", TEXT_GLOW.green)
              )}
            >
              {formatRate(node.targetOutputRate)}
            </div>
            <div data-testid={`raw-material-power-${itemId}`} className="text-xs text-space-300">
              {!isCircular && node.miningEquipment
                ? formatPower(node.miningEquipment.powerConsumption)
                : "0 kW"}
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-3 gap-2 text-sm border-t border-neon-cyan/20 pt-2 mt-2 relative z-10">
          {/* Mining Source */}
          <div>
            <div className="text-xs font-medium text-neon-green mb-1">{t("source")}</div>
            <div className="space-y-1">
              <div className="text-xs text-space-200">
                {isCircular ? "🔄 " : "⛏️ "}
                {node.miningFrom === "externalSupplyCircular"
                  ? t("externalSupplyCircular")
                  : parseColorTags(node.miningFrom || "")}
              </div>
            </div>
          </div>

          {/* Power Breakdown */}
          <div>
            <div className="text-xs font-medium text-neon-yellow mb-1">{t("power")}</div>
            <div className="space-y-1 text-xs">
              {!isCircular && node.miningEquipment ? (
                <div className="flex justify-between">
                  <span className="text-space-200">{t("mining")}:</span>
                  <span className="font-medium text-white">
                    {formatPower(node.miningEquipment.powerConsumption)}
                  </span>
                </div>
              ) : (
                <div className="flex justify-between">
                  <span className="text-space-200">{t("external")}:</span>
                  <span className="font-medium text-white">0 kW</span>
                </div>
              )}
            </div>
          </div>

          {/* Conveyor Belts */}
          <div>
            <div className="text-xs font-medium text-neon-cyan mb-1">🛤️ {t("belts")}</div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-space-200">{t("outputs")}:</span>
                <span
                  data-testid={`raw-material-belts-outputs-${itemId}`}
                  className="font-medium text-neon-blue"
                >
                  {node.conveyorBelts.outputs}
                </span>
              </div>
              <div className="flex justify-between border-t border-neon-cyan/20 pt-1">
                <span className="text-space-200 font-medium">{t("total")}:</span>
                <span
                  data-testid={`raw-material-belts-total-${itemId}`}
                  className="font-bold text-white"
                >
                  {node.conveyorBelts.total}
                </span>
              </div>
              {node.conveyorBelts.saturation && (
                <div className="flex justify-between pt-1 border-t border-neon-cyan/20">
                  <span className="text-space-200">{t("saturation")}:</span>
                  <span
                    data-testid={`raw-material-belts-saturation-${itemId}`}
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
      </div>
    </div>
  );
}
