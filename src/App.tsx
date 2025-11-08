import { useEffect, lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
import { useGameDataStore } from "./stores/gameDataStore";
import { useRecipeSelectionStore } from "./stores/recipeSelectionStore";
import { useSettingsStore } from "./stores/settingsStore";
import { useNodeOverrideStore } from "./stores/nodeOverrideStore";
import { useMiningSettingsStore } from "./stores/miningSettingsStore";
import i18n from "./i18n";
import { BackgroundEffects } from "./components/Layout/BackgroundEffects";
import { Header } from "./components/Layout/Header";

// Lazy load heavy layout components for better initial load performance
const SettingsPanelSection = lazy(() =>
  import("./components/Layout/SettingsPanelSection").then(module => ({
    default: module.SettingsPanelSection,
  }))
);
const RecipeSelectorSection = lazy(() =>
  import("./components/Layout/RecipeSelectorSection").then(module => ({
    default: module.RecipeSelectorSection,
  }))
);
const ProductionResultsPanel = lazy(() =>
  import("./components/Layout/ProductionResultsPanel").then(module => ({
    default: module.ProductionResultsPanel,
  }))
);
import { useTreeCollapse } from "./hooks/useTreeCollapse";
import { useProductionCalculation } from "./hooks/useProductionCalculation";
import { getPlanFromURL } from "./utils/urlShare";
import { restorePlan } from "./utils/planExport";

const ModSettings = lazy(() =>
  import("./components/ModSettings").then(m => ({ default: m.ModSettings }))
);
const WelcomeModal = lazy(() =>
  import("./components/WelcomeModal").then(m => ({ default: m.WelcomeModal }))
);

function App() {
  const { t } = useTranslation();
  const { data, isLoading, error, loadData, locale } = useGameDataStore();
  const {
    selectedRecipe,
    targetQuantity,
    calculationResult,
    setSelectedRecipe,
    setTargetQuantity,
    setCalculationResult,
  } = useRecipeSelectionStore();
  const { settings, updateSettings } = useSettingsStore();
  const { nodeOverrides, version: nodeOverridesVersion, setAllOverrides } = useNodeOverrideStore();
  const { settings: miningSettings } = useMiningSettingsStore();

  const { collapsedNodes, isTreeExpanded, handleToggleCollapse, handleToggleAll } =
    useTreeCollapse(calculationResult);
  useProductionCalculation(
    selectedRecipe,
    targetQuantity,
    data,
    settings,
    nodeOverrides,
    nodeOverridesVersion,
    miningSettings,
    setCalculationResult
  );

  // 言語設定の同期とHTML lang属性の更新
  useEffect(() => {
    if (locale && i18n.language !== locale) {
      void i18n.changeLanguage(locale);
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
    document.documentElement.classList.add("dark");
    document.documentElement.style.colorScheme = "dark";
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
        url.searchParams.delete("plan");
        window.history.replaceState({}, "", url.toString());
      }
    }
  }, [data, selectedRecipe, setSelectedRecipe, setTargetQuantity, updateSettings, setAllOverrides]);

  // ゲームデータの読み込み
  useEffect(() => {
    void loadData();
  }, [loadData]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-500">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-blue shadow-neon-blue mx-auto"></div>
          <p className="mt-4 text-space-200">{t("loadingGameData")}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-500">
        <div className="text-center">
          <div className="text-neon-orange text-xl mb-4">⚠ {t("error")}</div>
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
          <Suspense
            fallback={
              <div className="bg-dark-700/50 backdrop-blur-sm border border-neon-blue/30 rounded-lg p-6 animate-pulse">
                <div className="h-8 bg-dark-600 rounded mb-4"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-dark-600 rounded"></div>
                  <div className="h-4 bg-dark-600 rounded w-3/4"></div>
                </div>
              </div>
            }
          >
            <SettingsPanelSection
              selectedRecipe={selectedRecipe}
              targetQuantity={targetQuantity}
              setTargetQuantity={setTargetQuantity}
            />
          </Suspense>

          <div className="xl:col-span-3 space-y-6 animate-slideInRight">
            <Suspense
              fallback={
                <div className="bg-dark-700/50 backdrop-blur-sm border border-neon-blue/30 rounded-lg p-6 animate-pulse">
                  <div className="h-8 bg-dark-600 rounded mb-4"></div>
                  <div className="grid grid-cols-4 gap-4">
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="h-24 bg-dark-600 rounded"></div>
                    ))}
                  </div>
                </div>
              }
            >
              <RecipeSelectorSection
                recipes={Array.from(data.recipes.values())}
                selectedRecipeId={selectedRecipe?.SID}
                onRecipeSelect={setSelectedRecipe}
              />
            </Suspense>

            <Suspense
              fallback={
                <div className="bg-dark-700/50 backdrop-blur-sm border border-neon-blue/30 rounded-lg p-6 animate-pulse">
                  <div className="h-8 bg-dark-600 rounded mb-4"></div>
                  <div className="space-y-3">
                    <div className="h-32 bg-dark-600 rounded"></div>
                    <div className="h-32 bg-dark-600 rounded"></div>
                  </div>
                </div>
              }
            >
              <ProductionResultsPanel
                calculationResult={calculationResult}
                selectedRecipe={selectedRecipe}
                collapsedNodes={collapsedNodes}
                isTreeExpanded={isTreeExpanded}
                handleToggleCollapse={handleToggleCollapse}
                handleToggleAll={handleToggleAll}
              />
            </Suspense>
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
