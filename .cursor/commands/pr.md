# プルリクエスト作成コマンド

このコマンドは、既にコミット＆プッシュが完了している状態で、プルリクエストのみを作成するための専用コマンドです。

**特殊ケース用**: このコマンドは通常のワークフローとは異なる特殊なケースで使用します。品質保証（テスト、ビルド、ESLint）は別途実施済みであることを前提とし、PR本文にはテスト結果を含めません。

通常の開発フローでは、`/refactoring`, `/fix`, `/enhance` コマンドを使用してください。

## 使用方法

```
/pr [Issue番号またはIssue URL]
```

**例**:
- `/pr` - Issue紐付けなしでPR作成
- `/pr #45` - Issue番号を指定してPR作成
- `/pr https://github.com/owner/repo/issues/45` - Issue URLを指定してPR作成

## 前提条件

このコマンドを実行する前に、以下が完了している必要があります：
- [x] コード変更完了
- [x] テスト実行完了（単体テスト、E2Eテスト）
- [x] ビルド確認完了
- [x] ESLint確認完了
- [x] `git commit` 完了
- [x] `git push` 完了

## 実行内容

このコマンドは `@create-pull-request.mdc` の**ステップ1〜5を簡略化して自動実行**します（品質保証結果の収集は省略）：

### ステップ 1: 前提条件の確認

- [ ] 現在のブランチを確認
  ```bash
  git branch --show-current
  ```

- [ ] コミット状態を確認
  ```bash
  git status
  ```
  - **未コミットの変更がある場合**: エラーメッセージを表示して中断
  - **期待する状態**: `nothing to commit, working tree clean`

- [ ] プッシュ状態を確認
  ```bash
  git log origin/$(git branch --show-current)..HEAD
  ```
  - **プッシュされていないコミットがある場合**: エラーメッセージを表示して中断
  - **期待する状態**: ローカルとリモートが同期されている

### ステップ 2: マージ先ブランチの自動判定

現在のブランチ名から作業タイプを自動判定し、マージ先ブランチを決定：

| 現在のブランチパターン | マージ先ブランチ | 作業タイプ |
|----|-----|----|
| `hotfix/fix-*` | `main` | 不具合修正 |
| `feature/refactoring-*` | `develop` | リファクタリング |
| `feature/*` | `develop` | 機能エンハンス |
| その他 | `develop` (デフォルト) | - |

- [ ] 差分の統計を確認
  ```bash
  git diff <マージ先ブランチ> --stat
  ```

- [ ] コミットログを確認
  ```bash
  git log <マージ先ブランチ>..HEAD --oneline
  ```

### ステップ 3: PRタイトルの自動生成

コミットメッセージから作業タイプを判定し、以下の形式でタイトルを生成：

| 変更の種類 | タイトル形式 | 例 |
|-----|---|-----|
| **リファクタリング** | `refactor: <変更内容>` | `refactor: App.tsxを分割してカスタムフックを抽出` |
| **新機能** | `feat: <機能名>` | `feat: 採掘速度計算機能を追加` |
| **バグ修正** | `fix: <修正内容>` | `fix: 増産剤計算の誤りを修正` |
| **ドキュメント** | `docs: <ドキュメント名>` | `docs: READMEにインストール手順を追加` |
| **テスト** | `test: <テスト内容>` | `test: calculator.tsのテストカバレッジを向上` |
| **スタイル** | `style: <変更内容>` | `style: ESLintエラーを修正` |
| **パフォーマンス** | `perf: <改善内容>` | `perf: メモ化により再計算を最適化` |

**生成方法**:
1. 最新のコミットメッセージから作業タイプのプレフィックスを抽出
2. プレフィックスに続く説明文を取得
3. 簡潔で分かりやすいタイトルを生成（50文字以内を推奨）

### ステップ 4: PR本文の自動生成

以下のテンプレートに従って、シンプルなPR本文を生成：

```markdown
<1-2行で変更内容を要約>

## 目的

<なぜこの変更が必要か、解決する課題を記載>

## 変更内容

<変更したファイルと内容を箇条書きで記載>
- ファイル名: 変更内容

## 参考

<関連するIssue、ドキュメント、参考URLなどがあれば記載>

---

<Issue番号が指定されている場合>
Closes #<Issue番号>  (または Fixes #<Issue番号>)
```

**本文生成の方法**:
1. `git log` の最新コミットメッセージから変更内容を要約
2. `git diff <マージ先ブランチ> --stat` から変更されたファイルのリストを取得
3. 変更されたファイルごとに簡単な説明を記載
4. Issue番号が指定されている場合、適切なキーワードを追加

**Issue紐付けキーワード**:
- `Closes #123` - 機能実装、タスク完了
- `Fixes #123` - バグ修正
- `Resolves #123` - 問題解決
- `Related to #123` - 関連するが自動クローズしない

### ステップ 5: PR作成コマンドの実行

#### 5.1 本文をファイルに保存

**推奨方法**: `write` ツールを使用して直接ファイルに書き込む

```
Windows: $env:TEMP\pr_body.md
Unix/Mac: /tmp/pr_body.md
```

#### 5.2 PRを作成

**Windows (PowerShell)**:
```powershell
gh pr create --base <マージ先ブランチ> --title "<生成したタイトル>" --body-file "$env:TEMP\pr_body.md"
```

**Unix/Mac (Bash)**:
```bash
gh pr create --base <マージ先ブランチ> --title "<生成したタイトル>" --body-file /tmp/pr_body.md
```

#### 5.3 一時ファイルを削除

**推奨方法**: `delete_file` ツールを使用

#### 5.4 結果を確認

- PR URLが表示されることを確認
- ブラウザで自動的に開かれることを確認

## エラーハンドリング

### `gh` コマンドが見つからない場合

```
エラー: GitHub CLI (`gh`) がインストールされていません。
以下のコマンドでインストールしてください：
- Windows: `winget install GitHub.cli`
- Mac: `brew install gh`
- Linux: https://github.com/cli/cli#installation
```

### 認証エラーの場合

```
エラー: GitHub CLIで認証されていません。
以下のコマンドで認証してください：
`gh auth login`
```

### プッシュされていない場合

```
警告: 変更がリモートにプッシュされていません。
先に以下のコマンドを実行してください：
`git push origin <ブランチ名>`

このコマンドは中断されます。
```

### 未コミットの変更がある場合

```
警告: 未コミットの変更があります。
先にコミットしてください：
`git add .`
`git commit -m "..."`

このコマンドは中断されます。
```

## 使用例

### 例1: Issue番号なしでPR作成

```bash
# 現在のブランチ: feature/refactoring-app-component
# マージ先: develop (自動判定)

/pr

# 実行結果:
# ✅ ブランチ確認: feature/refactoring-app-component
# ✅ コミット状態: clean
# ✅ プッシュ状態: synced
# ✅ マージ先判定: develop
# ✅ 差分確認: 5 files changed, 200 insertions(+), 150 deletions(-)
# ✅ PRタイトル生成: "refactor: App.tsxを分割してカスタムフックを抽出"
# ✅ PR本文生成完了
# ✅ PR作成中...
# 🎉 PR created: https://github.com/owner/repo/pull/123
```

### 例2: Issue番号を指定してPR作成

```bash
# 現在のブランチ: hotfix/fix-calculation-error
# マージ先: main (自動判定)

/pr #78

# 実行結果:
# ✅ Issue番号: #78
# ✅ ブランチ確認: hotfix/fix-calculation-error
# ✅ コミット状態: clean
# ✅ プッシュ状態: synced
# ✅ マージ先判定: main
# ✅ 差分確認: 2 files changed, 50 insertions(+), 10 deletions(-)
# ✅ PRタイトル生成: "fix: 増産剤計算の誤りを修正"
# ✅ PR本文生成完了（Fixes #78 を追加）
# ✅ PR作成中...
# 🎉 PR created: https://github.com/owner/repo/pull/124
```

### 例3: Issue URLを指定してPR作成

```bash
# 現在のブランチ: feature/mining-calculator

/pr https://github.com/owner/repo/issues/92

# 実行結果:
# ✅ Issue番号: #92 (URLから抽出)
# ... (以下同様)
```

## 注意事項

1. **前提条件を満たすこと**
   - コミット＆プッシュが完了していることが必須
   - 未完了の場合はエラーメッセージを表示して中断

2. **マージ先ブランチの確認**
   - 自動判定されたマージ先ブランチが正しいか確認してください
   - 不具合修正: `main`
   - リファクタリング・機能エンハンス: `develop`

3. **Issue紐付けの自動化**
   - Issue番号を指定すると、適切なキーワード（Closes/Fixes/Resolves）が自動的に追加されます
   - PRがマージされると、Issueが自動的にクローズされます

4. **PR本文の編集**
   - PR作成後、GitHubのWebインターフェースで本文を編集できます
   - 必要に応じて追加情報（テスト結果など）を記載してください

5. **特殊ケース用のコマンド**
   - このコマンドは、通常のワークフローとは異なる特殊なケースで使用します
   - 品質保証は別途実施済みであることを前提としています
   - 通常の開発フローでは、`/refactoring`, `/fix`, `/enhance` コマンドを使用してください

---

**このコマンドは `@create-pull-request.mdc` の全ルールに従って実行されます。**

