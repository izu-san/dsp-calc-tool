import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import i18n from "../../i18n";
import { exportToCSV } from "../../lib/export/csvExporter";
import { transformToExportData } from "../../lib/export/dataTransformer";
import { exportToExcel } from "../../lib/export/excelExporter";
import { generateExportFilename } from "../../lib/export/filenameGenerator";
import { exportToImage, exportMultipleViews } from "../../lib/export/imageExporter";
import { exportToMarkdown } from "../../lib/export/markdownExporter";
import type { ImageExportOptions } from "../../types/export";
import { importPlan } from "../../lib/import";
import {
  buildSavedPlanFromExportData,
  parseExportDataFromJSON,
} from "../../lib/import/jsonImporter";
import { importFromMarkdown } from "../../lib/import/markdownImporter";
import { buildPlanFromImport } from "../../lib/import/planBuilder";
import { validatePlanInfo } from "../../lib/import/validation";
import { useGameDataStore } from "../../stores/gameDataStore";
import { useHistoryStore } from "../../stores/historyStore";
import { useNodeOverrideStore } from "../../stores/nodeOverrideStore";
import { useRecipeSelectionStore } from "../../stores/recipeSelectionStore";
import { useSettingsStore } from "../../stores/settingsStore";
import type { SavedPlan } from "../../types";
import {
  deletePlanFromLocalStorage,
  getRecentPlans,
  loadPlanFromLocalStorage,
  restorePlan,
  savePlanToLocalStorage,
} from "../../utils/planExport";
import { copyToClipboard, generateShareURL } from "../../utils/urlShare";
import { calculatePlanDiff } from "../../utils/planDiff";
import { PlanDiffView } from "../PlanDiffView";
import { setInternal } from "../../utils/historyRecorder";
import { HISTORY_VERSION } from "../../utils/historyUtils";

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
  const { savePlanVersion, getPlanVersions, loadPlanVersion, loadLatestPlanVersion, pushEntry } =
    useHistoryStore();

  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showVersionDialog, setShowVersionDialog] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [showDiffDialog, setShowDiffDialog] = useState(false);
  const [diffBaseVersion, setDiffBaseVersion] = useState<number | null>(null);
  const [diffCompareVersion, setDiffCompareVersion] = useState<number | null>(null);
  const [shareURL, setShareURL] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);
  const [planName, setPlanName] = useState("");
  const [importSuccessMessage, setImportSuccessMessage] = useState<string>("");
  const [importErrorMessage, setImportErrorMessage] = useState<string>("");
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string>("");
  const [exportErrorMessage, setExportErrorMessage] = useState<string>("");
  const [recentPlans, setRecentPlans] = useState(getRecentPlans());
  const fileInputRef = useRef<HTMLInputElement>(null);
  // New options for overrides handling
  const [includeOverridesOnSave, setIncludeOverridesOnSave] = useState(true);
  const [includeOverridesOnShare, setIncludeOverridesOnShare] = useState(true);
  const [mergeOverridesOnLoad, setMergeOverridesOnLoad] = useState(false);

  // Generate default plan name
  const getDefaultPlanName = () => {
    // Use recipe name as default if available
    if (selectedRecipe) {
      return selectedRecipe.name;
    }
    // Fallback to timestamp if no recipe selected
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    return `Plan_${year}-${month}-${day}_${hours}-${minutes}`;
  };

  const handleExport = async (format: "json" | "markdown" | "csv" | "excel", name: string) => {
    if (!selectedRecipe) {
      alert(t("pleaseSelectRecipe"));
      return;
    }

    try {
      if (!calculationResult) {
        alert(t("pleaseCalculateFirst"));
        return;
      }

      const exportData = transformToExportData(
        calculationResult,
        selectedRecipe,
        targetQuantity,
        settings,
        name,
        Date.now(),
        {
          template: powerGenerationTemplate,
          manualGenerator: manualPowerGenerator,
          manualFuel: manualPowerFuel,
          powerFuelProliferator: powerFuelProliferator,
        },
        { items: data?.items || new Map() }
      );

      let blob: Blob;
      let filename: string;
      let mimeType: string;

      if (format === "json") {
        // JSON エクスポート
        filename = generateExportFilename(name, "json");
        mimeType = "application/json;charset=utf-8";
        blob = new Blob([JSON.stringify(exportData, null, 2)], { type: mimeType });
      } else if (format === "markdown") {
        // Markdown エクスポート
        const markdown = exportToMarkdown(exportData);
        filename = generateExportFilename(name, "md");
        mimeType = "text/markdown;charset=utf-8";
        blob = new Blob([markdown], { type: mimeType });
      } else if (format === "csv") {
        // CSV エクスポート
        const csv = exportToCSV(exportData);
        filename = generateExportFilename(name, "csv");
        mimeType = "text/csv;charset=utf-8";
        blob = new Blob([csv], { type: mimeType });
      } else if (format === "excel") {
        // Excel エクスポート
        filename = generateExportFilename(name, "xlsx");
        mimeType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        blob = await exportToExcel(exportData);
      } else {
        throw new Error(`Unsupported format: ${format}`);
      }

      // ダウンロード
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportSuccessMessage(t("exported"));
      setExportErrorMessage("");
    } catch (error) {
      console.error("Export error:", error);
      setExportErrorMessage(`${t("exportError")}: ${error}`);
      setExportSuccessMessage("");
    }
  };

  const handleImageExport = async (name: string, options: ImageExportOptions) => {
    if (!selectedRecipe) {
      alert(t("pleaseSelectRecipe"));
      return;
    }

    if (!calculationResult) {
      alert(t("pleaseCalculateFirst"));
      return;
    }

    try {
      const selectors: string[] = [];

      // 各ビューに対応するセレクタを追加（表示されている場合のみ）
      if (options.includeViews.productionTree) {
        selectors.push("#production-tree-view");
      }
      if (options.includeViews.statistics) {
        selectors.push("#statistics-view");
      }
      if (options.includeViews.powerGraph) {
        selectors.push("#power-graph-view");
      }
      if (options.includeViews.buildingCost) {
        selectors.push("#building-cost-view");
      }
      if (options.includeViews.powerGeneration) {
        selectors.push("#power-generation-view");
      }

      // 表示されているビューのみをフィルタリング
      const visibleSelectors = selectors.filter(selector => {
        const element = document.querySelector(selector);
        return element !== null && (element as HTMLElement).offsetParent !== null; // 表示されているかチェック
      });

      if (visibleSelectors.length === 0) {
        throw new Error(
          "表示されているビューがありません。生産チェーン、統計、建設コスト、または発電設備のタブを開いてから画像エクスポートしてください。"
        );
      }

      // 画像をエクスポート
      let blob: Blob;
      if (visibleSelectors.length === 1) {
        blob = await exportToImage(visibleSelectors[0], options);
      } else {
        blob = await exportMultipleViews(visibleSelectors, options);
      }

      // ファイル名を生成
      const ext = options.format;
      const filename = generateExportFilename(name, ext);

      // ダウンロード
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportSuccessMessage(t("exported"));
      setExportErrorMessage("");
    } catch (error) {
      console.error("Image export error:", error);
      setExportErrorMessage(
        `${t("exportError")}: ${error instanceof Error ? error.message : String(error)}`
      );
      setExportSuccessMessage("");
    }
  };

  const handleSaveToLocalStorage = () => {
    if (!selectedRecipe) {
      alert(t("pleaseSelectRecipe"));
      return;
    }

    const planNameToSave = planName || getDefaultPlanName();

    const plan: SavedPlan = {
      name: planNameToSave,
      timestamp: Date.now(),
      recipeSID: selectedRecipe.SID,
      targetQuantity,
      settings,
      alternativeRecipes: Object.fromEntries(settings.alternativeRecipes),
      nodeOverrides: includeOverridesOnSave ? Object.fromEntries(nodeOverrides) : {},
    };

    // Check if a plan with the same name already exists
    const recentPlansList = getRecentPlans();
    const existingPlan = recentPlansList.find(p => p.name === planNameToSave);
    const existingPlanId = existingPlan?.planId;

    // Save to version management with existing planId if found
    const planId = savePlanVersion(plan, existingPlanId);

    // Update plan with planId for localStorage storage
    plan.planId = planId;

    // Also save to localStorage for recent plans (backward compatibility)
    savePlanToLocalStorage(plan);

    // Remove duplicate plans with the same name but different planId (old data without planId)
    const updatedRecentPlansList = getRecentPlans();
    const plansWithSameName = updatedRecentPlansList.filter(p => p.name === planNameToSave);
    if (plansWithSameName.length > 1) {
      // Keep only the most recent one
      const plansToKeep = plansWithSameName.sort((a, b) => b.timestamp - a.timestamp).slice(0, 1);
      const plansToRemove = plansWithSameName.filter(p => !plansToKeep.includes(p));

      // Remove old plans from localStorage
      plansToRemove.forEach(p => {
        localStorage.removeItem(p.key);
      });

      // Update recent plans list
      const filteredPlans = updatedRecentPlansList.filter(p => !plansToRemove.includes(p));
      localStorage.setItem("recent_plans", JSON.stringify(filteredPlans));
    }

    setRecentPlans(getRecentPlans());
    setShowSaveDialog(false);
    setPlanName("");
    alert(t("saved"));
  };

  const handleImportFile = async (file: File) => {
    if (!file) return;

    try {
      const fileExtension = file.name.split(".").pop()?.toLowerCase();
      let plan: SavedPlan | null = null;

      if (fileExtension === "json") {
        // JSON インポート（新しいExportData形式）
        if (!data) {
          setImportErrorMessage(t("gameDataNotLoaded"));
          setImportSuccessMessage("");
          return;
        }

        const text = await file.text();
        const exportData = parseExportDataFromJSON(text);
        plan = buildSavedPlanFromExportData(exportData, data, settings);
      } else if (fileExtension === "md" || fileExtension === "markdown") {
        // Markdown インポート
        if (!data) {
          setImportErrorMessage(t("gameDataNotLoaded"));
          setImportSuccessMessage("");
          return;
        }

        const text = await file.text();
        const importResult = importFromMarkdown(text);

        if (!importResult.success) {
          const errors = importResult.errors.map(e => e.message).join("\n");
          setImportErrorMessage(`${t("importError")}:\n${errors}`);
          setImportSuccessMessage("");
          return;
        }

        // 部分的なデータから SavedPlan を構築
        const planInfo = {
          name: importResult.extractedData.planName || file.name.replace(/\.(md|markdown)$/i, ""),
          timestamp: importResult.extractedData.timestamp || Date.now(),
          recipeSID: importResult.extractedData.recipeSID || 0,
          recipeName: importResult.extractedData.recipeName || "",
          targetQuantity: importResult.extractedData.targetQuantity || 1,
        };

        // 検証
        const validation = validatePlanInfo(planInfo, data);
        if (!validation.isValid) {
          const errors = validation.errors.map(e => e.message).join("\n");
          setImportErrorMessage(`${t("validationError")}:\n${errors}`);
          setImportSuccessMessage("");
          return;
        }

        // SavedPlan を構築（現在の設定をフォールバックとして渡す）
        plan = buildPlanFromImport(planInfo, data, settings);
        if (!plan) {
          setImportErrorMessage(t("planBuildError"));
          setImportSuccessMessage("");
          return;
        }

        // 警告があれば表示
        if (validation.warnings.length > 0) {
          const warnings = validation.warnings.map(w => w.message).join("\n");
          console.warn(`Import warnings:\n${warnings}`);
        }
      } else if (fileExtension === "csv" || fileExtension === "xlsx") {
        // CSV/Excel インポート
        if (!data) {
          setImportErrorMessage(t("gameDataNotLoaded"));
          setImportSuccessMessage("");
          return;
        }

        const importResult = await importPlan(file, {
          validateData: true,
          strictMode: false,
          allowPartialImport: true,
          autoFixErrors: true,
          checkVersion: true,
        });

        if (!importResult.success) {
          const errors =
            "errors" in importResult
              ? importResult.errors.map(e => e.message).join("\n")
              : t("importError");
          setImportErrorMessage(`${t("importError")}:\n${errors}`);
          setImportSuccessMessage("");
          return;
        }

        if (!("extractedData" in importResult)) {
          setImportErrorMessage(t("importError"));
          setImportSuccessMessage("");
          return;
        }

        // エラーがあれば警告として表示（部分インポート許可のため）
        if (importResult.errors.length > 0) {
          const errors = importResult.errors.map(e => e.message).join("\n");
          console.warn(`Import errors (continuing anyway):\n${errors}`);
        }

        // プラン情報を検証
        const planInfo = {
          name: importResult.extractedData.planInfo.name,
          timestamp: importResult.extractedData.planInfo.timestamp,
          recipeSID: importResult.extractedData.planInfo.recipeSID,
          recipeName: importResult.extractedData.planInfo.recipeName,
          targetQuantity: importResult.extractedData.planInfo.targetQuantity,
        };

        const validation = validatePlanInfo(planInfo, data);
        if (!validation.isValid) {
          const errors = validation.errors.map(e => e.message).join("\n");
          setImportErrorMessage(`${t("validationError")}:\n${errors}`);
          setImportSuccessMessage("");
          return;
        }

        // SavedPlan を構築（現在の設定をフォールバックとして渡す）
        plan = buildPlanFromImport(planInfo, data, settings);
        if (!plan) {
          setImportErrorMessage(t("planBuildError"));
          setImportSuccessMessage("");
          return;
        }

        // 警告があれば表示
        if (importResult.warnings.length > 0 || validation.warnings.length > 0) {
          const warnings = [
            ...importResult.warnings.map(w => w.message),
            ...validation.warnings.map(w => w.message),
          ].join("\n");
          console.warn(`Import warnings:\n${warnings}`);
        }
      } else {
        setImportErrorMessage(t("unsupportedFileFormat"));
        setImportSuccessMessage("");
        return;
      }

      if (!plan) {
        setImportErrorMessage(t("importError"));
        setImportSuccessMessage("");
        return;
      }

      // Validate recipe exists
      if (!data) {
        setImportErrorMessage(t("gameDataNotLoaded"));
        setImportSuccessMessage("");
        return;
      }

      const recipe = data.recipes.get(plan.recipeSID);
      if (!recipe) {
        setImportErrorMessage(`${t("recipeNotFound")}: ${plan.recipeSID}`);
        setImportSuccessMessage("");
        return;
      }

      // Record detailed history for file import
      setInternal(true); // Suppress automatic history recording

      // Restore plan
      if (mergeOverridesOnLoad) {
        // Merge overrides: existing wins or imported wins? Choose imported wins
        const merged = new Map(nodeOverrides);
        Object.entries(plan.nodeOverrides).forEach(([k, v]) => merged.set(k, v));
        restorePlan(
          plan,
          () => setSelectedRecipe(recipe),
          setTargetQuantity,
          updateSettings,
          setAllOverrides
        );
        // After settings/recipe restored, apply merged overrides
        setAllOverrides(merged);
      } else {
        restorePlan(
          plan,
          () => setSelectedRecipe(recipe),
          setTargetQuantity,
          updateSettings,
          setAllOverrides
        );
      }

      // Record detailed import history
      const historyDescription = t("planLoadedFromFile", { fileName: file.name });
      pushEntry({
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        type: "plan",
        description: historyDescription,
        changes: { fileName: file.name },
        previousChanges: {},
        version: HISTORY_VERSION,
        planSnapshot: plan,
        locale: i18n.language,
      });

      setInternal(false); // Re-enable automatic history recording

      setImportSuccessMessage(`${t("planLoaded", { name: plan.name })}`);
      setImportErrorMessage("");
      // インポート成功時にモーダルを閉じる
      setTimeout(() => {
        setShowLoadDialog(false);
      }, 500); // 成功メッセージを少し表示してから閉じる
    } catch (error) {
      setInternal(false); // Re-enable automatic history recording in case of error
      console.error("Import error:", error);
      setImportErrorMessage(`${t("loadError")}: ${error}`);
      setImportSuccessMessage("");
    }
  };

  const handleLoadLatestPlan = (planId: string) => {
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

    // Record detailed history for latest version load
    setInternal(true); // Suppress automatic history recording

    if (mergeOverridesOnLoad) {
      const merged = new Map(nodeOverrides);
      Object.entries(plan.nodeOverrides).forEach(([k, v]) => merged.set(k, v));
      restorePlan(
        plan,
        () => setSelectedRecipe(recipe),
        setTargetQuantity,
        updateSettings,
        setAllOverrides
      );
      setAllOverrides(merged);
    } else {
      restorePlan(
        plan,
        () => setSelectedRecipe(recipe),
        setTargetQuantity,
        updateSettings,
        setAllOverrides
      );
    }

    // Record detailed load history with latest version
    const historyDescription = t("planLoadedFromBrowser", {
      planName: plan.name,
      version: plan.version,
    });
    pushEntry({
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      type: "plan",
      description: historyDescription,
      changes: {},
      previousChanges: {},
      version: HISTORY_VERSION,
      planSnapshot: plan,
      locale: i18n.language,
    });

    setInternal(false); // Re-enable automatic history recording

    setShowLoadDialog(false);
    setImportSuccessMessage("");
    setImportErrorMessage("");
    alert(`${t("planLoaded", { name: plan.name })}`);
  };

  const handleLoadFromLocalStorage = (key: string) => {
    const plan = loadPlanFromLocalStorage(key);
    if (!plan) {
      alert(t("planNotFound"));
      return;
    }

    if (!data) {
      alert(t("gameDataNotLoaded"));
      return;
    }

    const recipe = data.recipes.get(plan.recipeSID);
    if (!recipe) {
      alert(`${t("recipeNotFound")}: ${plan.recipeSID}`);
      return;
    }

    // Record detailed history for browser load
    setInternal(true); // Suppress automatic history recording

    if (mergeOverridesOnLoad) {
      const merged = new Map(nodeOverrides);
      Object.entries(plan.nodeOverrides).forEach(([k, v]) => merged.set(k, v));
      restorePlan(
        plan,
        () => setSelectedRecipe(recipe),
        setTargetQuantity,
        updateSettings,
        setAllOverrides
      );
      setAllOverrides(merged);
    } else {
      restorePlan(
        plan,
        () => setSelectedRecipe(recipe),
        setTargetQuantity,
        updateSettings,
        setAllOverrides
      );
    }

    // Record detailed load history
    const historyDescription = t("planLoadedFromBrowser", {
      planName: plan.name,
      version: plan.version || 1,
    });
    pushEntry({
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      type: "plan",
      description: historyDescription,
      changes: {},
      previousChanges: {},
      version: HISTORY_VERSION,
      planSnapshot: plan,
      locale: i18n.language,
    });

    setInternal(false); // Re-enable automatic history recording

    setShowLoadDialog(false);
    setImportSuccessMessage("");
    setImportErrorMessage("");
    alert(`${t("planLoaded", { name: plan.name })}`);
  };

  const handleDeletePlan = (key: string) => {
    if (confirm(t("confirmDeletePlan"))) {
      deletePlanFromLocalStorage(key);
      setRecentPlans(getRecentPlans());
    }
  };

  const handleLoadVersion = (planId: string, version: number) => {
    if (!data) {
      alert(t("gameDataNotLoaded"));
      return;
    }

    const plan = loadPlanVersion(planId, version);
    if (!plan) {
      alert(t("versionNotFound"));
      return;
    }

    const recipe = data.recipes.get(plan.recipeSID);
    if (!recipe) {
      alert(`${t("recipeNotFound")}: ${plan.recipeSID}`);
      return;
    }

    // Record detailed history for version load
    setInternal(true); // Suppress automatic history recording

    restorePlan(
      plan,
      () => setSelectedRecipe(recipe),
      setTargetQuantity,
      updateSettings,
      setAllOverrides
    );

    // Record detailed version load history
    const historyDescription = t("planLoadedFromBrowser", { planName: plan.name, version });
    pushEntry({
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      type: "plan",
      description: historyDescription,
      changes: {},
      previousChanges: {},
      version: HISTORY_VERSION,
      planSnapshot: plan,
      locale: i18n.language,
    });

    setInternal(false); // Re-enable automatic history recording

    setShowVersionDialog(false);
    setShowLoadDialog(false);
    alert(`${t("versionLoaded", { version })}`);
  };

  const handleShareURL = () => {
    if (!selectedRecipe) {
      alert(t("pleaseSelectRecipe"));
      return;
    }

    const plan: SavedPlan = {
      name: planName || getDefaultPlanName(),
      timestamp: Date.now(),
      recipeSID: selectedRecipe.SID,
      targetQuantity,
      settings,
      alternativeRecipes: Object.fromEntries(settings.alternativeRecipes),
      nodeOverrides: includeOverridesOnShare ? Object.fromEntries(nodeOverrides) : {},
    };

    try {
      const url = generateShareURL(plan);
      setShareURL(url);
      setShowShareDialog(true);
      setCopySuccess(false);
    } catch (error) {
      alert(`${t("urlGenerationError")}: ${error}`);
    }
  };

  const handleCopyURL = async () => {
    const success = await copyToClipboard(shareURL);
    if (success) {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } else {
      alert(t("copyFailed"));
    }
  };

  return (
    <>
      <div className="flex gap-2">
        {/* Save Button */}
        <button
          data-testid="save-button"
          onClick={() => {
            setPlanName(getDefaultPlanName());
            setShowSaveDialog(true);
            setExportSuccessMessage("");
            setExportErrorMessage("");
          }}
          disabled={!selectedRecipe}
          className="px-4 py-2 bg-neon-green/30 border border-neon-green/50 text-white rounded-lg hover:bg-neon-green/40 hover:border-neon-green hover:shadow-[0_0_15px_rgba(0,255,136,0.4)] disabled:bg-dark-600 disabled:border-neon-green/20 disabled:text-space-400 disabled:cursor-not-allowed transition-all ripple-effect"
        >
          💾 {t("save")}
        </button>

        {/* Load Button */}
        <button
          data-testid="load-button"
          onClick={() => {
            setShowLoadDialog(true);
            setImportSuccessMessage("");
            setImportErrorMessage("");
          }}
          className="px-4 py-2 bg-neon-blue/30 border border-neon-blue/50 text-white rounded-lg hover:bg-neon-blue/40 hover:border-neon-blue hover:shadow-[0_0_15px_rgba(0,136,255,0.4)] transition-all ripple-effect"
        >
          📂 {t("load")}
        </button>

        {/* Share URL Button */}
        <button
          data-testid="url-share-button"
          onClick={handleShareURL}
          disabled={!selectedRecipe}
          className="px-4 py-2 bg-neon-purple/30 border border-neon-purple/50 text-white rounded-lg hover:bg-neon-purple/40 hover:border-neon-purple hover:shadow-[0_0_15px_rgba(168,85,247,0.4)] disabled:bg-dark-600 disabled:border-neon-purple/20 disabled:text-space-400 disabled:cursor-not-allowed transition-all ripple-effect"
        >
          🔗 {t("shareURL")}
        </button>
      </div>

      {/* Save/Export Dialog */}
      {showSaveDialog &&
        createPortal(
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-dark-700/95 backdrop-blur-md border-2 border-neon-green/40 rounded-xl shadow-[0_0_30px_rgba(0,255,136,0.3)] max-w-md w-full animate-fadeInScale">
              <h2 className="text-2xl font-bold mb-6 text-white drop-shadow-[0_0_8px_rgba(0,255,136,0.6)] flex items-center gap-2 px-6 pt-6">
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
                    value={planName}
                    onChange={e => setPlanName(e.target.value)}
                    placeholder={getDefaultPlanName()}
                    className="w-full px-3 py-2 border-2 border-neon-green/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-neon-green focus:border-neon-green bg-dark-800/50 text-white placeholder-gray-400 backdrop-blur-sm"
                  />
                </div>

                {/* Save to LocalStorage */}
                <button
                  data-testid="save-to-localstorage-button"
                  onClick={handleSaveToLocalStorage}
                  className="w-full px-4 py-2 bg-neon-green/20 border-2 border-neon-green/40 text-white rounded-lg hover:bg-neon-green/30 hover:border-neon-green hover:scale-105 active:scale-95 transition-all shadow-[0_0_10px_rgba(0,255,136,0.3)] hover:shadow-[0_0_15px_rgba(0,255,136,0.5)] ripple-effect font-medium"
                >
                  💾 {t("saveToLocalStorage")}
                </button>

                {/* Export Buttons */}
                <div>
                  <p className="text-sm font-semibold mb-3 text-neon-cyan">{t("exportToFile")}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      data-testid="export-json-button"
                      onClick={() => handleExport("json", planName || getDefaultPlanName())}
                      className="px-3 py-2 bg-green-500/20 border-2 border-green-500/40 text-white rounded-lg hover:bg-green-500/30 hover:border-green-500 hover:scale-105 active:scale-95 transition-all shadow-[0_0_10px_rgba(34,197,94,0.3)] hover:shadow-[0_0_15px_rgba(34,197,94,0.5)] ripple-effect text-sm font-medium"
                    >
                      JSON
                    </button>
                    <button
                      data-testid="export-markdown-button"
                      onClick={() => handleExport("markdown", planName || getDefaultPlanName())}
                      className="px-3 py-2 bg-purple-500/20 border-2 border-purple-500/40 text-white rounded-lg hover:bg-purple-500/30 hover:border-purple-500 hover:scale-105 active:scale-95 transition-all shadow-[0_0_10px_rgba(168,85,247,0.3)] hover:shadow-[0_0_15px_rgba(168,85,247,0.5)] ripple-effect text-sm font-medium"
                    >
                      Markdown
                    </button>
                    <button
                      data-testid="export-csv-button"
                      onClick={() => handleExport("csv", planName || getDefaultPlanName())}
                      className="px-3 py-2 bg-blue-500/20 border-2 border-blue-500/40 text-white rounded-lg hover:bg-blue-500/30 hover:border-blue-500 hover:scale-105 active:scale-95 transition-all shadow-[0_0_10px_rgba(59,130,246,0.3)] hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] ripple-effect text-sm font-medium"
                    >
                      CSV
                    </button>
                    <button
                      data-testid="export-excel-button"
                      onClick={() => handleExport("excel", planName || getDefaultPlanName())}
                      className="px-3 py-2 bg-green-600/20 border-2 border-green-600/40 text-white rounded-lg hover:bg-green-600/30 hover:border-green-600 hover:scale-105 active:scale-95 transition-all shadow-[0_0_10px_rgba(22,163,74,0.3)] hover:shadow-[0_0_15px_rgba(22,163,74,0.5)] ripple-effect text-sm font-medium"
                    >
                      Excel
                    </button>
                    <button
                      data-testid="export-image-button"
                      onClick={() =>
                        handleImageExport(planName || getDefaultPlanName(), {
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
                    checked={includeOverridesOnSave}
                    onChange={e => setIncludeOverridesOnSave(e.target.checked)}
                    className="h-4 w-4 accent-neon-green"
                  />
                  <label htmlFor="includeOverridesOnSave" className="text-sm text-white">
                    {t("includeNodeOverrides")}
                  </label>
                </div>

                {/* Export Success Message */}
                {exportSuccessMessage && (
                  <div
                    data-testid="export-success-message"
                    className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-500/50 rounded-lg text-sm text-green-800 dark:text-green-200 flex items-center justify-between"
                  >
                    <span>✅ {exportSuccessMessage}</span>
                    <button
                      onClick={() => setExportSuccessMessage("")}
                      className="ml-2 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Export Error Message */}
                {exportErrorMessage && (
                  <div
                    data-testid="export-error-message"
                    className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-500/50 rounded-lg text-sm text-red-800 dark:text-red-200 flex items-center justify-between"
                  >
                    <span>❌ {exportErrorMessage}</span>
                    <button
                      onClick={() => setExportErrorMessage("")}
                      className="ml-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
                    >
                      ✕
                    </button>
                  </div>
                )}

                <button
                  data-testid="save-dialog-close-button"
                  onClick={() => {
                    setShowSaveDialog(false);
                    setPlanName("");
                    setExportSuccessMessage("");
                    setExportErrorMessage("");
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
      {showLoadDialog &&
        createPortal(
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-dark-700/95 backdrop-blur-md border-2 border-neon-blue/40 rounded-xl shadow-[0_0_30px_rgba(0,136,255,0.3)] max-w-2xl w-full max-h-[80vh] overflow-y-auto animate-fadeInScale">
              <h2 className="text-2xl font-bold mb-6 text-white drop-shadow-[0_0_8px_rgba(0,136,255,0.6)] flex items-center gap-2 sticky top-0 bg-dark-700/95 backdrop-blur-md pb-4 border-b border-neon-blue/30 px-6 pt-6">
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
                        handleImportFile(file);
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
                  {importSuccessMessage && (
                    <div
                      data-testid="import-success-message"
                      className="mt-3 p-3 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-500/50 rounded-lg text-sm text-green-800 dark:text-green-200 flex items-center justify-between"
                    >
                      <span>✅ {importSuccessMessage}</span>
                      <button
                        onClick={() => setImportSuccessMessage("")}
                        className="ml-2 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  {/* Import Error Message */}
                  {importErrorMessage && (
                    <div
                      data-testid="import-error-message"
                      className="mt-3 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-500/50 rounded-lg text-sm text-red-800 dark:text-red-200 flex items-center justify-between"
                    >
                      <span>❌ {importErrorMessage}</span>
                      <button
                        onClick={() => setImportErrorMessage("")}
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
                      checked={mergeOverridesOnLoad}
                      onChange={e => setMergeOverridesOnLoad(e.target.checked)}
                      className="h-4 w-4 accent-neon-blue"
                    />
                    <label htmlFor="mergeOverridesOnLoad" className="text-sm text-white">
                      {t("mergeNodeOverridesOnLoad")}
                    </label>
                  </div>
                  {recentPlans.length === 0 ? (
                    <p className="text-space-200 text-sm">{t("noPlans")}</p>
                  ) : (
                    <div className="space-y-2">
                      {recentPlans.map(plan => (
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
                                  setSelectedPlanId(plan.planId || null);
                                  setShowVersionDialog(true);
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
                    setShowLoadDialog(false);
                    setImportSuccessMessage("");
                    setImportErrorMessage("");
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
      {showShareDialog &&
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
                    value={shareURL}
                    readOnly
                    className="flex-1 px-3 py-2 border-2 border-neon-purple/30 rounded-lg bg-dark-800/50 text-white text-sm font-mono backdrop-blur-sm"
                    onClick={e => e.currentTarget.select()}
                  />
                  <button
                    data-testid="copy-url-button"
                    onClick={handleCopyURL}
                    className={`px-4 py-2 rounded-lg text-white font-medium transition-all hover:scale-105 active:scale-95 ${
                      copySuccess
                        ? "bg-green-500/20 border-2 border-green-500/40 shadow-[0_0_15px_rgba(34,197,94,0.5)]"
                        : "bg-neon-blue/20 border-2 border-neon-blue/40 hover:bg-neon-blue/30 hover:border-neon-blue shadow-[0_0_10px_rgba(0,136,255,0.3)] hover:shadow-[0_0_15px_rgba(0,136,255,0.5)]"
                    } ripple-effect`}
                  >
                    {copySuccess ? `✓ ${t("copied")}` : `📋 ${t("copy")}`}
                  </button>
                </div>
              </div>

              {/* Include overrides in URL */}
              <div className="mb-4 flex items-center gap-2">
                <input
                  data-testid="include-overrides-on-share-checkbox"
                  id="includeOverridesOnShare"
                  type="checkbox"
                  checked={includeOverridesOnShare}
                  onChange={e => setIncludeOverridesOnShare(e.target.checked)}
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
                onClick={() => setShowShareDialog(false)}
                className="w-full px-4 py-2 bg-dark-800/50 border-2 border-space-500/40 text-white rounded-lg hover:bg-dark-800 hover:border-space-400 hover:scale-105 active:scale-95 transition-all ripple-effect font-medium"
              >
                {t("close")}
              </button>
            </div>
          </div>,
          document.body
        )}

      {/* Version History Dialog */}
      {showVersionDialog &&
        selectedPlanId &&
        createPortal(
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-dark-700/95 backdrop-blur-md border-2 border-purple-500/40 rounded-xl shadow-[0_0_30px_rgba(168,85,247,0.3)] max-w-2xl w-full max-h-[80vh] overflow-y-auto animate-fadeInScale">
              <h2 className="text-2xl font-bold mb-6 text-white drop-shadow-[0_0_8px_rgba(168,85,247,0.6)] flex items-center gap-2 px-6 pt-6">
                📚 {t("versionHistory")}
              </h2>

              <div className="px-6 pb-6 space-y-6">
                {(() => {
                  const versions = getPlanVersions(selectedPlanId);
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
                                    setDiffBaseVersion(versions[index - 1].version);
                                    setDiffCompareVersion(version.version);
                                    setShowDiffDialog(true);
                                  }}
                                  className="px-3 py-1 bg-yellow-500/20 border-2 border-yellow-500/40 text-white rounded-lg hover:bg-yellow-500/30 hover:border-yellow-500 hover:scale-105 active:scale-95 transition-all shadow-[0_0_10px_rgba(251,191,36,0.3)] hover:shadow-[0_0_15px_rgba(251,191,36,0.5)] ripple-effect text-sm font-medium"
                                >
                                  🔍 {t("compare")}
                                </button>
                              )}
                              <button
                                onClick={() => handleLoadVersion(selectedPlanId, version.version)}
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
                    setShowVersionDialog(false);
                    setSelectedPlanId(null);
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
      {showDiffDialog &&
        selectedPlanId &&
        diffBaseVersion !== null &&
        diffCompareVersion !== null &&
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
                      setShowDiffDialog(false);
                      setDiffBaseVersion(null);
                      setDiffCompareVersion(null);
                    }}
                    className="px-3 py-1 bg-red-500/20 border-2 border-red-500/40 text-white rounded-lg hover:bg-red-500/30 hover:border-red-500 hover:scale-105 active:scale-95 transition-all shadow-[0_0_10px_rgba(239,68,68,0.3)] hover:shadow-[0_0_15px_rgba(239,68,68,0.5)] ripple-effect text-sm font-medium"
                  >
                    {t("close")}
                  </button>
                </div>
              </div>

              <div className="px-6 pb-6 space-y-6">
                {(() => {
                  const baseVersion = loadPlanVersion(selectedPlanId, diffBaseVersion);
                  const compareVersion = loadPlanVersion(selectedPlanId, diffCompareVersion);

                  if (!baseVersion || !compareVersion) {
                    return <p className="text-red-300">{t("versionNotFound")}</p>;
                  }

                  const diffs = calculatePlanDiff(baseVersion, compareVersion);

                  return (
                    <>
                      <div className="bg-yellow-500/10 border-2 border-yellow-500/30 rounded-lg p-4">
                        <div className="text-sm text-yellow-200">
                          {t("comparingVersion")} {diffBaseVersion} → {t("version")}{" "}
                          {diffCompareVersion}
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
