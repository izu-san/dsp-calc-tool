import { useTranslation } from "react-i18next";
import type { RecipeTreeNode } from "../../types";
import { cn } from "../../utils/classNames";
import { formatNumber, formatPower, formatRate } from "../../utils/format";
import { getSaturationColor } from "../../constants/theme";
import { ItemIcon } from "../ItemIcon";

interface RecipeNodeDetailsProps {
  node: RecipeTreeNode;
}

interface ItemRowProps {
  itemId: number;
  name: string;
  value: string;
  valueClassName: string;
  testId?: string;
}

function ItemRow({ itemId, name, value, valueClassName, testId }: ItemRowProps) {
  return (
    <div className="flex items-center justify-between text-xs gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <ItemIcon itemId={itemId} alt={name} size={16} className="flex-shrink-0" />
        <span className="text-space-200 truncate">{name}</span>
      </div>
      <span data-testid={testId} className={cn("font-medium ml-2 flex-shrink-0", valueClassName)}>
        {value}
      </span>
    </div>
  );
}

/**
 * Details grid showing inputs, power breakdown, and conveyor belts
 */
export function RecipeNodeDetails({ node }: RecipeNodeDetailsProps) {
  const { t } = useTranslation();
  const recipeTimeSeconds = node.recipe ? node.recipe.TimeSpend / 60 : 0;

  return (
    <div
      id={`node-${node.nodeId}`}
      className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2 text-sm border-t border-neon-cyan/20 pt-2 mt-2 relative z-10"
    >
      {/* Recipe Definition */}
      <div>
        <div className="text-xs font-medium text-neon-cyan mb-1">{t("recipe")}</div>
        <div className="space-y-2 text-xs">
          <div>
            <div className="text-space-300 mb-1">{t("inputItems")}</div>
            <div className="space-y-1">
              {node.recipe?.Items.length ? (
                node.recipe.Items.map(item => (
                  <ItemRow
                    key={`recipe-input-${node.recipe!.SID}-${item.id}`}
                    itemId={item.id}
                    name={item.name}
                    value={`x${Math.trunc(item.count)}`}
                    valueClassName="text-neon-green"
                    testId={`recipe-input-item-${node.recipe!.SID}-${item.id}`}
                  />
                ))
              ) : (
                <div className="text-space-400">{t("noInputsRequired")}</div>
              )}
            </div>
          </div>

          <div className="border-t border-neon-cyan/20 pt-2">
            <div className="text-space-300 mb-1">{t("outputItems")}</div>
            <div className="space-y-1">
              {node.recipe?.Results.map(item => (
                <ItemRow
                  key={`recipe-output-${node.recipe!.SID}-${item.id}`}
                  itemId={item.id}
                  name={item.name}
                  value={`x${Math.trunc(item.count)}`}
                  valueClassName="text-neon-blue"
                  testId={`recipe-output-item-${node.recipe!.SID}-${item.id}`}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-between border-t border-neon-cyan/20 pt-2">
            <span className="text-space-300">{t("time")}:</span>
            <span
              data-testid={`recipe-time-${node.recipe!.SID}`}
              className="font-medium text-white"
            >
              {formatNumber(recipeTimeSeconds)}s
            </span>
          </div>
        </div>
      </div>

      {/* Inputs */}
      <div>
        <div className="text-xs font-medium text-neon-green mb-1">{t("inputs")}</div>
        <div className="space-y-1">
          {node.inputs.map(input => (
            <ItemRow
              key={input.itemId}
              itemId={input.itemId}
              name={input.itemName}
              value={formatRate(input.requiredRate)}
              valueClassName="text-neon-orange"
              testId={`recipe-input-rate-${node.recipe!.SID}-${input.itemId}`}
            />
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
