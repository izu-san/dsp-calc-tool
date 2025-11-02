import { useTranslation } from "react-i18next";
import { useGameDataStore } from "../../stores/gameDataStore";
import type { PlanDiffEntry } from "../../utils/planDiff";
import { formatDiffValue, getPathDisplayName } from "../../utils/planDiff";

interface PlanDiffViewProps {
  diffs: PlanDiffEntry[];
}

export function PlanDiffView({ diffs }: PlanDiffViewProps) {
  const { t } = useTranslation();
  const { data } = useGameDataStore();

  if (diffs.length === 0) {
    return (
      <div className="text-center py-8 text-space-200">
        <p>{t("noChanges")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {diffs.map((diff, index) => (
        <div
          key={`${diff.path}-${index}`}
          className={`
            p-4 rounded-lg border-2 transition-all
            ${
              diff.type === "add"
                ? "bg-green-500/10 border-green-500/30"
                : diff.type === "remove"
                  ? "bg-red-500/10 border-red-500/30"
                  : "bg-yellow-500/10 border-yellow-500/30"
            }
          `}
        >
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div
              className={`
                w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5
                ${
                  diff.type === "add"
                    ? "bg-green-500/20"
                    : diff.type === "remove"
                      ? "bg-red-500/20"
                      : "bg-yellow-500/20"
                }
              `}
            >
              {diff.type === "add" ? (
                <span className="text-green-300 text-sm">+</span>
              ) : diff.type === "remove" ? (
                <span className="text-red-300 text-sm">−</span>
              ) : (
                <span className="text-yellow-300 text-sm">~</span>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-white mb-2">
                {getPathDisplayName(diff.path, t)}
              </div>

              {/* Values */}
              {diff.type === "add" && (
                <div className="text-sm space-y-1">
                  <div className="text-space-200">
                    <span className="text-green-300 font-medium">+</span>{" "}
                    <span className="font-mono text-green-300">
                      {formatDiffValue(diff.after, diff.path, data, t)}
                    </span>
                  </div>
                </div>
              )}

              {diff.type === "remove" && (
                <div className="text-sm space-y-1">
                  <div className="text-space-200">
                    <span className="text-red-300 font-medium">−</span>{" "}
                    <span className="font-mono text-red-300 line-through">
                      {formatDiffValue(diff.before, diff.path, data, t)}
                    </span>
                  </div>
                </div>
              )}

              {diff.type === "change" && (
                <div className="text-sm space-y-1">
                  <div className="text-space-200">
                    <span className="text-red-300 font-medium">−</span>{" "}
                    <span className="font-mono text-red-300 line-through">
                      {formatDiffValue(diff.before, diff.path, data, t)}
                    </span>
                  </div>
                  <div className="text-space-200">
                    <span className="text-green-300 font-medium">+</span>{" "}
                    <span className="font-mono text-green-300">
                      {formatDiffValue(diff.after, diff.path, data, t)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
