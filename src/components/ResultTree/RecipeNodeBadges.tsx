import { useTranslation } from "react-i18next";
import type { RecipeTreeNode } from "../../types";
import { cn } from "../../utils/classNames";
import { BADGE_GLOW } from "../../constants/theme";

interface RecipeNodeBadgesProps {
  node: RecipeTreeNode;
}

/**
 * Badges section showing machine and proliferator info
 */
export function RecipeNodeBadges({ node }: RecipeNodeBadgesProps) {
  const { t } = useTranslation();

  return (
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
  );
}
