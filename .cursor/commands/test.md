# 総合テスト実行コマンド

このコマンドは、全テスト（単体テスト、E2Eテスト、カバレッジ）を一括実行します。

## 使用方法

```
/test [オプション]
```

**オプション**:
- `/test` - 全テスト実行（デフォルト）
- `/test unit` - 単体テストのみ
- `/test e2e` - E2Eテストのみ
- `/test coverage` - カバレッジレポート表示
- `/test quick` - E2Eをスキップして高速実行

**例**:
- `/test` - 全テスト実行
- `/test unit` - 単体テストのみ実行
- `/test e2e` - E2Eテストのみ実行
- `/test coverage` - カバレッジレポートを表示
- `/test quick` - 単体テストとビルドのみ（E2Eスキップ）

## 実行内容

### デフォルト（全テスト実行）

1. **単体テスト実行**
   ```bash
   npm test
   ```
   - 全単体テストを実行
   - 合格基準: 全テスト成功（0 failed）

2. **E2Eテスト実行**
   
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
   
   - 合格基準: 全21シナリオ成功
   - 実行時間: 約13秒（16並列ワーカー）

3. **カバレッジ確認**
   ```bash
   npm run test:coverage
   ```
   - カバレッジレポートを生成
   - 出力: `coverage/index.html`

4. **結果サマリーを表示**
   - 単体テスト結果（合格数/総数、失敗数）
   - E2Eテスト結果（合格数/総数）
   - カバレッジ率（全体、変更部分）
   - 全体の合否判定

### オプション別の実行内容

#### `/test unit` - 単体テストのみ

```bash
npm test
```

- 単体テストのみを実行
- 最も高速（E2Eをスキップ）
- 実行時間: 約10-30秒

#### `/test e2e` - E2Eテストのみ

devサーバーを起動してE2Eテストのみを実行（上記の手順2を実行）

- UIレベルのテストのみ
- 実行時間: 約13-20秒

#### `/test coverage` - カバレッジレポート表示

```bash
npm run test:coverage
```

- カバレッジレポートを生成・表示
- 出力ファイル: `coverage/index.html`
- ブラウザで詳細を確認可能
- カバレッジ目標: 85%以上

#### `/test quick` - 高速実行（E2Eスキップ）

```bash
# TypeScriptコンパイルチェック
npx tsc --noEmit

# 単体テスト実行
npm test

# ビルドチェック
npm run build
```

- E2Eテストをスキップして高速化
- コミット前の軽量チェックに適している
- 実行時間: 約1-2分

## 合格基準

全テスト実行時の合格基準：

| 項目 | 合格基準 |
|---|---|
| **単体テスト** | 全テスト成功（0 failed） |
| **E2Eテスト** | 全21シナリオ成功 |
| **カバレッジ** | 85%以上（新規コード） |
| **総合判定** | 上記全てが合格 |

## 結果の解釈

### 単体テスト結果の確認

- **"Tests:"** または **"Test Suites:"** 行を確認
- 例: `Tests: 45 passed, 45 total` → 全合格
- 例: `Tests: 43 passed, 2 failed, 45 total` → 2件失敗

### E2Eテスト結果の確認

- **"passed"** または **"failed"** を含む行を確認
- 例: `21 passed (13s)` → 全合格
- 例: `19 passed, 2 failed (15s)` → 2件失敗

### カバレッジ結果の確認

- **"All files"** 行のカバレッジ率を確認
- 例: `All files | 92.5 | 90.2 | 95.3 | 92.5 |` → 92.5%
- 目標: 85%以上

## エラーハンドリング

### 単体テストが失敗した場合

1. **失敗したテストを特定**
   ```bash
   npm test -- --reporter=verbose
   ```

2. **特定のテストファイルのみ実行**
   ```bash
   npm test -- <テストファイル名>
   ```

3. **修正してから再実行**

### E2Eテストが失敗した場合

1. **UIモードで視覚的に確認**
   ```bash
   npm run test:e2e -- --ui
   ```

2. **特定のテストのみ実行**
   ```bash
   npm run test:e2e -- tests/e2e/<ファイル名>.spec.ts
   ```

3. **スクリーンショットを確認**
   - `test-results/` ディレクトリを確認

### devサーバーが停止しない場合

**Windows**:
```powershell
# ポート5173を使用しているプロセスを強制終了
$viteProcess = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
if ($viteProcess) { Stop-Process -Id $viteProcess -Force }
```

**Unix/Mac**:
```bash
# ポート5173を使用しているプロセスを強制終了
lsof -ti:5173 | xargs kill -9
```

## 使用例

### 例1: コミット前の品質確認

```bash
# コード変更後、コミット前に全テストを実行
/test

# 実行結果:
# ✅ 単体テスト: 45/45 passed
# ✅ E2Eテスト: 21/21 passed
# ✅ カバレッジ: 92.5%
# 🎉 全テスト合格！コミット可能です。
```

### 例2: ロジック変更後に単体テストのみ実行

```bash
# ロジック変更後、高速フィードバックのため単体テストのみ
/test unit

# 実行結果:
# ✅ 単体テスト: 45/45 passed
# ⚠️  E2Eテストはスキップされました
```

### 例3: UI変更後にE2Eテストのみ実行

```bash
# UI変更後、UIレベルの動作確認
/test e2e

# 実行結果:
# ✅ E2Eテスト: 21/21 passed
# ⚠️  単体テストはスキップされました
```

### 例4: カバレッジレポートの確認

```bash
# テストカバレッジを詳細に確認
/test coverage

# 実行結果:
# ✅ カバレッジレポート生成完了
# 📊 全体カバレッジ: 92.5%
# 📂 レポート: coverage/index.html
```

### 例5: 高速チェック（E2Eスキップ）

```bash
# 高速フィードバックのためE2Eをスキップ
/test quick

# 実行結果:
# ✅ TypeScript: OK
# ✅ 単体テスト: 45/45 passed
# ✅ ビルド: OK
# ⚠️  E2Eテストはスキップされました
# ⏱️  実行時間: 1分20秒
```

## 注意事項

1. **全テスト実行には時間がかかる**
   - 単体テスト: 約10-30秒
   - E2Eテスト: 約13秒
   - カバレッジ: 約20-40秒
   - 合計: 約1-2分

2. **E2Eテストはdevサーバーが必要**
   - 自動的に起動・停止されます
   - ポート5173が使用中の場合はエラーになります

3. **高速フィードバックには `/test quick` を使用**
   - E2Eをスキップして高速化
   - コミット前には全テスト実行を推奨

4. **失敗時は詳細を確認**
   - 失敗したテストは必ず原因を特定して修正してください
   - リグレッションの可能性があります

5. **カバレッジ目標を維持**
   - 新規コード: 85%以上
   - クリティカルパス（calculator, parser）: 90%以上

## 品質保証の重要性

このコマンドは、コードの品質を保証するための最も重要なツールです。

- **コミット前**: 必ず全テスト実行（`/test`）
- **開発中**: 高速フィードバックのため `/test unit` または `/test quick`
- **UI変更後**: `/test e2e` でUIレベルの動作確認
- **リファクタリング後**: 全テスト実行でリグレッション確認

---

**このコマンドは品質保証の要です。必ずコミット前に実行してください。**

