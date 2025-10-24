# 依存関係アップデートコマンド

このコマンドは、依存関係の安全なアップデート手順を自動化します。

**重要**: 依存関係のアップデートは慎重に行う必要があります。このコマンドは段階的にアップデートし、各ステップで検証を行います。

## 使用方法

```
/update-deps [オプション]
```

**オプション**:
- `/update-deps` - 全依存関係をチェック（デフォルト）
- `/update-deps security` - セキュリティ脆弱性のみ修正
- `/update-deps minor` - マイナーバージョンのみ更新
- `/update-deps major` - メジャーバージョンも更新（慎重）
- `/update-deps <package-name>` - 特定のパッケージのみ更新
- `/update-deps check` - アップデート可能な依存関係を表示（実際には更新しない）

**例**:
- `/update-deps` - 全依存関係をチェックしてアップデート
- `/update-deps security` - セキュリティ脆弱性のみ修正
- `/update-deps react` - reactパッケージのみ更新
- `/update-deps check` - アップデート可能なパッケージを表示

## ブランチ戦略

依存関係のアップデートでは、**必ずブランチを分けて作業**することを推奨します。

### ブランチ命名規則

| アップデート種別 | ブランチ名 | PR先 | 例 |
|---|---|---|---|
| **セキュリティ緊急** | `hotfix/security-update` | `main` | `hotfix/security-update-2024-10` |
| **セキュリティ通常** | `chore/security-update` | `develop` | `chore/security-update-2024-10` |
| **マイナーバージョン** | `chore/deps-minor-update` | `develop` | `chore/deps-minor-update-2024-Q4` |
| **メジャーバージョン** | `chore/deps-major-update` | `develop` | `chore/deps-major-update-2024-Q4` |
| **特定パッケージ** | `chore/update-<package>` | `develop` | `chore/update-react-19` |

### ブランチ作成の判断基準

| 脆弱性レベル | ブランチ戦略 | PR先 | 理由 |
|---|---|---|---|
| **Critical (緊急)** | hotfixブランチ | `main` | 本番環境への即座の影響を避けるため |
| **High (高)** | choreブランチ | `develop` | テストを十分に実施してからマージ |
| **Moderate/Low** | choreブランチ | `develop` | 通常のメンテナンスフロー |
| **メジャーバージョン** | choreブランチ | `develop` | 破壊的変更の可能性があるため |

**重要**: 例外なく、**必ずブランチを分けて作業**してください。直接 `main` や `develop` で作業しないこと。

## 実行内容

### ステップ 0: ブランチ作成（必須）

アップデート作業を開始する前に、**必ずブランチを作成**します：

#### 0.1 セキュリティ緊急対応の場合

```bash
# mainブランチから作業
git checkout main
git pull origin main
git checkout -b hotfix/security-update-$(date +%Y-%m)
```

- **PR先**: `main` ブランチ
- **マージ後**: `develop` へのバックマージを忘れずに

#### 0.2 通常のセキュリティ・マイナーバージョン更新の場合

```bash
# developブランチから作業
git checkout develop
git pull origin develop
git checkout -b chore/deps-update-$(date +%Y-%m)
```

- **PR先**: `develop` ブランチ

#### 0.3 メジャーバージョン更新の場合

```bash
# developブランチから作業
git checkout develop
git pull origin develop
git checkout -b chore/deps-major-update-$(date +%Y-Q%q)
```

- **PR先**: `develop` ブランチ
- **注意**: 十分なテストとレビューを実施

#### 0.4 特定パッケージの更新の場合

```bash
# developブランチから作業
git checkout develop
git pull origin develop
git checkout -b chore/update-<package-name>
```

- **PR先**: `develop` ブランチ
- **例**: `chore/update-react-19`

### ステップ 1: 現在の状態をバックアップ

アップデート前に現在の状態をバックアップ：

```bash
# package.json と package-lock.json をバックアップ
cp package.json package.json.backup
cp package-lock.json package-lock.json.backup

# 現在のコミット状態を確認
git status

# 未コミットの変更がある場合は警告
# → 先にコミットまたはstashを推奨
```

**バックアップファイル**:
- `package.json.backup`
- `package-lock.json.backup`

### ステップ 2: 脆弱性確認

セキュリティ脆弱性をチェック：

```bash
# 脆弱性監査
npm audit

# 脆弱性の詳細を表示
npm audit --json > audit-report.json
```

**出力内容**:
- 脆弱性の件数（Critical, High, Moderate, Low）
- 影響を受けるパッケージ
- 修正可能な脆弱性の数
- 推奨されるアクション

**脆弱性レベルの解釈**:

| レベル | 深刻度 | 対応 |
|---|---|---|
| **Critical** | 🔴 緊急 | 即座に修正が必要 |
| **High** | 🟠 高 | できるだけ早く修正 |
| **Moderate** | 🟡 中 | 近日中に修正を検討 |
| **Low** | 🟢 低 | 余裕があれば修正 |

### ステップ 3: アップデート可能な依存関係を確認

```bash
# アップデート可能なパッケージを確認
npm outdated

# 結果を解析して表示
# - Current: 現在のバージョン
# - Wanted: package.jsonの範囲内で最新
# - Latest: 最新のバージョン
```

**出力例**:
```
Package           Current  Wanted  Latest  Location
react             18.2.0   18.3.1  19.0.0  new_calc
vite              5.0.0    5.4.11  6.0.0   new_calc
typescript        5.3.3    5.3.3   5.7.2   new_calc
```

**バージョンの色分け**:
- 🟢 **Wanted = Latest**: 安全に更新可能
- 🟡 **Wanted < Latest (Minor)**: マイナーバージョンアップ（通常は安全）
- 🔴 **Wanted < Latest (Major)**: メジャーバージョンアップ（破壊的変更の可能性）

### ステップ 4: アップデート戦略の決定

オプションに応じて、アップデート戦略を決定：

#### 4.1 `/update-deps security` - セキュリティ脆弱性のみ

```bash
# 自動修正可能な脆弱性を修正
npm audit fix

# 破壊的変更を含む修正（慎重）
# npm audit fix --force
```

- **対象**: セキュリティ脆弱性があるパッケージのみ
- **安全性**: 高（自動修正は互換性を保つ範囲のみ）
- **推奨**: 定期的に実行

#### 4.2 `/update-deps minor` - マイナーバージョンのみ

```bash
# package.jsonの範囲内で更新
npm update

# または特定のパッケージのみ
npm update <package-name>
```

- **対象**: マイナーバージョン・パッチバージョンのみ
- **安全性**: 中〜高（破壊的変更は含まれない想定）
- **推奨**: 月1回程度

#### 4.3 `/update-deps major` - メジャーバージョンも更新

```bash
# 最新バージョンにアップデート（慎重）
npm install <package-name>@latest

# またはnpm-check-updatesを使用
npx npm-check-updates -u
npm install
```

- **対象**: メジャーバージョンも含む
- **安全性**: 低〜中（破壊的変更の可能性）
- **推奨**: 四半期に1回、慎重に実施
- **注意**: 必ずテストを実行してからコミット

#### 4.4 `/update-deps <package-name>` - 特定のパッケージのみ

```bash
# 特定のパッケージを最新に更新
npm install <package-name>@latest

# または特定のバージョンを指定
npm install <package-name>@<version>
```

- **対象**: 指定されたパッケージのみ
- **安全性**: パッケージによる
- **推奨**: 新機能が必要な場合、または脆弱性修正

### ステップ 5: 差分検証

アップデート後の変更を確認：

```bash
# package.json の差分
git diff package.json

# package-lock.json の差分（サマリーのみ）
git diff package-lock.json --stat

# 変更されたパッケージのリストを抽出
```

**確認項目**:
- どのパッケージがどのバージョンに更新されたか
- 新しく追加された依存関係はないか
- 削除された依存関係はないか
- バージョン範囲の変更（`^`, `~` など）

**変更サマリー例**:
```
📦 アップデートされたパッケージ:
- react: 18.2.0 → 18.3.1 (minor)
- vite: 5.0.0 → 5.4.11 (patch)
- @types/react: 18.2.0 → 18.3.1 (minor)

📊 統計:
- 合計: 3個
- メジャー: 0個
- マイナー: 2個
- パッチ: 1個
```

### ステップ 6: ビルドとテストの実行

アップデート後の動作確認：

```bash
# 1. 依存関係の再インストール
npm ci

# 2. TypeScriptコンパイル確認
npx tsc --noEmit

# 3. ESLint確認
npm run lint

# 4. 単体テスト実行
npm test

# 5. ビルド確認
npm run build

# 6. E2Eテスト実行（重要）
npm run test:e2e
```

**合格基準**:
- TypeScript: コンパイルエラー0件
- ESLint: エラー0件
- 単体テスト: 全テスト合格
- ビルド: エラーなしで完了
- E2Eテスト: 全21シナリオ合格

**失敗時の対応**:
- エラーメッセージを確認
- 原因のパッケージを特定
- ロールバックまたは個別に修正

### ステップ 7: ユーザー確認

アップデート内容をユーザーに報告し、承認を得る：

```
✅ アップデート完了

📦 アップデートされたパッケージ:
- react: 18.2.0 → 18.3.1
- vite: 5.0.0 → 5.4.11
- @types/react: 18.2.0 → 18.3.1

✅ 全テスト合格
✅ ビルド成功

このままコミットしますか？
- OK: コミット＆プッシュ
- NG: ロールバック
```

**ユーザーの判断**:
- ✅ **OK**: ステップ8（コミット）に進む
- ❌ **NG**: ステップ9（ロールバック）を実行

### ステップ 8: コミット（ユーザーがOKの場合）

```bash
# バックアップファイルを削除
rm package.json.backup
rm package-lock.json.backup
rm audit-report.json

# 変更をステージング
git add package.json package-lock.json

# コミット
git commit -m "chore: 依存関係を更新

- react: 18.2.0 → 18.3.1
- vite: 5.0.0 → 5.4.11
- @types/react: 18.2.0 → 18.3.1

全テスト合格、ビルド成功を確認"

# プッシュ
git push origin <ブランチ名>
```

### ステップ 9: ロールバック手順（問題があった場合）

#### 9.1 即座にロールバック

```bash
# バックアップから復元
cp package.json.backup package.json
cp package-lock.json.backup package-lock.json

# 依存関係を再インストール
npm ci

# バックアップファイルを削除
rm package.json.backup
rm package-lock.json.backup
rm audit-report.json

# 動作確認
npm run build
npm test
```

#### 9.2 Gitでロールバック（コミット後に問題が発覚した場合）

```bash
# 直前のコミットを取り消し
git revert HEAD

# または特定のコミットを取り消し
git revert <コミットハッシュ>

# 依存関係を再インストール
npm ci

# 動作確認
npm run build
npm test
```

#### 9.3 特定のパッケージのみロールバック

```bash
# 特定のパッケージを以前のバージョンに戻す
npm install <package-name>@<old-version>

# 動作確認
npm run build
npm test
```

## 使用例

### 例1: セキュリティ脆弱性のみ修正

```bash
# 0. ブランチ作成（必須）
git checkout develop
git pull origin develop
git checkout -b chore/security-update-2024-10

# 1. アップデート実行
/update-deps security

# 実行結果:
# ⚠️  現在のブランチ: chore/security-update-2024-10
# ✅ ブランチ確認OK（developから分岐）
#
# 🔍 ステップ 1: バックアップ作成中...
# ✅ package.json, package-lock.json をバックアップしました
#
# 🔍 ステップ 2: 脆弱性確認中...
# ⚠️  検出された脆弱性:
# - Critical: 2件
# - High: 5件
# - Moderate: 10件
# - Low: 3件
#
# 🔧 ステップ 3: セキュリティ修正中...
# ✅ 15件の脆弱性を修正しました
#
# 📊 ステップ 4: 差分確認中...
# 📦 アップデートされたパッケージ:
# - vite: 5.0.0 → 5.0.13 (セキュリティパッチ)
# - axios: 1.5.0 → 1.6.2 (セキュリティパッチ)
#
# ✅ ステップ 5: テスト実行中...
# ✅ 全テスト合格
# ✅ ビルド成功
#
# このままコミットしますか？ (OK/NG)
```

### 例2: マイナーバージョンのみ更新

```bash
# 0. ブランチ作成（必須）
git checkout develop
git pull origin develop
git checkout -b chore/deps-minor-update-2024-Q4

# 1. アップデート実行
/update-deps minor

# 実行結果:
# ⚠️  現在のブランチ: chore/deps-minor-update-2024-Q4
# ✅ ブランチ確認OK（developから分岐）
#
# 🔍 ステップ 1: バックアップ作成中...
# ✅ バックアップ完了
#
# 🔍 ステップ 2: アップデート可能な依存関係を確認中...
# 📦 アップデート可能:
# - react: 18.2.0 → 18.3.1 (minor)
# - vite: 5.0.0 → 5.4.11 (minor)
# - typescript: 5.3.3 → 5.3.3 (最新)
#
# 🔧 ステップ 3: マイナーバージョン更新中...
# ✅ 2個のパッケージを更新しました
#
# 📊 ステップ 4: 差分確認中...
# 📦 アップデートされたパッケージ:
# - react: 18.2.0 → 18.3.1
# - vite: 5.0.0 → 5.4.11
#
# ✅ ステップ 5: テスト実行中...
# ✅ TypeScript: OK
# ✅ ESLint: OK
# ✅ 単体テスト: 45/45 passed
# ✅ ビルド: OK
# ✅ E2Eテスト: 21/21 passed
#
# 🎉 アップデート完了！
# このままコミットしますか？ (OK/NG)
```

### 例3: 特定のパッケージのみ更新

```bash
# 0. ブランチ作成（必須）
git checkout develop
git pull origin develop
git checkout -b chore/update-react-19

# 1. アップデート実行
/update-deps react

# 実行結果:
# ⚠️  現在のブランチ: chore/update-react-19
# ✅ ブランチ確認OK（developから分岐）
#
# 🔍 ステップ 1: バックアップ作成中...
# ✅ バックアップ完了
#
# 🔍 ステップ 2: reactの最新バージョンを確認中...
# 📦 react:
# - Current: 18.2.0
# - Latest: 19.0.0 (メジャーバージョンアップ)
#
# ⚠️  警告: メジャーバージョンアップです
# 破壊的変更が含まれる可能性があります。
# 続行しますか？ (OK/NG)
#
# → ユーザーがOKを選択
#
# 🔧 ステップ 3: react を更新中...
# ✅ react: 18.2.0 → 19.0.0
#
# ⚠️  関連パッケージも更新が必要です:
# - @types/react: 18.2.0 → 19.0.0
# - react-dom: 18.2.0 → 19.0.0
#
# これらも更新しますか？ (OK/NG)
#
# → ユーザーがOKを選択
#
# ✅ ステップ 4: テスト実行中...
# ❌ TypeScript: 3 errors
#   - src/App.tsx:45 - Type error: Property 'render' does not exist
#   - src/components/Main.tsx:12 - Type error: ...
#
# ❌ アップデート失敗
# ロールバックしますか？ (OK/NG)
```

### 例4: アップデート可能な依存関係を確認のみ

```bash
/update-deps check

# 実行結果:
# 🔍 アップデート可能な依存関係を確認中...
#
# 📦 アップデート可能なパッケージ:
#
# 🟢 パッチバージョン (安全):
# - vite: 5.4.10 → 5.4.11
# - vitest: 2.1.0 → 2.1.5
#
# 🟡 マイナーバージョン (通常は安全):
# - react: 18.2.0 → 18.3.1
# - @types/react: 18.2.0 → 18.3.1
#
# 🔴 メジャーバージョン (破壊的変更の可能性):
# - react: 18.3.1 → 19.0.0
# - vite: 5.4.11 → 6.0.0
#
# 🔒 セキュリティ脆弱性:
# - Critical: 0件
# - High: 2件 (vite, axios)
# - Moderate: 5件
#
# 推奨されるアクション:
# 1. セキュリティ脆弱性を修正: /update-deps security
# 2. マイナーバージョンを更新: /update-deps minor
# 3. メジャーバージョンは慎重に: /update-deps major
```

## エラーハンドリング

### テストが失敗した場合

```
❌ テスト失敗

失敗したテスト:
- src/lib/__tests__/calculator.test.ts
  ✗ should calculate production chain correctly

原因:
- react 19.0.0 で破壊的変更が含まれている

対処方法:
1. ロールバック: /update-deps rollback
2. 手動で修正してから再実行: 
   - コードを修正
   - /test で確認
   - git commit
```

### ビルドが失敗した場合

```
❌ ビルド失敗

エラー:
- Cannot find module 'react'
- TypeScript compilation error

原因:
- 依存関係の不整合

対処方法:
1. 依存関係を再インストール:
   npm ci
2. それでも失敗する場合はロールバック:
   /update-deps rollback
```

### コンフリクトが発生した場合

```
⚠️  警告: package.json に未コミットの変更があります

現在の変更をコミットまたはstashしてから実行してください：
git stash
/update-deps
git stash pop
```

## 推奨される運用

### 定期メンテナンス

| 頻度 | コマンド | 目的 |
|---|---|---|
| **週1回** | `/update-deps security` | セキュリティ脆弱性の修正 |
| **月1回** | `/update-deps minor` | マイナーバージョンの更新 |
| **四半期に1回** | `/update-deps major` | メジャーバージョンの更新 |
| **随時** | `/update-deps check` | アップデート可能な依存関係の確認 |

### 緊急対応（Critical脆弱性）

Critical脆弱性の場合、**mainブランチへの緊急マージ**が必要です：

```bash
# 0. hotfixブランチを作成（mainから）
git checkout main
git pull origin main
git checkout -b hotfix/security-update-$(date +%Y-%m)

# 1. すぐに確認
/update-deps check

# 2. セキュリティ修正を即座に実行
/update-deps security

# 3. テスト実行
/test

# 4. コミット＆プッシュ
git add package.json package-lock.json
git commit -m "security: Critical脆弱性を緊急修正

- 脆弱性レベル: Critical
- 影響範囲: [パッケージ名]
- 修正内容: [バージョン] → [バージョン]

全テスト合格、ビルド成功を確認"
git push origin hotfix/security-update-$(date +%Y-%m)

# 5. PR作成（mainへの緊急マージ）
/pr

# 6. マージ後、developへのバックマージを忘れずに
git checkout develop
git pull origin develop
git merge main
git push origin develop
```

**重要**: Critical脆弱性は**mainブランチへの直接マージ**を検討しますが、必ずPRを経由してレビューを受けてください。

### 大規模アップデート（四半期メンテナンス）

四半期ごとの定期メンテナンスでは、計画的にアップデートを実施します：

```bash
# 0. 専用ブランチを作成（developから）
git checkout develop
git pull origin develop
git checkout -b chore/deps-update-2024-Q4

# 1. アップデート可能な依存関係を確認
/update-deps check

# 2. まずセキュリティ修正
/update-deps security
/test
git add package.json package-lock.json
git commit -m "security: セキュリティ脆弱性を修正"

# 3. マイナーバージョンを更新
/update-deps minor
/test
git add package.json package-lock.json
git commit -m "chore: マイナーバージョンを更新"

# 4. メジャーバージョンは個別に慎重に
/update-deps react
/test
# 問題があればロールバック、なければコミット
git add package.json package-lock.json
git commit -m "chore: reactを19.0.0に更新"

# ... 他のメジャーバージョンも同様に個別コミット

# 5. 最終確認：全テスト実行
/test

# 6. プッシュ
git push origin chore/deps-update-2024-Q4

# 7. PR作成（developへ）
/pr

# 8. マージ後の確認
# - CI/CDが正常に動作するか
# - デプロイが成功するか
```

**ポイント**:
- 各ステップでコミットを分ける（問題があった場合に部分的にロールバック可能）
- メジャーバージョンアップは個別にコミット
- 全体で1つのPRにまとめる

## 注意事項

1. **必ずブランチを分ける（最重要）**
   - 直接 `main` や `develop` で作業しない
   - セキュリティ緊急対応: `hotfix/security-update-*` → `main`
   - 通常のアップデート: `chore/deps-*` → `develop`
   - PRを経由してレビューを受ける

2. **必ずバックアップを取る**
   - このコマンドは自動的にバックアップを作成します
   - ロールバックが必要な場合に備えて

3. **テストは必ず実行**
   - 依存関係の更新後は必ず全テストを実行
   - E2Eテストも含めて実行（UIレベルのリグレッション確認）

4. **メジャーバージョンアップは慎重に**
   - 破壊的変更が含まれる可能性が高い
   - CHANGELOGやマイグレーションガイドを確認
   - 十分にテストしてからコミット
   - 個別にコミットして、問題があれば部分的にロールバック

5. **セキュリティ脆弱性は優先**
   - Critical、High レベルの脆弱性は即座に修正
   - Critical の場合は hotfix ブランチで main に緊急マージ
   - 定期的に `npm audit` を実行

6. **コミット前に確認**
   - どのパッケージがどのバージョンに更新されたか
   - 意図しない変更がないか
   - 全テストが合格しているか
   - `/diff` コマンドで差分を確認

7. **ロールバック手順を知っておく**
   - 問題があった場合、すぐにロールバックできるように
   - バックアップファイルの場所を確認
   - ブランチを削除すれば元の状態に戻せる

8. **マージ後のバックマージ**
   - hotfix ブランチを main にマージした後、必ず develop にもバックマージ
   - `git checkout develop && git merge main`

## 関連コマンド

- **`/test`**: 全テスト実行（依存関係更新後に必須）
- **`/quick-check`**: 高速品質チェック（E2Eスキップ）
- **`/diff`**: 差分確認（package.jsonの変更を確認）
- **`/pr`**: PR作成（依存関係更新のPR作成）

---

**依存関係のアップデートは慎重に行い、必ず全テストを実行してください。問題があればすぐにロールバックできるよう、バックアップを取っておくことが重要です。**

