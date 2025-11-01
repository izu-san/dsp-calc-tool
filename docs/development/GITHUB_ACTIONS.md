# GitHub Actions CI/CD 設定ガイド

このプロジェクトには以下のGitHub Actionsワークフローが設定されています。

## 📋 ワークフロー一覧

### 1. CI (`.github/workflows/ci.yml`)

**トリガー**: `develop`および`main`ブランチへのPull Request、またはこれらのブランチへのpush

**実行内容**:

- ✅ **Lint Check**: ESLintによるコード品質チェック
- ✅ **TypeScript Type Check**: 型エラーのチェック
- ✅ **Unit Tests**: Vitestによる単体テスト実行
  - カバレッジレポートの生成
  - Codecovへのアップロード（オプション）
- ✅ **Build Check**: プロジェクトのビルド確認
  - ビルド成果物を7日間保存
- ⏸️ **E2E Tests**: Playwrightによるエンドツーエンドテスト（現在無効）

**重要**: E2Eテストを有効にするには、`ci.yml`の`e2e-test`ジョブの`if: false`を`if: true`に変更してください。

### 2. Deploy (`.github/workflows/deploy.yml`)

**トリガー**: `main`ブランチへのpush

**実行内容**:

- 🚀 プロジェクトのビルド
- 🌐 GitHub Pagesへの自動デプロイ

**セットアップ手順**:

1. GitHubリポジトリの Settings → Pages に移動
2. Source を「GitHub Actions」に設定
3. `main`ブランチにマージすると自動的にデプロイされます

**ベースパスの設定**:
GitHub Pagesでサブディレクトリにデプロイする場合は、`vite.config.ts`に以下を追加してください:

```typescript
export default defineConfig({
  base: "/リポジトリ名/",
  // ...
});
```

### 3. Dependency Review (`.github/workflows/dependency-review.yml`)

**トリガー**: `develop`および`main`ブランチへのPull Request

**実行内容**:

- 🔍 依存関係の脆弱性チェック
- ⚠️ 中程度以上の脆弱性が検出されると失敗
- 📝 Pull Requestにレビューコメントを追加

### 4. Code Quality (`.github/workflows/code-quality.yml`)

**トリガー**: `develop`および`main`ブランチへのPull Request

**実行内容**:

- 📦 **Bundle Size Analysis**: ビルド後のファイルサイズ分析
  - Pull Requestにサイズレポートをコメント
- 🔄 **Code Duplication Check**: 重複コードの検出

### 5. Dependabot (`.github/dependabot.yml`)

**実行内容**:

- 📅 毎週月曜日9:00（JST）に依存関係をチェック
- 🔄 npm パッケージの自動アップデート
- ⚙️ GitHub Actionsの自動アップデート
- 📦 関連する依存関係をグループ化してPull Requestを作成

**設定されたグループ**:

- `dev-dependencies`: 開発用依存関係
- `react`: React関連パッケージ
- `radix-ui`: Radix UI コンポーネント

## 🚀 初回セットアップ

1. **GitHub Pagesの有効化**（デプロイを使用する場合）:

   ```
   Settings → Pages → Source を "GitHub Actions" に設定
   ```

2. **Codecovの設定**（オプション）:
   - [Codecov](https://codecov.io/)でリポジトリを有効化
   - `CODECOV_TOKEN`は不要（GitHub Actionsから直接アップロード可能）

3. **ブランチ保護ルールの設定**（推奨）:
   ```
   Settings → Branches → Add branch protection rule
   - Branch name pattern: main, develop
   - ✅ Require status checks to pass before merging
     - lint, typecheck, unit-test, build を必須に設定
   - ✅ Require pull request reviews before merging
   ```

## 🔧 カスタマイズ

### Lintルールの調整

`eslint.config.js`を編集してください。

### テストタイムアウトの変更

CI環境でテストがタイムアウトする場合:

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    testTimeout: 10000, // デフォルトは5000ms
  },
});
```

### E2Eテストの有効化

1. Playwrightの設定ファイルを作成:

   ```bash
   npm init playwright@latest
   ```

2. `ci.yml`の`e2e-test`ジョブを有効化:

   ```yaml
   if: true # false から true に変更
   ```

3. E2Eテストスクリプトを追加:
   ```json
   // package.json
   "scripts": {
     "test:e2e": "playwright test"
   }
   ```

## 📊 バッジの追加

READMEに以下のバッジが追加されています:

```markdown
[![CI](https://github.com/izu-san/dsp-calc-tool/actions/workflows/ci.yml/badge.svg)](https://github.com/izu-san/dsp-calc-tool/actions/workflows/ci.yml)
[![Deploy](https://github.com/izu-san/dsp-calc-tool/actions/workflows/deploy.yml/badge.svg)](https://github.com/izu-san/dsp-calc-tool/actions/workflows/deploy.yml)
[![Code Quality](https://github.com/izu-san/dsp-calc-tool/actions/workflows/code-quality.yml/badge.svg)](https://github.com/izu-san/dsp-calc-tool/actions/workflows/code-quality.yml)
```

## ⚠️ トラブルシューティング

### ビルドが失敗する

- Node.jsバージョンの確認（20以上が必要）
- 依存関係のキャッシュをクリア: Pull Requestに`[skip ci]`を含めない

### E2Eテストが不安定

- `page.waitForTimeout()`の代わりに`page.waitForSelector()`を使用
- ネットワークリクエストの完了を待つ: `page.waitForLoadState('networkidle')`

### Dependabotが多すぎる

`.github/dependabot.yml`で以下を調整:

```yaml
open-pull-requests-limit: 5 # デフォルトは10
schedule:
  interval: "monthly" # weeklyからmonthlyに変更
```

## 📚 参考リンク

- [GitHub Actions Documentation](https://docs.github.com/ja/actions)
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Dependabot Documentation](https://docs.github.com/ja/code-security/dependabot)
