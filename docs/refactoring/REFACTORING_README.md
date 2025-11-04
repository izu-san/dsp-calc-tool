# リファクタリングプロジェクト ドキュメント

## 概要

このディレクトリには、Dyson Sphere Program 生産チェーン計算機の大規模リファクタリングプロジェクトに関するドキュメントが含まれています。

## ドキュメント一覧

### 📊 進捗状況

- **[refactoring-progress.md](./refactoring-progress.md)**
  - 各フェーズの実施内容と成果
  - 現在の進捗状況
  - 残作業の詳細
  - 重要な注意事項
  - トラブルシューティング

### ✅ チェックリスト

- **[refactoring-checklist.md](./refactoring-checklist.md)**
  - Phase 4 の残作業チェックリスト
  - Phase 3 の slice 化チェックリスト
  - Phase 5 の E2E テスト再構築チェックリスト
  - 共通チェックリスト

### 📐 パターン集

- **[refactoring-patterns.md](./refactoring-patterns.md)**
  - テストリファクタリングパターン
  - サービス層パターン
  - 履歴記録パターン
  - 列挙型パターン
  - よくあるエラーと対処法
  - ベストプラクティス

## クイックスタート

### 作業を再開する場合

1. **[refactoring-progress.md](./refactoring-progress.md)** を確認して現在の進捗を把握
2. **[refactoring-checklist.md](./refactoring-checklist.md)** で残作業を確認
3. **[refactoring-patterns.md](./refactoring-patterns.md)** でパターンを確認して作業開始

### よく使う情報

#### ビルダーの使用方法

- `refactoring-patterns.md` の「テストリファクタリングパターン」セクションを参照

#### エラーが発生した場合

- `refactoring-progress.md` の「トラブルシューティング」セクションを参照
- `refactoring-patterns.md` の「よくあるエラーと対処法」セクションを参照

#### 残作業を確認する場合

- `refactoring-checklist.md` の各セクションを確認

## フェーズ別状況

### ✅ Phase 1: PlanManager のサービス+フックへの分割

**ステータス**: 完了
**詳細**: `refactoring-progress.md` の Phase 1 セクションを参照

### ✅ Phase 2: レイアウトと計算 UI のタブ状態を列挙型に統一

**ステータス**: 完了
**詳細**: `refactoring-progress.md` の Phase 2 セクションを参照

### ✅ Phase 3: Zustand ストアの slice 化と履歴記録のサービス層への移行

**ステータス**: 完了（slice化は準備のみ）
**詳細**: `refactoring-progress.md` の Phase 3 セクションを参照

### ✅ Phase 4: lib テストのモジュール単位への再編成とビルダー/モックの統一

**ステータス**: 完了
**詳細**: `refactoring-progress.md` の Phase 4 セクションを参照

### ✅ Phase 5: Playwright フィクスチャ導入とシナリオ分割でE2Eを再構築

**ステータス**: 完了
**詳細**: `refactoring-progress.md` の Phase 5 セクションを参照
**成果**:

- Playwrightフィクスチャの作成（app.fixture.ts, test-data.fixture.ts, browser.fixture.ts）
- 全E2Eテストファイルのリファクタリング（11ファイル）
- パフォーマンス最適化（並列実行の最適化）
- ドキュメント作成（docs/testing/E2E_TESTING.md）

## 関連ファイル

### ビルダーファイル

- `src/test/factories/nodeBuilder.ts`
- `src/test/factories/recipeBuilder.ts`
- `src/test/factories/machineBuilder.ts`
- `src/test/factories/testDataFactory.ts`

### サービスファイル

- `src/services/plan-management/`
- `src/services/history-recording/`

### フックファイル

- `src/hooks/usePlanManagerDialogs.ts`
- `src/hooks/usePlanExport.ts`
- `src/hooks/usePlanImport.ts`

### 型定義ファイル

- `src/types/ui-tabs.ts`

## 更新履歴

- **2025-01-28**: Phase 5完了
  - E2Eテストの再構築完了（フィクスチャ作成・テストリファクタリング・パフォーマンス最適化・ドキュメント作成）
  - Phase 4完了（テストリファクタリング完了）
  - Phase 3完了（settingsStoreのslice化完了）
- **2025-01-28**: 初期ドキュメント作成
  - Phase 1-4 の進捗を記録
  - パターン集とチェックリストを作成

---

**注意**: 作業を進める際は、必ず最新のドキュメントを確認してください。
