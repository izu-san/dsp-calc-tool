import { useEffect, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameDataStore } from './stores/gameDataStore';
import { useRecipeSelectionStore } from './stores/recipeSelectionStore';
import { useSettingsStore } from './stores/settingsStore';
import { useNodeOverrideStore } from './stores/nodeOverrideStore';
import i18n from './i18n';
import { BackgroundEffects } from './components/Layout/BackgroundEffects';
import { Header } from './components/Layout/Header';
import { SettingsPanelSection } from './components/Layout/SettingsPanelSection';
import { RecipeSelectorSection } from './components/Layout/RecipeSelectorSection';
import { ProductionResultsPanel } from './components/Layout/ProductionResultsPanel';
import { useTreeCollapse } from './hooks/useTreeCollapse';
import { useProductionCalculation } from './hooks/useProductionCalculation';
import { getPlanFromURL } from './utils/urlShare';
import { restorePlan } from './utils/planExport';

const ModSettings = lazy(() => import('./components/ModSettings').then(m => ({ default: m.ModSettings })));
const WelcomeModal = lazy(() => import('./components/WelcomeModal').then(m => ({ default: m.WelcomeModal })));

function App() {
  const { t } = useTranslation();
  const { data, isLoading, error, loadData, locale } = useGameDataStore();
  const { selectedRecipe, targetQuantity, calculationResult, setSelectedRecipe, setTargetQuantity, setCalculationResult } = useRecipeSelectionStore();
  const { settings, updateSettings } = useSettingsStore();
  const { nodeOverrides, version: nodeOverridesVersion, setAllOverrides } = useNodeOverrideStore();
  
  const { collapsedNodes, isTreeExpanded, handleToggleCollapse, handleToggleAll } = useTreeCollapse(calculationResult);
  useProductionCalculation(selectedRecipe, targetQuantity, data, settings, nodeOverrides, nodeOverridesVersion, setCalculationResult);
  
  // 言語設定の同期とHTML lang属性の更新
  useEffect(() => {
    if (locale && i18n.language !== locale) {
      i18n.changeLanguage(locale);
    }
    document.documentElement.lang = locale;
  }, [locale]);
  
  // 言語変更時に選択されたレシピを新しいデータから再取得
  useEffect(() => {
    if (data && selectedRecipe) {
      const updatedRecipe = data.recipes.get(selectedRecipe.SID);
      if (updatedRecipe && updatedRecipe !== selectedRecipe) {
        setSelectedRecipe(updatedRecipe);
      }
    }
  }, [locale, data, selectedRecipe, setSelectedRecipe]);
  
  // ダークモードを永続的に有効化
  useEffect(() => {
    document.documentElement.classList.add('dark');
    document.documentElement.style.colorScheme = 'dark';
  }, []);

  // URLからプランを読み込む
  useEffect(() => {
    if (!data || selectedRecipe) return;

    const planFromURL = getPlanFromURL();
    if (planFromURL) {
      const recipe = data.recipes.get(planFromURL.recipeSID);
      if (recipe) {
        restorePlan(
          planFromURL,
          () => setSelectedRecipe(recipe),
          setTargetQuantity,
          updateSettings,
          setAllOverrides
        );
        
        const url = new URL(window.location.href);
        url.searchParams.delete('plan');
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, [data, selectedRecipe, setSelectedRecipe, setTargetQuantity, updateSettings, setAllOverrides]);
  
  // ゲームデータの読み込み
  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-500">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-blue shadow-neon-blue mx-auto"></div>
          <p className="mt-4 text-space-200">{t('loadingGameData')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-500">
        <div className="text-center">
          <div className="text-neon-orange text-xl mb-4">⚠ {t('error')}</div>
          <p className="text-space-200">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="min-h-screen bg-dark-500 relative">
      <BackgroundEffects />
      <Suspense fallback={null}>
        <ModSettings />
      </Suspense>
      <Header />

      <main className="max-w-[1920px] mx-auto px-4 py-6 sm:px-6 lg:px-8 relative z-10 mt-20">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <SettingsPanelSection
            selectedRecipe={selectedRecipe}
            targetQuantity={targetQuantity}
            setTargetQuantity={setTargetQuantity}
          />

          <div className="xl:col-span-3 space-y-6 animate-slideInRight">
            <RecipeSelectorSection
              recipes={Array.from(data.recipes.values())}
              selectedRecipeId={selectedRecipe?.SID}
              onRecipeSelect={setSelectedRecipe}
            />

            <ProductionResultsPanel
              calculationResult={calculationResult}
              selectedRecipe={selectedRecipe}
              collapsedNodes={collapsedNodes}
              isTreeExpanded={isTreeExpanded}
              handleToggleCollapse={handleToggleCollapse}
              handleToggleAll={handleToggleAll}
            />
          </div>
        </div>
      </main>

      <Suspense fallback={null}>
        <WelcomeModal />
      </Suspense>
    </div>
  );
}

export default App;
