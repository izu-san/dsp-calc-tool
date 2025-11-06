# リファクタリング作業開始コマンド

このコマンドは、リファクタリング作業を開始するための専用コマンドです。

## 使用方法

```
/refactoring <Issue URL または Issue番号>
```

**例**:
- `/refactoring #45`
- `/refactoring https://github.com/owner/repo/issues/45`

## 実行内容

このコマンドを実行すると、`@development-workflow.mdc` の**全ステップを必ず自動的に実行**します：

### 1. Issue情報の抽出
- Issue URL または Issue番号から Issue 番号を抽出
- Issue番号は PR作成時に自動的に紐付けられます

### 2. 作業タイプの判定とブランチ作成
- **作業タイプ**: **リファクタリング**
- **ベースブランチ**: `develop`
- **ブランチ命名規則**: `feature/refactoring-<機能名のスラッグ化>`
- **例**: `feature/refactoring-app-component`
- **コミットプレフィックス**: `refactor:`
- **PR先**: `develop` ブランチ

### 3. 必須実行ステップ（全13ステップ）

`@development-workflow.mdc` の**全ステップを必ず自動的に実行**：

#### ✅ **ステップ 1**: GitHub Issueの確認と仕様書作成 🔴 必須実行
- [ ] **GitHub Issueを確認**し、詳細な仕様書を作成する（必ず実行すること）
- [ ] 内容に不明点や疑問点がある場合、ユーザーに問い合わせて疑問点などが全て解消するまで繰り返し確認する
- [ ] すべての不明点や疑問点が解消した場合、`docs/` ディレクトリに仕様書をMarkdown形式で保存する

#### ✅ **ステップ 2**: 仕様書の再確認 🔴 必須実行
- [ ] **作成した仕様書ファイルを再度読み込み**、改めて疑問点がないか確認する（必ず実行すること）
- [ ] すべての疑問点が解消するまで繰り返す

#### ✅ **ステップ 3**: 作業タイプの判定とブランチ作成 🔴 必須実行
- [ ] **作業タイプを判定**（必ず実行すること）
  - **リファクタリング** (`feature/refactoring-*` → `develop`)
- [ ] 現在のブランチを確認（必ず実行すること）
- [ ] **ベースブランチを最新化**（必ず実行すること）
  ```bash
  git checkout develop
  git pull origin develop
  ```
- [ ] **作業ブランチを作成**（必ず実行すること）
  ```bash
  git checkout -b feature/refactoring-<機能名>
  ```

#### ✅ **ステップ 4**: 既存テストの実行（変更前） 🔴 必須実行
- [ ] **単体テストを実行**し、全テスト合格を確認（必ず実行すること）
  ```bash
  npm test
  ```
- [ ] **E2Eテストを実行**し、全テスト合格を確認（必ず実行すること）
  ```bash
  # Windows (PowerShell)
  Start-Process pwsh -ArgumentList "-Command", "npm run dev" -WindowStyle Hidden
  Start-Sleep -Seconds 5
  npm run test:e2e
  $viteProcess = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
  if ($viteProcess) { Stop-Process -Id $viteProcess -Force -ErrorAction SilentlyContinue }
  ```

#### ✅ **ステップ 5**: コード変更の実施
- [ ] 依頼内容に沿ったコード変更を実施
- [ ] **既存ファイルを削除する場合**（コード統合、ファイル移動などで不要になった場合）
  ```bash
  # 必ず git rm コマンドを使用すること
  git rm <削除するファイルパス>
  ```
- [ ] TypeScriptのコンパイルエラーがないことを確認
  ```bash
  npx tsc --noEmit
  ```

#### ✅ **ステップ 5.5**: ユーザー確認 🔴 必須実行
- [ ] **変更内容をユーザーに報告**（必ず実行すること）
- [ ] **ユーザーの承認を待つ**
  - ✅ **OK**: ステップ6に進む
  - ❌ **NG**: ステップ5に戻り、フィードバックに基づいて再度変更

#### ✅ **ステップ 6**: ビルド確認
- [ ] **プロダクションビルドが成功**することを確認
  ```bash
  npm run build
  ```

#### ✅ **ステップ 7**: 単体テストの再実行（変更後）
- [ ] **単体テストを再実行**し、全テスト合格を確認
  ```bash
  npm test
  ```

#### ✅ **ステップ 8**: 単体テストの追加・変更（必要に応じて）
- [ ] **変更内容に応じて単体テストを追加・変更**する
  - **リファクタリングの場合**: 既存テストが全て合格している場合は追加不要
  - **追加・変更が不要な場合は、その理由をユーザーに報告**する

#### ✅ **ステップ 9**: E2Eテストの再実行（変更後） 🔴 必須実行
- [ ] **E2Eテストを再実行**し、全テスト合格を確認（必ず実行すること）
  ```bash
  # Windows (PowerShell)
  Start-Process pwsh -ArgumentList "-Command", "npm run dev" -WindowStyle Hidden
  Start-Sleep -Seconds 5
  npm run test:e2e
  $viteProcess = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
  if ($viteProcess) { Stop-Process -Id $viteProcess -Force -ErrorAction SilentlyContinue }
  ```

#### ✅ **ステップ 10**: 最終確認
- [ ] ESLintでコード品質を確認
  ```bash
  npm run lint
  ```
- [ ] ローカル環境でアプリケーションを起動し、動作確認
  ```bash
  npm run dev
  ```

#### ✅ **ステップ 11**: コミット前の最終確認 🔴 必須実行
- [ ] 変更内容を確認（必ず実行すること）
  ```bash
  git status
  git diff
  ```
- [ ] **削除されたファイルの確認**（ファイル削除を行った場合）
- [ ] 不要なファイル（一時ファイル、デバッグコードなど）が含まれていないことを確認

#### ✅ **ステップ 11.5**: ユーザー承認 🔴 必須実行
- [ ] **git操作の実行許可をユーザーに確認**（必ず実行すること）
- [ ] **ユーザーの承認を待つ**
  - ✅ **OK**: ステップ12に進む
  - ❌ **NG**: 変更内容を修正してから再度確認

#### ✅ **ステップ 12**: コミットとプッシュ 🔴 必須実行
- [ ] 変更をステージングしてコミット（必ず実行すること）
  ```bash
  git add <変更したファイル>
  git commit -m "refactor: <主要ファイル>を<変更内容>"
  ```
- [ ] リモートリポジトリにプッシュ
  ```bash
  git push origin feature/refactoring-<機能名>
  ```

#### ✅ **ステップ 13**: プルリクエストの作成 🔴 必須実行
- [ ] プルリクエストを作成（必ず実行すること）
- [ ] @create-pull-request.mdc の**全ステップを自動実行**すること

## リファクタリングの定義

以下のような作業がリファクタリングに該当します：
- コードの構造改善（ファイル分割、関数抽出など）
- 重複コードの削減
- コードの可読性向上
- パフォーマンス最適化（機能変更なし）
- テストの追加・改善
- 型定義の改善
- 命名の改善

**重要**: 機能の動作は変更しないこと。リファクタリング前後で動作が同一であることを確認してください。

## コミットメッセージ形式

```
refactor: <主要ファイル>を<変更内容>
```

**例**:
- `refactor: App.tsxを分割してカスタムフックを抽出`
- `refactor: calculator.tsを関数単位にファイル分割`
- `refactor: 型定義をブランデッド型に変更`

## PR作成時の自動設定

- **PRタイトル**: `refactor: <主要ファイル>を<変更内容>`
- **PR先**: `develop` ブランチ
- **Issue紐付け**: `Refactors #<Issue番号>` が自動的に追加されます
- **品質保証結果**: 単体テスト、E2Eテスト、ビルド、ESLintの結果が自動的に記載されます

## 注意事項

1. **挙動の変更は絶対に禁止**
   - リファクタリング時に機能の挙動を変更してはならない
   - ユニットテストの変更も原則禁止
   - 例外: テストが間違っている場合のみ（必ず理由を説明）

2. **テストは必ず全て合格すること**
   - リファクタリングは動作を変更しないため、既存テストが全て合格する必要があります
   - 失敗する場合はリグレッションの可能性があります

3. **E2Eテストも必ず実行**
   - UIレベルの動作確認も重要です

4. **段階的な変更を推奨**
   - 大規模なリファクタリングは複数のPRに分割してください
   - 各PRで独立してテスト可能にしてください

5. **カバレッジを維持**
   - リファクタリング後もテストカバレッジが低下しないように注意してください

6. **環境変数の追加禁止**
   - 新しい環境変数を安易に追加しない
   - データは `public/data/` と localStorage で管理する

7. **設定ファイルの書き換えは慎重に**
   - `package.json`、`tsconfig.json`、`vite.config.ts` などの変更は必ず理由を説明
   - ビルド設定の変更は影響範囲を確認してから実施

## 実装パターンの参照

リファクタリングを実施する際は、以下のドキュメントを参照してください：
- `@TypeScript.mdc` - TypeScript実装パターン
- `@coding.mdc` - 設計原則
- プロジェクトルート `.cursor/rules/` - プロジェクト固有のルール

## コードレビュー時のチェックポイント

- [ ] 機能の挙動が変更されていないか
- [ ] 既存テストが全て合格しているか
- [ ] コードの可読性が向上しているか
- [ ] パフォーマンスが維持されているか
- [ ] ESLintエラーがないか
- [ ] TypeScriptコンパイルエラーがないか
- [ ] 不要なファイルが削除されているか（`git rm`使用）

---

**このコマンドは `@development-workflow.mdc` と `@create-pull-request.mdc` の全ルールに従って実行されます。**
