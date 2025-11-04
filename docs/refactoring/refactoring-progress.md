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

## Phase 5: Playwright フィクスチャ導入とシナリオ分割でE2Eを再構築 ⏳ 未着手

### 予定作業

#### E2Eテストの再構築

- Playwright フィクスチャの導入
- シナリオの分割と整理
- テストの実行時間短縮
- 保守性の向上

### 現状

- 未着手
- Phase 4完了後に実施予定

---

## 残作業詳細

### 1. テストファイルのリファクタリング（継続）

#### まだリファクタリングしていないテストファイル

**lib/**tests**/ 配下**

- `src/lib/__tests__/parser.test.ts` - XMLパーサーのテスト（モックXML使用のため特殊）
- `src/lib/__tests__/miningCalculation.test.ts` - 採掘計算のテスト
- `src/lib/__tests__/miningCalculation.edge.test.ts` - 採掘計算のエッジケース
- `src/lib/__tests__/photonGenerationCalculation.test.ts` - 光子生成計算のテスト
- `src/lib/__tests__/powerGenerationCalculation.test.ts` - 発電計算のテスト
- `src/lib/__tests__/powerDisplayConsistency.test.ts` - 電力表示一貫性のテスト
- `src/lib/__tests__/unifiedPowerCalculation.test.ts` - 統一電力計算のテスト
- `src/lib/__tests__/matrix-lab-speed.test.ts` - Matrix Lab速度のテスト
- `src/lib/__tests__/calculator.boundary.test.ts` - 計算機の境界値テスト

**lib/calculator/**tests**/ 配下**

- `src/lib/calculator/__tests__/belt-calculation.test.ts` - ベルト計算のテスト（モックデータ不使用のため対応不要）

**lib/import/**tests**/ 配下**

- インポート関連のテスト（必要に応じて）

**lib/export/**tests**/ 配下**

- エクスポート関連のテスト（必要に応じて）

**lib/roadmap/**tests**/ 配下**

- `src/lib/roadmap/__tests__/phaseCalculation.test.ts` - フェーズ計算のテスト

#### リファクタリング指針

1. **モックRecipe/Machine/Nodeがある場合**
   - `recipePresets`、`machinePresets`、または対応するビルダー関数を使用
   - 特殊なケースは`createSingleOutputRecipe`、`createMultiOutputRecipe`、`createMachineByType`を使用

2. **XMLパーサーのテスト（parser.test.ts）**
   - XML文字列を直接使用しているため、ビルダーパターンは適用困難
   - 現状のままで問題なし

3. **モックデータ不使用のテスト**
   - `belt-calculation.test.ts`など、モックデータを直接使用していないテストは対応不要

### 2. settingsStore の slice 化（継続）

#### 現状

- `src/stores/settingsSlice.ts` の基盤ファイルは作成済み
- 実際のslice化は未実施

#### 予定作業

- `settingsStore`を機能ごとにsliceに分割
  - 増産剤設定
  - 機械ランク設定
  - コンベアベルト設定
  - ソーター設定
  - 代替レシピ設定
  - 採掘速度研究設定
  - 光子生成設定
  - カスタムテンプレート

### 3. Phase 5: E2Eテストの再構築

#### 予定作業

- Playwright フィクスチャの導入
- シナリオの分割
- テスト実行時間の短縮
- 保守性の向上

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
**ステータス**: Phase 1-4 完了、Phase 5 未着手
