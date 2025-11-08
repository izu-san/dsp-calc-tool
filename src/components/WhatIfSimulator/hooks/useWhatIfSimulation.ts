import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { calculateProductionChain } from "../../../lib/calculator";
import { useGameDataStore } from "../../../stores/gameDataStore";
import { useMiningSettingsStore } from "../../../stores/miningSettingsStore";
import { useNodeOverrideStore } from "../../../stores/nodeOverrideStore";
import { useRecipeSelectionStore } from "../../../stores/recipeSelectionStore";
import { useSettingsStore } from "../../../stores/settingsStore";
import type { RecipeTreeNode } from "../../../types";
import type { BottleneckSuggestion, Scenario, ScenarioResult } from "../types";

/**
 * WhatIfシミュレーションのロジックを管理するカスタムフック
 */
export function useWhatIfSimulation() {
  const { t } = useTranslation();
  const { data } = useGameDataStore();
  const { selectedRecipe, targetQuantity } = useRecipeSelectionStore();
  const { settings } = useSettingsStore();
  const { nodeOverrides } = useNodeOverrideStore();
  const { settings: miningSettings } = useMiningSettingsStore();

  /**
   * ツリーから総ベルト数を再帰的にカウント
   */
  const countTotalBelts = useCallback((node: RecipeTreeNode): number => {
    const count = (n: RecipeTreeNode): number => {
      let total = n.conveyorBelts?.total || 0;
      if (n.children) {
        for (const child of n.children) {
          total += count(child);
        }
      }
      return total;
    };
    return count(node);
  }, []);

  /**
   * シナリオが既に適用されているかチェック
   */
  const isScenarioAlreadyApplied = useCallback(
    (scenario: Scenario): boolean => {
      const scenarioSettings = scenario.settings;

      // Check proliferator
      if (scenarioSettings.proliferator) {
        if (settings.proliferator.type !== scenarioSettings.proliferator.type) {
          return false;
        }
        if (
          typeof scenarioSettings.proliferator.mode !== "undefined" &&
          settings.proliferator.mode !== scenarioSettings.proliferator.mode
        ) {
          return false;
        }
      }

      // Check conveyor belt
      if (scenarioSettings.conveyorBelt) {
        if (
          scenarioSettings.conveyorBelt.tier &&
          settings.conveyorBelt.tier !== scenarioSettings.conveyorBelt.tier
        ) {
          return false;
        }
        if (
          scenarioSettings.conveyorBelt.stackCount !== undefined &&
          settings.conveyorBelt.stackCount !== scenarioSettings.conveyorBelt.stackCount
        ) {
          return false;
        }
      }

      // Check machine ranks with rank ordering (current >= scenario requirement)
      if (scenarioSettings.machineRank) {
        const assembleOrder = ["mk1", "mk2", "mk3", "recomposing"] as const;
        const smeltOrder = ["arc", "plane", "negentropy"] as const;
        const chemicalOrder = ["standard", "quantum"] as const;
        const researchOrder = ["standard", "self-evolution"] as const;

        const isAtLeast = (current: string, required: string, order: readonly string[]) => {
          const ci = order.indexOf(current);
          const ri = order.indexOf(required);
          return ci !== -1 && ri !== -1 && ci >= ri;
        };

        for (const [type, rank] of Object.entries(scenarioSettings.machineRank)) {
          if (!(type in settings.machineRank)) continue;

          const currentRank = settings.machineRank[type as keyof typeof settings.machineRank];

          if (typeof rank !== "string" || typeof currentRank !== "string") continue;

          switch (type) {
            case "Assemble":
              if (!isAtLeast(currentRank, rank, assembleOrder)) return false;
              break;
            case "Smelt":
              if (!isAtLeast(currentRank, rank, smeltOrder)) return false;
              break;
            case "Chemical":
              if (!isAtLeast(currentRank, rank, chemicalOrder)) return false;
              break;
            case "Research":
              if (!isAtLeast(currentRank, rank, researchOrder)) return false;
              break;
            default:
              if (currentRank !== rank) return false;
          }
        }
      }

      return true;
    },
    [settings]
  );

  /**
   * シナリオ定義
   */
  const scenarios: Scenario[] = useMemo(
    () => [
      {
        id: "proliferator_mk3",
        name: t("upgradeToMk3Proliferator"),
        description: t("upgradeToMk3ProliferatorDesc"),
        isBottleneckFix: true,
        settings: {
          proliferator: {
            type: "mk3",
            mode: settings.proliferator.mode,
            productionBonus: 0.25,
            speedBonus: 1.0,
            powerIncrease: 1.5,
          },
        },
      },
      {
        id: "belt_mk3",
        name: t("upgradeToMk3Belt"),
        description: t("upgradeToMk3BeltDesc"),
        isBottleneckFix: true,
        settings: {
          conveyorBelt: {
            tier: "mk3",
            speed: 30,
            stackCount: settings.conveyorBelt.stackCount,
          },
        },
      },
      {
        id: "stack_4",
        name: t("increaseBeltStack"),
        description: t("increaseBeltStackDesc"),
        isBottleneckFix: true,
        settings: {
          conveyorBelt: {
            ...settings.conveyorBelt,
            stackCount: 4,
          },
        },
      },
      {
        id: "quantum_chemical",
        name: t("upgradeToQuantumChemical"),
        description: t("upgradeToQuantumChemicalDesc"),
        settings: {
          machineRank: {
            ...settings.machineRank,
            Chemical: "quantum",
          },
        },
      },
      {
        id: "assembler_mk3",
        name: t("upgradeToAssemblerMk3"),
        description: t("upgradeToAssemblerMk3Desc"),
        settings: {
          machineRank: {
            ...settings.machineRank,
            Assemble: "mk3",
          },
        },
      },
      {
        id: "assembler_recomposing",
        name: t("upgradeToRecomposingAssembler"),
        description: t("upgradeToRecomposingAssemblerDesc"),
        settings: {
          machineRank: {
            ...settings.machineRank,
            Assemble: "recomposing",
          },
        },
      },
      {
        id: "production_mode",
        name: t("switchToProductionMode"),
        description: t("switchToProductionModeDesc"),
        settings: {
          proliferator: {
            ...settings.proliferator,
            mode: "production",
          },
        },
      },
      {
        id: "speed_mode",
        name: t("switchToSpeedMode"),
        description: t("switchToSpeedModeDesc"),
        settings: {
          proliferator: {
            ...settings.proliferator,
            mode: "speed",
          },
        },
      },
    ],
    [t, settings.proliferator, settings.conveyorBelt, settings.machineRank]
  );

  /**
   * 各シナリオの計算結果
   */
  const results = useMemo(() => {
    if (!selectedRecipe || !data || targetQuantity <= 0) {
      return { baseResult: null, scenarioResults: [] };
    }

    const baseResult = calculateProductionChain(
      selectedRecipe,
      targetQuantity,
      data,
      settings,
      nodeOverrides,
      miningSettings
    );

    const scenarioResults: ScenarioResult[] = scenarios.map(scenario => {
      const modifiedSettings = { ...settings, ...scenario.settings };
      const result = calculateProductionChain(
        selectedRecipe,
        targetQuantity,
        data,
        modifiedSettings,
        nodeOverrides,
        miningSettings
      );

      // Calculate differences
      const powerDiff = result.totalPower.total - baseResult.totalPower.total;
      const machineDiff = result.totalMachines - baseResult.totalMachines;

      // Calculate belt changes
      const baseBelts = countTotalBelts(baseResult.rootNode);
      const scenarioBelts = countTotalBelts(result.rootNode);
      const beltDiff = scenarioBelts - baseBelts;

      return {
        scenario,
        result,
        baseResult,
        diff: {
          power: powerDiff,
          powerPercent:
            baseResult.totalPower.total > 0 ? (powerDiff / baseResult.totalPower.total) * 100 : 0,
          machines: machineDiff,
          machinePercent:
            baseResult.totalMachines > 0 ? (machineDiff / baseResult.totalMachines) * 100 : 0,
          belts: beltDiff,
          beltPercent: baseBelts > 0 ? (beltDiff / baseBelts) * 100 : 0,
        },
      };
    });

    return { baseResult, scenarioResults };
  }, [
    data,
    selectedRecipe,
    targetQuantity,
    settings,
    nodeOverrides,
    scenarios,
    countTotalBelts,
    miningSettings,
  ]);

  /**
   * ボトルネック検出
   */
  const bottleneckSuggestions = useMemo((): BottleneckSuggestion[] => {
    if (!results.baseResult) return [];

    const suggestions: BottleneckSuggestion[] = [];

    // Check for overall inefficiency - only if proliferator upgrade would help
    if (settings.proliferator.type !== "mk3") {
      suggestions.push({
        issue: t("notUsingMk3Proliferator"),
        severity: "low",
        suggestion: t("upgradeToMk3ProliferatorSuggestion"),
        scenarioId: "proliferator_mk3",
      });
    }

    return suggestions;
  }, [results.baseResult, settings, t]);

  return {
    data,
    selectedRecipe,
    scenarios,
    results,
    bottleneckSuggestions,
    countTotalBelts,
    isScenarioAlreadyApplied,
  };
}
