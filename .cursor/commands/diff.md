# 差分確認コマンド

このコマンドは、指定ブランチとの差分を確認するコマンドです。

## 使用方法

```
/diff [ブランチ名]
```

**例**:
- `/diff` - 自動判定（main または develop）
- `/diff main` - mainブランチとの差分
- `/diff develop` - developブランチとの差分
- `/diff feature/other-branch` - 他のfeatureブランチとの差分

## 実行内容

### ステップ 1: ブランチの自動判定

ブランチ名が指定されていない場合、現在のブランチから自動判定：

| 現在のブランチパターン | 比較先ブランチ | 理由 |
|----|-----|-----|
| `hotfix/fix-*` | `main` | 不具合修正はmainにマージ |
| `feature/refactoring-*` | `develop` | リファクタリングはdevelopにマージ |
| `feature/*` | `develop` | 機能追加はdevelopにマージ |
| `develop` | `main` | developとmainの差分 |
| `main` | `origin/main` | ローカルとリモートの差分 |
| その他 | `develop` | デフォルトはdevelop |

### ステップ 2: 差分の統計を表示

```bash
git diff <ブランチ> --stat
```

**表示内容**:
- 変更されたファイルのリスト
- 各ファイルの追加行数・削除行数
- 合計の追加行数・削除行数

**例**:
```
 src/lib/calculator.ts              | 120 +++++++++++++------
 src/components/ResultTree.tsx      |  45 +++++--
 src/stores/settingsStore.ts        |  30 +++++
 tests/e2e/calculator.spec.ts       |  60 ++++++++++
 4 files changed, 200 insertions(+), 55 deletions(-)
```

### ステップ 3: 変更されたファイルのリスト

変更されたファイルを分類して表示：

**追加されたファイル**:
```
✅ 新規ファイル (3個):
- src/lib/miningCalculation.ts
- src/components/MiningCalculator/MiningCalculator.tsx
- tests/e2e/mining.spec.ts
```

**変更されたファイル**:
```
📝 変更されたファイル (5個):
- src/lib/calculator.ts (+120, -55)
- src/components/ResultTree.tsx (+45, -10)
- src/stores/settingsStore.ts (+30, -0)
- src/App.tsx (+5, -3)
- package.json (+2, -0)
```

**削除されたファイル**:
```
🗑️ 削除されたファイル (1個):
- src/lib/oldCalculator.ts
```

### ステップ 4: 追加行数・削除行数のサマリー

全体の変更量を集計：

```
📊 変更サマリー:
- 合計ファイル数: 9個
  - 新規: 3個
  - 変更: 5個
  - 削除: 1個
- 追加行数: 200行
- 削除行数: 55行
- 純増加: +145行
```

### ステップ 5: コミットログ

```bash
git log <ブランチ>..HEAD --oneline
```

現在のブランチに含まれる、比較先ブランチにはないコミットを表示：

```
📜 コミットログ (5個):
- abc1234 feat: 採掘速度計算機能を追加
- def5678 refactor: calculator.tsを整理
- ghi9012 test: 単体テストを追加
- jkl3456 fix: Null参照エラーを修正
- mno7890 docs: READMEを更新
```

### ステップ 6: 主要な変更内容の要約

変更内容を自動的に要約：

```
🔍 主要な変更内容:

1. 新機能追加 (3ファイル)
   - 採掘速度計算機能を実装
   - UIコンポーネントを追加
   - E2Eテストを追加

2. リファクタリング (2ファイル)
   - calculator.tsをクリーンアップ
   - 型定義を改善

3. バグ修正 (1ファイル)
   - Null参照エラーを修正

4. テスト追加 (1ファイル)
   - 単体テストのカバレッジを向上

5. ドキュメント更新 (1ファイル)
   - README.mdを更新
```

### ステップ 7: 詳細な差分の表示（オプション）

オプションで詳細な差分を表示：

```bash
# ファイルごとの詳細な差分
git diff <ブランチ> -- <ファイル名>
```

## オプション

### `/diff --detail` - 詳細な差分を表示

```
/diff --detail
```

- 各ファイルの詳細な差分（追加・削除された行）を表示
- コードレベルの変更内容を確認

### `/diff --files` - ファイルリストのみ表示

```
/diff --files
```

- 変更されたファイルのリストのみ表示
- 統計情報を省略して高速表示

### `/diff --commits` - コミットログのみ表示

```
/diff --commits
```

- コミットログのみ表示
- ファイルの差分を省略

### `/diff --summary` - サマリーのみ表示

```
/diff --summary
```

- 変更サマリーのみ表示（ファイル数、行数）
- 最も高速

## 使用例

### 例1: 自動判定（デフォルト）

```bash
# 現在のブランチ: feature/refactoring-app-component
# 自動判定: develop ブランチと比較

/diff

# 実行結果:
# 🔍 差分確認: develop...HEAD
#
# 📊 変更サマリー:
# - 合計ファイル数: 5個
#   - 新規: 2個
#   - 変更: 3個
#   - 削除: 0個
# - 追加行数: 200行
# - 削除行数: 150行
# - 純増加: +50行
#
# ✅ 新規ファイル (2個):
# - src/hooks/useProductionCalculation.ts
# - src/components/Layout/MainLayout.tsx
#
# 📝 変更されたファイル (3個):
# - src/App.tsx (+5, -200)
# - src/lib/calculator.ts (+120, -50)
# - package.json (+2, -0)
#
# 📜 コミットログ (3個):
# - abc1234 refactor: App.tsxを分割してカスタムフックを抽出
# - def5678 refactor: calculator.tsを整理
# - ghi9012 test: 単体テストを追加
#
# 🔍 主要な変更内容:
# 1. リファクタリング (3ファイル)
#    - App.tsxを300行から50行に削減
#    - カスタムフックを抽出
#    - レイアウトコンポーネントを分離
#
# 2. テスト追加 (1ファイル)
#    - useProductionCalculation.test.ts を追加
```

### 例2: mainブランチとの差分

```bash
/diff main

# 実行結果:
# 🔍 差分確認: main...HEAD
#
# 📊 変更サマリー:
# - 合計ファイル数: 10個
# - 追加行数: 500行
# - 削除行数: 100行
# - 純増加: +400行
#
# 📜 コミットログ (8個):
# - abc1234 feat: 採掘速度計算機能を追加
# - def5678 feat: レシピ比較モーダルを追加
# - ghi9012 refactor: App.tsxを分割
# - jkl3456 fix: Null参照エラーを修正
# ... (以下略)
```

### 例3: ファイルリストのみ表示

```bash
/diff --files

# 実行結果:
# 📂 変更されたファイル:
#
# ✅ 新規 (2個):
# - src/hooks/useProductionCalculation.ts
# - src/components/Layout/MainLayout.tsx
#
# 📝 変更 (3個):
# - src/App.tsx
# - src/lib/calculator.ts
# - package.json
```

### 例4: コミットログのみ表示

```bash
/diff --commits

# 実行結果:
# 📜 コミットログ: develop...HEAD
#
# abc1234 (2024-10-24) refactor: App.tsxを分割してカスタムフックを抽出
# def5678 (2024-10-23) refactor: calculator.tsを整理
# ghi9012 (2024-10-23) test: 単体テストを追加
```

### 例5: 詳細な差分を表示

```bash
/diff --detail

# 実行結果:
# 🔍 詳細な差分: develop...HEAD
#
# === src/App.tsx ===
# @@ -1,15 +1,5 @@
# -import React from 'react';
# -import { useState, useEffect } from 'react';
# +import { MainLayout } from './components/Layout/MainLayout';
# +import { useProductionCalculation } from './hooks/useProductionCalculation';
#
# ... (以下略)
```

## エラーハンドリング

### ブランチが存在しない場合

```
❌ エラー: ブランチが存在しません

指定されたブランチ: feature/nonexistent

確認事項:
- ブランチ名が正しいか確認してください
- リモートブランチの場合は git fetch してください

利用可能なブランチ:
- main
- develop
- feature/refactoring-app
- hotfix/fix-calculation-error
```

### リモートブランチが最新でない場合

```
⚠️  警告: リモートブランチが最新でない可能性があります

最終更新: 2日前

最新の差分を確認するには:
git fetch origin
/diff
```

## 推奨される使用タイミング

### ✅ 差分確認を実行すべきとき

1. **PR作成前**
   - 変更内容を確認してからPR作成
   - 意図しない変更がないかチェック

2. **コミット前**
   - どのファイルを変更したか確認
   - コミットに含めるべきファイルを特定

3. **マージ前**
   - マージする内容を最終確認
   - コンフリクトの可能性を事前チェック

4. **レビュー依頼前**
   - レビュアーに説明する内容を整理
   - 変更量の把握

### 使用例: PR作成前のフロー

```bash
# 1. 変更内容を確認
/diff

# 2. 差分が期待通りか確認
# ... 確認 ...

# 3. 意図しない変更があれば修正
git checkout HEAD -- <ファイル名>

# 4. 再度差分確認
/diff

# 5. OKならPR作成
/pr
```

## 他のコマンドとの連携

### コミット前のワークフロー

```bash
# 1. 変更内容を確認
/diff

# 2. 自己レビュー
/self-review

# 3. クリーンアップ
/cleanup

# 4. 変更内容を再確認
/diff

# 5. テスト実行
/test

# 6. コミット
git add <変更ファイル>
git commit -m "feat: 新機能を追加"
```

### PR作成前のワークフロー

```bash
# 1. マージ先ブランチを最新化
git fetch origin

# 2. 差分確認
/diff

# 3. 変更内容が適切か確認
# ... 確認 ...

# 4. 全テスト実行
/test

# 5. PR作成
/pr
```

## 注意事項

1. **リモートブランチを最新化**
   - 差分確認前に `git fetch` でリモートを最新化

2. **意図しない変更をチェック**
   - 差分に意図しないファイルが含まれていないか確認
   - .cursor/rules/ の変更は通常不要

3. **変更量を把握**
   - 大規模な変更は複数のPRに分割を検討
   - 1PR = 200-300行程度が理想

4. **コミットログを確認**
   - コミットメッセージが適切か確認
   - 必要に応じて git rebase -i で整理

---

**差分確認はコミット・PR作成前の重要なステップです。意図しない変更がないか必ず確認してください。**

