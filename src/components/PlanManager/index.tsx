import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useGameDataStore } from '../../stores/gameDataStore';
import { useRecipeSelectionStore } from '../../stores/recipeSelectionStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useNodeOverrideStore } from '../../stores/nodeOverrideStore';
import type { SavedPlan } from '../../types';
import {
  restorePlan,
  savePlanToLocalStorage,
  getRecentPlans,
  loadPlanFromLocalStorage,
  deletePlanFromLocalStorage,
} from '../../utils/planExport';
import { generateShareURL, copyToClipboard } from '../../utils/urlShare';
import { transformToExportData } from '../../lib/export/dataTransformer';
import { exportToMarkdown } from '../../lib/export/markdownExporter';
import { generateExportFilename } from '../../lib/export/filenameGenerator';
import { importFromMarkdown } from '../../lib/import/markdownImporter';
import { validatePlanInfo } from '../../lib/import/validation';
import { buildPlanFromImport } from '../../lib/import/planBuilder';
import { parseExportDataFromJSON, buildSavedPlanFromExportData } from '../../lib/import/jsonImporter';

export function PlanManager() {
  const { t } = useTranslation();
  const { data } = useGameDataStore();
  const { selectedRecipe, targetQuantity, calculationResult, setSelectedRecipe, setTargetQuantity } = useRecipeSelectionStore();
  const { settings, updateSettings, powerGenerationTemplate, manualPowerGenerator, manualPowerFuel, powerFuelProliferator } = useSettingsStore();
  const { nodeOverrides, setAllOverrides } = useNodeOverrideStore();
  
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareURL, setShareURL] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [planName, setPlanName] = useState('');
  const [recentPlans, setRecentPlans] = useState(getRecentPlans());
  const fileInputRef = useRef<HTMLInputElement>(null);
  // New options for overrides handling
  const [includeOverridesOnSave, setIncludeOverridesOnSave] = useState(true);
  const [includeOverridesOnShare, setIncludeOverridesOnShare] = useState(true);
  const [mergeOverridesOnLoad, setMergeOverridesOnLoad] = useState(false);

  // Generate default plan name with date and time
  const getDefaultPlanName = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `Plan_${year}-${month}-${day}_${hours}-${minutes}`;
  };

  const handleExport = async (format: 'json' | 'markdown', name: string) => {
    if (!selectedRecipe) {
      alert(t('pleaseSelectRecipe'));
      return;
    }

    try {
      if (format === 'json') {
        // JSON エクスポート（Markdownと同じExportData形式）
        if (!calculationResult) {
          alert(t('pleaseCalculateFirst'));
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

        const filename = generateExportFilename(name, 'json');

        // ダウンロード
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else if (format === 'markdown') {
        // Markdown エクスポート
        if (!calculationResult) {
          alert(t('pleaseCalculateFirst'));
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

        const markdown = exportToMarkdown(exportData);
        const filename = generateExportFilename(name, 'md');

        // ダウンロード
        const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      setShowSaveDialog(false);
      setPlanName('');
      alert(t('exported'));
    } catch (error) {
      console.error('Export error:', error);
      alert(`${t('exportError')}: ${error}`);
    }
  };

  const handleSaveToLocalStorage = () => {
    if (!selectedRecipe) {
      alert(t('pleaseSelectRecipe'));
      return;
    }

    const plan: SavedPlan = {
      name: planName || getDefaultPlanName(),
      timestamp: Date.now(),
      recipeSID: selectedRecipe.SID,
      targetQuantity,
      settings,
      alternativeRecipes: Object.fromEntries(settings.alternativeRecipes),
      nodeOverrides: includeOverridesOnSave
        ? Object.fromEntries(nodeOverrides)
        : {},
    };

    savePlanToLocalStorage(plan);
    setRecentPlans(getRecentPlans());
    setShowSaveDialog(false);
    setPlanName('');
    alert(t('saved'));
  };

  const handleImportFile = async (file: File) => {
    if (!file) return;

    try {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      let plan: SavedPlan | null = null;

      if (fileExtension === 'json') {
        // JSON インポート（新しいExportData形式）
        if (!data) {
          alert(t('gameDataNotLoaded'));
          return;
        }

        const text = await file.text();
        const exportData = parseExportDataFromJSON(text);
        plan = buildSavedPlanFromExportData(exportData, data, settings);
      } else if (fileExtension === 'md' || fileExtension === 'markdown') {
        // Markdown インポート
        if (!data) {
          alert(t('gameDataNotLoaded'));
          return;
        }

        const text = await file.text();
        const importResult = importFromMarkdown(text);

        if (!importResult.success) {
          const errors = importResult.errors.map(e => e.message).join('\n');
          alert(`${t('importError')}:\n${errors}`);
          return;
        }

        // 部分的なデータから SavedPlan を構築
        const planInfo = {
          name: importResult.extractedData.planName || file.name.replace(/\.(md|markdown)$/i, ''),
          timestamp: importResult.extractedData.timestamp || Date.now(),
          recipeSID: importResult.extractedData.recipeSID || 0,
          recipeName: importResult.extractedData.recipeName || '',
          targetQuantity: importResult.extractedData.targetQuantity || 1,
        };

        // 検証
        const validation = validatePlanInfo(planInfo, data);
        if (!validation.isValid) {
          const errors = validation.errors.map(e => e.message).join('\n');
          alert(`${t('validationError')}:\n${errors}`);
          return;
        }

        // SavedPlan を構築（現在の設定をフォールバックとして渡す）
        plan = buildPlanFromImport(planInfo, data, settings);
        if (!plan) {
          alert(t('planBuildError'));
          return;
        }

        // 警告があれば表示
        if (validation.warnings.length > 0) {
          const warnings = validation.warnings.map(w => w.message).join('\n');
          console.warn(`Import warnings:\n${warnings}`);
        }
      } else {
        alert(t('unsupportedFileFormat'));
        return;
      }

      if (!plan) {
        alert(t('importError'));
        return;
      }

      // Validate recipe exists
      if (!data) {
        alert(t('gameDataNotLoaded'));
        return;
      }

      const recipe = data.recipes.get(plan.recipeSID);
      if (!recipe) {
        alert(`${t('recipeNotFound')}: ${plan.recipeSID}`);
        return;
      }

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

      alert(`${t('planLoaded', { name: plan.name })}`);
    } catch (error) {
      console.error('Import error:', error);
      alert(`${t('loadError')}: ${error}`);
    }
  };

  const handleLoadFromLocalStorage = (key: string) => {
    const plan = loadPlanFromLocalStorage(key);
    if (!plan) {
      alert(t('planNotFound'));
      return;
    }

    if (!data) {
      alert(t('gameDataNotLoaded'));
      return;
    }

    const recipe = data.recipes.get(plan.recipeSID);
    if (!recipe) {
      alert(`${t('recipeNotFound')}: ${plan.recipeSID}`);
      return;
    }

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

    setShowLoadDialog(false);
    alert(`${t('planLoaded', { name: plan.name })}`);
  };

  const handleDeletePlan = (key: string) => {
    if (confirm(t('confirmDeletePlan'))) {
      deletePlanFromLocalStorage(key);
      setRecentPlans(getRecentPlans());
    }
  };

  const handleShareURL = () => {
    if (!selectedRecipe) {
      alert(t('pleaseSelectRecipe'));
      return;
    }

    const plan: SavedPlan = {
      name: planName || getDefaultPlanName(),
      timestamp: Date.now(),
      recipeSID: selectedRecipe.SID,
      targetQuantity,
      settings,
      alternativeRecipes: Object.fromEntries(settings.alternativeRecipes),
      nodeOverrides: includeOverridesOnShare
        ? Object.fromEntries(nodeOverrides)
        : {},
    };

    try {
      const url = generateShareURL(plan);
      setShareURL(url);
      setShowShareDialog(true);
      setCopySuccess(false);
    } catch (error) {
      alert(`${t('urlGenerationError')}: ${error}`);
    }
  };

  const handleCopyURL = async () => {
    const success = await copyToClipboard(shareURL);
    if (success) {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } else {
      alert(t('copyFailed'));
    }
  };

  return (
    <>
      <div className="flex gap-2">
        {/* Save Button */}
        <button
          onClick={() => setShowSaveDialog(true)}
          disabled={!selectedRecipe}
          className="px-4 py-2 bg-neon-green/30 border border-neon-green/50 text-white rounded-lg hover:bg-neon-green/40 hover:border-neon-green hover:shadow-[0_0_15px_rgba(0,255,136,0.4)] disabled:bg-dark-600 disabled:border-neon-green/20 disabled:text-space-400 disabled:cursor-not-allowed transition-all ripple-effect"
        >
          💾 {t('save')}
        </button>

        {/* Load Button */}
        <button
          onClick={() => setShowLoadDialog(true)}
          className="px-4 py-2 bg-neon-blue/30 border border-neon-blue/50 text-white rounded-lg hover:bg-neon-blue/40 hover:border-neon-blue hover:shadow-[0_0_15px_rgba(0,136,255,0.4)] transition-all ripple-effect"
        >
          📂 {t('load')}
        </button>

        {/* Share URL Button */}
        <button
          onClick={handleShareURL}
          disabled={!selectedRecipe}
          className="px-4 py-2 bg-neon-purple/30 border border-neon-purple/50 text-white rounded-lg hover:bg-neon-purple/40 hover:border-neon-purple hover:shadow-[0_0_15px_rgba(168,85,247,0.4)] disabled:bg-dark-600 disabled:border-neon-purple/20 disabled:text-space-400 disabled:cursor-not-allowed transition-all ripple-effect"
        >
          🔗 {t('shareURL')}
        </button>
      </div>

      {/* Save/Export Dialog */}
      {showSaveDialog && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4 dark:text-white">{t('save')}</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 dark:text-gray-300">
                {t('planName')}
              </label>
              <input
                type="text"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                placeholder={getDefaultPlanName()}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
              />
            </div>

            {/* Save to LocalStorage */}
            <button
              onClick={handleSaveToLocalStorage}
              className="w-full mb-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
            >
              💾 {t('saveToLocalStorage')}
            </button>

            {/* Export Buttons */}
            <div className="mb-4">
              <p className="text-sm font-medium mb-2 dark:text-gray-300">{t('exportToFile')}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleExport('json', planName || getDefaultPlanName())}
                  className="flex-1 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-sm"
                >
                  JSON
                </button>
                <button
                  onClick={() => handleExport('markdown', planName || getDefaultPlanName())}
                  className="flex-1 px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600 text-sm"
                >
                  Markdown
                </button>
              </div>
            </div>

            {/* Include overrides option */}
            <div className="mb-4 flex items-center gap-2">
              <input
                id="includeOverridesOnSave"
                type="checkbox"
                checked={includeOverridesOnSave}
                onChange={(e) => setIncludeOverridesOnSave(e.target.checked)}
                className="h-4 w-4"
              />
              <label htmlFor="includeOverridesOnSave" className="text-sm dark:text-gray-200">
                {t('includeNodeOverrides')}
              </label>
            </div>

            <button
              onClick={() => {
                setShowSaveDialog(false);
                setPlanName('');
              }}
              className="w-full px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded hover:bg-gray-400 dark:hover:bg-gray-600"
            >
              {t('cancel')}
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Load/Import Dialog */}
      {showLoadDialog && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 dark:text-white">{t('load')}</h2>
            
            {/* File Import */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2 dark:text-gray-300">
                {t('loadFromFile')}
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.md,.markdown"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleImportFile(file);
                    // Reset file input
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t('supportedFormats')}: JSON (.json), Markdown (.md)
              </p>
            </div>

            {/* Recent Plans */}
            <div>
              <h3 className="text-lg font-semibold mb-2 dark:text-white">{t('recentPlans')}</h3>
              {/* Merge overrides option */}
              <div className="mb-3 flex items-center gap-2">
                <input
                  id="mergeOverridesOnLoad"
                  type="checkbox"
                  checked={mergeOverridesOnLoad}
                  onChange={(e) => setMergeOverridesOnLoad(e.target.checked)}
                  className="h-4 w-4"
                />
                <label htmlFor="mergeOverridesOnLoad" className="text-sm dark:text-gray-200">
                  {t('mergeNodeOverridesOnLoad')}
                </label>
              </div>
              {recentPlans.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm">{t('noPlans')}</p>
              ) : (
                <div className="space-y-2">
                  {recentPlans.map((plan) => (
                    <div
                      key={plan.key}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-650"
                    >
                      <div className="flex-1">
                        <div className="font-medium dark:text-white">{plan.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(plan.timestamp).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleLoadFromLocalStorage(plan.key)}
                          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-sm"
                        >
                          {t('load')}
                        </button>
                        <button
                          onClick={() => handleDeletePlan(plan.key)}
                          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 text-sm"
                        >
                          {t('delete')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => setShowLoadDialog(false)}
              className="w-full mt-4 px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded hover:bg-gray-400 dark:hover:bg-gray-600"
            >
              {t('close')}
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Share URL Dialog */}
      {showShareDialog && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full">
            <h2 className="text-xl font-bold mb-4 dark:text-white">🔗 {t('shareURL')}</h2>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {t('shareUrlDescription')}
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 dark:text-gray-300">
                {t('sharedUrl')}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareURL}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 dark:text-white text-sm font-mono"
                  onClick={(e) => e.currentTarget.select()}
                />
                <button
                  onClick={handleCopyURL}
                  className={`px-4 py-2 rounded text-white font-medium transition-colors ${
                    copySuccess 
                      ? 'bg-green-600 dark:bg-green-700' 
                      : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600'
                  }`}
                >
                  {copySuccess ? `✓ ${t('copied')}` : `📋 ${t('copy')}`}
                </button>
              </div>
            </div>

            {/* Include overrides in URL */}
            <div className="mb-4 flex items-center gap-2">
              <input
                id="includeOverridesOnShare"
                type="checkbox"
                checked={includeOverridesOnShare}
                onChange={(e) => setIncludeOverridesOnShare(e.target.checked)}
                className="h-4 w-4"
              />
              <label htmlFor="includeOverridesOnShare" className="text-sm dark:text-gray-200">
                {t('includeNodeOverridesInURL')}
              </label>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3 mb-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                {t('urlWarning')}
              </p>
            </div>

            <button
              onClick={() => setShowShareDialog(false)}
              className="w-full px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded hover:bg-gray-400 dark:hover:bg-gray-600"
            >
              {t('close')}
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
