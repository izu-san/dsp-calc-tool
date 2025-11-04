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

- [ ] Playwright フィクスチャの作成
  - [ ] 共通フィクスチャの定義
  - [ ] テストデータフィクスチャ
  - [ ] ブラウザフィクスチャ

- [ ] シナリオの分割
  - [ ] 既存のE2Eテストを確認
  - [ ] シナリオごとに分割
  - [ ] 共通処理の抽出

- [ ] テスト実行時間の短縮
  - [ ] 並列実行の最適化
  - [ ] 不要なテストの削除
  - [ ] モックの活用

- [ ] ドキュメントの更新
  - [ ] E2Eテストの実行方法
  - [ ] フィクスチャの使用方法
  - [ ] 新しいシナリオの追加方法

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

**最終更新**: 2025-01-28 (Phase 4完了、Phase 3 slice化完了・テスト更新完了)
