# Data Test ID 対応表

このドキュメントは、E2Eテスト用に追加されたdata-testid属性の対応表です。

## Welcome モーダル (WelcomeModal)

### ステップ表示

| data-testid                           | 説明                   | 対象要素                       |
| ------------------------------------- | ---------------------- | ------------------------------ |
| `welcome-step-indicator-{stepNumber}` | ステップインジケーター | 各ステップの進行状況バー       |
| `welcome-step-progress`               | ステップ進行状況       | ステップ進行状況のテキスト表示 |

## 設定パネル (SettingsPanel)

### メインコンテナ

| data-testid      | 説明           | 対象要素                   |
| ---------------- | -------------- | -------------------------- |
| `settings-panel` | 設定パネル全体 | 設定パネルのメインコンテナ |

### 増産剤設定

| data-testid                       | 説明                             | 対象要素                                         |
| --------------------------------- | -------------------------------- | ------------------------------------------------ |
| `overclock-not-available-message` | 追加生産モード使用不可メッセージ | 追加生産モードが使用できない場合の警告メッセージ |

## 代替レシピ選択 (AlternativeRecipeSelector)

### レシピ数表示

| data-testid             | 説明         | 対象要素                     |
| ----------------------- | ------------ | ---------------------------- |
| `recipe-count-{itemId}` | レシピ数表示 | 各アイテムの代替レシピ数表示 |

## レシピ選択 (RecipeSelector)

### メインコンテナ

| data-testid   | 説明                 | 対象要素                   |
| ------------- | -------------------- | -------------------------- |
| `recipe-list` | レシピ選択エリア全体 | レシピ選択のメインコンテナ |

### お気に入り

| data-testid       | 説明               | 対象要素                         |
| ----------------- | ------------------ | -------------------------------- |
| `favorites-count` | お気に入りカウント | お気に入りボタン内のカウント表示 |

### 検索結果

| data-testid                   | 説明             | 対象要素                            |
| ----------------------------- | ---------------- | ----------------------------------- |
| `recipe-search-results-count` | レシピ検索結果数 | 「161 レシピ 見つかりました」の表示 |

## プランマネージャー (PlanManager)

### インポートメッセージ

| data-testid              | 説明                     | 対象要素                           |
| ------------------------ | ------------------------ | ---------------------------------- |
| `import-success-message` | インポート成功メッセージ | プランインポート成功時のメッセージ |
| `import-error-message`   | インポート失敗メッセージ | プランインポート失敗時のメッセージ |

## ModSettings

### 読み込みメッセージ

| data-testid                | 説明                              | 対象要素                                 |
| -------------------------- | --------------------------------- | ---------------------------------------- |
| `modsettings-load-success` | ModSettings読み込み成功メッセージ | カスタムレシピ読み込み成功時のメッセージ |
| `modsettings-load-error`   | ModSettings読み込み失敗メッセージ | カスタムレシピ読み込み失敗時のメッセージ |

## レイアウト・ナビゲーション (Layout)

### タブ

| data-testid             | 説明               | 対象要素                 |
| ----------------------- | ------------------ | ------------------------ |
| `production-chain-tab`  | 生産チェーンのタブ | 生産チェーンのタブボタン |
| `statistics-tab`        | 統計のタブ         | 統計のタブボタン         |
| `building-cost-tab`     | 建設コストのタブ   | 建設コストのタブボタン   |
| `power-generation-tab`  | 発電設備のタブ     | 発電設備のタブボタン     |
| `mining-calculator-tab` | 採掘計算機のタブ   | 採掘計算機のタブボタン   |

### ボタン

| data-testid                  | 説明                      | 対象要素                  |
| ---------------------------- | ------------------------- | ------------------------- |
| `expand-collapse-all-button` | 全て展開/折りたたみボタン | 全て展開/折りたたみボタン |

## レシピ選択 (RecipeSelector)

### レシピ選択グリッド

| data-testid       | 説明               | 対象要素                     |
| ----------------- | ------------------ | ---------------------------- |
| `recipe-selector` | レシピ選択グリッド | レシピ選択グリッドのコンテナ |

## 生産チェーン (ProductionResultsPanel)

### メインコンテナ

| data-testid       | 説明                   | 対象要素                     |
| ----------------- | ---------------------- | ---------------------------- |
| `production-tree` | 生産チェーンエリア全体 | 生産チェーンのメインコンテナ |

### 原材料ノード

| data-testid                              | 説明                 | 対象要素               |
| ---------------------------------------- | -------------------- | ---------------------- |
| `raw-material-node-{itemId}`             | 原材料ノード全体     | 原材料ノードのコンテナ |
| `raw-material-output-rate-{itemId}`      | 原材料の出力速度     | 出力速度の数値表示     |
| `raw-material-power-{itemId}`            | 原材料の電力消費     | 電力消費の数値表示     |
| `raw-material-belts-outputs-{itemId}`    | 原材料のベルト出力数 | ベルト出力数の数値表示 |
| `raw-material-belts-total-{itemId}`      | 原材料のベルト総数   | ベルト総数の数値表示   |
| `raw-material-belts-saturation-{itemId}` | 原材料のベルト飽和率 | ベルト飽和率の数値表示 |

### レシピノード

| data-testid                              | 説明                   | 対象要素                     |
| ---------------------------------------- | ---------------------- | ---------------------------- |
| `recipe-node-{recipeSID}`                | レシピノード全体       | レシピノードのコンテナ       |
| `recipe-output-rate-{recipeSID}`         | レシピの出力速度       | 出力速度の数値表示           |
| `recipe-power-{recipeSID}`               | レシピの総電力消費     | 総電力消費の数値表示         |
| `recipe-input-rate-{recipeSID}-{itemId}` | レシピの入力速度       | 各入力アイテムの速度数値表示 |
| `recipe-power-machines-{recipeSID}`      | レシピの機械電力       | 機械電力の数値表示           |
| `recipe-power-sorters-{recipeSID}`       | レシピのソーター電力   | ソーター電力の数値表示       |
| `recipe-power-dyson-{recipeSID}`         | レシピのダイソン球電力 | ダイソン球電力の数値表示     |
| `recipe-belts-inputs-{recipeSID}`        | レシピのベルト入力数   | ベルト入力数の数値表示       |
| `recipe-belts-outputs-{recipeSID}`       | レシピのベルト出力数   | ベルト出力数の数値表示       |
| `recipe-belts-total-{recipeSID}`         | レシピのベルト総数     | ベルト総数の数値表示         |
| `recipe-belts-saturation-{recipeSID}`    | レシピのベルト飽和率   | ベルト飽和率の数値表示       |

### アイコン

| data-testid             | 説明             | 対象要素         |
| ----------------------- | ---------------- | ---------------- |
| `item-icon-{itemId}`    | アイテムアイコン | アイテムアイコン |
| `item-icon-{recipeSID}` | レシピアイコン   | レシピアイコン   |

## 統計タブ (StatisticsView)

### 概要統計

| data-testid                 | 説明           | 対象要素               |
| --------------------------- | -------------- | ---------------------- |
| `statistics-total-machines` | 総施設数       | 総施設数のカード       |
| `statistics-total-power`    | 総電力         | 総電力のカード         |
| `statistics-raw-materials`  | 原材料数       | 原材料数のカード       |
| `statistics-items-produced` | 生産アイテム数 | 生産アイテム数のカード |

### 電力グラフ

| data-testid                          | 説明                   | 対象要素                    |
| ------------------------------------ | ---------------------- | --------------------------- |
| `statistics-show-power-graph-button` | 電力グラフ表示ボタン   | 電力グラフ表示/非表示ボタン |
| `power-graph-total-consumption`      | 電力グラフの総消費電力 | 総消費電力のカード          |

### テーブル

| data-testid                              | 説明               | 対象要素                     |
| ---------------------------------------- | ------------------ | ---------------------------- |
| `statistics-raw-materials-table`         | 原材料テーブル     | 原材料テーブルのコンテナ     |
| `statistics-intermediate-products-table` | 中間生産物テーブル | 中間生産物テーブルのコンテナ |
| `statistics-final-products-table`        | 最終生産物テーブル | 最終生産物テーブルのコンテナ |

## 建設コスト (BuildingCostView)

### 生産設備

| data-testid                         | 説明               | 対象要素                     |
| ----------------------------------- | ------------------ | ---------------------------- |
| `building-cost-production-machines` | 生産設備セクション | 生産設備セクションのコンテナ |
| `building-cost-machine-{machineId}` | 個別の生産設備     | 各生産設備のカード           |

### 物流

| data-testid               | 説明           | 対象要素                 |
| ------------------------- | -------------- | ------------------------ |
| `building-cost-logistics` | 物流セクション | 物流セクションのコンテナ |
| `building-cost-sorters`   | ソーター       | ソーターのカード         |
| `building-cost-belts`     | ベルト         | ベルトのカード           |

## 発電設備 (PowerGenerationView)

### 設定

| data-testid                                         | 説明                     | 対象要素                           |
| --------------------------------------------------- | ------------------------ | ---------------------------------- |
| `power-generation-template-select`                  | 発電設備テンプレート選択 | テンプレート選択のセレクトボックス |
| `power-generation-proliferator-button-{type}`       | 増産剤ボタン             | 増産剤タイプのボタン               |
| `power-generation-generator-auto-button`            | 発電設備自動選択ボタン   | 自動選択ボタン                     |
| `power-generation-generator-button-{generatorType}` | 発電設備ボタン           | 各発電設備のボタン                 |
| `power-generation-fuel-auto-button`                 | 燃料自動選択ボタン       | 燃料自動選択ボタン                 |
| `power-generation-fuel-button-{fuelKey}`            | 燃料ボタン               | 各燃料のボタン                     |

### 必要電力

| data-testid                       | 説明     | 対象要素         |
| --------------------------------- | -------- | ---------------- |
| `power-generation-required-power` | 必要電力 | 必要電力のカード |

### 発電設備恒星

| data-testid                              | 説明           | 対象要素                 |
| ---------------------------------------- | -------------- | ------------------------ |
| `power-generation-generators`            | 発電設備リスト | 発電設備リストのコンテナ |
| `power-generation-generator-{machineId}` | 個別の発電設備 | 各発電設備のカード       |

### サマリー

| data-testid                | 説明             | 対象要素         |
| -------------------------- | ---------------- | ---------------- |
| `power-generation-summary` | 発電設備サマリー | サマリーのカード |

## 採掘計算機 (MiningCalculator)

### 設定

| data-testid                          | 説明                       | 対象要素                         |
| ------------------------------------ | -------------------------- | -------------------------------- |
| `miningCalculator`                   | 採掘計算機タイトル         | 採掘計算機のタイトル             |
| `noRawMaterialsRequired`             | 原材料不要メッセージ       | 原材料不要時のメッセージ         |
| `miningSpeedResearch`                | 採掘速度研究ラベル         | 採掘速度研究のラベル             |
| `mining-speed-bonus-decrease-button` | 採掘速度ボーナス減少ボタン | 採掘速度ボーナス減少ボタン       |
| `mining-speed-bonus-input`           | 採掘速度ボーナス入力       | 採掘速度ボーナスの数値入力       |
| `mining-speed-bonus-increase-button` | 採掘速度ボーナス増加ボタン | 採掘速度ボーナス増加ボタン       |
| `machineType`                        | 機械タイプラベル           | 機械タイプのラベル               |
| `mining-machine-type-select`         | 採掘機械タイプ選択         | 採掘機械タイプのセレクトボックス |
| `mining-work-speed-slider`           | 作業速度スライダー         | 作業速度のスライダー             |

### 起動採集器

| data-testid                            | 説明             | 対象要素           |
| -------------------------------------- | ---------------- | ------------------ |
| `mining-calculator-orbital-collectors` | 軌道採集器       | 軌道採集器のカード |
| `orbitalCollectors`                    | 軌道採集器ラベル | 軌道採集器のラベル |

### 電力倍率

| data-testid                          | 説明     | 対象要素         |
| ------------------------------------ | -------- | ---------------- |
| `mining-calculator-power-multiplier` | 電力倍率 | 電力倍率のカード |

### 素材内訳

| data-testid                            | 説明               | 対象要素                     |
| -------------------------------------- | ------------------ | ---------------------------- |
| `mining-calculator-material-breakdown` | 素材内訳セクション | 素材内訳セクションのコンテナ |
| `mining-calculator-material-{itemId}`  | 個別の素材         | 各素材のカード               |
| `collectors-label`                     | 採集器ラベル       | 採集器のラベル（非表示）     |
| `liquid-equipment-label`               | 液体設備ラベル     | 液体設備のラベル（非表示）   |
| `veins-label`                          | 鉱脈ラベル         | 鉱脈のラベル（非表示）       |
| `minersNeeded-label`                   | 必要採掘機ラベル   | 必要採掘機のラベル（非表示） |

## 設定パネル (SettingsPanel)

### 目標数量

| data-testid             | 説明         | 対象要素           |
| ----------------------- | ------------ | ------------------ |
| `target-quantity-input` | 目標数量入力 | 目標数量の数値入力 |

### 増産剤設定

| data-testid                       | 説明               | 対象要素             |
| --------------------------------- | ------------------ | -------------------- |
| `proliferator-type-button-{type}` | 増産剤タイプボタン | 増産剤タイプのボタン |
| `proliferator-mode-button-{mode}` | 増産剤モードボタン | 増産剤モードのボタン |

### ベルト設定

| data-testid                          | 説明                 | 対象要素                 |
| ------------------------------------ | -------------------- | ------------------------ |
| `conveyor-belt-button-{tier}`        | ベルトボタン         | ベルトのティアボタン     |
| `conveyor-belt-stack-button-{count}` | ベルトスタックボタン | ベルトスタック数のボタン |
| `sorter-button-{tier}`               | ソーターボタン       | ソーターのティアボタン   |

### 機械ランク設定

| data-testid                            | 説明                 | 対象要素               |
| -------------------------------------- | -------------------- | ---------------------- |
| `machine-rank-button-smelt-{value}`    | 製錬機械ランクボタン | 製錬機械ランクのボタン |
| `machine-rank-button-assemble-{value}` | 組立機械ランクボタン | 組立機械ランクのボタン |

## レシピ比較モーダル (RecipeComparisonModal)

| data-testid                                  | 説明             | 対象要素               |
| -------------------------------------------- | ---------------- | ---------------------- |
| `recipe-comparison-select-button-{recipeId}` | レシピ選択ボタン | レシピ比較の選択ボタン |

## 電力グラフビュー (PowerGraphView)

| data-testid                     | 説明             | 対象要素               |
| ------------------------------- | ---------------- | ---------------------- |
| `power-graph-total-consumption` | 総消費電力カード | 総消費電力の表示カード |
| `power-distribution-chart`      | 電力配分グラフ   | 電力配分の円グラフ     |

## 代替レシピ選択 (AlternativeRecipeSelector)

| data-testid                                      | 説明                 | 対象要素               |
| ------------------------------------------------ | -------------------- | ---------------------- |
| `alternative-recipe-selector`                    | 代替レシピ設定エリア | 代替レシピ設定の全体   |
| `alternative-recipe-compare-button-{itemId}`     | 代替レシピ比較ボタン | 代替レシピ比較のボタン |
| `alternative-recipe-mining-button-{itemId}`      | 代替レシピ採掘ボタン | 代替レシピ採掘のボタン |
| `alternative-recipe-button-{itemId}-{recipeSID}` | 代替レシピボタン     | 代替レシピのボタン     |

## What-If シミュレーター (WhatIfSimulator)

### ボトルネック修正

| data-testid                         | 説明                     | 対象要素                   |
| ----------------------------------- | ------------------------ | -------------------------- |
| `whatif-fix-all-bottlenecks-button` | 全ボトルネック修正ボタン | 全ボトルネック修正のボタン |

### 最適化目標

| data-testid                           | 説明               | 対象要素               |
| ------------------------------------- | ------------------ | ---------------------- |
| `whatif-optimization-goal-power`      | 電力最適化目標     | 電力最適化のボタン     |
| `whatif-optimization-goal-machines`   | 機械最適化目標     | 機械最適化のボタン     |
| `whatif-optimization-goal-efficiency` | 効率最適化目標     | 効率最適化のボタン     |
| `whatif-optimization-goal-balanced`   | バランス最適化目標 | バランス最適化のボタン |

### クイックアクション

| data-testid                            | 説明                           | 対象要素                         |
| -------------------------------------- | ------------------------------ | -------------------------------- |
| `whatif-apply-best-button`             | 最適適用ボタン                 | 最適設定適用のボタン             |
| `whatif-quick-action-max-proliferator` | 最大増産剤クイックアクション   | 最大増産剤のクイックアクション   |
| `whatif-quick-action-max-belts`        | 最大ベルトクイックアクション   | 最大ベルトのクイックアクション   |
| `whatif-quick-action-max-stack`        | 最大スタッククイックアクション | 最大スタックのクイックアクション |

## 言語切り替え (LanguageSwitcher)

| data-testid                | 説明                 | 対象要素                       |
| -------------------------- | -------------------- | ------------------------------ |
| `language-switcher-select` | 言語切り替えセレクト | 言語切り替えのセレクトボックス |

## プランマネージャー (PlanManager)

| data-testid    | 説明               | 対象要素                     |
| -------------- | ------------------ | ---------------------------- |
| `plan-manager` | プランマネージャー | プランマネージャーのコンテナ |

## 使用方法

### Playwrightでの使用例

```typescript
// メインコンテナの存在確認
const settingsPanel = page.getByTestId("settings-panel");
const recipeList = page.getByTestId("recipe-list");
const productionTree = page.getByTestId("production-tree");

// Welcome モーダルのステップ表示を取得
const stepIndicator = page.getByTestId("welcome-step-indicator-1");
const stepProgress = page.getByTestId("welcome-step-progress");

// 追加生産モード使用不可メッセージを取得
const overclockMessage = page.getByTestId("overclock-not-available-message");

// レシピ数を取得
const recipeCount = page.getByTestId("recipe-count-1001");

// お気に入りカウントを取得
const favoritesCount = page.getByTestId("favorites-count");

// レシピ検索結果数を取得
const recipeSearchResults = page.getByTestId("recipe-search-results-count");

// インポート成功/失敗メッセージを取得
const importSuccess = page.getByTestId("import-success-message");
const importError = page.getByTestId("import-error-message");

// ModSettings読み込み成功/失敗メッセージを取得
const modSettingsSuccess = page.getByTestId("modsettings-load-success");
const modSettingsError = page.getByTestId("modsettings-load-error");

// タブの切り替え
await page.getByTestId("statistics-tab").click();
await page.getByTestId("building-cost-tab").click();

// 生産チェーンのノードを取得
const recipeNode = page.getByTestId("recipe-node-123");
const outputRate = page.getByTestId("recipe-output-rate-123");

// 統計の総施設数を取得
const totalMachines = page.getByTestId("statistics-total-machines");

// 建設コストのソーター数を取得
const sorters = page.getByTestId("building-cost-sorters");

// 発電設備の必要電力を取得
const requiredPower = page.getByTestId("power-generation-required-power");

// 採掘計算機の軌道採集器数を取得
const orbitalCollectors = page.getByTestId("mining-calculator-orbital-collectors");

// 設定の変更
await page.getByTestId("target-quantity-input").fill("100");
await page.getByTestId("proliferator-type-button-mk3").click();

// What-Ifシミュレーターの使用
await page.getByTestId("whatif-optimization-goal-power").click();
await page.getByTestId("whatif-apply-best-button").click();
```

### 注意事項

1. **動的なID**: `{itemId}`, `{recipeSID}`, `{machineId}`, `{type}`, `{mode}`, `{tier}`, `{value}`, `{count}`, `{generatorType}`, `{fuelKey}` などのプレースホルダーは実際の値に置き換えられます
2. **条件付き表示**: 一部の要素は条件によって表示されない場合があります
3. **多言語対応**: 表示されるテキストは多言語対応されているため、テストではdata-testidを使用してください
4. **非表示要素**: `collectors-label`, `liquid-equipment-label`, `veins-label`, `minersNeeded-label` は非表示のラベル要素です

## 更新履歴

- 2024-12-19: 初版作成
- 生産チェーン、統計タブ、建設コスト、発電設備、採掘計算機のdata-testidを追加
- 2024-12-19: 既存のdata-testidも含めて完全なマッピング表に更新
- レイアウト、設定パネル、代替レシピ選択、What-Ifシミュレーター、言語切り替えなどの既存data-testidを追加
- 2024-12-19: 追加のdata-testidを追加
- Welcome モーダルのステップ表示、追加生産モード使用不可メッセージ、レシピ数表示、お気に入りカウント、インポート成功/失敗メッセージ、ModSettings読み込み成功/失敗メッセージを追加
- 2024-12-19: メインコンテナのdata-testidを追加
- `settings-panel`、`recipe-list`、`production-tree`のメインコンテナ識別子を追加
