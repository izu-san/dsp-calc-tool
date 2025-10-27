# 不具合修正作業開始コマンド

このコマンドは、不具合修正作業を開始するための専用コマンドです。

## 使用方法

```
/fix <Issue URL または Issue番号> <簡単な説明>
```

**例**:
- `/fix #78 増産剤計算エラー`
- `/fix https://github.com/owner/repo/issues/78 増産剤計算エラー`
- `/fix #78` (説明なしの場合はIssueタイトルを使用)

## 実行内容

このコマンドを実行すると、`@development-workflow.mdc` の**全ステップを必ず自動的に実行**します：

### 1. Issue情報の抽出
- Issue URL または Issue番号から Issue 番号を抽出
- Issue番号は PR作成時に自動的に紐付けられます

### 2. 作業タイプの判定とブランチ作成
- **作業タイプ**: **不具合修正**
- **ベースブランチ**: `main`（デフォルト）
  - **ユーザー指定がある場合**: ユーザーが指定したベースブランチを使用
  - **例**: `develop`、`feature/xxx` など
- **ブランチ命名規則**: `hotfix/fix-<問題の説明のスラッグ化>`
- **例**: `hotfix/fix-calculation-error`
- **コミットプレフィックス**: `fix:`
- **PR先**: ベースブランチに応じて決定
  - `main` → `main` ブランチ
  - `develop` → `develop` ブランチ
  - その他 → 指定されたベースブランチ

### 3. 必須実行ステップ（全11ステップ）

`@development-workflow.mdc` の**全ステップを必ず自動的に実行**：

#### ✅ **ステップ 1**: 作業タイプの判定とブランチ作成 🔴 必須実行
- [ ] **作業タイプを判定**（必ず実行すること）
  - **不具合修正** (`hotfix/fix-*` → ベースブランチ)
- [ ] 現在のブランチを確認（必ず実行すること）
- [ ] **ベースブランチを最新化**（必ず実行すること）
  ```bash
  # デフォルト: mainブランチ
  git checkout main
  git pull origin main
  
  # ユーザー指定がある場合: 指定されたブランチ
  # git checkout <ユーザー指定ブランチ>
  # git pull origin <ユーザー指定ブランチ>
  ```
- [ ] **作業ブランチを作成**（必ず実行すること）
  ```bash
  git checkout -b hotfix/fix-<問題の説明>
  ```

#### ✅ **ステップ 2**: 既存テストの実行（変更前） 🔴 必須実行
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

#### ✅ **ステップ 3**: コード変更の実施
- [ ] **バグを再現するテストを追加**（TDD推奨）
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

#### ✅ **ステップ 3.5**: ユーザー確認 🔴 必須実行
- [ ] **変更内容をユーザーに報告**（必ず実行すること）
- [ ] **ユーザーの承認を待つ**
  - ✅ **OK**: ステップ4に進む
  - ❌ **NG**: ステップ3に戻り、フィードバックに基づいて再度変更

#### ✅ **ステップ 4**: ビルド確認
- [ ] **プロダクションビルドが成功**することを確認
  ```bash
  npm run build
  ```

#### ✅ **ステップ 5**: 単体テストの再実行（変更後）
- [ ] **単体テストを再実行**し、全テスト合格を確認
  ```bash
  npm test
  ```

#### ✅ **ステップ 6**: 単体テストの追加・変更（必要に応じて）
- [ ] **変更内容に応じて単体テストを追加・変更**する
  - **バグを再現するテストを追加**（TDD推奨）
  - **リグレッションテストとして残す**
- [ ] **追加・変更が不要な場合は、その理由をユーザーに報告**する

#### ✅ **ステップ 7**: E2Eテストの再実行（変更後） 🔴 必須実行
- [ ] **E2Eテストを再実行**し、全テスト合格を確認（必ず実行すること）
  ```bash
  # Windows (PowerShell)
  Start-Process pwsh -ArgumentList "-Command", "npm run dev" -WindowStyle Hidden
  Start-Sleep -Seconds 5
  npm run test:e2e
  $viteProcess = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
  if ($viteProcess) { Stop-Process -Id $viteProcess -Force -ErrorAction SilentlyContinue }
  ```

#### ✅ **ステップ 8**: 最終確認
- [ ] ESLintでコード品質を確認
  ```bash
  npm run lint
  ```
- [ ] ローカル環境でアプリケーションを起動し、動作確認
  ```bash
  npm run dev
  ```
- [ ] **修正した不具合が再現しないことを確認**

#### ✅ **ステップ 9**: コミット前の最終確認 🔴 必須実行
- [ ] 変更内容を確認（必ず実行すること）
  ```bash
  git status
  git diff
  ```
- [ ] **削除されたファイルの確認**（ファイル削除を行った場合）
- [ ] 不要なファイル（一時ファイル、デバッグコードなど）が含まれていないことを確認

#### ✅ **ステップ 9.5**: ユーザー承認 🔴 必須実行
- [ ] **git操作の実行許可をユーザーに確認**（必ず実行すること）
- [ ] **ユーザーの承認を待つ**
  - ✅ **OK**: ステップ10に進む
  - ❌ **NG**: 変更内容を修正してから再度確認

#### ✅ **ステップ 10**: コミットとプッシュ 🔴 必須実行
- [ ] 変更をステージングしてコミット（必ず実行すること）
  ```bash
  git add <変更したファイル>
  git commit -m "fix: <修正内容>"
  ```
- [ ] リモートリポジトリにプッシュ
  ```bash
  git push origin hotfix/fix-<問題の説明>
  ```

#### ✅ **ステップ 11**: プルリクエストの作成 🔴 必須実行
- [ ] プルリクエストを作成（必ず実行すること）
- [ ] @create-pull-request.mdc の**全ステップを自動実行**すること

## 不具合修正の定義

以下のような作業が不具合修正に該当します：
- バグの修正
- 計算エラーの修正
- UI表示エラーの修正
- エッジケースでのエラー修正
- Null参照エラーの修正
- 型エラーの修正
- パフォーマンス問題の修正（機能に影響がある場合）

## テスト駆動開発（TDD）の推奨

不具合修正では、以下の手順を推奨します：

1. **バグを再現するテストを先に書く**
   ```typescript
   it('should handle edge case correctly', () => {
     // バグを再現する条件
     const result = calculateSomething(edgeCaseInput);
     // 期待する正しい結果
     expect(result).toBe(expectedValue);
   });
   ```

2. **テストが失敗することを確認**
   - バグが再現されていることを確認

3. **コードを修正してテストを合格させる**
   - 最小限の変更でバグを修正

4. **リグレッションテストとして残す**
   - 同じバグが再発しないようにテストを保持

## コミットメッセージ形式

```
fix: <修正内容>
```

**例**:
- `fix: 増産剤計算の誤りを修正`
- `fix: Null参照エラーを修正`
- `fix: レシピツリー表示のバグを修正`

## PR作成時の自動設定

- **PRタイトル**: `fix: <修正内容>`
- **PR先**: ベースブランチに応じて決定
  - `main` → `main` ブランチ
  - `develop` → `develop` ブランチ
  - その他 → 指定されたベースブランチ
- **Issue紐付け**: `Fixes #<Issue番号>` が自動的に追加されます
- **品質保証結果**: 単体テスト、E2Eテスト、ビルド、ESLintの結果が自動的に記載されます

## 注意事項

1. **ベースブランチの選択**
   - **デフォルト**: `main` ブランチ（本番環境への直接影響）
   - **ユーザー指定**: `develop` やその他のブランチも指定可能
   - **本番環境への影響**: `main` ブランチの場合、本番環境への影響が大きいため慎重に確認してください

2. **バグ再現テストは必須**
   - バグを再現するテストがない場合、同じバグが再発する可能性があります
   - TDD（テスト駆動開発）を推奨します

3. **最小限の変更を心がける**
   - 不具合修正は最小限の変更で行ってください
   - リファクタリングは別のPRで実施してください

4. **E2Eテストも必ず実行**
   - UIレベルでのリグレッションを確認してください

5. **動作確認を徹底**
   - 修正後、手動でも動作確認を行ってください
   - 他の機能に影響がないことを確認してください

## 緊急度の高い修正の場合

- レビュアーに連絡し、優先的にレビューを依頼してください
- マージ後、`develop` ブランチへの反映（バックマージ）を忘れずに

---

**このコマンドは `@development-workflow.mdc` と `@create-pull-request.mdc` の全ルールに従って実行されます。**

