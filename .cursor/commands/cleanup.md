# クリーンアップコマンド

このコマンドは、不要なファイル、コード、デバッグコードを削除するコマンドです。

## 使用方法

```
/cleanup [対象]
```

**対象**:
- `/cleanup` - 全自動クリーンアップ（デフォルト）
- `/cleanup debug` - デバッグコードのみ
- `/cleanup imports` - 未使用のimportのみ
- `/cleanup files` - 一時ファイルのみ
- `/cleanup comments` - 不要なコメントのみ
- `/cleanup eslint` - ESLint自動修正のみ

**例**:
- `/cleanup` - 全項目をクリーンアップ
- `/cleanup debug` - console.log() などのデバッグコードを削除
- `/cleanup imports` - 未使用のimportを削除

## 実行内容

### デフォルト（全自動クリーンアップ）

以下の全項目を順番に実行します：

#### 1. 未使用のimport文を削除

- **検出方法**: TypeScriptコンパイラとESLintで未使用変数を検出
- **削除対象**:
  ```typescript
  // 削除される例
  import { unusedFunction } from './helpers'; // 使用されていない
  import React from 'react'; // 使用されていない（React 17+）
  import type { UnusedType } from './types'; // 使用されていない型
  ```

- **保持される例**:
  ```typescript
  // 保持される例
  import './styles.css'; // 副作用のためのimport
  import React from 'react'; // JSXで使用されている
  import { usedFunction } from './helpers'; // コード内で使用されている
  ```

#### 2. デバッグコードを削除

- **削除対象**:
  ```typescript
  // 削除されるデバッグコード
  console.log('Debug:', result);
  console.warn('Warning:', error);
  console.error('Error:', error); // エラーハンドリング以外
  console.debug('Debug info');
  console.info('Info');
  console.table(data);
  debugger; // デバッガーブレークポイント
  ```

- **保持される例**:
  ```typescript
  // 保持されるログ（意図的なログ出力）
  if (process.env.NODE_ENV === 'development') {
    console.log('Development mode');
  }
  
  // エラーハンドリング内のログは保持
  try {
    // 処理
  } catch (error) {
    console.error('Failed to process:', error); // 保持
    throw error;
  }
  ```

#### 3. 一時ファイルを削除

- **削除対象**:
  ```
  *.tmp
  *.bak
  *.swp
  *.swo
  *~
  .DS_Store
  Thumbs.db
  *.log (node_modules以外)
  .vscode/settings.json.bak
  .cursor/chat/*.bak
  ```

- **除外**:
  ```
  node_modules/**
  dist/**
  coverage/**
  .git/**
  ```

#### 4. 不要なコメントアウトされたコードを削除

- **削除対象**:
  ```typescript
  // 削除される例（コメントアウトされた古いコード）
  // function oldImplementation() {
  //   return 'old';
  // }
  
  // const oldVariable = 'old';
  
  // if (condition) {
  //   // 古い処理
  // }
  ```

- **保持される例**:
  ```typescript
  // 保持されるコメント（説明・仕様）
  // この関数は生産チェーンを計算します
  function calculateProductionChain() {
    // ステップ1: 入力を検証
    // TODO: 将来的にはバリデーション強化
    return result;
  }
  ```

#### 5. ESLint --fix を実行

```bash
npm run lint -- --fix
```

- **自動修正される内容**:
  - 未使用変数の削除
  - import順序の修正
  - セミコロンの追加・削除
  - インデントの修正
  - 空行の整理
  - 括弧の統一

#### 6. 削除内容をユーザーに報告

クリーンアップの結果をサマリー形式で報告：

```
✅ クリーンアップ完了

📊 削除サマリー:
- 未使用のimport: 5個
- デバッグコード（console.log等）: 8個
- 一時ファイル: 3個
- コメントアウトされたコード: 12行
- ESLint自動修正: 15箇所

📂 削除されたファイル:
- temp_backup.ts.bak
- debug_output.log
- .DS_Store

⚠️  確認が必要な項目:
- src/lib/parser.ts:45 - console.error() が残っています（エラーハンドリング内のため保持）

📝 次のステップ:
1. git diff で変更内容を確認してください
2. 意図しない削除がないか確認してください
3. テストを実行してください（/test）
```

### オプション別の実行内容

#### `/cleanup debug` - デバッグコードのみ

```bash
# console.log(), console.warn(), debugger などを検出・削除
grep -r "console\\.log" src/
grep -r "console\\.warn" src/
grep -r "console\\.debug" src/
grep -r "debugger" src/
```

- **削除対象**: console.*, debugger
- **保持対象**: エラーハンドリング内のconsole.error()
- **実行時間**: 約5秒

#### `/cleanup imports` - 未使用のimportのみ

```bash
# TypeScriptコンパイラで未使用変数を検出
npx tsc --noEmit

# ESLintで未使用importを検出・削除
npm run lint -- --fix
```

- **削除対象**: 未使用のimport文
- **保持対象**: 副作用のためのimport（例: './styles.css'）
- **実行時間**: 約10秒

#### `/cleanup files` - 一時ファイルのみ

```bash
# 一時ファイルを検出
find . -name "*.tmp" -o -name "*.bak" -o -name "*.swp"

# 削除
find . -name "*.tmp" -delete
find . -name "*.bak" -delete
find . -name "*.swp" -delete
find . -name ".DS_Store" -delete
```

- **削除対象**: 一時ファイル、バックアップファイル
- **除外**: node_modules/, dist/, .git/
- **実行時間**: 約5秒

#### `/cleanup comments` - 不要なコメントのみ

- **削除対象**: コメントアウトされた古いコード
- **保持対象**: 説明コメント、TODOコメント、仕様コメント
- **実行時間**: 約5秒

#### `/cleanup eslint` - ESLint自動修正のみ

```bash
npm run lint -- --fix
```

- **自動修正**: ESLintのauto-fixable rulesのみ
- **実行時間**: 約10秒

## 安全性の確保

### 削除前の確認

1. **バックアップの作成**
   - 重要な変更の場合、自動的にgit stashでバックアップ
   - `git stash save "Before cleanup"`

2. **差分の表示**
   - 削除後、自動的に `git diff` を表示
   - ユーザーが意図しない削除を確認可能

3. **ユーザー確認**
   - 大量の削除（50行以上）の場合、ユーザーに確認を求める
   - 確認なしに削除しない

### 保護されるファイル・コード

以下は削除されません：

1. **設定ファイル**
   - package.json
   - tsconfig.json
   - vite.config.ts
   - etc.

2. **ドキュメント**
   - README.md
   - docs/**
   - *.md（一般）

3. **ビルド成果物**
   - dist/**
   - coverage/**

4. **依存関係**
   - node_modules/**

5. **Git管理ファイル**
   - .git/**
   - .gitignore

6. **意図的なログ**
   - エラーハンドリング内のconsole.error()
   - 開発環境限定のログ

## 使用例

### 例1: 全自動クリーンアップ

```bash
/cleanup

# 実行結果:
# 🧹 全自動クリーンアップ開始...
#
# [1/5] 未使用のimport削除中...
# ✅ 5個の未使用importを削除しました
#   - src/lib/calculator.ts: 2個
#   - src/components/ResultTree.tsx: 3個
#
# [2/5] デバッグコード削除中...
# ✅ 8個のデバッグコードを削除しました
#   - console.log(): 6個
#   - console.warn(): 2個
#
# [3/5] 一時ファイル削除中...
# ✅ 3個の一時ファイルを削除しました
#   - temp_backup.ts.bak
#   - debug_output.log
#   - .DS_Store
#
# [4/5] コメントアウトされたコード削除中...
# ✅ 12行のコメントアウトされたコードを削除しました
#
# [5/5] ESLint自動修正実行中...
# ✅ 15箇所を自動修正しました
#
# 🎉 クリーンアップ完了！
#
# 📝 次のステップ:
# 1. git diff で変更内容を確認してください
# 2. テストを実行してください（/test）
```

### 例2: デバッグコードのみ削除

```bash
/cleanup debug

# 実行結果:
# 🧹 デバッグコード削除中...
#
# 検出されたデバッグコード:
# - src/lib/calculator.ts:45 → console.log('result:', result)
# - src/lib/calculator.ts:78 → console.warn('deprecated')
# - src/components/ResultTree.tsx:120 → console.debug('node:', node)
#
# ✅ 3個のデバッグコードを削除しました
#
# 📝 git diff で変更内容を確認してください
```

### 例3: 未使用のimportのみ削除

```bash
/cleanup imports

# 実行結果:
# 🧹 未使用のimport削除中...
#
# 検出された未使用import:
# - src/lib/calculator.ts:3 → import { unusedFunction } from './helpers'
# - src/lib/parser.ts:5 → import type { UnusedType } from './types'
#
# ✅ 2個の未使用importを削除しました
#
# 📝 TypeScriptコンパイルを確認してください（npx tsc --noEmit）
```

## エラーハンドリング

### 削除に失敗した場合

```
❌ クリーンアップ中にエラーが発生しました

エラー内容:
- ファイルが開かれています: src/lib/calculator.ts
  → ファイルを閉じてから再実行してください

復元方法:
1. git stash pop で変更を復元できます
2. git diff で差分を確認してください
```

### 意図しない削除があった場合

```bash
# バックアップから復元
git stash pop

# または特定のファイルのみ復元
git checkout HEAD -- <ファイル名>
```

## 推奨される使用タイミング

### ✅ クリーンアップを実行すべきとき

1. **コミット前**
   - 不要なデバッグコードを削除
   - 未使用のimportを整理

2. **リファクタリング後**
   - 古いコードが残っている
   - 未使用のimportが増えた

3. **PR作成前**
   - コードをきれいにしてからレビューに出す

4. **開発中の定期的な整理**
   - 週1回程度の定期クリーンアップ

### ❌ クリーンアップを避けるべきとき

1. **デバッグ中**
   - デバッグコードを残しておきたい

2. **未保存の変更がある**
   - 先に保存してからクリーンアップ

3. **大規模な変更中**
   - 小さな単位で段階的にクリーンアップ

## ワークフローへの組み込み

### コミット前のフロー

```bash
# 1. コード変更完了
# ... コード編集 ...

# 2. 自己レビュー
/self-review

# 3. クリーンアップ 🆕
/cleanup

# 4. 変更内容を確認
git diff

# 5. テスト実行
/test

# 6. コミット
git add <変更ファイル>
git commit -m "feat: 新機能を追加"
```

### リファクタリング後のフロー

```bash
# 1. リファクタリング完了
# ... コード整理 ...

# 2. 未使用のimport削除
/cleanup imports

# 3. テスト実行（リグレッション確認）
/test

# 4. さらにクリーンアップ
/cleanup

# 5. 最終確認
git diff
/test

# 6. コミット
git add <変更ファイル>
git commit -m "refactor: コードを整理"
```

## 注意事項

1. **必ずバックアップを取る**
   - 重要な変更の場合、`git stash` で自動バックアップ
   - 手動で `git commit` してからクリーンアップも推奨

2. **削除後は必ず確認**
   - `git diff` で変更内容を確認
   - 意図しない削除がないかチェック

3. **テストを実行**
   - クリーンアップ後は必ず `/test` でテスト実行
   - 削除によって動作が変わっていないか確認

4. **エラーハンドリングのログは残す**
   - try-catch内のconsole.error()は削除されません
   - 意図的なログ出力は保持されます

5. **段階的にクリーンアップ**
   - 一度に全削除ではなく、段階的にクリーンアップ
   - 各ステップでテスト実行を推奨

---

**クリーンアップはコードの可読性と保守性を向上させる重要なステップです。コミット前に必ず実行してください。**

