import { useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { usePlanExport } from "../../hooks/usePlanExport";
import { usePlanImport } from "../../hooks/usePlanImport";
import { usePlanManagerDialogs } from "../../hooks/usePlanManagerDialogs";
import { loadPlanWithHistory } from "../../services/plan-management/planLoadService";
import {
  createPlanFromState,
  getDefaultPlanName,
  savePlanWithVersion,
} from "../../services/plan-management/planSaveService";
import { getRecentPlans } from "../../services/plan-management/planStorageService";
import { useGameDataStore } from "../../stores/gameDataStore";
import { useHistoryStore } from "../../stores/historyStore";
import { useNodeOverrideStore } from "../../stores/nodeOverrideStore";
import { useRecipeSelectionStore } from "../../stores/recipeSelectionStore";
import { useSettingsStore } from "../../stores/settingsStore";
import type { Recipe, SavedPlan } from "../../types";
import type { ImageExportOptions } from "../../types/export";
import { calculatePlanDiff } from "../../utils/planDiff";
import { copyToClipboard, generateShareURL } from "../../utils/urlShare";
import { PlanDiffView } from "../PlanDiffView";

export function PlanManager() {
  const { t } = useTranslation();
  const { data } = useGameDataStore();
  const {
    selectedRecipe,
    targetQuantity,
    calculationResult,
    setSelectedRecipe,
    setTargetQuantity,
  } = useRecipeSelectionStore();
  const {
    settings,
    updateSettings,
    powerGenerationTemplate,
    manualPowerGenerator,
    manualPowerFuel,
    powerFuelProliferator,
  } = useSettingsStore();
  const { nodeOverrides, setAllOverrides } = useNodeOverrideStore();
  const {
    getPlanVersions,
    loadPlanVersion: loadPlanVersionFromStore,
    loadLatestPlanVersion,
  } = useHistoryStore();

  // Dialog state management
  const dialogs = usePlanManagerDialogs();

  // Escキーでダイアログを閉じる
  useEffect(() => {
    if (!dialogs.activeDialog) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (dialogs.activeDialog === "diff") {
          dialogs.setDiffVersions(null, null);
        }
        if (dialogs.activeDialog === "version") {
          dialogs.setSelectedPlanId(null);
        }
        dialogs.closeDialog();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    dialogs.activeDialog,
    dialogs.closeDialog,
    dialogs.setDiffVersions,
    dialogs.setSelectedPlanId,
  ]);

  // Export functionality
  const planExport = usePlanExport({
    selectedRecipe,
    calculationResult,
    targetQuantity,
    settings,
    powerGenerationTemplate,
    manualPowerGenerator,
    manualPowerFuel,
    powerFuelProliferator,
    items: data?.items || new Map<number, { name: string }>(),
  });

  // Import functionality
  const planImport = usePlanImport({
    gameData: data,
    currentSettings: settings,
    callbacks: {
      setRecipe: (recipe: Recipe) => {
        const r = data?.recipes.get(recipe.SID);
        if (r) setSelectedRecipe(r);
      },
      setTargetQuantity,
      updateSettings,
      setNodeOverrides: setAllOverrides,
    },
    mergeOverrides: dialogs.mergeOverridesOnLoad,
    currentOverrides: nodeOverrides,
    onImportSuccess: () => {
      setTimeout(() => {
        dialogs.closeDialog();
      }, 500);
    },
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate default plan name helper
  const getDefaultPlanNameValue = useCallback(() => {
    return getDefaultPlanName(selectedRecipe?.name);
  }, [selectedRecipe]);

  // Handle save to localStorage
  const handleSaveToLocalStorage = useCallback(() => {
    if (!selectedRecipe) {
      alert(t("pleaseSelectRecipe"));
      return;
    }

    const planNameToSave = dialogs.planName || getDefaultPlanNameValue();

    // Check if a plan with the same name already exists
    const recentPlansList = getRecentPlans();
    const existingPlan = recentPlansList.find(p => p.name === planNameToSave);
    const existingPlanId = existingPlan?.planId;

    // Create plan from current state
    const plan = createPlanFromState({
      name: planNameToSave,
      recipeSID: selectedRecipe.SID,
      targetQuantity,
      settings,
      alternativeRecipes: settings.alternativeRecipes,
      nodeOverrides,
      includeOverrides: dialogs.includeOverridesOnSave,
    });

    try {
      savePlanWithVersion({ plan, existingPlanId });
      planImport.refreshRecentPlans();
      dialogs.closeDialogWithReset();
      dialogs.setPlanName("");
      alert(t("saved"));
    } catch (error) {
      alert(`${t("saveError")}: ${error}`);
    }
  }, [
    selectedRecipe,
    targetQuantity,
    settings,
    nodeOverrides,
    dialogs,
    planImport,
    getDefaultPlanNameValue,
    t,
  ]);

  // Handle export
  const handleExport = useCallback(
    async (format: "json" | "markdown" | "csv" | "excel", name: string) => {
      await planExport.handleExport(format, name);
    },
    [planExport]
  );

  // Handle image export
  const handleImageExport = useCallback(
    async (name: string, options: ImageExportOptions) => {
      await planExport.handleImageExport(name, options);
    },
    [planExport]
  );

  // Handle file import
  const handleImportFile = useCallback(
    async (file: File) => {
      await planImport.handleImportFile(file);
    },
    [planImport]
  );

  // Handle load latest plan version
  const handleLoadLatestPlan = useCallback(
    (planId: string) => {
      if (!data) {
        alert(t("gameDataNotLoaded"));
        return;
      }

      const plan = loadLatestPlanVersion(planId);
      if (!plan) {
        alert(t("planNotFound"));
        return;
      }

      const recipe = data.recipes.get(plan.recipeSID);
      if (!recipe) {
        alert(`${t("recipeNotFound")}: ${plan.recipeSID}`);
        return;
      }

      try {
        loadPlanWithHistory({
          plan,
          recipe,
          callbacks: {
            setRecipe: setSelectedRecipe,
            setTargetQuantity,
            updateSettings,
            setNodeOverrides: setAllOverrides,
          },
          mergeOverrides: dialogs.mergeOverridesOnLoad,
          currentOverrides: nodeOverrides,
          historyDescription: t("planLoadedFromBrowser", {
            planName: plan.name,
            version: plan.version || 1,
          }),
        });

        dialogs.closeDialog();
        planImport.clearMessages();
        alert(`${t("planLoaded", { name: plan.name })}`);
      } catch (error) {
        alert(`${t("loadError")}: ${error}`);
      }
    },
    [
      data,
      dialogs,
      nodeOverrides,
      planImport,
      t,
      loadLatestPlanVersion,
      setSelectedRecipe,
      setTargetQuantity,
      updateSettings,
      setAllOverrides,
    ]
  );

  // Handle load from localStorage
  const handleLoadFromLocalStorage = useCallback(
    (key: string) => {
      planImport.handleLoadFromStorage(key);
      dialogs.closeDialog();
    },
    [planImport, dialogs]
  );

  // Handle delete plan
  const handleDeletePlan = useCallback(
    (key: string) => {
      planImport.handleDeletePlan(key);
    },
    [planImport]
  );

  // Handle load version
  const handleLoadVersion = useCallback(
    (planId: string, version: number) => {
      if (!data) {
        alert(t("gameDataNotLoaded"));
        return;
      }

      const plan = loadPlanVersionFromStore(planId, version);
      if (!plan) {
        alert(t("versionNotFound"));
        return;
      }

      const recipe = data.recipes.get(plan.recipeSID);
      if (!recipe) {
        alert(`${t("recipeNotFound")}: ${plan.recipeSID}`);
        return;
      }

      try {
        loadPlanWithHistory({
          plan,
          recipe,
          callbacks: {
            setRecipe: setSelectedRecipe,
            setTargetQuantity,
            updateSettings,
            setNodeOverrides: setAllOverrides,
          },
          historyDescription: t("planLoadedFromBrowser", { planName: plan.name, version }),
        });

        dialogs.closeDialog();
        dialogs.setSelectedPlanId(null);
        alert(`${t("versionLoaded", { version })}`);
      } catch (error) {
        alert(`${t("loadError")}: ${error}`);
      }
    },
    [
      data,
      dialogs,
      t,
      loadPlanVersionFromStore,
      setSelectedRecipe,
      setTargetQuantity,
      updateSettings,
      setAllOverrides,
    ]
  );

  // Handle share URL
  const handleShareURL = useCallback(() => {
    if (!selectedRecipe) {
      alert(t("pleaseSelectRecipe"));
      return;
    }

    const plan: SavedPlan = {
      name: dialogs.planName || getDefaultPlanNameValue(),
      timestamp: Date.now(),
      recipeSID: selectedRecipe.SID,
      targetQuantity,
      settings,
      alternativeRecipes: Object.fromEntries(settings.alternativeRecipes),
      nodeOverrides: dialogs.includeOverridesOnShare ? Object.fromEntries(nodeOverrides) : {},
    };

    try {
      const url = generateShareURL(plan);
      dialogs.setShareURL(url);
      dialogs.openDialog("share");
      dialogs.setCopySuccess(false);
    } catch (error) {
      alert(`${t("urlGenerationError")}: ${error}`);
    }
  }, [
    selectedRecipe,
    targetQuantity,
    settings,
    nodeOverrides,
    dialogs,
    getDefaultPlanNameValue,
    t,
  ]);

  // Handle copy URL
  const handleCopyURL = useCallback(async () => {
    const success = await copyToClipboard(dialogs.shareURL);
    if (success) {
      dialogs.setCopySuccess(true);
      setTimeout(() => dialogs.setCopySuccess(false), 2000);
    } else {
      alert(t("copyFailed"));
    }
  }, [dialogs, t]);

  return (
    <>
      <div className="flex gap-2">
        {/* Save Button */}
        <button
          data-testid="save-button"
          onClick={() => {
            dialogs.setPlanName(getDefaultPlanNameValue());
            dialogs.openDialog("save");
            planExport.setExportSuccessMessage("");
            planExport.setExportErrorMessage("");
          }}
          disabled={!selectedRecipe}
          className="px-4 py-2 bg-neon-green/30 border border-neon-green/50 text-white rounded-lg hover:bg-neon-green/40 hover:border-neon-green hover:${CARD_GLOW.greenStrong} disabled:bg-dark-600 disabled:border-neon-green/20 disabled:text-space-400 disabled:cursor-not-allowed transition-all ripple-effect"
        >
          💾 {t("save")}
        </button>

        {/* Load Button */}
        <button
          data-testid="load-button"
          onClick={() => {
            dialogs.openDialog("load");
            planImport.clearMessages();
          }}
          className="px-4 py-2 bg-neon-blue/30 border border-neon-blue/50 text-white rounded-lg hover:bg-neon-blue/40 hover:border-neon-blue hover:${CARD_GLOW.blue} transition-all ripple-effect"
        >
          📂 {t("load")}
        </button>

        {/* Share URL Button */}
        <button
          data-testid="url-share-button"
          onClick={handleShareURL}
          disabled={!selectedRecipe}
          className="px-4 py-2 bg-neon-purple/30 border border-neon-purple/50 text-white rounded-lg hover:bg-neon-purple/40 hover:border-neon-purple hover:${CARD_GLOW.purple} disabled:bg-dark-600 disabled:border-neon-purple/20 disabled:text-space-400 disabled:cursor-not-allowed transition-all ripple-effect"
        >
          🔗 {t("shareURL")}
        </button>
      </div>

      {/* Save/Export Dialog */}
      {dialogs.activeDialog === "save" &&
        createPortal(
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-dark-700/95 backdrop-blur-md border-2 border-neon-green/40 rounded-xl ${MODAL_GLOW.green} max-w-md w-full animate-fadeInScale">
              <h2
                data-testid="save-dialog-title"
                className="text-2xl font-bold mb-6 text-white ${TEXT_GLOW.green} flex items-center gap-2 px-6 pt-6"
              >
                💾 {t("save")}
              </h2>

              <div className="px-6 pb-6 space-y-6">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-neon-cyan">
                    {t("planName")}
                  </label>
                  <input
                    data-testid="plan-name-input"
                    type="text"
                    value={dialogs.planName}
                    onChange={e => dialogs.setPlanName(e.target.value)}
                    placeholder={getDefaultPlanNameValue()}
                    className="w-full px-3 py-2 border-2 border-neon-green/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-neon-green focus:border-neon-green bg-dark-800/50 text-white placeholder-gray-400 backdrop-blur-sm"
                  />
                </div>

                {/* Save to LocalStorage */}
                <button
                  data-testid="save-to-localstorage-button"
                  onClick={handleSaveToLocalStorage}
                  className="w-full px-4 py-2 bg-neon-green/20 border-2 border-neon-green/40 text-white rounded-lg hover:bg-neon-green/30 hover:border-neon-green hover:scale-105 active:scale-95 transition-all ${ICON_GLOW.green} hover:${CARD_GLOW.greenStrong} ripple-effect font-medium"
                >
                  💾 {t("saveToLocalStorage")}
                </button>

                {/* Export Buttons */}
                <div>
                  <p className="text-sm font-semibold mb-3 text-neon-cyan">{t("exportToFile")}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      data-testid="export-json-button"
                      onClick={() =>
                        handleExport("json", dialogs.planName || getDefaultPlanNameValue())
                      }
                      className="px-3 py-2 bg-green-500/20 border-2 border-green-500/40 text-white rounded-lg hover:bg-green-500/30 hover:border-green-500 hover:scale-105 active:scale-95 transition-all ${ICON_GLOW.green} hover:${CARD_GLOW.greenStrong} ripple-effect text-sm font-medium"
                    >
                      JSON
                    </button>
                    <button
                      data-testid="export-markdown-button"
                      onClick={() =>
                        handleExport("markdown", dialogs.planName || getDefaultPlanNameValue())
                      }
                      className="px-3 py-2 bg-purple-500/20 border-2 border-purple-500/40 text-white rounded-lg hover:bg-purple-500/30 hover:border-purple-500 hover:scale-105 active:scale-95 transition-all shadow-[0_0_10px_rgba(168,85,247,0.3)] hover:shadow-[0_0_15px_rgba(168,85,247,0.5)] ripple-effect text-sm font-medium"
                    >
                      Markdown
                    </button>
                    <button
                      data-testid="export-csv-button"
                      onClick={() =>
                        handleExport("csv", dialogs.planName || getDefaultPlanNameValue())
                      }
                      className="px-3 py-2 bg-blue-500/20 border-2 border-blue-500/40 text-white rounded-lg hover:bg-blue-500/30 hover:border-blue-500 hover:scale-105 active:scale-95 transition-all shadow-[0_0_10px_rgba(59,130,246,0.3)] hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] ripple-effect text-sm font-medium"
                    >
                      CSV
                    </button>
                    <button
                      data-testid="export-excel-button"
                      onClick={() =>
                        handleExport("excel", dialogs.planName || getDefaultPlanNameValue())
                      }
                      className="px-3 py-2 bg-green-600/20 border-2 border-green-600/40 text-white rounded-lg hover:bg-green-600/30 hover:border-green-600 hover:scale-105 active:scale-95 transition-all shadow-[0_0_10px_rgba(22,163,74,0.3)] hover:shadow-[0_0_15px_rgba(22,163,74,0.5)] ripple-effect text-sm font-medium"
                    >
                      Excel
                    </button>
                    <button
                      data-testid="export-image-button"
                      onClick={() =>
                        handleImageExport(dialogs.planName || getDefaultPlanNameValue(), {
                          resolution: "2x",
                          format: "png",
                          quality: 90,
                          includeViews: {
                            productionTree: true,
                            statistics: false,
                            powerGraph: false,
                            buildingCost: false,
                            powerGeneration: false,
                          },
                          customLayout: false,
                          backgroundColor: "#1a1a1a",
                          padding: 20,
                        })
                      }
                      className="px-3 py-2 bg-orange-500/20 border-2 border-orange-500/40 text-white rounded-lg hover:bg-orange-500/30 hover:border-orange-500 hover:scale-105 active:scale-95 transition-all shadow-[0_0_10px_rgba(249,115,22,0.3)] hover:shadow-[0_0_15px_rgba(249,115,22,0.5)] ripple-effect text-sm font-medium"
                    >
                      画像 (PNG)
                    </button>
                  </div>
                </div>

                {/* Include overrides option */}
                <div className="mb-4 flex items-center gap-2">
                  <input
                    data-testid="include-overrides-on-save-checkbox"
                    id="includeOverridesOnSave"
                    type="checkbox"
                    checked={dialogs.includeOverridesOnSave}
                    onChange={e => dialogs.setIncludeOverridesOnSave(e.target.checked)}
                    className="h-4 w-4 accent-neon-green"
                  />
                  <label htmlFor="includeOverridesOnSave" className="text-sm text-white">
                    {t("includeNodeOverrides")}
                  </label>
                </div>

                {/* Export Success Message */}
                {planExport.exportSuccessMessage && (
                  <div
                    data-testid="export-success-message"
                    className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-500/50 rounded-lg text-sm text-green-800 dark:text-green-200 flex items-center justify-between"
                  >
                    <span>✅ {planExport.exportSuccessMessage}</span>
                    <button
                      onClick={() => planExport.setExportSuccessMessage("")}
                      className="ml-2 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Export Error Message */}
                {planExport.exportErrorMessage && (
                  <div
                    data-testid="export-error-message"
                    className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-500/50 rounded-lg text-sm text-red-800 dark:text-red-200 flex items-center justify-between"
                  >
                    <span>❌ {planExport.exportErrorMessage}</span>
                    <button
                      onClick={() => planExport.setExportErrorMessage("")}
                      className="ml-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
                    >
                      ✕
                    </button>
                  </div>
                )}

                <button
                  data-testid="save-dialog-close-button"
                  onClick={() => {
                    dialogs.closeDialogWithReset();
                    planExport.setExportSuccessMessage("");
                    planExport.setExportErrorMessage("");
                  }}
                  className="w-full px-4 py-2 bg-dark-800/50 border-2 border-space-500/40 text-white rounded-lg hover:bg-dark-800 hover:border-space-400 hover:scale-105 active:scale-95 transition-all ripple-effect font-medium"
                >
                  {t("close")}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Load/Import Dialog */}
      {dialogs.activeDialog === "load" &&
        createPortal(
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-dark-700/95 backdrop-blur-md border-2 border-neon-blue/40 rounded-xl ${MODAL_GLOW.blue} max-w-2xl w-full max-h-[80vh] overflow-y-auto animate-fadeInScale">
              <h2
                data-testid="load-dialog-title"
                className="text-2xl font-bold mb-6 text-white drop-shadow-[0_0_8px_rgba(0,136,255,0.6)] flex items-center gap-2 sticky top-0 bg-dark-700/95 backdrop-blur-md pb-4 border-b border-neon-blue/30 px-6 pt-6"
              >
                📂 {t("load")}
              </h2>

              <div className="px-6 pb-6 space-y-6">
                {/* File Import */}
                <div>
                  <label className="block text-sm font-semibold mb-2 text-neon-cyan">
                    {t("loadFromFile")}
                  </label>
                  <input
                    data-testid="file-import-input"
                    ref={fileInputRef}
                    type="file"
                    accept=".json,.md,.markdown,.csv,.xlsx"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        void handleImportFile(file);
                        // Reset file input
                        if (fileInputRef.current) {
                          fileInputRef.current.value = "";
                        }
                      }
                    }}
                    className="w-full px-3 py-2 border-2 border-neon-blue/30 rounded-lg bg-dark-800/50 text-white backdrop-blur-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-neon-blue/20 file:text-white file:cursor-pointer file:hover:bg-neon-blue/30 file:transition-all"
                  />
                  <p className="text-xs text-space-200 mt-1">
                    {t("supportedFormats")}: JSON (.json), Markdown (.md), CSV (.csv), Excel (.xlsx)
                  </p>

                  {/* Import Success Message */}
                  {planImport.importSuccessMessage && (
                    <div
                      data-testid="import-success-message"
                      className="mt-3 p-3 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-500/50 rounded-lg text-sm text-green-800 dark:text-green-200 flex items-center justify-between"
                    >
                      <span>✅ {planImport.importSuccessMessage}</span>
                      <button
                        onClick={() => planImport.setImportSuccessMessage("")}
                        className="ml-2 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  {/* Import Error Message */}
                  {planImport.importErrorMessage && (
                    <div
                      data-testid="import-error-message"
                      className="mt-3 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-500/50 rounded-lg text-sm text-red-800 dark:text-red-200 flex items-center justify-between"
                    >
                      <span>❌ {planImport.importErrorMessage}</span>
                      <button
                        onClick={() => planImport.setImportErrorMessage("")}
                        className="ml-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>

                {/* Recent Plans */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-white">{t("recentPlans")}</h3>
                  {/* Merge overrides option */}
                  <div className="mb-4 flex items-center gap-2">
                    <input
                      data-testid="merge-overrides-on-load-checkbox"
                      id="mergeOverridesOnLoad"
                      type="checkbox"
                      checked={dialogs.mergeOverridesOnLoad}
                      onChange={e => dialogs.setMergeOverridesOnLoad(e.target.checked)}
                      className="h-4 w-4 accent-neon-blue"
                    />
                    <label htmlFor="mergeOverridesOnLoad" className="text-sm text-white">
                      {t("mergeNodeOverridesOnLoad")}
                    </label>
                  </div>
                  {planImport.recentPlans.length === 0 ? (
                    <p className="text-space-200 text-sm">{t("noPlans")}</p>
                  ) : (
                    <div className="space-y-2">
                      {planImport.recentPlans.map(plan => (
                        <div
                          key={plan.key}
                          data-testid={`plan-item-${plan.key}`}
                          className="flex items-center justify-between p-3 bg-dark-800/50 border border-neon-blue/20 rounded-lg hover:bg-dark-800 hover:border-neon-blue/40 transition-all"
                        >
                          <div className="flex-1">
                            <div className="font-medium text-white">{plan.name}</div>
                            <div className="text-sm text-space-200">
                              {new Date(plan.timestamp).toLocaleString()}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              data-testid={`load-plan-button-${plan.key}`}
                              onClick={() =>
                                plan.planId
                                  ? handleLoadLatestPlan(plan.planId)
                                  : handleLoadFromLocalStorage(plan.key)
                              }
                              className="px-3 py-1 bg-neon-blue/20 border-2 border-neon-blue/40 text-white rounded-lg hover:bg-neon-blue/30 hover:border-neon-blue hover:scale-105 active:scale-95 transition-all shadow-[0_0_10px_rgba(0,136,255,0.3)] hover:shadow-[0_0_15px_rgba(0,136,255,0.5)] ripple-effect text-sm font-medium"
                            >
                              {t("load")}
                            </button>
                            {plan.planId && (
                              <button
                                data-testid={`version-button-${plan.key}`}
                                onClick={() => {
                                  dialogs.setSelectedPlanId(plan.planId || null);
                                  dialogs.openDialog("version");
                                }}
                                className="px-3 py-1 bg-purple-500/20 border-2 border-purple-500/40 text-white rounded-lg hover:bg-purple-500/30 hover:border-purple-500 hover:scale-105 active:scale-95 transition-all shadow-[0_0_10px_rgba(168,85,247,0.3)] hover:shadow-[0_0_15px_rgba(168,85,247,0.5)] ripple-effect text-sm font-medium"
                              >
                                📚 {t("versions")}
                              </button>
                            )}
                            <button
                              data-testid={`delete-plan-button-${plan.key}`}
                              onClick={() => handleDeletePlan(plan.key)}
                              className="px-3 py-1 bg-red-500/20 border-2 border-red-500/40 text-white rounded-lg hover:bg-red-500/30 hover:border-red-500 hover:scale-105 active:scale-95 transition-all shadow-[0_0_10px_rgba(239,68,68,0.3)] hover:shadow-[0_0_15px_rgba(239,68,68,0.5)] ripple-effect text-sm font-medium"
                            >
                              {t("delete")}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  data-testid="load-dialog-close-button"
                  onClick={() => {
                    dialogs.closeDialog();
                    planImport.clearMessages();
                  }}
                  className="w-full px-4 py-2 bg-dark-800/50 border-2 border-space-500/40 text-white rounded-lg hover:bg-dark-800 hover:border-space-400 hover:scale-105 active:scale-95 transition-all ripple-effect font-medium"
                >
                  {t("close")}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Share URL Dialog */}
      {dialogs.activeDialog === "share" &&
        createPortal(
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-dark-700/95 backdrop-blur-md border-2 border-neon-purple/40 rounded-xl shadow-[0_0_30px_rgba(168,85,247,0.3)] max-w-2xl w-full p-6 animate-fadeInScale">
              <h2 className="text-2xl font-bold mb-4 text-white drop-shadow-[0_0_8px_rgba(168,85,247,0.6)] flex items-center gap-2">
                🔗 {t("shareURL")}
              </h2>

              <p className="text-sm text-space-200 mb-4">{t("shareUrlDescription")}</p>

              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2 text-neon-cyan">
                  {t("sharedUrl")}
                </label>
                <div className="flex gap-2">
                  <input
                    data-testid="share-url-input"
                    type="text"
                    value={dialogs.shareURL}
                    readOnly
                    className="flex-1 px-3 py-2 border-2 border-neon-purple/30 rounded-lg bg-dark-800/50 text-white text-sm font-mono backdrop-blur-sm"
                    onClick={e => e.currentTarget.select()}
                  />
                  <button
                    data-testid="copy-url-button"
                    onClick={handleCopyURL}
                    className={`px-4 py-2 rounded-lg text-white font-medium transition-all hover:scale-105 active:scale-95 ${
                      dialogs.copySuccess
                        ? "bg-green-500/20 border-2 border-green-500/40 shadow-[0_0_15px_rgba(34,197,94,0.5)]"
                        : "bg-neon-blue/20 border-2 border-neon-blue/40 hover:bg-neon-blue/30 hover:border-neon-blue shadow-[0_0_10px_rgba(0,136,255,0.3)] hover:shadow-[0_0_15px_rgba(0,136,255,0.5)]"
                    } ripple-effect`}
                  >
                    {dialogs.copySuccess ? `✓ ${t("copied")}` : `📋 ${t("copy")}`}
                  </button>
                </div>
              </div>

              {/* Include overrides in URL */}
              <div className="mb-4 flex items-center gap-2">
                <input
                  data-testid="include-overrides-on-share-checkbox"
                  id="includeOverridesOnShare"
                  type="checkbox"
                  checked={dialogs.includeOverridesOnShare}
                  onChange={e => dialogs.setIncludeOverridesOnShare(e.target.checked)}
                  className="h-4 w-4 accent-neon-purple"
                />
                <label htmlFor="includeOverridesOnShare" className="text-sm text-white">
                  {t("includeNodeOverridesInURL")}
                </label>
              </div>

              <div className="bg-yellow-500/10 border-2 border-yellow-500/30 rounded-lg p-3 mb-4">
                <p className="text-sm text-yellow-300">{t("urlWarning")}</p>
              </div>

              <button
                data-testid="share-dialog-close-button"
                onClick={() => dialogs.closeDialog()}
                className="w-full px-4 py-2 bg-dark-800/50 border-2 border-space-500/40 text-white rounded-lg hover:bg-dark-800 hover:border-space-400 hover:scale-105 active:scale-95 transition-all ripple-effect font-medium"
              >
                {t("close")}
              </button>
            </div>
          </div>,
          document.body
        )}

      {/* Version History Dialog */}
      {dialogs.activeDialog === "version" &&
        dialogs.selectedPlanId &&
        createPortal(
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-dark-700/95 backdrop-blur-md border-2 border-purple-500/40 rounded-xl shadow-[0_0_30px_rgba(168,85,247,0.3)] max-w-2xl w-full max-h-[80vh] overflow-y-auto animate-fadeInScale">
              <h2 className="text-2xl font-bold mb-6 text-white drop-shadow-[0_0_8px_rgba(168,85,247,0.6)] flex items-center gap-2 px-6 pt-6">
                📚 {t("versionHistory")}
              </h2>

              <div className="px-6 pb-6 space-y-6">
                {(() => {
                  const versions = getPlanVersions(dialogs.selectedPlanId!);
                  return versions.length === 0 ? (
                    <p className="text-space-200 text-sm">{t("noVersions")}</p>
                  ) : (
                    <div className="space-y-3">
                      {versions.map((version, index) => (
                        <div
                          key={version.version}
                          className="p-4 bg-dark-800/50 border border-purple-500/20 rounded-lg hover:bg-dark-800 hover:border-purple-500/40 transition-all"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex-1">
                              <div className="font-medium text-white">
                                {t("version")} {version.version}
                              </div>
                              <div className="text-sm text-space-200">
                                {new Date(version.timestamp).toLocaleString()}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {index > 0 && (
                                <button
                                  onClick={() => {
                                    dialogs.setDiffVersions(
                                      versions[index - 1].version,
                                      version.version
                                    );
                                    dialogs.openDialog("diff");
                                  }}
                                  className="px-3 py-1 bg-yellow-500/20 border-2 border-yellow-500/40 text-white rounded-lg hover:bg-yellow-500/30 hover:border-yellow-500 hover:scale-105 active:scale-95 transition-all shadow-[0_0_10px_rgba(251,191,36,0.3)] hover:shadow-[0_0_15px_rgba(251,191,36,0.5)] ripple-effect text-sm font-medium"
                                >
                                  🔍 {t("compare")}
                                </button>
                              )}
                              <button
                                onClick={() =>
                                  handleLoadVersion(dialogs.selectedPlanId!, version.version)
                                }
                                className="px-3 py-1 bg-neon-blue/20 border-2 border-neon-blue/40 text-white rounded-lg hover:bg-neon-blue/30 hover:border-neon-blue hover:scale-105 active:scale-95 transition-all shadow-[0_0_10px_rgba(0,136,255,0.3)] hover:shadow-[0_0_15px_rgba(0,136,255,0.5)] ripple-effect text-sm font-medium"
                              >
                                {t("load")}
                              </button>
                            </div>
                          </div>
                          {version.description && (
                            <div className="text-sm text-space-100 mt-2 pt-2 border-t border-purple-500/20">
                              {version.description}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              <div className="px-6 pb-6">
                <button
                  onClick={() => {
                    dialogs.closeDialog();
                    dialogs.setSelectedPlanId(null);
                  }}
                  className="w-full px-4 py-2 bg-dark-800/50 border-2 border-space-500/40 text-white rounded-lg hover:bg-dark-800 hover:border-space-400 hover:scale-105 active:scale-95 transition-all ripple-effect font-medium"
                >
                  {t("close")}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Diff Dialog */}
      {dialogs.activeDialog === "diff" &&
        dialogs.selectedPlanId &&
        dialogs.diffBaseVersion !== null &&
        dialogs.diffCompareVersion !== null &&
        createPortal(
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-[#070a10] border-2 border-yellow-500/40 rounded-xl shadow-[0_0_30px_rgba(251,191,36,0.3)] max-w-4xl w-full max-h-[80vh] overflow-y-auto animate-fadeInScale">
              <div className="sticky top-0 bg-[#070a10] border-b border-yellow-500/30 z-10 px-6 pt-6 pb-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white drop-shadow-[0_0_8px_rgba(251,191,36,0.6)] flex items-center gap-2">
                    🔍 {t("compareVersions")}
                  </h2>
                  <button
                    onClick={() => {
                      dialogs.closeDialog();
                      dialogs.setDiffVersions(null, null);
                    }}
                    className="px-3 py-1 bg-red-500/20 border-2 border-red-500/40 text-white rounded-lg hover:bg-red-500/30 hover:border-red-500 hover:scale-105 active:scale-95 transition-all shadow-[0_0_10px_rgba(239,68,68,0.3)] hover:shadow-[0_0_15px_rgba(239,68,68,0.5)] ripple-effect text-sm font-medium"
                  >
                    {t("close")}
                  </button>
                </div>
              </div>

              <div className="px-6 pb-6 space-y-6">
                {(() => {
                  const baseVersion = loadPlanVersionFromStore(
                    dialogs.selectedPlanId!,
                    dialogs.diffBaseVersion!
                  );
                  const compareVersion = loadPlanVersionFromStore(
                    dialogs.selectedPlanId!,
                    dialogs.diffCompareVersion!
                  );

                  if (!baseVersion || !compareVersion) {
                    return <p className="text-red-300">{t("versionNotFound")}</p>;
                  }

                  const diffs = calculatePlanDiff(baseVersion, compareVersion);

                  return (
                    <>
                      <div className="bg-yellow-500/10 border-2 border-yellow-500/30 rounded-lg p-4">
                        <div className="text-sm text-yellow-200">
                          {t("comparingVersion")} {dialogs.diffBaseVersion} → {t("version")}{" "}
                          {dialogs.diffCompareVersion}
                        </div>
                      </div>

                      <PlanDiffView diffs={diffs} />
                    </>
                  );
                })()}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
