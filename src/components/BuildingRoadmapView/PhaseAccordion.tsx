import { useTranslation } from "react-i18next";
import type { PhaseInfo } from "../../types/roadmap";
import { useBuildingRoadmapStore } from "../../stores/buildingRoadmapStore";
import { PhaseNode } from "./PhaseNode";
import { ProgressBar } from "./ProgressBar";
import { cn } from "../../utils/classNames";

interface PhaseAccordionProps {
  phase: PhaseInfo;
  isExpanded: boolean;
  onToggle: () => void;
}

export function PhaseAccordion({ phase, isExpanded, onToggle }: PhaseAccordionProps) {
  const { t } = useTranslation();
  const { togglePhaseCompletion } = useBuildingRoadmapStore();

  const handlePhaseToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    togglePhaseCompletion(phase.phaseNumber);
  };

  const progressPercent =
    phase.totalCount > 0 ? Math.round((phase.completedCount / phase.totalCount) * 100) : 0;

  return (
    <div className="border border-neon-blue/20 rounded-lg overflow-hidden">
      {/* Phase Header */}
      <div className="w-full px-4 py-3 bg-dark-800/50 hover:bg-dark-800/70 transition-all flex items-center justify-between">
        <button
          data-testid={`phase-header-${phase.phaseNumber}`}
          onClick={onToggle}
          className="flex items-center gap-3 flex-1 text-left"
        >
          <span className="text-lg">{isExpanded ? "▼" : "▶"}</span>
          <div className="flex-1 text-left">
            <div className="font-semibold text-white">{phase.title}</div>
            <div className="text-sm text-space-300">
              {t("roadmap.progressLabel", {
                completed: phase.completedCount,
                total: phase.totalCount,
              })}
            </div>
          </div>
        </button>
        <div className="flex items-center gap-3">
          <div className="w-32">
            <ProgressBar value={progressPercent} />
          </div>
          <button
            data-testid={`phase-toggle-all-${phase.phaseNumber}`}
            onClick={handlePhaseToggle}
            className={cn(
              "px-3 py-1 text-xs rounded border transition-all",
              phase.isCompleted
                ? "bg-neon-green/20 border-neon-green/40 text-neon-green"
                : "bg-dark-700/50 border-neon-blue/30 text-space-300 hover:border-neon-blue/50"
            )}
          >
            {t("roadmap.toggleAll")}
          </button>
        </div>
      </div>

      {/* Phase Content */}
      {isExpanded && (
        <div className="p-4 bg-dark-900/30 space-y-2">
          {phase.nodes.map(node => (
            <PhaseNode key={node.nodeId} node={node} />
          ))}
        </div>
      )}
    </div>
  );
}
