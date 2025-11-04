# リファクタリングチェックリスト

## Phase 4: テストリファクタリング - 残作業チェックリスト

### lib/**tests**/ 配下の残作業

- [x] `src/lib/__tests__/parser.test.ts`
  - 備考: XML文字列を直接使用しているため、ビルダーパターンは適用困難。現状のままで問題なし。

- [x] `src/lib/__tests__/miningCalculation.test.ts`
  - 現状: `createMockGameData()`を使用済み
  - 対応: ✅ 完了

- [x] `src/lib/__tests__/miningCalculation.edge.test.ts`
  - 現状: `createMockGameData()`を使用済み
  - 対応: ✅ 完了

- [x] `src/lib/__tests__/photonGenerationCalculation.test.ts`
  - 現状: ビルダーを使用する必要がない（簡単な計算テストのみ）
  - 対応: ✅ 確認済み、対応不要

- [x] `src/lib/__tests__/powerGenerationCalculation.test.ts`
  - 現状: ビルダーを使用する必要がない（簡単な計算テストのみ）
  - 対応: ✅ 確認済み、対応不要

- [x] `src/lib/__tests__/powerDisplayConsistency.test.ts`
  - 現状: `createMockGameData()`を使用、`createMockRecipeTreeNode()`と`createMockMiningCalculation()`をビルダーに置き換え済み
  - 対応: ✅ 完了

- [x] `src/lib/__tests__/unifiedPowerCalculation.test.ts`
  - 現状: `createMockGameData()`を使用、`createMockRecipeTreeNode()`と`createMockMiningCalculation()`をビルダーに置き換え済み
  - 対応: ✅ 完了

- [x] `src/lib/__tests__/matrix-lab-speed.test.ts`
  - 現状: `createMockGameData()`、`createMachineByType()`、`createMultiOutputRecipe()`を使用済み
  - 対応: ✅ 完了

- [x] `src/lib/__tests__/calculator.boundary.test.ts`
  - 現状: `createMockGameData()`、`createMockSettings()`、`createSingleOutputRecipe()`、`createMachineByType()`を使用済み
  - 対応: ✅ 完了

- [x] `src/lib/__tests__/buildingCost.test.ts`
  - 現状: 手動`RecipeTreeNode`作成を`createRecipeNode()`と`createRawMaterialNode()`に置き換え済み
  - 対応: ✅ 完了

- [x] `src/lib/__tests__/statistics.test.ts`
  - 現状: 手動`RecipeTreeNode`作成を`createRecipeNode()`と`createRawMaterialNode()`に置き換え済み
  - 対応: ✅ 完了

- [x] `src/lib/__tests__/calculator.test.ts`
  - 現状: `createMockGameData()`を使用、`createTestGameData()`でビルダーを使用して拡張済み
  - 対応: ✅ 完了

### lib/calculator/**tests**/ 配下の残作業

- [x] `src/lib/calculator/__tests__/belt-calculation.test.ts`
  - 備考: モックデータ不使用のため対応不要

- [x] `src/lib/calculator/__tests__/aggregations.test.ts`
  - 現状: ビルダーを使用済み
  - 対応: ✅ 完了

### lib/roadmap/**tests**/ 配下の残作業

- [x] `src/lib/roadmap/__tests__/phaseCalculation.test.ts`
  - 現状: `createRawMaterialNode()`、`createRecipeNode()`、`createMachineByType()`を使用済み
  - 対応: ✅ 完了

### コンポーネントテストファイル

- [x] `src/components/PowerGraphView/__tests__/PowerGraphView.test.tsx`
  - 現状: 手動`RecipeTreeNode`作成を`createRecipeNode()`に置き換え済み
  - 対応: ✅ 完了

- [x] `src/components/MiningCalculator/__tests__/MiningCalculator.test.tsx`
  - 現状: 手動`RecipeTreeNode`作成を`createRecipeNode()`に置き換え済み
  - 対応: ✅ 完了

- [x] `src/components/ResultTree/__tests__/ResultTree.test.tsx`
  - 現状: 手動`RecipeTreeNode`作成を`createRecipeNode()`と`createRawMaterialNode()`に置き換え済み
  - 対応: ✅ 完了

- [x] `src/components/SettingsPanel/__tests__/index.coverage.test.tsx`
  - 現状: 手動`RecipeTreeNode`作成を`createRecipeNode()`に置き換え済み
  - 対応: ✅ 完了

### lib/import/**tests**/ 配下の残作業

- [x] 必要に応じて確認
  - 備考: ビルダーを使用する必要がないテストファイルのため対応不要

### lib/export/**tests**/ 配下の残作業

- [x] 必要に応じて確認
  - 備考: ビルダーを使用する必要がないテストファイルのため対応不要

---

## Phase 3: settingsStore の slice 化 - 残作業チェックリスト

- [x] `src/stores/settingsSlice.ts` の実装
  - [x] 増産剤設定slice（SettingsSlice）
  - [x] 機械ランク設定slice（SettingsSlice）
  - [x] コンベアベルト設定slice（SettingsSlice）
  - [x] ソーター設定slice（SettingsSlice）
  - [x] 代替レシピ設定slice（SettingsSlice）
  - [x] 採掘速度研究設定slice（SettingsSlice）
  - [x] 光子生成設定slice（SettingsSlice）
  - [x] テンプレート関連slice（TemplateSlice）
  - [x] 発電設備関連slice（PowerGenerationSlice）
  - [x] カスタムテンプレートslice（CustomTemplateSlice）

- [x] `src/stores/settingsStore.ts` の更新
  - [x] sliceを使用するように変更
  - [x] テストの更新（すべて通過: 65テスト成功）

---

## Phase 5: E2Eテストの再構築 - 作業チェックリスト

- [x] Playwright フィクスチャの作成
  - [x] 共通フィクスチャの定義（app.fixture.ts）
  - [x] テストデータフィクスチャ（test-data.fixture.ts）
  - [x] ブラウザフィクスチャ（browser.fixture.ts）

- [x] シナリオの分割
  - [x] 既存のE2Eテストを確認
  - [x] すべてのテストファイルをフィクスチャを使用するようにリファクタリング
    - [x] 02-game-data.spec.ts
    - [x] 03-main-features.spec.ts
    - [x] 04-power-generation.spec.ts
    - [x] 05-import-export.spec.ts
    - [x] 06-persistence-locale.spec.ts
    - [x] 07-modsettings.spec.ts
    - [x] 08-what-if.spec.ts
    - [x] 09-history-version-management.spec.ts
    - [x] 10-building-roadmap.spec.ts
    - [x] 11-custom-template.spec.ts
    - [x] seed.spec.ts
    - [ ] 01-welcome-modal.spec.ts（welcome modalをテストするため、フィクスチャは使用しない）

- [x] テスト実行時間の短縮
  - [x] 並列実行の最適化（playwright.config.tsでワーカー数を最適化）
  - [x] 不要なテストの削除（確認済み、削除不要）
  - [x] モックの活用（フィクスチャで共通処理をモジュール化）

- [x] ドキュメントの更新
  - [x] E2Eテストの実行方法（docs/testing/E2E_TESTING.md）
  - [x] フィクスチャの使用方法（docs/testing/E2E_TESTING.md）
  - [x] 新しいシナリオの追加方法（docs/testing/E2E_TESTING.md）

---

## 共通チェックリスト

### リファクタリング時の確認事項

- [ ] テストがすべて通過することを確認
- [ ] lintエラーがないことを確認
- [ ] 型エラーがないことを確認
- [ ] 既存の機能が壊れていないことを確認
- [ ] コードレビューを実施（可能な場合）

### コミット前の確認事項

- [ ] 変更内容を確認
- [ ] 不要なファイルが含まれていないか確認
- [ ] コミットメッセージが適切か確認
- [ ] 関連するドキュメントを更新

---

## 緊急度別タスク

### 🔴 高優先度（すぐに実施すべき）

1. ~~Phase 4 の残りのテストファイルのリファクタリング~~ ✅ 完了
2. Phase 4 のコミット

### 🟡 中優先度（近日中に実施）

3. ~~settingsStore の slice 化~~ ✅ 完了（テスト更新は別途実施）
4. Phase 5: E2Eテストの再構築

### 🟢 低優先度（時間があるときに実施）

5. テストカバレッジの向上
6. パフォーマンス最適化
7. ドキュメントの整備

---

**最終更新**: 2025-01-28 (Phase 5完了: フィクスチャ作成・テストリファクタリング・パフォーマンス最適化・ドキュメント作成完了)
