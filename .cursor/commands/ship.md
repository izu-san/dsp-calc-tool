# 品質チェック&PR作成コマンド

このコマンドは、変更内容の品質チェックを実行し、全て成功した場合に自動的にコミット・プッシュ・PR作成を行います。

## 使用方法

```
/ship <Issue URL または Issue番号> [PR先ブランチ]
```

**引数**:
- `<Issue URL または Issue番号>`: 必須。GitHub IssueのURL、`#123`形式、または`123`形式
- `[PR先ブランチ]`: オプション。デフォルトは`develop`。指定がある場合はそのブランチへ

**例**:
- `/ship #92`
- `/ship 92`
- `/ship https://github.com/izu-san/dsp-calc-tool/issues/92`
- `/ship #92 develop`
- `/ship #92 main`

## 実行内容

このコマンドを実行すると、以下の**全ステップを必ず自動的に実行**します：

### ステップ 1: 前提条件の確認 🔴 必須実行

- [ ] **Issue番号の抽出**（必ず実行すること）
  - URL形式: `https://github.com/owner/repo/issues/123` → `123`
  - `#123`形式 → `123`
  - `123`形式 → `123`
  - 抽出したIssue番号を記録

- [ ] **PR先ブランチの決定**（必ず実行すること）
  - 引数で指定がある場合: 指定されたブランチ
  - 指定がない場合: `develop`（デフォルト）

- [ ] **現在のブランチを確認**（必ず実行すること）
  ```bash
  git branch --show-current
  ```

- [ ] **Git状態を確認**（必ず実行すること）
  ```bash
  git status
  ```
  - 未コミットの変更があるか確認
  - コミット済みの変更があるか確認

### ステップ 2: TypeScriptコンパイルチェック 🔴 必須実行

- [ ] **TypeScriptコンパイルを実行**（必ず実行すること）
  ```bash
  npx tsc --noEmit
  ```

- [ ] **エラー処理**:
  - **成功（exit code 0）**: ステップ3へ進む
  - **失敗（exit code 非0）**:
    - エラー内容を解析
    - 自動修正可能なエラー（未使用変数、型アサーションなど）を修正
    - 修正後、再度コンパイルチェックを実行
    - **自動修正しても直らない場合**: エラー内容を出力して処理を中止

### ステップ 3: ESLintチェック 🔴 必須実行

- [ ] **ESLintチェックを実行**（必ず実行すること）
  ```bash
  npm run lint
  ```

- [ ] **エラー処理**:
  - **成功（exit code 0）**: ステップ4へ進む
  - **失敗（exit code 非0）**:
    - 自動修正を実行（`npm run lint:fix`）
    - 修正後、再度ESLintチェックを実行
    - **自動修正しても直らない場合**:
      - エラー内容を解析
      - 可能な限り手動修正を試みる
      - **修正しても直らない場合**: エラー内容を出力して処理を中止

### ステップ 4: Prettierフォーマットチェック 🔴 必須実行

- [ ] **Prettierチェックを実行**（必ず実行すること）
  ```bash
  npm run format:check
  ```

- [ ] **エラー処理**:
  - **成功（exit code 0）**: ステップ5へ進む
  - **失敗（exit code 非0）**:
    - 自動修正を実行（`npm run format`）
    - 修正後、再度フォーマットチェックを実行
    - **自動修正後も失敗する場合**: エラー内容を出力して処理を中止

### ステップ 5: 単体テスト実行 🔴 必須実行

- [ ] **単体テストを実行**（必ず実行すること）
  ```bash
  npm test
  ```

- [ ] **エラー処理**:
  - **成功（exit code 0）**: ステップ6へ進む
  - **失敗（exit code 非0）**:
    - テスト結果を出力（どのテストが失敗したか）
    - **自動修正不可**: エラー内容を出力して処理を中止

### ステップ 6: E2Eテスト実行 🔴 必須実行

- [ ] **E2Eテストを実行**（必ず実行すること）

  **Windows (PowerShell)**:
  ```powershell
  # devサーバーをバックグラウンドで起動
  Start-Process pwsh -ArgumentList "-Command", "npm run dev" -WindowStyle Hidden
  # 数秒待機してサーバー起動を確認
  Start-Sleep -Seconds 5
  # E2Eテスト実行
  npm run test:e2e
  # テスト後、Viteを実行しているプロセスを停止（ポート5173）
  $viteProcess = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
  if ($viteProcess) { Stop-Process -Id $viteProcess -Force -ErrorAction SilentlyContinue }
  ```

  **Unix/Mac (Bash)**:
  ```bash
  # devサーバーをバックグラウンドで起動
  npm run dev &
  DEV_PID=$!
  # 数秒待機してサーバー起動を確認
  sleep 3
  # E2Eテスト実行
  npm run test:e2e
  # テスト後、devサーバーを停止
  kill $DEV_PID
  ```

- [ ] **エラー処理**:
  - **成功（exit code 0）**: ステップ7へ進む
  - **失敗（exit code 非0）**:
    - テスト結果を出力（どのテストが失敗したか）
    - **自動修正不可**: エラー内容を出力して処理を中止

### ステップ 7: ビルドチェック 🔴 必須実行

- [ ] **プロダクションビルドを実行**（必ず実行すること）
  ```bash
  npm run build
  ```

- [ ] **エラー処理**:
  - **成功（exit code 0）**: ステップ8へ進む
  - **失敗（exit code 非0）**:
    - ビルドエラー内容を出力
    - **自動修正不可**: エラー内容を出力して処理を中止

### ステップ 8: テスト結果の収集 🔴 必須実行

- [ ] **各チェックの結果を記録**（必ず実行すること）
  - TypeScriptコンパイル: 成功/失敗
  - ESLint: エラー数、警告数
  - Prettier: 成功/失敗
  - 単体テスト: 成功/失敗、テスト数、カバレッジ率（可能なら）
  - E2Eテスト: 成功/失敗、シナリオ数
  - ビルド: 成功/失敗

### ステップ 9: Git操作の実行 🔴 必須実行

**前提条件**: ステップ1-7が全て成功していること

- [ ] **未コミットの変更がある場合**:
  - [ ] 変更内容を確認
    ```bash
    git status
    git diff --stat
    ```
  - [ ] **コミットメッセージを自動生成**（必ず実行すること）
    - `git log` の最新コミットメッセージを確認
    - 変更されたファイルから変更内容を推測
    - Conventional Commits形式でメッセージを生成
    - 作業タイプの判定（feat/fix/refactorなど）
  - [ ] **コミットを実行**（必ず実行すること）
    ```bash
    git add .
    git commit -m "<自動生成したメッセージ>"
    ```

- [ ] **リモートリポジトリにプッシュ**（必ず実行すること）
  ```bash
  git push origin $(git branch --show-current)
  ```
  - 既にプッシュ済みの場合はスキップ

### ステップ 10: PR作成 🔴 必須実行

- [ ] **PRタイトルを自動生成**（必ず実行すること）
  - コミットメッセージから抽出
  - または変更内容から生成
  - Conventional Commits形式を維持

- [ ] **PR本文を自動生成**（必ず実行すること）

  **テンプレート**:
  ```markdown
  <変更内容の1-2行要約>

  ## 目的

  <変更の目的や解決する課題>

  ## 変更内容

  <変更したファイルと内容を箇条書き>
  - ファイル名: 変更内容

  ## 品質保証結果

  ### TypeScriptコンパイル
  - 実行結果: ✅ success

  ### ESLint
  - エラー: <エラー数>
  - 警告: <警告数>

  ### Prettier
  - 実行結果: ✅ success

  ### 単体テスト
  - 実行結果: ✅ passed
  - テスト数: <成功数/総数>

  ### E2Eテスト
  - 実行結果: ✅ passed
  - シナリオ数: <成功数/総数>

  ### ビルド
  - ビルド結果: ✅ success

  ## 参考

  <関連するIssue、ドキュメントなど>

  Closes #<Issue番号>
  ```

- [ ] **リポジトリ情報を取得**（必ず実行すること）
  ```bash
  git remote get-url origin
  ```
  - owner/repoを抽出

- [ ] **GitHub MCPでPRを作成**（必ず実行すること）
  - `mcp_github_create_pull_request` ツールを使用
  - `owner`: リポジトリのオーナー
  - `repo`: リポジトリ名
  - `title`: 自動生成したPRタイトル
  - `head`: 現在のブランチ名
  - `base`: ステップ1で決定したPR先ブランチ
  - `body`: 自動生成したPR本文（Issue番号を含む）

- [ ] **PR作成結果を報告**（必ず実行すること）
  - PR番号とURLをユーザーに報告

## エラーハンドリング

### 自動修正可能なエラー

以下のエラーは自動修正を試みます：

1. **ESLintエラー**
   - `npm run lint:fix` で自動修正
   - 修正後、再度チェックを実行

2. **Prettierフォーマットエラー**
   - `npm run format` で自動修正
   - 修正後、再度チェックを実行

3. **TypeScriptの一部エラー**
   - 未使用変数の削除
   - 型アサーションの追加（推測可能な場合）
   - 明らかな型エラーの修正（推測可能な場合）

### 自動修正不可なエラー

以下のエラーは自動修正できません：

1. **TypeScriptの複雑なエラー**
   - ロジックエラー
   - 型定義の不整合
   - インターフェースの不一致

2. **テストの失敗**
   - 単体テストの失敗
   - E2Eテストの失敗

3. **ビルドエラー**
   - 依存関係の問題
   - 設定ファイルのエラー

**対応**: エラー内容を詳細に出力し、処理を中止します。

## 実行例

### 例1: 未コミットの変更がある場合

```bash
# ユーザーがコマンド実行
/ship #92

# 実行フロー:
# 1. TypeScriptコンパイルチェック ✅
# 2. ESLintチェック ✅
# 3. Prettierチェック ✅
# 4. 単体テスト ✅
# 5. E2Eテスト ✅
# 6. ビルドチェック ✅
# 7. git add . && git commit -m "feat: 可視化機能を追加"
# 8. git push origin feature/visualization-view
# 9. PR作成（developブランチへ、Closes #92）
```

### 例2: 全てコミット済みの場合

```bash
# ユーザーがコマンド実行
/ship #92

# 実行フロー:
# 1. TypeScriptコンパイルチェック ✅
# 2. ESLintチェック ✅
# 3. Prettierチェック ✅
# 4. 単体テスト ✅
# 5. E2Eテスト ✅
# 6. ビルドチェック ✅
# 7. git push origin feature/visualization-view（スキップされない場合）
# 8. PR作成（developブランチへ、Closes #92）
```

### 例3: ESLintエラーがある場合

```bash
# ユーザーがコマンド実行
/ship #92

# 実行フロー:
# 1. TypeScriptコンパイルチェック ✅
# 2. ESLintチェック ❌ (2 errors, 1 warning)
#    → npm run lint:fix を実行
#    → 再度ESLintチェック ✅
# 3. Prettierチェック ✅
# 4. 単体テスト ✅
# 5. E2Eテスト ✅
# 6. ビルドチェック ✅
# 7. git add . && git commit -m "feat: 可視化機能を追加"
# 8. git push origin feature/visualization-view
# 9. PR作成（developブランチへ、Closes #92）
```

### 例4: テストが失敗した場合

```bash
# ユーザーがコマンド実行
/ship #92

# 実行フロー:
# 1. TypeScriptコンパイルチェック ✅
# 2. ESLintチェック ✅
# 3. Prettierチェック ✅
# 4. 単体テスト ❌ (1 failed)
#    → エラー内容を出力
#    → 処理を中止
```

## 注意事項

1. **全てのチェックが成功する必要がある**: 1つでも失敗すると処理が中止されます
2. **自動修正は慎重に**: 自動修正後も再度チェックを実行し、本当に修正されたか確認します
3. **PR作成前に必ずプッシュ**: リモートにプッシュされていない場合はエラーになります
4. **Issue番号の抽出**: URL、`#123`、`123`のいずれの形式でも対応します
5. **PR先ブランチ**: デフォルトは`develop`、引数で指定可能です

---

**このコマンドは `@create-pull-request.mdc` のルールに従ってPRを作成します。**
