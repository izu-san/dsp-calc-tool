# Git Hooks設定

このプロジェクトでは、コード品質を自動的に保つためにGit Hooksを設定しています。

## 設定内容

### 1. Husky

- **pre-commit**: コミット前にlint-stagedを実行
- **prepare**: npm install時に自動的にhuskyを初期化

### 2. lint-staged

ステージされたファイルに対して以下の処理を実行：

#### TypeScript/JavaScriptファイル

```json
"*.{ts,tsx,js,jsx}": [
  "eslint --fix",
  "prettier --write"
]
```

#### JSON/Markdown/CSSファイル

```json
"*.{json,md,css}": [
  "prettier --write"
]
```

## 動作の流れ

1. `git add` でファイルをステージング
2. `git commit` を実行
3. **pre-commitフック**が自動実行
4. **lint-staged**がステージされたファイルをチェック
5. **ESLint**でコード品質チェック・自動修正
6. **Prettier**でフォーマット
7. 修正されたファイルが自動的にステージング
8. コミット完了

## 手動実行

### lint-stagedのみ実行

```bash
npx lint-staged
```

### 特定のファイルのみチェック

```bash
npx lint-staged --config package.json
```

## トラブルシューティング

### Git Hooksが動作しない場合

```bash
# huskyを再初期化
npx husky init

# pre-commitフックを再設定
echo "npx lint-staged" > .husky/pre-commit
```

### 特定のコミットでスキップしたい場合

```bash
git commit --no-verify -m "skip hooks"
```

## 設定ファイル

- `.husky/pre-commit`: pre-commitフックの設定
- `package.json`の`lint-staged`: lint-stagedの設定
- `package.json`の`prepare`: huskyの自動初期化

## メリット

- **自動的なコード品質チェック**: コミット時に自動実行
- **チーム開発の統一**: 全員が同じ品質基準を適用
- **レビュー効率化**: フォーマット差分がなくなる
- **バグの早期発見**: ESLintエラーをコミット前に検出
