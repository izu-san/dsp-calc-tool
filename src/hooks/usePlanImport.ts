/**
 * Plan Import Hook
 * Manages import operations and messages
 */

import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import type { SavedPlan } from "../../types";
import type { GameData } from "../../types/game-data";
import type { GlobalSettings } from "../../types/settings";
import { importPlanFromFile } from "../services/plan-management/planImportService";
import {
  loadPlanFromStorage,
  getRecentPlans,
  deletePlanFromStorage,
} from "../services/plan-management/planStorageService";
import { loadPlanWithHistory } from "../services/plan-management/planLoadService";
import type { PlanRestorationCallbacks } from "../services/plan-management/planRestorationService";
import type { ImportResult } from "../services/plan-management/types";

export interface UsePlanImportParams {
  gameData: GameData | null;
  currentSettings: GlobalSettings;
  callbacks?: PlanRestorationCallbacks;
  mergeOverrides?: boolean;
  currentOverrides?: Map<string, unknown>;
  onImportSuccess?: () => void;
}

export function usePlanImport(params: UsePlanImportParams) {
  const { t } = useTranslation();
  const [importSuccessMessage, setImportSuccessMessage] = useState<string>("");
  const [importErrorMessage, setImportErrorMessage] = useState<string>("");
  const [recentPlans, setRecentPlans] = useState(() => getRecentPlans());

  const clearMessages = useCallback(() => {
    setImportSuccessMessage("");
    setImportErrorMessage("");
  }, []);

  const handleImportFile = useCallback(
    async (file: File): Promise<ImportResult & { plan?: SavedPlan }> => {
      if (!file) {
        return {
          success: false,
          error: "No file provided",
        };
      }

      if (!params.gameData) {
        setImportErrorMessage(t("gameDataNotLoaded"));
        return {
          success: false,
          error: t("gameDataNotLoaded"),
        };
      }

      clearMessages();

      const result = await importPlanFromFile({
        file,
        gameData: params.gameData,
        currentSettings: params.currentSettings,
      });

      if (result.success && result.plan) {
        // Validate recipe exists
        const recipe = params.gameData.recipes.get(result.plan.recipeSID);
        if (!recipe) {
          setImportErrorMessage(`${t("recipeNotFound")}: ${result.plan.recipeSID}`);
          return {
            success: false,
            error: `${t("recipeNotFound")}: ${result.plan.recipeSID}`,
          };
        }

        // Restore plan if callbacks provided
        if (params.callbacks) {
          try {
            loadPlanWithHistory({
              plan: result.plan,
              recipe,
              callbacks: params.callbacks,
              mergeOverrides: params.mergeOverrides,
              currentOverrides: params.currentOverrides,
              historyDescription: t("planLoadedFromFile", { fileName: file.name }),
              historyMetadata: { fileName: file.name },
            });

            setImportSuccessMessage(`${t("planLoaded", { name: result.plan.name })}`);
            params.onImportSuccess?.();
          } catch (error) {
            setImportErrorMessage(`${t("loadError")}: ${error}`);
            return {
              success: false,
              error: error instanceof Error ? error.message : String(error),
            };
          }
        } else {
          setImportSuccessMessage(`${t("planLoaded", { name: result.plan.name })}`);
        }
      } else {
        setImportErrorMessage(`${t("importError")}: ${result.error || "Unknown error"}`);
      }

      return result;
    },
    [params, t, clearMessages]
  );

  const handleLoadFromStorage = useCallback(
    (key: string) => {
      if (!params.gameData) {
        alert(t("gameDataNotLoaded"));
        return;
      }

      const plan = loadPlanFromStorage(key);
      if (!plan) {
        alert(t("planNotFound"));
        return;
      }

      const recipe = params.gameData.recipes.get(plan.recipeSID);
      if (!recipe) {
        alert(`${t("recipeNotFound")}: ${plan.recipeSID}`);
        return;
      }

      if (!params.callbacks) {
        alert(t("planNotFound"));
        return;
      }

      try {
        loadPlanWithHistory({
          plan,
          recipe,
          callbacks: params.callbacks,
          mergeOverrides: params.mergeOverrides,
          currentOverrides: params.currentOverrides,
        });

        alert(`${t("planLoaded", { name: plan.name })}`);
        params.onImportSuccess?.();
      } catch (error) {
        alert(`${t("loadError")}: ${error}`);
      }
    },
    [params, t]
  );

  const handleDeletePlan = useCallback(
    (key: string) => {
      if (confirm(t("confirmDeletePlan"))) {
        deletePlanFromStorage(key);
        setRecentPlans(getRecentPlans());
      }
    },
    [t]
  );

  return {
    importSuccessMessage,
    importErrorMessage,
    recentPlans,
    handleImportFile,
    handleLoadFromStorage,
    handleDeletePlan,
    clearMessages,
    refreshRecentPlans: () => setRecentPlans(getRecentPlans()),
    setImportSuccessMessage,
    setImportErrorMessage,
  };
}
