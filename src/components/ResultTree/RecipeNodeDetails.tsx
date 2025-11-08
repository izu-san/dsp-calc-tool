import { useTranslation } from "react-i18next";
import type { RecipeTreeNode } from "../../types";
import { cn } from "../../utils/classNames";
import { formatRate, formatPower } from "../../utils/format";
import { getSaturationColor } from "../../constants/theme";

interface RecipeNodeDetailsProps {
  node: RecipeTreeNode;
}

/**
 * Details grid showing inputs, power breakdown, and conveyor belts
 */
export function RecipeNodeDetails({ node }: RecipeNodeDetailsProps) {
  const { t } = useTranslation();

  return (
    <div
      id={`node-${node.nodeId}`}
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
              <span className="text-yellow-400">⚡ {t("dysonSpherePower").split(" ")[0]}:</span>
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
  );
}
