import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { CalculationResult } from "../../types/calculation";
import type { MiningCalculation } from "../../lib/miningCalculation";
import { useGameDataStore } from "../../stores/gameDataStore";
import { useRecipeSelectionStore } from "../../stores/recipeSelectionStore";
import { useBuildingRoadmapStore } from "../../stores/buildingRoadmapStore";
import { generateRoadmap } from "../../lib/roadmap/roadmapGeneration";
import { PhaseAccordion } from "./PhaseAccordion";
import { ProgressBar } from "./ProgressBar";

interface BuildingRoadmapViewProps {
  calculationResult: CalculationResult | null;
  miningCalculation?: MiningCalculation | null;
}

export function BuildingRoadmapView({
  calculationResult,
  miningCalculation,
}: BuildingRoadmapViewProps) {
  const { t } = useTranslation();
  const { data } = useGameDataStore();
  const { selectedRecipe, targetQuantity } = useRecipeSelectionStore();
  const {
    currentRoadmap,
    generateRoadmap: generateRoadmapStore,
    resetAllCompletions,
    loadFromPlan,
    saveToPlan,
  } = useBuildingRoadmapStore();

  const [expandedPhases, setExpandedPhases] = useState<Set<number>>(new Set([1]));

  // Generate roadmap when calculation result changes
  useEffect(() => {
    if (!calculationResult || !selectedRecipe) return;

    const planId = `${selectedRecipe.SID}-${targetQuantity}`;
    const existingCompletions = loadFromPlan(planId);
    const roadmap = generateRoadmap(
      calculationResult,
      data,
      selectedRecipe.SID,
      targetQuantity,
      existingCompletions || undefined,
      miningCalculation || undefined
    );
    generateRoadmapStore(roadmap, existingCompletions || undefined);
  }, [
    calculationResult,
    selectedRecipe,
    targetQuantity,
    data,
    generateRoadmapStore,
    loadFromPlan,
    miningCalculation,
  ]);

  // Save completions when roadmap changes (debounced)
  useEffect(() => {
    if (!currentRoadmap || !selectedRecipe) return;
    const planId = `${selectedRecipe.SID}-${targetQuantity}`;
    const timeoutId = setTimeout(() => {
      saveToPlan(planId);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [currentRoadmap, selectedRecipe, targetQuantity, saveToPlan]);

  // Calculate overall progress
  const overallProgress = useMemo(() => {
    if (!currentRoadmap) return 0;
    const totalNodes = currentRoadmap.phases.reduce((sum, phase) => sum + phase.totalCount, 0);
    const completedNodes = currentRoadmap.phases.reduce(
      (sum, phase) => sum + phase.completedCount,
      0
    );
    return totalNodes > 0 ? Math.round((completedNodes / totalNodes) * 100) : 0;
  }, [currentRoadmap]);

  const handleTogglePhase = (phaseNumber: number) => {
    setExpandedPhases(prev => {
      const newSet = new Set(prev);
      if (newSet.has(phaseNumber)) {
        newSet.delete(phaseNumber);
      } else {
        newSet.add(phaseNumber);
      }
      return newSet;
    });
  };

  const handleReset = () => {
    if (window.confirm(t("roadmap.resetConfirmMessage"))) {
      resetAllCompletions();
    }
  };

  if (!calculationResult || !currentRoadmap) {
    return (
      <div className="bg-dark-700/50 backdrop-blur-sm border border-neon-blue/30 rounded-lg shadow-panel p-6">
        <h2 className="text-lg font-semibold text-white mb-4">{t("roadmap.title")}</h2>
        <p className="text-sm text-space-300">{t("roadmap.selectRecipeFirst")}</p>
      </div>
    );
  }

  return (
    <div className="bg-dark-700/50 backdrop-blur-sm border border-neon-blue/30 rounded-lg shadow-panel p-6">
      <h2 className="text-lg font-semibold text-white mb-4">{t("roadmap.title")}</h2>

      {/* Overall Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-neon-cyan">
            {t("roadmap.overallProgress", { percent: overallProgress })}
          </span>
        </div>
        <ProgressBar value={overallProgress} />
      </div>

      {/* Phases */}
      <div className="space-y-2 mb-6">
        {currentRoadmap.phases.map(phase => (
          <PhaseAccordion
            key={phase.phaseNumber}
            phase={phase}
            isExpanded={expandedPhases.has(phase.phaseNumber)}
            onToggle={() => handleTogglePhase(phase.phaseNumber)}
          />
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleReset}
          className="px-4 py-2 text-sm font-medium rounded-lg border border-neon-red/30 text-neon-red hover:bg-neon-red/10 transition-all"
        >
          {t("roadmap.resetAll")}
        </button>
      </div>
    </div>
  );
}
