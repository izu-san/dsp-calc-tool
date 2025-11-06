/**
 * i18n キーの型定義
 *
 * 階層構造のi18nキーに型安全性を提供します。
 * これにより、存在しないキーを参照した際にTypeScriptコンパイラが検出できます。
 *
 * ⚠️ ja.json に基づいて型定義を生成しています。
 * ja.json を更新した場合は、この型定義も更新される可能性があります。
 */

/**
 * 階層構造のi18nキー型
 *
 * この型は、ja.json / en.json の階層構造を反映しています。
 */
export type I18nKey =
  // common
  | `common.actions.${
      | "save"
      | "load"
      | "export"
      | "import"
      | "apply"
      | "cancel"
      | "close"
      | "reset"
      | "delete"
      | "undo"
      | "redo"
      | "show"
      | "hide"
      | "expand"
      | "collapse"
      | "select"
      | "compare"
      | "copy"
      | "overwrite"}`
  | `common.status.${
      | "saved"
      | "exported"
      | "copied"
      | "applied"
      | "created"
      | "updated"
      | "deleted"
      | "undone"
      | "redone"
      | "selected"
      | "calculating"
      | "verified"}`
  | `common.labels.${
      | "yes"
      | "none"
      | "only"
      | "items"
      | "type"
      | "mode"
      | "settings"
      | "template"
      | "unknown"
      | "current"
      | "version"
      | "versions"
      | "history"
      | "changes"
      | "action"
      | "method"
      | "efficiency"
      | "characters"
      | "units"
      | "each"
      | "required"
      | "time"
      | "total"
      | "source"
      | "metric"
      | "improvement"
      | "research"}`
  | `common.time.${"justNow" | "minutesAgo" | "hoursAgo" | "daysAgo"}`
  | `common.ranks.${"mk1" | "mk2" | "mk3"}`
  | `common.units.${"perMinute" | "itemPerSecond" | "itemsPerSecond"}`
  // header
  | `header.${"title" | "help" | "changeLanguage"}`
  // recipe
  | `recipe.selector.${
      | "title"
      | "searchPlaceholder"
      | "pleaseSelect"
      | "noSelected"
      | "notFound"
      | "targetQuantity"
      | "target"}`
  | `recipe.labels.${
      | "recipe"
      | "recipes"
      | "alternativeRecipe"
      | "alternativeRecipes"
      | "defaultRecipe"
      | "unknownRecipe"}`
  | "recipe.actions.compare"
  | `recipe.comparison.${
      | "title"
      | "comparingMethods"
      | "basedOnProducing"
      | "selectPreferredDesc"
      | "noAlternativesFound"
      | "efficiencyCalculation"
      | "mostEfficient"
      | "starIndicates"
      | "defaultOption"}`
  | `recipe.categories.${
      | "all"
      | "smelt"
      | "assemble"
      | "chemical"
      | "research"
      | "refine"
      | "particle"
      | "fractionate"
      | "photonGeneration"}`
  | `recipe.search.${
      | "suggestions"
      | "noResults"
      | "trySearching"
      | "hintRecipeNames"
      | "hintMaterialNames"
      | "hintProductNames"
      | "hintRecipeIDs"
      | "found"
      | "for"
      | "searchingIn"}`
  | `recipe.favorites.${"title" | "add" | "remove"}`
  // production
  | `production.tree.${"title" | "expandAll" | "collapseAll" | "requiredRate" | "machineCount"}`
  | `production.labels.${
      | "inputs"
      | "outputs"
      | "production"
      | "consumption"
      | "net"
      | "productionRate"
      | "output"
      | "speed"
      | "inputItems"
      | "outputItems"}`
  | `production.modes.${"production" | "speed" | "productionOK"}`
  | `production.statistics.${
      | "title"
      | "selectRecipe"
      | "overview"
      | "totalMachines"
      | "itemsProduced"
      | "intermediateProducts"
      | "finalProducts"
      | "item"}`
  | `production.rawMaterials.${
      | "title"
      | "noRequired"
      | "externalSupply"
      | "breakdown"
      | "mining"
      | "external"
      | "noInputs"}`
  | `production.bottlenecks.${
      | "title"
      | "detected"
      | "detectedMultiple"
      | "none"
      | "inefficiencies"
      | "smooth"
      | "fixAll"
      | "fixNow"}`
  | "production.multiOutput.title"
  // settings
  | `settings.global.${
      | "current"
      | "withCurrent"
      | "overwriteWithCurrent"
      | "applySettings"
      | "resetToGlobal"}`
  | `settings.proliferator.${
      | "label"
      | "type"
      | "mode"
      | "multiplier"
      | "mk1"
      | "mk2"
      | "mk3"
      | "exclusive"
      | "productionDisabled"
      | "productionDisabledDesc"
      | "notAllowed"
      | "activeEffects"
      | "productionBonus"
      | "speedBonus"
      | "powerIncrease"
      | "boost"}`
  | `settings.machines.${
      | "rank"
      | "selectRankDesc"
      | "fixedNoVariants"
      | "machine"
      | "production"
      | "label"
      | "type"
      | "miningMachine"
      | "advancedMiningMachine"
      | "miningMachines"
      | "miningEquipment"}`
  | `settings.machines.types.${
      | "smelter"
      | "assembler"
      | "chemicalPlant"
      | "matrixLab"
      | "oilRefinery"
      | "particleCollider"
      | "arcSmelter"
      | "planeSmelter"
      | "negentropySmelter"
      | "assemblingMachineMk1"
      | "assemblingMachineMk2"
      | "assemblingMachineMk3"
      | "recomposingAssembler"
      | "chemicalPlantStandard"
      | "quantumChemicalPlant"
      | "matrixLabStandard"
      | "selfEvolutionLab"
      | "miniatureParticleCollider"}`
  | `settings.conveyorBelt.${
      | "label"
      | "plural"
      | "belt"
      | "belts"
      | "total"
      | "totalSpeed"
      | "tier"
      | "selectDesc"
      | "saturationAt"
      | "saturation"}`
  | `settings.sorter.${
      | "label"
      | "plural"
      | "rank"
      | "mk1"
      | "mk2"
      | "mk3"
      | "piling"
      | "mk1OrHigher"
      | "currentTier"}`
  | `settings.stacks.${"count" | "stacks"}`
  | "settings.logistics.label"
  | `settings.node.${
      | "title"
      | "overrides"
      | "useCustom"
      | "overrideGlobal"
      | "usingGlobal"
      | "enableCustom"}`
  | `settings.templates.${
      | "earlyGame"
      | "midGame"
      | "lateGame"
      | "endGame"
      | "powerSaver"
      | "earlyGameDesc"
      | "midGameDesc"
      | "lateGameDesc"
      | "endGameDesc"
      | "powerSaverDesc"
      | "apply"
      | "applyQuestion"}`
  | `settings.customTemplates.${
      | "title"
      | "create"
      | "edit"
      | "delete"
      | "name"
      | "note"
      | "emptyState"
      | "maxReached"
      | "duplicateName"
      | "confirmOverwrite"
      | "templateName"
      | "templateNote"}`
  | `settings.photonGeneration.${
      | "label"
      | "rayReceiver"
      | "criticalPhoton"
      | "gravitonLens"
      | "useGravitonLens"
      | "gravitonLensProliferator"
      | "rayTransmissionEfficiency"
      | "rayTransmissionEfficiencyValue"
      | "continuousReception"
      | "researchLevel"
      | "continuousReceptionFixed"}`
  // power
  | `power.${
      | "label"
      | "consumption"
      | "consumptionKW"
      | "total"
      | "totalConsumption"
      | "normal"
      | "dysonSphere"
      | "dysonSphereNote"
      | "distribution"
      | "breakdown"
      | "noData"
      | "multiplier"
      | "standard"
      | "mining"}`
  | `power.graph.${"title" | "change"}`
  | `power.generation.${string}` // 多数のサブキーがあるため簡略化
  // mining
  | `mining.calculator.${string}` // 多数のサブキーがあるため簡略化
  // building
  | `building.cost.${"title" | "selectRecipe" | "totalRequirements"}`
  | `building.roadmap.${string}` // 多数のサブキーがあるため簡略化
  // plan
  | `plan.manager.${string}`
  | `plan.share.${string}`
  | `plan.version.${string}`
  // whatIf
  | `whatIf.${string}`
  // visualization
  | `visualization.${string}`
  // modSettings
  | `modSettings.${string}`
  // errors
  | `errors.${string}`
  // history
  | `history.${string}`
  // help
  | `help.${string}`
  // welcome
  | `welcome.${string}`
  // errorUI
  | `errorUI.${string}`
  // dataLoading
  | "dataLoading.loadingGameData";

/**
 * i18next の t() 関数に型安全性を提供するための宣言
 *
 * Note: 実際の型定義は react-i18next の型定義ファイルで上書きが必要だが、
 * 現時点ではこのファイルに記載することで、IDEの補完サポートを提供する。
 */
declare module "react-i18next" {
  interface CustomTypeOptions {
    // カスタム型オプション
    defaultNS: "translation";
    resources: {
      translation: Record<string, unknown>;
    };
  }
}
