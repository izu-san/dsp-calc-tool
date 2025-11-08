import type { RecipeTreeNode } from "../../types";
import { cn } from "../../utils/classNames";
import { formatRate, formatPower } from "../../utils/format";
import { TEXT_GLOW } from "../../constants/theme";

interface RecipeNodeOutputProps {
  node: RecipeTreeNode;
}

/**
 * Output rate and power display section
 */
export function RecipeNodeOutput({ node }: RecipeNodeOutputProps) {
  return (
    <div className="text-right pr-8">
      <div
        data-testid={`recipe-output-rate-${node.recipe!.SID}`}
        className={cn("text-lg font-bold text-neon-cyan", TEXT_GLOW.cyan)}
      >
        {formatRate(node.targetOutputRate)}
      </div>
      <div data-testid={`recipe-power-${node.recipe!.SID}`} className="text-xs text-space-300">
        {formatPower(node.power.total)}
      </div>
    </div>
  );
}
