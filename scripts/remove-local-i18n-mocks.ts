/**
 * テストファイルからローカルのi18nモックを削除するスクリプト
 * グローバルモック(src/test/setup.ts)を使用するように統一する
 */

import fs from "fs";
import path from "path";

const testFiles = [
  "src/components/PowerGenerationView/__tests__/index.test.tsx",
  "src/components/SettingsPanel/__tests__/PhotonGenerationSettings.test.tsx",
  "src/components/SettingsPanel/__tests__/ProliferatorSettings.test.tsx",
  "src/components/HelpModal/__tests__/HelpModal.test.tsx",
  "src/components/HelpModal/__tests__/FeedbackForm.test.tsx",
  "src/components/HelpModal/__tests__/BuildBadges.test.tsx",
  "src/components/HelpModal/__tests__/ReliabilityIndicator.test.tsx",
  "src/components/HelpModal/__tests__/QualityPolicy.test.tsx",
  "src/components/__tests__/WelcomeModal.test.tsx",
  "src/components/SettingsPanel/__tests__/TemplateSelector.test.tsx",
  "src/components/PlanManager/__tests__/PlanManager.test.tsx",
  "src/components/PlanManager/__tests__/ExportDialog.test.tsx",
  "src/components/Layout/Header/__tests__/LanguageMenu.test.tsx",
  "src/components/Layout/Header/__tests__/HelpMenu.test.tsx",
  "src/components/HistoryDialog/__tests__/HistoryDialog.test.tsx",
  "src/components/VisualizationView/__tests__/VisualizationView.smoke.test.tsx",
  "src/components/VisualizationView/__tests__/NodeDetailPanel.test.tsx",
  "src/components/VisualizationView/__tests__/FilterPanel.test.tsx",
  "src/components/Layout/__tests__/ProductionResultsPanel.test.tsx",
  "src/components/__tests__/ErrorBoundary.test.tsx",
  "src/components/__tests__/App.smoke.test.tsx",
  "src/components/WhatIfSimulator/__tests__/WhatIfSimulator.test.tsx",
  "src/components/SettingsPanel/__tests__/index.test.tsx",
  "src/components/SettingsPanel/__tests__/index.coverage.test.tsx",
  "src/components/SettingsPanel/__tests__/MachineRankSettings.test.tsx",
  "src/components/SettingsPanel/__tests__/ConveyorBeltSettings.test.tsx",
  "src/components/ResultTree/__tests__/ResultTree.test.tsx",
  "src/components/ResultTree/__tests__/InlineNodeSettings.test.tsx",
  "src/components/ResultTree/__tests__/CompactNodeSettings.test.tsx",
  "src/components/RecipeSelector/__tests__/RecipeSelector.test.tsx",
  "src/components/RecipeSelector/__tests__/RecipeGrid.coverage.test.tsx",
  "src/components/RecipeSelector/__tests__/RecipeGrid.responsive.test.tsx",
  "src/components/RecipeComparisonModal/__tests__/RecipeComparisonModal.test.tsx",
  "src/components/PlanDiffView/__tests__/PlanDiffView.test.tsx",
  "src/components/NodeSettingsModal/__tests__/NodeSettingsModal.test.tsx",
  "src/components/ModSettings/__tests__/ModSettings.test.tsx",
  "src/components/Layout/__tests__/SettingsPanelSection.test.tsx",
  "src/components/Layout/__tests__/RecipeSelectorSection.test.tsx",
  "src/components/Layout/__tests__/Header.test.tsx",
  "src/components/AlternativeRecipeSelector/__tests__/AlternativeRecipeSelector.test.tsx",
];

// i18nモックのパターン（複数パターンに対応）
const patterns = [
  // パターン1: コメント + モック（単一行）
  /\/\/\s*i18n\s*モック\s*\nvi\.mock\("react-i18next",\s*\(\)\s*=>\s*\(\{\s*useTranslation:\s*\(\)\s*=>\s*\(\{\s*t:\s*\(key:\s*string\)\s*=>\s*key\s*\}\),?\s*\}\)\);?\n*/gi,

  // パターン2: コメント + モック（複数行）
  /\/\/\s*i18n\s*モック\s*\nvi\.mock\("react-i18next",\s*\(\)\s*=>\s*\(\{[\s\S]*?useTranslation:\s*\(\)\s*=>\s*\(\{[\s\S]*?t:\s*\(key:\s*string\)\s*=>\s*key[\s\S]*?\}\),?[\s\S]*?\}\)\);?\n*/gi,

  // パターン3: Mock i18next (英語コメント + モック)
  /\/\/\s*Mock\s+i18next\s*\nvi\.mock\("react-i18next",\s*\(\)\s*=>\s*\(\{[\s\S]*?useTranslation:\s*\(\)\s*=>\s*\(\{[\s\S]*?t:\s*\(key:\s*string\)\s*=>\s*key[\s\S]*?\}\),?[\s\S]*?\}\)\);?\n*/gi,

  // パターン4: コメント無し（モックのみ、単一行）
  /vi\.mock\("react-i18next",\s*\(\)\s*=>\s*\(\{\s*useTranslation:\s*\(\)\s*=>\s*\(\{\s*t:\s*\(key:\s*string\)\s*=>\s*key\s*\}\),?\s*\}\)\);?\n*/gi,

  // パターン5: コメント無し（モックのみ、複数行）
  /vi\.mock\("react-i18next",\s*\(\)\s*=>\s*\(\{[\s\S]*?useTranslation:\s*\(\)\s*=>\s*\(\{[\s\S]*?t:\s*\(key:\s*string\)\s*=>\s*key[\s\S]*?\}\),?[\s\S]*?\}\)\);?\n*/gi,
];

let processedCount = 0;
let removedCount = 0;

for (const filePath of testFiles) {
  const fullPath = path.resolve(process.cwd(), filePath);

  if (!fs.existsSync(fullPath)) {
    console.warn(`⚠️  File not found: ${filePath}`);
    continue;
  }

  let content = fs.readFileSync(fullPath, "utf-8");
  const originalContent = content;

  // 各パターンで置換を試みる
  for (const pattern of patterns) {
    content = content.replace(pattern, "");
  }

  // 変更があった場合のみファイルを更新
  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content, "utf-8");
    removedCount++;
    console.log(`✓ Removed i18n mock from: ${filePath}`);
  }

  processedCount++;
}

console.log(`\n✅ Processed ${processedCount} files`);
console.log(`🗑️  Removed i18n mocks from ${removedCount} files`);
console.log(`\n💡 Global i18n mock in src/test/setup.ts will be used for all tests.`);
