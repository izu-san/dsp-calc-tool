import type { CalculationResult } from "../../types/calculation";
import type { GameData } from "../../types/game-data";
import type { BuildingRoadmap, PhaseNode } from "../../types/roadmap";
import type { MiningCalculation } from "../miningCalculation";
import { calculatePhases, generatePlanId } from "./phaseCalculation";

/**
 * Generate building roadmap from calculation result
 */
export function generateRoadmap(
  calculationResult: CalculationResult,
  gameData: GameData | null,
  recipeSID: number,
  targetQuantity: number,
  existingCompletions?: Record<string, boolean>,
  miningCalculation?: MiningCalculation
): BuildingRoadmap {
  const phases = calculatePhases(calculationResult.rootNode, gameData, miningCalculation);

  // Apply existing completions if provided
  if (existingCompletions) {
    phases.forEach(phase => {
      phase.nodes.forEach((node: PhaseNode) => {
        if (existingCompletions[node.nodeId]) {
          node.isCompleted = true;
        }
      });
      // Recalculate phase completion
      phase.completedCount = phase.nodes.filter((n: PhaseNode) => n.isCompleted).length;
      phase.isCompleted = phase.completedCount === phase.totalCount && phase.totalCount > 0;
    });
  }

  const planId = generatePlanId(recipeSID, targetQuantity);

  return {
    planId,
    phases,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}
