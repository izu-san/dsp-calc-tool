/**
 * Plan Export Hook
 * Manages export operations and messages
 */

import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import type {
  CalculationResult,
  Recipe,
  GlobalSettings,
  ProliferatorConfig,
  PowerGeneratorType,
  GameTemplate,
} from "../types";
import {
  exportPlan,
  exportPlanToImage,
  type PlanExportParams,
  type PlanImageExportParams,
} from "../services/plan-management/planExportService";
import type { ImageExportOptions } from "../types/export";

export interface UsePlanExportParams {
  selectedRecipe: Recipe | null;
  calculationResult: CalculationResult | null;
  targetQuantity: number;
  settings: GlobalSettings;
  powerGenerationTemplate: GameTemplate;
  manualPowerGenerator: PowerGeneratorType | null;
  manualPowerFuel: string | null;
  powerFuelProliferator: ProliferatorConfig;
  items: Map<number, { name: string }>;
}

export function usePlanExport(params: UsePlanExportParams) {
  const { t } = useTranslation();
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string>("");
  const [exportErrorMessage, setExportErrorMessage] = useState<string>("");

  const clearMessages = useCallback(() => {
    setExportSuccessMessage("");
    setExportErrorMessage("");
  }, []);

  const handleExport = useCallback(
    async (format: "json" | "markdown" | "csv" | "excel", planName: string) => {
      if (!params.selectedRecipe) {
        alert(t("pleaseSelectRecipe"));
        return;
      }

      if (!params.calculationResult) {
        alert(t("pleaseCalculateFirst"));
        return;
      }

      clearMessages();

      const exportParams: PlanExportParams = {
        calculationResult: params.calculationResult,
        selectedRecipe: params.selectedRecipe,
        targetQuantity: params.targetQuantity,
        settings: params.settings,
        planName,
        powerGenerationSettings: {
          template: params.powerGenerationTemplate,
          manualGenerator: params.manualPowerGenerator,
          manualFuel: params.manualPowerFuel,
          powerFuelProliferator: params.powerFuelProliferator,
        },
        items: params.items,
      };

      const result = await exportPlan(format, exportParams);

      if (result.success) {
        setExportSuccessMessage(t("exported"));
      } else {
        setExportErrorMessage(`${t("exportError")}: ${result.error || "Unknown error"}`);
      }
    },
    [params, t, clearMessages]
  );

  const handleImageExport = useCallback(
    async (planName: string, options: ImageExportOptions) => {
      if (!params.selectedRecipe) {
        alert(t("pleaseSelectRecipe"));
        return;
      }

      if (!params.calculationResult) {
        alert(t("pleaseCalculateFirst"));
        return;
      }

      clearMessages();

      const exportParams: PlanImageExportParams = {
        calculationResult: params.calculationResult,
        selectedRecipe: params.selectedRecipe,
        targetQuantity: params.targetQuantity,
        settings: params.settings,
        planName,
        powerGenerationSettings: {
          template: params.powerGenerationTemplate,
          manualGenerator: params.manualPowerGenerator,
          manualFuel: params.manualPowerFuel,
          powerFuelProliferator: params.powerFuelProliferator,
        },
        items: params.items,
        options,
      };

      const result = await exportPlanToImage(exportParams);

      if (result.success) {
        setExportSuccessMessage(t("exported"));
      } else {
        setExportErrorMessage(`${t("exportError")}: ${result.error || "Unknown error"}`);
      }
    },
    [params, t, clearMessages]
  );

  return {
    exportSuccessMessage,
    exportErrorMessage,
    handleExport,
    handleImageExport,
    clearMessages,
    setExportSuccessMessage,
    setExportErrorMessage,
  };
}
