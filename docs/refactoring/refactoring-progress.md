# リファクタリング進捗レポート

## 概要

Dyson Sphere Program 生産チェーン計算機の大規模リファクタリングプロジェクトの進捗状況を記録します。

**作成日**: 2025-01-28
**最終更新**: 2025-01-28

---

## Phase 1: PlanManager のサービス+フックへの分割 ✅ 完了

### 実施内容

#### 作成したサービス

- `src/services/plan-management/planExportService.ts` - プランエクスポート処理
- `src/services/plan-management/planImportService.ts` - プランインポート処理
- `src/services/plan-management/planStorageService.ts` - localStorage 操作
- `src/services/plan-management/planRestorationService.ts` - プラン復元処理
- `src/services/plan-management/planSaveService.ts` - プラン保存処理（バージョン管理含む）
- `src/services/plan-management/planLoadService.ts` - プラン読み込み処理（履歴統合）

#### 作成したカスタムフック

- `src/hooks/usePlanManagerDialogs.ts` - ダイアログ状態管理
- `src/hooks/usePlanExport.ts` - エクスポート機能
- `src/hooks/usePlanImport.ts` - インポート機能

#### 変更したファイル

- `src/components/PlanManager/index.tsx` - UIロジックのみにリファクタリング

### 成果

- UI、状態管理、ビジネスロジックの分離が完了
- テスト容易性の向上
- コードの可読性と保守性の向上

---

## Phase 2: レイアウトと計算 UI のタブ状態を列挙型に統一 ✅ 完了

### 実施内容

#### 作成した型定義

- `src/types/ui-tabs.ts` - UIタブ状態の列挙型定義
  - `ProductionResultsTab` - 生産結果パネルのタブ
  - `RecipeSelectorTab` - レシピセレクターのタブ
  - `MainView` - メインビューの状態

#### 変更したファイル

- `src/components/Layout/ProductionResultsPanel.tsx` - 列挙型を使用
- `src/components/RecipeSelector/index.tsx` - 列挙型を使用

### 成果

- 型安全性の向上
- コードの一貫性向上
- タブ状態管理の簡素化

---

## Phase 3: Zustand ストアの slice 化と履歴記録のサービス層への移行 ✅ 完了

### 実施内容

#### 作成したサービス

- `src/services/history-recording/historyRecordingService.ts` - 履歴記録の集約サービス
  - `recordHistoryEntry` - 汎用履歴記録関数
  - `recordSettingsHistory` - 設定変更履歴
  - `recordPlanHistory` - プラン変更履歴
  - `recordPowerGenerationHistory` - 発電設定変更履歴
  - `recordNodeOverrideHistory` - ノードオーバーライド履歴

#### 変更したストア

- `src/stores/settingsStore.ts` - 履歴記録ロジックをサービス層へ移行
- `src/stores/recipeSelectionStore.ts` - 履歴記録ロジックをサービス層へ移行
- `src/stores/nodeOverrideStore.ts` - 履歴記録ロジックをサービス層へ移行
- `src/stores/miningSettingsStore.ts` - 履歴記録ロジックをサービス層へ移行

#### 準備作業

- `src/stores/settingsSlice.ts` - 今後のslice化のための基盤ファイル作成

### 成果

- 履歴記録ロジックの一元化
- ストアの責務の明確化
- テスト容易性の向上

---

## Phase 4: lib テストのモジュール単位への再編成とビルダー/モックの統一 ✅ 完了

### 実施内容

#### 作成したビルダーファイル

- `src/test/factories/nodeBuilder.ts` - RecipeTreeNode作成用ビルダー
  - `createRecipeTreeNode` - 基本ノード作成
  - `createRecipeNode` - レシピノード作成
  - `createRawMaterialNode` - 原材料ノード作成
  - `createCircularDependencyNode` - 循環依存ノード作成
  - `createDefaultPowerConsumption` - デフォルト電力消費データ
  - `createDefaultConveyorBelts` - デフォルトコンベアベルト要件

- `src/test/factories/recipeBuilder.ts` - Recipe作成用ビルダー
  - `createRecipe` - 基本レシピ作成
  - `createSingleOutputRecipe` - 単一出力レシピ作成
  - `createMultiOutputRecipe` - 複数出力レシピ作成
  - `recipePresets` - よく使われるレシピのプリセット
    - `ironIngot()` - Iron Ingot レシピ
    - `copperIngot()` - Copper Ingot レシピ
    - `gear()` - Gear レシピ
    - `refinedOil()` - Refined Oil レシピ（副産物: Hydrogen）

- `src/test/factories/machineBuilder.ts` - Machine作成用ビルダー
  - `createMachine` - 基本機械作成
  - `createMachineByType` - タイプ別機械作成
  - `machinePresets` - よく使われる機械のプリセット
    - `arcSmelter()` - Arc Smelter
    - `assemblerMk1()` - Assembling Machine Mk.I
    - `assemblerMk2()` - Assembling Machine Mk.II
    - `assemblerMk3()` - Assembling Machine Mk.III
    - `chemicalPlant()` - Chemical Plant
    - `sorterMk1()` - Sorter Mk.I
    - `matrixLab()` - Matrix Lab

#### 更新したファイル

- `src/test/factories/testDataFactory.ts` - 新しいビルダーを再エクスポート、`machines`の型を`Map<number, Machine>`に修正

#### リファクタリング完了したテストファイル

1. ✅ `src/lib/__tests__/calculator.test.ts`
2. ✅ `src/lib/__tests__/buildingCost.test.ts`
3. ✅ `src/lib/__tests__/statistics.test.ts`
4. ✅ `src/lib/__tests__/statistics.coverage.test.ts`
5. ✅ `src/lib/__tests__/statistics.edge.test.ts`
6. ✅ `src/lib/__tests__/powerConsistency.test.ts`
7. ✅ `src/lib/calculator/__tests__/production-rate.test.ts`
8. ✅ `src/lib/calculator/__tests__/power-calculation.test.ts`
9. ✅ `src/lib/calculator/__tests__/aggregations.test.ts`
10. ✅ `src/lib/calculator/__tests__/multi-output.test.ts`

### リファクタリングパターン

#### Recipe の置き換え

```typescript
// Before
const mockRecipe: Recipe = {
  SID: 1,
  name: "Iron Ingot",
  Type: "Smelt",
  // ... 多くのプロパティ
};

// After
const mockRecipe = recipePresets.ironIngot();
// または
const mockRecipe = createSingleOutputRecipe({
  SID: 1,
  name: "Iron Ingot",
  type: "Smelt",
  // ... 必要なプロパティのみ
});
```

#### Machine の置き換え

```typescript
// Before
const mockMachine: Machine = {
  id: 2302,
  name: "Arc Smelter",
  Type: "Smelt",
  // ... 多くのプロパティ
};

// After
const mockMachine = machinePresets.arcSmelter();
// または
const mockMachine = createMachineByType({
  id: 2302,
  name: "Arc Smelter",
  type: "Smelt",
  // ... 必要なプロパティのみ
});
```

#### RecipeTreeNode の置き換え

```typescript
// Before
const node: RecipeTreeNode = {
  recipe: mockRecipe,
  machine: mockMachine,
  targetOutputRate: 30,
  machineCount: 5,
  proliferator: { ...PROLIFERATOR_DATA.none, mode: "production" },
  power: { machines: 540, sorters: 0, total: 540 },
  // ... 多くのプロパティ
};

// After
const node = createRecipeNode({
  recipe: mockRecipe,
  machine: mockMachine,
  targetOutputRate: 30,
  machineCount: 5,
  proliferator: { ...PROLIFERATOR_DATA.none, mode: "production" },
  power: { machines: 540, sorters: 0, dysonSphere: 0, total: 540 },
  // ... 必要なプロパティのみ
});
```

### 成果

- テストデータ作成の統一化
- コードの重複削減
- テストの可読性向上
- 型安全性の確保

---

## Phase 5: Playwright フィクスチャ導入とシナリオ分割でE2Eを再構築 ✅ 完了

### 実施内容

#### 作成したフィクスチャ

- `tests/e2e/fixtures/app.fixture.ts` - アプリ共通フィクスチャ
  - ページ初期化（`page.goto('/')`）
  - アニメーション無効化
  - Welcomeモーダルのスキップ

- `tests/e2e/fixtures/test-data.fixture.ts` - テストデータフィクスチャ
  - `clearLocalStorage` - localStorageクリア
  - `clearLocalStorageKeepingTutorial` - チュートリアル状態を保持してクリア
  - `setLocalStorage` / `getLocalStorage` - localStorage操作

- `tests/e2e/fixtures/browser.fixture.ts` - ブラウザフィクスチャ
  - `reloadPage` - ページリロード（アニメーション無効化・welcome modalスキップ含む）
  - `setViewport` - ビューポートサイズ設定
  - `newPage` - 新しいページを開く

- `tests/e2e/fixtures/index.ts` - フィクスチャのエクスポート

#### リファクタリング完了したE2Eテストファイル

1. ✅ `tests/e2e/02-game-data.spec.ts`
2. ✅ `tests/e2e/03-main-features.spec.ts`
3. ✅ `tests/e2e/04-power-generation.spec.ts`
4. ✅ `tests/e2e/05-import-export.spec.ts`
5. ✅ `tests/e2e/06-persistence-locale.spec.ts`
6. ✅ `tests/e2e/07-modsettings.spec.ts`
7. ✅ `tests/e2e/08-what-if.spec.ts`
8. ✅ `tests/e2e/09-history-version-management.spec.ts`
9. ✅ `tests/e2e/10-building-roadmap.spec.ts`
10. ✅ `tests/e2e/11-custom-template.spec.ts`
11. ✅ `tests/e2e/seed.spec.ts`

**注**: `01-welcome-modal.spec.ts`はwelcome modalをテストするため、フィクスチャを使用しない

#### パフォーマンス最適化

- `playwright.config.ts`でワーカー数を最適化
  - ローカル: CPUコア数の50%（速度と安定性のバランス）
  - CI: 1ワーカー（安定性優先）

#### ドキュメント作成

- `docs/testing/E2E_TESTING.md` - E2Eテストガイド
  - E2Eテストの実行方法
  - フィクスチャの使用方法
  - 新しいシナリオの追加方法
  - ベストプラクティス
  - トラブルシューティング

### 成果

- E2Eテストの重複コード削減
- 保守性の向上
- テスト実行時間の最適化
- ドキュメントの整備

---

## 残作業詳細

### 1. テストファイルのリファクタリング ✅ 完了

#### リファクタリング完了したテストファイル

**lib/**tests**/ 配下**

- ✅ `src/lib/roadmap/__tests__/phaseCalculation.test.ts` - `createMockRecipe`を12箇所全て`createSingleOutputRecipe`に置き換え完了
- ✅ `src/lib/__tests__/powerDisplayConsistency.test.ts` - ビルダー使用済み
- ✅ `src/lib/__tests__/unifiedPowerCalculation.test.ts` - ビルダー使用済み
- ✅ `src/lib/__tests__/calculator.boundary.test.ts` - ビルダー使用済み
- ✅ `src/lib/__tests__/matrix-lab-speed.test.ts` - ビルダー使用済み（既にリファクタリング済み）

**lib/calculator/**tests**/ 配下**

- ✅ `src/lib/calculator/__tests__/belt-calculation.test.ts` - モックデータ不使用のため対応不要

**hooks/**tests**/ 配下**

- ✅ `src/hooks/__tests__/useProductionCalculation.test.ts` - `createSingleOutputRecipe`と`createMockGameData`を使用するようにリファクタリング完了
- ✅ `src/hooks/__tests__/useTreeCollapse.test.ts` - ビルダー関数を使用するようにリファクタリング完了

**stores/**tests**/ 配下**

- ✅ `src/stores/__tests__/gameDataStore.test.ts` - `createMachineByType`を使用するようにリファクタリング完了

**utils/**tests**/ 配下**

- ✅ `src/utils/__tests__/historyRestore.test.ts` - `createSingleOutputRecipe`と`createMockGameData`を使用するようにリファクタリング完了（2箇所）

**components/**tests**/ 配下**

- ✅ `src/components/Layout/__tests__/SettingsPanelSection.test.tsx` - `createSingleOutputRecipe`を使用するようにリファクタリング完了
- ✅ `src/components/Layout/__tests__/ProductionResultsPanel.test.tsx` - `createSingleOutputRecipe`を使用するようにリファクタリング完了
- ✅ `src/components/RecipeSelector/__tests__/RecipeSelector.test.tsx` - `createSingleOutputRecipe`と`createMultiOutputRecipe`を使用するようにリファクタリング完了
- ✅ `src/components/RecipeSelector/__tests__/RecipeGrid.responsive.test.tsx` - `createSingleOutputRecipe`を使用するようにリファクタリング完了
- ✅ `src/components/ResultTree/__tests__/ResultTree.test.tsx` - ビルダー使用済み
- ✅ `src/components/__tests__/App.smoke.test.tsx` - `createSingleOutputRecipe`を使用するようにリファクタリング完了（3箇所）
- ✅ `src/components/Layout/__tests__/RecipeSelectorSection.test.tsx` - `createSingleOutputRecipe`を使用するようにリファクタリング完了

**constants/**tests**/ 配下**

- ✅ `src/constants/__tests__/machines.test.ts` - `createMachineByType`を使用するようにリファクタリング完了

**lib/import/**tests**/ 配下**

- ✅ `src/lib/import/__tests__/validation.test.ts` - `createSingleOutputRecipe`と`createMockGameData`を使用するようにリファクタリング完了
- ✅ `src/lib/import/__tests__/planBuilder.test.ts` - `createSingleOutputRecipe`と`createMockGameData`、`createMockSettings`を使用するようにリファクタリング完了

**lib/export/**tests**/ 配下**

- ✅ `src/lib/export/__tests__/dataTransformer.test.ts` - `createSingleOutputRecipe`と`createMachineByType`を使用するようにリファクタリング完了

#### 対応不要/低優先度のファイル

- `src/lib/__tests__/parser.test.ts` - XMLパーサーのテスト（モックXML使用のため特殊）
- `src/lib/__tests__/miningCalculation.test.ts` - Recipe/Machineモック不使用のため対応不要
- `src/lib/__tests__/miningCalculation.edge.test.ts` - Recipe/Machineモック不使用のため対応不要
- `src/lib/__tests__/photonGenerationCalculation.test.ts` - Recipe/Machineモック不使用のため対応不要
- `src/lib/__tests__/powerGenerationCalculation.test.ts` - Recipe/Machineモック不使用のため対応不要

#### リファクタリング指針

1. **モックRecipe/Machine/Nodeがある場合**
   - `recipePresets`、`machinePresets`、または対応するビルダー関数を使用
   - 特殊なケースは`createSingleOutputRecipe`、`createMultiOutputRecipe`、`createMachineByType`を使用
   - `createRecipeNode`、`createRawMaterialNode`でノードを作成

2. **XMLパーサーのテスト（parser.test.ts）**
   - XML文字列を直接使用しているため、ビルダーパターンは適用困難
   - 現状のままで問題なし

3. **モックデータ不使用のテスト**
   - `belt-calculation.test.ts`など、モックデータを直接使用していないテストは対応不要
   - `photonGenerationCalculation.test.ts`、`powerGenerationCalculation.test.ts`など、Recipe/Machineモックを使用しないテストも対応不要

4. **コンポーネントテストのリファクタリング**
   - コンポーネントテストでは、最小限のモックデータで十分な場合が多い
   - 直接オブジェクトリテラルで定義されている場合でも、ビルダーに置き換えることで一貫性が向上
   - モック関数内で定義されているものは、外部から見えないため優先度は低い

5. **優先度の高いリファクタリング対象**
   - `src/lib/roadmap/__tests__/phaseCalculation.test.ts` - `createMockRecipe`を12箇所使用
   - その他の`lib/`配下のテストファイル（ビジネスロジック層のため）

### 2. settingsStore の slice 化 ✅ 完了

#### 実施内容

- `src/stores/settingsSlice.ts` に以下のsliceを実装
  - `SettingsSlice` - 基本設定（増産剤、機械ランク、コンベアベルト、ソーター、代替レシピ、採掘速度研究、光子生成）
  - `TemplateSlice` - テンプレート管理
  - `PowerGenerationSlice` - 発電設備設定
  - `CustomTemplateSlice` - カスタムテンプレート管理

- `src/stores/settingsStore.ts` をsliceを使用するように更新
- テスト更新完了（65テスト成功）

### 3. Phase 5: E2Eテストの再構築 ✅ 完了

#### 実施内容

- Playwright フィクスチャの導入完了
- シナリオの分割完了（11ファイルをリファクタリング）
- テスト実行時間の短縮完了（ワーカー数最適化）
- 保守性の向上完了（ドキュメント作成）

---

## 重要な注意事項

### 1. ビルダーの使用方法

#### PowerConsumption の構造

- `power` オブジェクトには必ず `dysonSphere` プロパティを含めること
- 形式: `{ machines: number, sorters: number, dysonSphere: number, total: number }`

#### ConveyorBeltRequirement の構造

- `conveyorBelts` オブジェクトは `{ inputs: number, outputs: number, total: number }` 形式
- 一部のテストでは `perSecond` プロパティが使われているが、新しいビルダーでは使用しない

#### ProliferatorConfig の使用

- `PROLIFERATOR_DATA` は `src/types/settings` から直接インポートすること
- `testDataFactory` から再エクスポートしていないため注意

### 2. テスト実行時の注意

#### 機械の電力値について

- `machinePresets.arcSmelter()` の `workEnergyPerTick` は `360000` に設定済み
- これは元のテストの期待値に合わせて調整済み
- 他の機械プリセットも必要に応じて調整が必要な場合がある

#### エッジケーステスト

- `statistics.edge.test.ts` など、`any`型を使用している特殊なテストは、可能な範囲でビルダーを使用
- 完全な型安全性は犠牲になる場合があるが、ビルダーを使用することで一貫性は保たれる

### 3. 既知の問題

#### `parser.test.ts` について

- XML文字列を直接使用しているため、ビルダーパターンは適用困難
- 現状のままで問題なし

#### `machines` の型について

- `GameData` の `machines` は `Map<number, Machine>` 形式
- `testDataFactory.ts` で修正済み

---

## 使用したパターンとベストプラクティス

### 1. ビルダーパターン

#### 基本原則

- テストデータの作成を統一化
- デフォルト値を提供し、必要な部分のみオーバーライド
- プリセットを用意してよく使われるデータを簡単に作成可能に

#### プリセットの追加方法

新しいプリセットを追加する場合は、対応するビルダーファイルに追加：

```typescript
// recipeBuilder.ts に追加例
export const recipePresets = {
  // ... 既存のプリセット

  /**
   * 新しいレシピプリセット
   */
  newRecipe: (): Recipe =>
    createSingleOutputRecipe({
      SID: 999,
      name: "New Recipe",
      // ... その他のプロパティ
    }),
};
```

### 2. サービス層パターン

#### 原則

- UI、状態管理、ビジネスロジックを分離
- サービス層でビジネスロジックを集約
- カスタムフックでUIとサービスを接続

### 3. 履歴記録パターン

#### 原則

- 履歴記録ロジックをサービス層に集約
- ストアから直接履歴を記録しない
- タイプ別のヘルパー関数を提供

---

## トラブルシューティング

### テストが失敗する場合

1. **`PROLIFERATOR_DATA` が見つからない**
   - `src/types/settings` から直接インポートすること
   - `testDataFactory` から再エクスポートしていない

2. **`power` オブジェクトの型エラー**
   - `dysonSphere` プロパティが含まれているか確認
   - 形式: `{ machines: number, sorters: number, dysonSphere: number, total: number }`

3. **機械の電力値が期待値と異なる**
   - `machinePresets` の設定値を確認
   - 必要に応じて `machineBuilder.ts` を修正

### ビルダーが見つからない場合

1. **インポートパスの確認**
   - `src/test/factories/testDataFactory` からインポート
   - または直接各ビルダーファイルからインポート

2. **再エクスポートの確認**
   - `testDataFactory.ts` で正しく再エクスポートされているか確認

---

## コミット履歴

### Phase 1-3 のコミット

- **コミットハッシュ**: `e954c87`
- **ブランチ**: `feature/refactoring-0.0.2`
- **メッセージ**: "refactor: Phase 1-3 リファクタリング完了"

### Phase 4 のコミット

- まだコミットしていない（作業中）

---

## 次のステップ

### 優先度: 高

1. **残りのテストファイルのリファクタリング**
   - `miningCalculation.test.ts` など、まだリファクタリングしていないファイル
   - ただし、XMLパーサーのテストなど特殊なケースは除く

2. **Phase 4 のコミット**
   - 現在の作業をコミット
   - メッセージ: "refactor: Phase 4 テストリファクタリング完了"

### 優先度: 中

3. **settingsStore の slice 化**
   - `settingsSlice.ts` を実装
   - 機能ごとにsliceに分割

4. **Phase 5: E2Eテストの再構築**
   - Playwright フィクスチャの導入
   - シナリオの分割

---

## 参考情報

### 関連ファイル

#### ビルダーファイル

- `src/test/factories/nodeBuilder.ts`
- `src/test/factories/recipeBuilder.ts`
- `src/test/factories/machineBuilder.ts`
- `src/test/factories/testDataFactory.ts`

#### サービスファイル

- `src/services/plan-management/`
- `src/services/history-recording/`

#### フックファイル

- `src/hooks/usePlanManagerDialogs.ts`
- `src/hooks/usePlanExport.ts`
- `src/hooks/usePlanImport.ts`

### 型定義ファイル

- `src/types/ui-tabs.ts`
- `src/types/calculation.ts`
- `src/types/game-data.ts`
- `src/types/settings.ts`

---

## 作業メモ

### 実施済みの主要な変更

1. **PlanManager の分割**
   - 1000行以上のコンポーネントを複数のサービスとフックに分割
   - 可読性と保守性が大幅に向上

2. **タブ状態の統一**
   - 複数のboolean状態を列挙型に統一
   - 型安全性が向上

3. **履歴記録の集約**
   - 分散していた履歴記録ロジックをサービス層に集約
   - ストアの責務が明確化

4. **テストの統一化**
   - モックデータ作成をビルダーパターンに統一
   - テストコードの重複が削減

### 今後の改善点

1. **テストカバレッジの向上**
   - リファクタリングしたコードのテストカバレッジを確認
   - 不足しているテストケースを追加

2. **パフォーマンス最適化**
   - テスト実行時間の短縮
   - E2Eテストの最適化

3. **ドキュメントの整備**
   - APIドキュメントの更新
   - 使用方法のドキュメント作成

---

**最終更新**: 2025-01-28
**ステータス**: Phase 1-5 完了
