/**
 * i18n キー移行スクリプト
 *
 * ⚠️ このスクリプトは移行完了済み（2025-11-06）です。
 * 今後は実行する必要はありません。記録として残しています。
 *
 * フラットな構造から階層構造への移行を自動化します。
 * - 旧キーから新キーへのマッピングを定義（561キー）
 * - TypeScriptファイル内の t() 呼び出しを自動変換
 * - 動的キー生成（テンプレート文字列）は手動で対応
 *
 * 実行結果:
 * - 190ファイルを処理
 * - 20箇所を自動変換
 * - 動的キー生成7箇所を手動修正
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * 旧キーから新キーへのマッピング
 * 完全なマッピングを定義 (561キー)
 */
export const KEY_MAPPING: Record<string, string> = {
  // ============================================
  // common (共通アクション)
  // ============================================
  save: "common.actions.save",
  load: "common.actions.load",
  export: "common.actions.export",
  import: "common.actions.import",
  apply: "common.actions.apply",
  cancel: "common.actions.cancel",
  close: "common.actions.close",
  reset: "common.actions.reset",
  delete: "common.actions.delete",
  undo: "common.actions.undo",
  redo: "common.actions.redo",
  show: "common.actions.show",
  hide: "common.actions.hide",
  expand: "common.actions.expand",
  collapse: "common.actions.collapse",
  select: "common.actions.select",
  compare: "common.actions.compare",
  copy: "common.actions.copy",
  overwrite: "common.actions.overwrite",

  // common.status
  saved: "common.status.saved",
  exported: "common.status.exported",
  copied: "common.status.copied",
  applied: "common.status.applied",
  created: "common.status.created",
  updated: "common.status.updated",
  deleted: "common.status.deleted",
  undone: "common.status.undone",
  redone: "common.status.redone",
  selected: "common.status.selected",
  calculating: "common.status.calculating",
  verified: "common.status.verified",

  // common.labels
  yes: "common.labels.yes",
  none: "common.labels.none",
  only: "common.labels.only",
  items: "common.labels.items",
  type: "common.labels.type",
  mode: "common.labels.mode",
  settings: "common.labels.settings",
  template: "common.labels.template",
  unknown: "common.labels.unknown",
  current: "common.labels.current",
  version: "common.labels.version",
  versions: "common.labels.versions",
  history: "common.labels.history",
  changes: "common.labels.changes",
  action: "common.labels.action",
  method: "common.labels.method",
  efficiency: "common.labels.efficiency",
  characters: "common.labels.characters",
  units: "common.labels.units",
  each: "common.labels.each",
  required: "common.labels.required",
  time: "common.labels.time",
  total: "common.labels.total",
  source: "common.labels.source",
  metric: "common.labels.metric",
  improvement: "common.labels.improvement",

  // common.time
  justNow: "common.time.justNow",
  minutesAgo: "common.time.minutesAgo",
  hoursAgo: "common.time.hoursAgo",
  daysAgo: "common.time.daysAgo",

  // common.ranks
  mk1: "common.ranks.mk1",
  mk2: "common.ranks.mk2",
  mk3: "common.ranks.mk3",

  // common.units
  perMinute: "common.units.perMinute",
  itemPerSecond: "common.units.itemPerSecond",
  itemsPerSecond: "common.units.itemsPerSecond",

  // ============================================
  // header (ヘッダー)
  // ============================================
  title: "header.title",
  help: "header.help",
  changeLanguage: "header.changeLanguage",

  // ============================================
  // recipe (レシピ)
  // ============================================
  selectRecipe: "recipe.selector.title",
  searchRecipesItemsMaterials: "recipe.selector.searchPlaceholder",
  pleaseSelectRecipe: "recipe.selector.pleaseSelect",
  noRecipeSelected: "recipe.selector.noSelected",
  recipeNotFound: "recipe.selector.notFound",
  targetQuantity: "recipe.selector.targetQuantity",
  target: "recipe.selector.target",
  recipe: "recipe.labels.recipe",
  recipes: "recipe.labels.recipes",
  alternativeRecipe: "recipe.labels.alternativeRecipe",
  alternativeRecipes: "recipe.labels.alternativeRecipes",
  defaultRecipe: "recipe.labels.defaultRecipe",
  unknownRecipe: "recipe.labels.unknownRecipe",
  compareRecipes: "recipe.actions.compare",
  recipeComparison: "recipe.comparison.title",
  comparingProductionMethods: "recipe.comparison.comparingMethods",
  comparisonBasedOnProducing: "recipe.comparison.basedOnProducing",
  selectPreferredRecipesDesc: "recipe.comparison.selectPreferredDesc",
  noAlternativeRecipesFound: "recipe.comparison.noAlternativesFound",
  efficiencyScoreCalculation: "recipe.comparison.efficiencyCalculation",
  mostEfficient: "recipe.comparison.mostEfficient",
  starIndicatesMostEfficient: "recipe.comparison.starIndicates",

  // recipe.categories
  categoryAll: "recipe.categories.all",
  categorySmelt: "recipe.categories.smelt",
  categoryAssemble: "recipe.categories.assemble",
  categoryChemical: "recipe.categories.chemical",
  categoryResearch: "recipe.categories.research",
  categoryRefine: "recipe.categories.refine",
  categoryParticle: "recipe.categories.particle",
  categoryFractionate: "recipe.categories.fractionate",
  categoryPhotonGeneration: "recipe.categories.photonGeneration",

  // recipe.search
  suggestions: "recipe.search.suggestions",
  noResultsFound: "recipe.search.noResults",
  trySearchingFor: "recipe.search.trySearching",
  searchHintRecipeNames: "recipe.search.hintRecipeNames",
  searchHintMaterialNames: "recipe.search.hintMaterialNames",
  searchHintProductNames: "recipe.search.hintProductNames",
  searchHintRecipeIDs: "recipe.search.hintRecipeIDs",
  found: "recipe.search.found",
  for: "recipe.search.for",
  searchingInNamesIDsInputsOutputs: "recipe.search.searchingIn",

  // recipe.favorites
  favorites: "recipe.favorites.title",
  addToFavorites: "recipe.favorites.add",
  removeFromFavorites: "recipe.favorites.remove",

  // ============================================
  // production (生産)
  // ============================================
  productionTree: "production.tree.title",
  expandAll: "production.tree.expandAll",
  collapseAll: "production.tree.collapseAll",
  requiredRate: "production.tree.requiredRate",
  machineCount: "production.tree.machineCount",
  inputs: "production.labels.inputs",
  outputs: "production.labels.outputs",
  production: "production.labels.production",
  consumption: "production.labels.consumption",
  net: "production.labels.net",
  productionRate: "production.labels.productionRate",
  output: "production.labels.output",
  speed: "production.labels.speed",
  productionMode: "production.modes.production",
  speedMode: "production.modes.speed",
  productionModeOK: "production.modes.productionOK",

  // production.statistics
  statistics: "production.statistics.title",
  productionStatistics: "production.statistics.title",
  selectRecipeToSeeStats: "production.statistics.selectRecipe",
  productionOverview: "production.statistics.overview",
  totalMachines: "production.statistics.totalMachines",
  itemsProduced: "production.statistics.itemsProduced",
  intermediateProducts: "production.statistics.intermediateProducts",
  finalProducts: "production.statistics.finalProducts",
  item: "production.statistics.item",

  // production.rawMaterials
  rawMaterials: "production.rawMaterials.title",
  noRawMaterialsRequired: "production.rawMaterials.noRequired",
  externalSupplyCircular: "production.rawMaterials.externalSupply",
  materialBreakdown: "production.rawMaterials.breakdown",
  mining: "production.rawMaterials.mining",
  external: "production.rawMaterials.external",
  noInputsRequired: "production.rawMaterials.noInputs",

  // production.bottlenecks
  bottlenecks: "production.bottlenecks.title",
  bottleneckDetected: "production.bottlenecks.detected",
  bottlenecksDetected: "production.bottlenecks.detectedMultiple",
  noBottlenecksDetected: "production.bottlenecks.none",
  productionChainInefficiencies: "production.bottlenecks.inefficiencies",
  productionChainSmooth: "production.bottlenecks.smooth",
  fixAll: "production.bottlenecks.fixAll",
  fixNow: "production.bottlenecks.fixNow",
  fixAllBottlenecks: "production.bottlenecks.fixAll",

  // production.multiOutput
  multiOutputResults: "production.multiOutput.title",

  // ============================================
  // settings (設定)
  // ============================================
  // settings.global
  currentSettings: "settings.global.current",
  withCurrentSettings: "settings.global.withCurrent",
  overwriteWithCurrentSettings: "settings.global.overwriteWithCurrent",
  applySettings: "settings.global.applySettings",
  resetToGlobal: "settings.global.resetToGlobal",

  // settings.proliferator
  proliferator: "settings.proliferator.label",
  proliferatorType: "settings.proliferator.type",
  proliferatorMode: "settings.proliferator.mode",
  proliferatorMultiplier: "settings.proliferator.multiplier",
  proliferatorMK1: "settings.proliferator.MK1",
  proliferatorMK2: "settings.proliferator.MK2",
  proliferatorMK3: "settings.proliferator.MK3",
  exclusive: "settings.proliferator.exclusive",
  productionModeDisabled: "settings.proliferator.productionDisabled",
  productionModeDisabledDescription: "settings.proliferator.productionDisabledDesc",
  notAllowed: "settings.proliferator.notAllowed",
  activeEffects: "settings.proliferator.activeEffects",
  productionBonus: "settings.proliferator.productionBonus",
  speedBonus: "settings.proliferator.speedBonus",
  powerIncrease: "settings.proliferator.powerIncrease",
  boost: "settings.proliferator.boost",

  // settings.machines
  machineRank: "settings.machines.rank",
  selectMachineRankDesc: "settings.machines.selectRankDesc",
  fixedNoVariants: "settings.machines.fixedNoVariants",
  machine: "settings.machines.machine",
  productionMachines: "settings.machines.production",
  machines: "settings.machines.label",
  machineType: "settings.machines.type",
  miningMachine: "settings.machines.miningMachine",
  advancedMiningMachine: "settings.machines.advancedMiningMachine",
  miningMachines: "settings.machines.miningMachines",
  miningEquipment: "settings.machines.miningEquipment",

  // settings.machines.types
  smelter: "settings.machines.types.smelter",
  assembler: "settings.machines.types.assembler",
  chemicalPlant: "settings.machines.types.chemicalPlant",
  matrixLab: "settings.machines.types.matrixLab",
  oilRefinery: "settings.machines.types.oilRefinery",
  particleCollider: "settings.machines.types.particleCollider",
  arcSmelter: "settings.machines.types.arcSmelter",
  planeSmelter: "settings.machines.types.planeSmelter",
  negentropySmelter: "settings.machines.types.negentropySmelter",
  assemblingMachineMk1: "settings.machines.types.assemblingMachineMk1",
  assemblingMachineMk2: "settings.machines.types.assemblingMachineMk2",
  assemblingMachineMk3: "settings.machines.types.assemblingMachineMk3",
  recomposingAssembler: "settings.machines.types.recomposingAssembler",
  chemicalPlantStandard: "settings.machines.types.chemicalPlantStandard",
  quantumChemicalPlant: "settings.machines.types.quantumChemicalPlant",
  matrixLabStandard: "settings.machines.types.matrixLabStandard",
  selfEvolutionLab: "settings.machines.types.selfEvolutionLab",
  miniatureParticleCollider: "settings.machines.types.miniatureParticleCollider",

  // settings.conveyorBelt
  conveyorBelt: "settings.conveyorBelt.label",
  conveyorBelts: "settings.conveyorBelt.plural",
  belt: "settings.conveyorBelt.belt",
  belts: "settings.conveyorBelt.belts",
  totalBelts: "settings.conveyorBelt.total",
  totalBeltSpeed: "settings.conveyorBelt.totalSpeed",
  beltTier: "settings.conveyorBelt.tier",
  selectConveyorBeltDesc: "settings.conveyorBelt.selectDesc",
  conveyorBeltSaturationAt: "settings.conveyorBelt.saturationAt",
  saturation: "settings.conveyorBelt.saturation",

  // settings.sorter
  sorter: "settings.sorter.label",
  sorters: "settings.sorter.plural",
  sorterRank: "settings.sorter.rank",
  sorterMkI: "settings.sorter.mkI",
  sorterMkII: "settings.sorter.mkII",
  sorterMkIII: "settings.sorter.mkIII",
  pilingSorter: "settings.sorter.piling",
  mkIOrHigher: "settings.sorter.mk1OrHigher",
  currentTierSetting: "settings.sorter.currentTier",

  // settings.stacks
  stackCount: "settings.stacks.count",
  stacks: "settings.stacks.stacks",

  // settings.logistics
  logistics: "settings.logistics.label",

  // settings.node
  nodeSettings: "settings.node.title",
  nodeOverrides: "settings.node.overrides",
  useCustomSettings: "settings.node.useCustom",
  overrideGlobalSettingsForNode: "settings.node.overrideGlobal",
  usingGlobalSettings: "settings.node.usingGlobal",
  enableCustomSettingsToOverride: "settings.node.enableCustom",

  // settings.templates
  earlyGame: "settings.templates.earlyGame",
  midGame: "settings.templates.midGame",
  lateGame: "settings.templates.lateGame",
  endGame: "settings.templates.endGame",
  powerSaver: "settings.templates.powerSaver",
  earlyGameDesc: "settings.templates.earlyGameDesc",
  midGameDesc: "settings.templates.midGameDesc",
  lateGameDesc: "settings.templates.lateGameDesc",
  endGameDesc: "settings.templates.endGameDesc",
  powerSaverDesc: "settings.templates.powerSaverDesc",
  applyTemplate: "settings.templates.apply",
  applyQuestion: "settings.templates.applyQuestion",

  // settings.customTemplates
  customTemplate: "settings.customTemplates.title",
  createCustomTemplate: "settings.customTemplates.create",
  editCustomTemplate: "settings.customTemplates.edit",
  deleteCustomTemplate: "settings.customTemplates.delete",
  customTemplateName: "settings.customTemplates.name",
  customTemplateNote: "settings.customTemplates.note",
  customTemplateEmptyState: "settings.customTemplates.emptyState",
  customTemplateMaxReached: "settings.customTemplates.maxReached",
  customTemplateDuplicateName: "settings.customTemplates.duplicateName",
  customTemplateConfirmOverwrite: "settings.customTemplates.confirmOverwrite",
  templateName: "settings.customTemplates.templateName",
  templateNote: "settings.customTemplates.templateNote",

  // settings.photonGeneration
  photonGeneration: "settings.photonGeneration.label",
  rayReceiver: "settings.photonGeneration.rayReceiver",
  criticalPhoton: "settings.photonGeneration.criticalPhoton",
  gravitonLens: "settings.photonGeneration.gravitonLens",
  useGravitonLens: "settings.photonGeneration.useGravitonLens",
  gravitonLensProliferator: "settings.photonGeneration.gravitonLensProliferator",
  rayTransmissionEfficiency: "settings.photonGeneration.rayTransmissionEfficiency",
  rayTransmissionEfficiencyValue: "settings.photonGeneration.rayTransmissionEfficiencyValue",
  continuousReception: "settings.photonGeneration.continuousReception",
  researchLevel: "settings.photonGeneration.researchLevel",
  continuousReceptionFixed: "settings.photonGeneration.continuousReceptionFixed",

  // ============================================
  // power (電力)
  // ============================================
  power: "power.label",
  powerConsumption: "power.consumption",
  powerConsumptionKW: "power.consumptionKW",
  totalPower: "power.total",
  totalPowerConsumption: "power.totalConsumption",
  normalPower: "power.normal",
  dysonSpherePower: "power.dysonSphere",
  dysonSpherePowerNote: "power.dysonSphereNote",
  powerDistribution: "power.distribution",
  powerBreakdown: "power.breakdown",
  noPowerConsumptionData: "power.noData",
  powerGraph: "power.graph.title",
  powerChange: "power.graph.change",
  powerMultiplier: "power.multiplier",
  standardPower: "power.standard",
  miningPower: "power.mining",

  // power.generation
  "powerGeneration.title": "power.generation.title",
  "powerGeneration.requiredPower": "power.generation.requiredPower",
  "powerGeneration.generatorAllocation": "power.generation.generatorAllocation",
  "powerGeneration.baseOutput": "power.generation.baseOutput",
  "powerGeneration.operatingRate": "power.generation.operatingRate",
  "powerGeneration.count": "power.generation.count",
  "powerGeneration.totalOutput": "power.generation.totalOutput",
  "powerGeneration.fuel": "power.generation.fuel",
  "powerGeneration.energyPerItem": "power.generation.energyPerItem",
  "powerGeneration.fuelConsumption": "power.generation.fuelConsumption",
  "powerGeneration.itemsPerSecond": "power.generation.itemsPerSecond",
  "powerGeneration.units": "power.generation.units",
  "powerGeneration.summary": "power.generation.summary",
  "powerGeneration.totalGenerators": "power.generation.totalGenerators",
  "powerGeneration.totalFuelConsumption": "power.generation.totalFuelConsumption",
  "powerGeneration.noPowerRequired": "power.generation.noPowerRequired",
  "powerGeneration.variableOutputWarning": "power.generation.variableOutputWarning",
  "powerGeneration.templateLabel": "power.generation.templateLabel",
  "powerGeneration.templateDefault": "power.generation.templateDefault",
  "powerGeneration.templateEarlyGame": "power.generation.templateEarlyGame",
  "powerGeneration.templateMidGame": "power.generation.templateMidGame",
  "powerGeneration.templateLateGame": "power.generation.templateLateGame",
  "powerGeneration.templateEndGame": "power.generation.templateEndGame",
  "powerGeneration.manualSelection": "power.generation.manualSelection",
  "powerGeneration.generatorLabel": "power.generation.generatorLabel",
  "powerGeneration.fuelLabel": "power.generation.fuelLabel",
  "powerGeneration.automatic": "power.generation.automatic",
  "powerGeneration.proliferatorSettings": "power.generation.proliferatorSettings",
  "powerGeneration.proliferatorEffectSpeed": "power.generation.proliferatorEffectSpeed",
  "powerGeneration.proliferatorEffectProduction": "power.generation.proliferatorEffectProduction",
  "powerGeneration.manualGenerator": "power.generation.manualGenerator",
  "powerGeneration.manualFuel": "power.generation.manualFuel",
  "powerGeneration.fuelProliferator": "power.generation.fuelProliferator",

  // ============================================
  // mining (採掘)
  // ============================================
  miningCalculator: "mining.calculator.title",
  calculateMiningMachinesNeeded: "mining.calculator.calculateMachines",
  miningSpeedResearch: "mining.calculator.speedResearch",
  miningResearchHint: "mining.calculator.researchHint",
  miningResearch: "mining.calculator.research",
  miningOnly: "mining.calculator.miningOnly",
  workSpeed: "mining.calculator.workSpeed",
  advancedOnly: "mining.calculator.advancedOnly",
  orbitalCollectors: "mining.calculator.orbitalCollectors",
  forHydrogenDeuterium: "mining.calculator.forHydrogenDeuterium",
  veins: "mining.calculator.veins",
  minersNeeded: "mining.calculator.minersNeeded",
  waterPumps: "mining.calculator.waterPumps",
  oilExtractors: "mining.calculator.oilExtractors",
  collectors: "mining.calculator.collectors",
  veinsNeededLabel: "mining.calculator.veinsNeededLabel",
  veinsNeededDesc: "mining.calculator.veinsNeededDesc",
  miningSpeedResearchDesc: "mining.calculator.speedResearchDesc",
  workSpeedAdvanced: "mining.calculator.workSpeedAdvanced",
  workSpeedAdvancedDesc: "mining.calculator.workSpeedAdvancedDesc",
  orbitalCollectorsDesc: "mining.calculator.orbitalCollectorsDesc",
  verifiedDesc: "mining.calculator.verifiedDesc",

  // ============================================
  // building (建設)
  // ============================================
  buildingCost: "building.cost.title",
  selectRecipeForBuildingReqs: "building.cost.selectRecipe",
  totalBuildingRequirements: "building.cost.totalRequirements",

  // building.roadmap
  "roadmap.title": "building.roadmap.title",
  "roadmap.phaseTitle": "building.roadmap.phaseTitle",
  "roadmap.phaseTitleRawMaterials": "building.roadmap.phaseTitleRawMaterials",
  "roadmap.phaseTitleWithStage": "building.roadmap.phaseTitleWithStage",
  "roadmap.finalProductLabel": "building.roadmap.finalProductLabel",
  "roadmap.progressLabel": "building.roadmap.progressLabel",
  "roadmap.overallProgress": "building.roadmap.overallProgress",
  "roadmap.resetAll": "building.roadmap.resetAll",
  "roadmap.exportProgress": "building.roadmap.exportProgress",
  "roadmap.resetConfirmTitle": "building.roadmap.resetConfirmTitle",
  "roadmap.resetConfirmMessage": "building.roadmap.resetConfirmMessage",
  "roadmap.machineCount": "building.roadmap.machineCount",
  "roadmap.miningRate": "building.roadmap.miningRate",
  "roadmap.selectRecipeFirst": "building.roadmap.selectRecipeFirst",
  "roadmap.completed": "building.roadmap.completed",
  "roadmap.checkAll": "building.roadmap.checkAll",
  "roadmap.toggleAll": "building.roadmap.toggleAll",
  "roadmap.exported": "building.roadmap.exported",
  "roadmap.machineWaterPump": "building.roadmap.machineWaterPump",
  "roadmap.machineOilExtractor": "building.roadmap.machineOilExtractor",
  "roadmap.machineMiningMachine": "building.roadmap.machineMiningMachine",
  "roadmap.machineAdvancedMiningMachine": "building.roadmap.machineAdvancedMiningMachine",
  "roadmap.machineOrbitalCollector": "building.roadmap.machineOrbitalCollector",
  "roadmap.recipeTypeSmelt": "building.roadmap.recipeTypeSmelt",
  "roadmap.recipeTypeAssemble": "building.roadmap.recipeTypeAssemble",
  "roadmap.recipeTypeChemical": "building.roadmap.recipeTypeChemical",
  "roadmap.recipeTypeRefine": "building.roadmap.recipeTypeRefine",
  "roadmap.recipeTypeResearch": "building.roadmap.recipeTypeResearch",
  "roadmap.recipeTypeParticle": "building.roadmap.recipeTypeParticle",
  "roadmap.recipeTypeFractionate": "building.roadmap.recipeTypeFractionate",
  "roadmap.recipeTypePhotonGeneration": "building.roadmap.recipeTypePhotonGeneration",

  // ============================================
  // plan (プラン管理)
  // ============================================
  planName: "plan.manager.name",
  description: "plan.manager.description",
  recentPlans: "plan.manager.recent",
  noPlans: "plan.manager.noPlans",
  saveTooltip: "plan.manager.saveTooltip",
  loadTooltip: "plan.manager.loadTooltip",
  shareTooltip: "plan.manager.shareTooltip",
  saveToLocalStorage: "plan.manager.saveToLocalStorage",
  saveToFile: "plan.manager.saveToFile",
  exportToFile: "plan.manager.exportToFile",
  loadFromFile: "plan.manager.loadFromFile",
  supportedFormats: "plan.manager.supportedFormats",
  planLoaded: "plan.manager.loaded",
  planLoadedFromFile: "plan.manager.loadedFromFile",
  planLoadedFromBrowser: "plan.manager.loadedFromBrowser",
  planNotFound: "plan.manager.notFound",
  confirmDeletePlan: "plan.manager.confirmDelete",
  includeNodeOverrides: "plan.manager.includeNodeOverrides",
  mergeNodeOverridesOnLoad: "plan.manager.mergeNodeOverridesOnLoad",
  includeNodeOverridesInURL: "plan.manager.includeNodeOverridesInURL",

  // plan.share
  shareURL: "plan.share.url",
  shareUrlDescription: "plan.share.description",
  sharedUrl: "plan.share.sharedUrl",
  urlWarning: "plan.share.urlWarning",
  urlGenerationError: "plan.share.generationError",
  copyFailed: "plan.share.copyFailed",

  // plan.version
  versionHistory: "plan.version.history",
  noVersions: "plan.version.noVersions",
  versionLoaded: "plan.version.loaded",
  versionNotFound: "plan.version.notFound",
  compareVersions: "plan.version.compare",
  comparingVersion: "plan.version.comparing",
  noChanges: "plan.version.noChanges",
  patchDiff: "plan.version.patchDiff",
  selectVersion: "plan.version.selectVersion",
  selectVersionToCompare: "plan.version.selectVersionToCompare",
  diffSummary: "plan.version.diffSummary",
  noDiffFound: "plan.version.noDiffFound",
  added: "plan.version.added",
  removed: "plan.version.removed",
  modified: "plan.version.modified",

  // ============================================
  // whatIf (What-ifシミュレーター)
  // ============================================
  whatIfSimulator: "whatIf.title",
  whatIfAnalysis: "whatIf.analysis",
  compareDifferentSettings: "whatIf.compareSettings",
  scenarioApplied: "whatIf.scenarioApplied",
  scenarioAppliedToSettings: "whatIf.scenarioAppliedToSettings",
  scenarios: "whatIf.scenarios",
  comparison: "whatIf.comparison",
  detailedComparison: "whatIf.detailedComparison",
  applyScenarioToSettings: "whatIf.applyScenarioToSettings",

  // whatIf.optimization
  optimizationEngine: "whatIf.optimization.engine",
  selectOptimizationGoal: "whatIf.optimization.selectGoal",
  allOptimizationsComplete: "whatIf.optimization.allComplete",
  optimizationComplete: "whatIf.optimization.complete",
  alreadyOptimizedFor: "whatIf.optimization.alreadyOptimized",
  noFurtherImprovements: "whatIf.optimization.noFurtherImprovements",
  perfectConfiguration: "whatIf.optimization.perfectConfiguration",
  allScenariosApplied: "whatIf.optimization.allScenariosApplied",
  usingBestConfigurations: "whatIf.optimization.usingBestConfigurations",
  applyBest: "whatIf.optimization.applyBest",
  applyBestScenarioTitle: "whatIf.optimization.applyBestTitle",
  showingScenariosBy: "whatIf.optimization.showingScenariosBy",
  showingScenariosLowestPower: "whatIf.optimization.showingScenariosLowestPower",
  showingScenariosFewestMachines: "whatIf.optimization.showingScenariosFewestMachines",
  showingScenariosBestEfficiency: "whatIf.optimization.showingScenariosBestEfficiency",
  showingScenariosBalanced: "whatIf.optimization.showingScenariosBalanced",

  // whatIf.goals
  lowestPowerConsumption: "whatIf.goals.lowestPower",
  fewestMachines: "whatIf.goals.fewestMachines",
  bestOverallEfficiency: "whatIf.goals.bestEfficiency",
  mostBalancedImprovements: "whatIf.goals.mostBalanced",
  minimumPowerConsumption: "whatIf.goals.minimumPower",
  minimumMachineCount: "whatIf.goals.minimumMachines",
  maximumEfficiency: "whatIf.goals.maximumEfficiency",
  balancedPerformance: "whatIf.goals.balanced",

  // whatIf.quickActions
  quickActions: "whatIf.quickActions.title",
  applyCommonOptimizations: "whatIf.quickActions.applyCommon",
  maxProliferator: "whatIf.quickActions.maxProliferator",
  maxBelts: "whatIf.quickActions.maxBelts",
  maxStack: "whatIf.quickActions.maxStack",
  minPower: "whatIf.quickActions.minPower",
  minMachines: "whatIf.quickActions.minMachines",
  maxEfficiency: "whatIf.quickActions.maxEfficiency",
  balanced: "whatIf.quickActions.balanced",

  // whatIf.suggestions
  notUsingMk3Proliferator: "whatIf.suggestions.notUsingMk3Proliferator",
  upgradeToMk3ProliferatorSuggestion: "whatIf.suggestions.upgradeToMk3ProliferatorSuggestion",
  upgradeToMk3ConveyorBelts: "whatIf.suggestions.upgradeToMk3ConveyorBelts",
  increaseBeltStackTo4: "whatIf.suggestions.increaseBeltStackTo4",
  upgradeToMk3Proliferator: "whatIf.suggestions.upgradeToMk3Proliferator",
  upgradeToMk3ProliferatorDesc: "whatIf.suggestions.upgradeToMk3ProliferatorDesc",
  upgradeToMk3Belt: "whatIf.suggestions.upgradeToMk3Belt",
  upgradeToMk3BeltDesc: "whatIf.suggestions.upgradeToMk3BeltDesc",
  increaseBeltStack: "whatIf.suggestions.increaseBeltStack",
  increaseBeltStackDesc: "whatIf.suggestions.increaseBeltStackDesc",
  upgradeToQuantumChemical: "whatIf.suggestions.upgradeToQuantumChemical",
  upgradeToQuantumChemicalDesc: "whatIf.suggestions.upgradeToQuantumChemicalDesc",
  upgradeToAssemblerMk3: "whatIf.suggestions.upgradeToAssemblerMk3",
  upgradeToAssemblerMk3Desc: "whatIf.suggestions.upgradeToAssemblerMk3Desc",
  upgradeToRecomposingAssembler: "whatIf.suggestions.upgradeToRecomposingAssembler",
  upgradeToRecomposingAssemblerDesc: "whatIf.suggestions.upgradeToRecomposingAssemblerDesc",
  switchToProductionMode: "whatIf.suggestions.switchToProductionMode",
  switchToProductionModeDesc: "whatIf.suggestions.switchToProductionModeDesc",
  switchToSpeedMode: "whatIf.suggestions.switchToSpeedMode",
  switchToSpeedModeDesc: "whatIf.suggestions.switchToSpeedModeDesc",

  // whatIf.metrics
  topN: "whatIf.metrics.topN",
  fixes: "whatIf.metrics.fixes",
  machineChange: "whatIf.metrics.machineChange",
  green: "whatIf.metrics.green",
  red: "whatIf.metrics.red",
  greenIndicatesImprovement: "whatIf.metrics.greenIndicatesImprovement",
  redIndicatesIncrease: "whatIf.metrics.redIndicatesIncrease",
  powerConsumptionLowerIsBetter: "whatIf.metrics.powerConsumptionLower",
  machineCountFewerIsBetter: "whatIf.metrics.machineCountFewer",
  inputComplexityFewerIsBetter: "whatIf.metrics.inputComplexityFewer",

  // ============================================
  // visualization (可視化)
  // ============================================
  "visualization.tabLabel": "visualization.tabLabel",
  "visualization.filters.machineType": "visualization.filters.machineType",
  "visualization.filters.allMachines": "visualization.filters.allMachines",
  "visualization.filters.materialTypes": "visualization.filters.materialTypes",
  "visualization.filters.rawMaterials": "visualization.filters.rawMaterials",
  "visualization.filters.intermediates": "visualization.filters.intermediates",
  "visualization.filters.finalProducts": "visualization.filters.finalProducts",
  "visualization.filters.reset": "visualization.filters.reset",
  "visualization.emptyState.noData": "visualization.emptyState.noData",
  "visualization.node.machineTitle": "visualization.node.machineTitle",
  "visualization.node.itemTitle": "visualization.node.itemTitle",
  "visualization.node.close": "visualization.node.close",
  "visualization.node.value": "visualization.node.value",
  "visualization.node.machineType": "visualization.node.machineType",
  "visualization.node.machineRank": "visualization.node.machineRank",
  "visualization.node.machineName": "visualization.node.machineName",
  "visualization.node.machineCount": "visualization.node.machineCount",
  "visualization.node.recipeType": "visualization.node.recipeType",
  "visualization.node.proliferator": "visualization.node.proliferator",
  "visualization.node.powerConsumption": "visualization.node.powerConsumption",
  "visualization.node.inputs": "visualization.node.inputs",
  "visualization.node.outputs": "visualization.node.outputs",
  "visualization.node.noFlows": "visualization.node.noFlows",
  "visualization.node.nodeType": "visualization.node.nodeType",
  "visualization.node.types.machine": "visualization.node.types.machine",
  "visualization.node.types.raw-material": "visualization.node.types.rawMaterial",
  "visualization.node.types.intermediate": "visualization.node.types.intermediate",
  "visualization.node.types.final-product": "visualization.node.types.finalProduct",

  // ============================================
  // modSettings (MOD設定)
  // ============================================
  modSettings: "modSettings.title",
  advancedSettingsForModded: "modSettings.description",
  advancedFeatures: "modSettings.advancedFeatures",
  advancedFeaturesWarning: "modSettings.advancedFeaturesWarning",
  pressCtrlShiftM: "modSettings.shortcut",
  customRecipesXML: "modSettings.customRecipesXML",
  uploadCustomRecipesDesc: "modSettings.uploadCustomRecipesDesc",
  uploadXML: "modSettings.uploadXML",
  resetToDefault: "modSettings.resetToDefault",
  recipesUpdatedSuccessfully: "modSettings.recipesUpdatedSuccessfully",
  customProliferatorMultipliers: "modSettings.customProliferatorMultipliers",
  customProliferatorMultipliersDesc: "modSettings.customProliferatorMultipliersDesc",
  productionMultiplierLabel: "modSettings.productionMultiplierLabel",
  speedMultiplierLabel: "modSettings.speedMultiplierLabel",
  applyCustomMultipliers: "modSettings.applyCustomMultipliers",
  proliferatorMultipliersUpdated: "modSettings.proliferatorMultipliersUpdated",
  defaultMultipliers: "modSettings.defaultMultipliers",
  confirmResetToDefault: "modSettings.confirmResetToDefault",
  confirmResetProliferatorToDefault: "modSettings.confirmResetProliferatorToDefault",

  // ============================================
  // errors (エラー)
  // ============================================
  error: "errors.general",
  errorOccurred: "errors.occurred",
  errorApology: "errors.apology",
  errorDetails: "errors.details",
  errorTip: "errors.tip",
  gameDataNotLoaded: "errors.gameDataNotLoaded",
  loadError: "errors.loadError",
  exportError: "errors.exportError",
  importError: "errors.importError",
  validationError: "errors.validationError",
  planBuildError: "errors.planBuildError",
  invalidFileType: "errors.invalidFileType",
  fileTooLarge: "errors.fileTooLarge",
  invalidRecipesXML: "errors.invalidRecipesXML",
  securityError: "errors.securityError",
  xmlParsingError: "errors.xmlParsingError",
  noRecipesFound: "errors.noRecipesFound",
  failedToParseCustomRecipes: "errors.failedToParseCustomRecipes",
  failedToReadFile: "errors.failedToReadFile",
  failedToReset: "errors.failedToReset",
  unsupportedFileFormat: "errors.unsupportedFileFormat",
  failedToLoadVersionData: "errors.failedToLoadVersionData",
  pleaseCalculateFirst: "errors.pleaseCalculateFirst",

  // ============================================
  // history (履歴)
  // ============================================
  showHistory: "history.show",
  entries: "history.entries",
  noHistoryEntries: "history.noHistoryEntries",
  canUndo: "history.canUndo",
  canRedo: "history.canRedo",
  cannotUndo: "history.cannotUndo",
  cannotRedo: "history.cannotRedo",
  noHistoryOperations: "history.noHistoryOperations",
  clearHistory: "history.clear",
  restoreToHere: "history.restoreToHere",
  restoreFromHere: "history.restoreFromHere",
  filterHistory: "history.filter",
  allTypes: "history.allTypes",
  filterSettings: "history.filterSettings",
  filterNodeOverride: "history.filterNodeOverride",
  filterPlan: "history.filterPlan",
  filterPowerGeneration: "history.filterPowerGeneration",
  searchHistory: "history.search",
  searchHistoryPlaceholder: "history.searchPlaceholder",

  // ============================================
  // help (ヘルプ)
  // ============================================
  about: "help.about.title",
  changelog: "help.changelog.title",
  changelogNotAvailable: "help.changelog.notAvailable",
  faqLabel: "help.faq.title",
  gameVersions: "help.about.gameVersions",
  supportedVersion: "help.about.supportedVersion",
  unsupportedVersion: "help.about.unsupportedVersion",
  primaryVersion: "help.about.primaryVersion",
  dataLastUpdated: "help.about.dataLastUpdated",
  appVersion: "help.about.appVersion",
  buildTime: "help.about.buildTime",
  buildStatus: "help.about.buildStatus",
  buildStatusSuccess: "help.about.buildStatusSuccess",
  buildStatusFailure: "help.about.buildStatusFailure",
  buildStatusUnknown: "help.about.buildStatusUnknown",
  testCoverage: "help.about.testCoverage",
  testCoveragePercentage: "help.about.testCoveragePercentage",
  qualityPolicy: "help.about.qualityPolicy",
  qualityPolicyDescription: "help.about.qualityPolicyDescription",
  designPhilosophy: "help.about.designPhilosophy",
  designPhilosophyDescription: "help.about.designPhilosophyDescription",
  reliabilityIndicator: "help.about.reliabilityIndicator",
  repository: "help.about.repository",
  reportIssue: "help.about.reportIssue",
  versionInfoNotAvailable: "help.about.versionInfoNotAvailable",

  // help.faq
  "faq.categories.calculation.title": "help.faq.calculation.title",
  "faq.categories.calculation.questions": "help.faq.calculation.questions",
  "faq.categories.limitations.title": "help.faq.limitations.title",
  "faq.categories.limitations.questions": "help.faq.limitations.questions",
  "faq.categories.common.title": "help.faq.common.title",
  "faq.categories.common.questions": "help.faq.common.questions",
  "faq.categories.troubleshooting.title": "help.faq.troubleshooting.title",
  "faq.categories.troubleshooting.questions": "help.faq.troubleshooting.questions",

  // help.support
  "support.title": "help.support.title",
  "support.repository": "help.support.repository",
  "support.reportIssue": "help.support.reportIssue",
  "support.bugReportInfo": "help.support.bugReportInfo",
  "support.bugReportInfoItems": "help.support.bugReportInfoItems",
  "support.responsePolicy": "help.support.responsePolicy",
  "support.responsePolicyDescription": "help.support.responsePolicyDescription",

  // help.feedback
  feedback: "help.feedback.title",
  "feedbackForm.title": "help.feedback.form.title",
  "feedbackForm.category": "help.feedback.form.category",
  "feedbackForm.category.featureRequest": "help.feedback.form.categoryFeatureRequest",
  "feedbackForm.category.dataCorrection": "help.feedback.form.categoryDataCorrection",
  "feedbackForm.category.uiImprovement": "help.feedback.form.categoryUIImprovement",
  "feedbackForm.category.bugReport": "help.feedback.form.categoryBugReport",
  "feedbackForm.category.other": "help.feedback.form.categoryOther",
  "feedbackForm.title.label": "help.feedback.form.titleLabel",
  "feedbackForm.title.placeholder": "help.feedback.form.titlePlaceholder",
  "feedbackForm.content.label": "help.feedback.form.contentLabel",
  "feedbackForm.content.placeholder": "help.feedback.form.contentPlaceholder",
  "feedbackForm.contact.label": "help.feedback.form.contactLabel",
  "feedbackForm.contact.placeholder": "help.feedback.form.contactPlaceholder",
  "feedbackForm.contact.description": "help.feedback.form.contactDescription",
  "feedbackForm.privacyConsent": "help.feedback.form.privacyConsent",
  "feedbackForm.privacyConsent.link": "help.feedback.form.privacyConsentLink",
  "feedbackForm.privacyConsent.required": "help.feedback.form.privacyConsentRequired",
  "feedbackForm.submit": "help.feedback.form.submit",
  "feedbackForm.submitting": "help.feedback.form.submitting",
  "feedbackForm.success.github": "help.feedback.form.successGithub",
  "feedbackForm.success.form": "help.feedback.form.successForm",
  "feedbackForm.success.formPrefilled": "help.feedback.form.successFormPrefilled",
  "feedbackForm.error": "help.feedback.form.error",
  "feedbackForm.error.formNotConfigured": "help.feedback.form.errorFormNotConfigured",
  "feedbackForm.submitMethod.label": "help.feedback.form.submitMethodLabel",
  "feedbackForm.submitMethod.github": "help.feedback.form.submitMethodGithub",
  "feedbackForm.submitMethod.form": "help.feedback.form.submitMethodForm",
  "feedbackForm.submitMethod.description": "help.feedback.form.submitMethodDescription",
  "feedbackForm.githubIssue.description": "help.feedback.form.githubIssueDescription",
  "feedbackForm.githubIssue.button": "help.feedback.form.githubIssueButton",
  "feedbackForm.googleForm.description": "help.feedback.form.googleFormDescription",
  "feedbackForm.googleForm.button": "help.feedback.form.googleFormButton",
  "feedbackForm.validation.required": "help.feedback.form.validationRequired",
  "feedbackForm.validation.maxLength": "help.feedback.form.validationMaxLength",
  "feedbackForm.validation.emailInvalid": "help.feedback.form.validationEmailInvalid",
  "feedbackForm.validation.categoryRequired": "help.feedback.form.validationCategoryRequired",

  // help.shortcuts
  keyboardShortcuts: "help.shortcuts.title",
  "shortcuts.undo": "help.shortcuts.undo",
  "shortcuts.redo": "help.shortcuts.redo",
  "shortcuts.modSettings": "help.shortcuts.modSettings",
  "shortcuts.languageSwitch": "help.shortcuts.languageSwitch",
  "shortcuts.helpModal": "help.shortcuts.helpModal",
  "shortcuts.closeModal": "help.shortcuts.closeModal",
  "shortcutKeys.ctrlZ": "help.shortcuts.keys.ctrlZ",
  "shortcutKeys.ctrlY": "help.shortcuts.keys.ctrlY",
  "shortcutKeys.ctrlShiftM": "help.shortcuts.keys.ctrlShiftM",
  "shortcutKeys.ctrlL": "help.shortcuts.keys.ctrlL",
  "shortcutKeys.ctrlQuestion": "help.shortcuts.keys.ctrlQuestion",
  "shortcutKeys.f1": "help.shortcuts.keys.f1",
  "shortcutKeys.escape": "help.shortcuts.keys.escape",

  // help.accessibility
  "accessibility.policy": "help.accessibility.policy",
  "accessibility.keyboardNavigation": "help.accessibility.keyboardNavigation",
  "accessibility.screenReader": "help.accessibility.screenReader",
  "accessibility.keyboardNavigationDescription": "help.accessibility.keyboardNavigationDescription",
  "accessibility.screenReaderDescription": "help.accessibility.screenReaderDescription",

  // ============================================
  // welcome (ウェルカムモーダル)
  // ============================================
  welcomeToCalculator: "welcome.title",
  calculatorDescription: "welcome.description",
  mainFeatures: "welcome.mainFeatures",
  automaticProductionTree: "welcome.features.automaticProductionTree",
  alternativeRecipeSelection: "welcome.features.alternativeRecipeSelection",
  bottleneckDetection: "welcome.features.bottleneckDetection",
  whatIfSimulation: "welcome.features.whatIfSimulation",
  planSaveShare: "welcome.features.planSaveShare",
  basicUsage: "welcome.basicUsage.title",
  step1SelectRecipe: "welcome.basicUsage.step1",
  step1Description: "welcome.basicUsage.step1Description",
  step2SetTarget: "welcome.basicUsage.step2",
  step2Description: "welcome.basicUsage.step2Description",
  step3AdjustSettings: "welcome.basicUsage.step3",
  step3Description: "welcome.basicUsage.step3Description",
  step4CheckResults: "welcome.basicUsage.step4",
  step4Description: "welcome.basicUsage.step4Description",
  convenientFeatures: "welcome.convenientFeatures.title",
  urlSharing: "welcome.convenientFeatures.urlSharing",
  urlSharingDescription: "welcome.convenientFeatures.urlSharingDescription",
  planSaving: "welcome.convenientFeatures.planSaving",
  planSavingDescription: "welcome.convenientFeatures.planSavingDescription",
  whatIfSimulatorFeature: "welcome.convenientFeatures.whatIfSimulator",
  whatIfSimulatorDescription: "welcome.convenientFeatures.whatIfSimulatorDescription",
  templateFeature: "welcome.convenientFeatures.templateFeature",
  templateFeatureDescription: "welcome.convenientFeatures.templateFeatureDescription",
  stepProgress: "welcome.stepProgress",
  skip: "welcome.skip",
  back: "welcome.back",
  next: "welcome.next",
  getStarted: "welcome.getStarted",

  // ============================================
  // errorUI (エラーUI)
  // ============================================
  showStackTrace: "errorUI.showStackTrace",
  reloadPage: "errorUI.reloadPage",
  clearDataRestart: "errorUI.clearDataRestart",
  backToHome: "errorUI.backToHome",
  confirmClearData: "errorUI.confirmClearData",

  // ============================================
  // dataLoading (データ読み込み)
  // ============================================
  loadingGameData: "dataLoading.loadingGameData",

  // ============================================
  // defaultOption (デフォルトオプション)
  // ============================================
  defaultOption: "recipe.comparison.defaultOption",

  // ============================================
  // 特殊: research (研究)
  // ============================================
  research: "common.labels.research",

  // ============================================
  // 特殊: inputItems/outputItems
  // ============================================
  inputItems: "production.labels.inputItems",
  outputItems: "production.labels.outputItems",
};

/**
 * ディレクトリを再帰的に走査してTypeScript/TSXファイルを取得
 */
function getAllTsFiles(dir: string, fileList: string[] = []): string[] {
  const files = readdirSync(dir);

  for (const file of files) {
    const filePath = join(dir, file);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      // __tests__ ディレクトリはスキップ
      if (!file.includes("__tests__") && file !== "node_modules") {
        getAllTsFiles(filePath, fileList);
      }
    } else if (
      (file.endsWith(".ts") || file.endsWith(".tsx")) &&
      !file.includes(".test.") &&
      !file.includes(".spec.")
    ) {
      fileList.push(filePath);
    }
  }

  return fileList;
}

/**
 * TypeScript ファイル内の t() 呼び出しを変換
 */
export function migrateKeys(): void {
  // TypeScript/TSX ファイルを検索
  const files = getAllTsFiles("src");

  let totalReplacements = 0;

  for (const file of files) {
    const content = readFileSync(file, "utf-8");
    let fileReplacements = 0;

    // t('oldKey') または t("oldKey") のパターンをマッチ
    // interpolation も考慮: t('key', { ... })
    const tCallPattern = /t\s*\(\s*(['"`])([^'"`]+)\1/g;

    const newContent = content.replace(tCallPattern, (match, quote, key) => {
      const newKey = KEY_MAPPING[key];
      if (newKey) {
        fileReplacements++;
        totalReplacements++;
        return `t(${quote}${newKey}${quote}`;
      }
      // マッピングがない場合は警告を出力（オプション）
      if (key && !key.includes(".")) {
        console.warn(`⚠️  Unmapped key in ${file}: "${key}"`);
      }
      return match;
    });

    // 変更があった場合のみファイルを書き込み
    if (fileReplacements > 0) {
      writeFileSync(file, newContent, "utf-8");
      console.log(`✅ ${file}: ${fileReplacements} replacements`);
    }
  }

  console.log(`\n🎉 Total replacements: ${totalReplacements}`);
  console.log(`📁 Files processed: ${files.length}`);
}

// スクリプトとして実行
try {
  migrateKeys();
  console.log("\n✅ Migration complete!");
  process.exit(0);
} catch (error) {
  console.error("\n❌ Migration failed:", error);
  process.exit(1);
}
