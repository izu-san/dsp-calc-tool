# 発電設備のエクスポート・インポート機能追加 - 実装プラン

## 概要

生産プランのエクスポート・インポート機能に発電設備の計算結果と設定を追加し、完全なプラン復元を可能にする。

## 実装範囲

- **エクスポート形式**: Markdown, CSV, Excel, 画像の全形式
- **データ復元**: 発電設備の設定（テンプレート、手動選択）と計算結果を完全復元
- **段階的実装**: 仕様書の更新 → データ構造の拡張 → 各形式の実装

## 実装計画

### Phase 1: 仕様書の更新

**対象ファイル:**

- `docs/features/EXPORT_FUNCTIONALITY.md`
- `docs/features/IMPORT_FUNCTIONALITY.md`

**追加内容:**

#### EXPORT_FUNCTIONALITY.md の更新

1. **共通データ構造に発電設備情報を追加** (35-105行目)

```typescript
export interface ExportData {
  // 既存...
  powerGeneration?: ExportPowerGeneration;
}

export interface ExportPowerGeneration {
  requiredPower: number;
  template: string;
  manualGenerator?: string;
  manualFuel?: string;
  proliferatorSettings?: {
    type: string;
    mode: string;
    speedBonus: number;
    productionBonus: number;
  };
  generators: Array<{
    generatorId: number;
    generatorName: string;
    generatorType: string;
    count: number;
    baseOutput: number;
    actualOutputPerUnit: number;
    totalOutput: number;
    fuelId?: number;
    fuelName?: string;
    fuelConsumptionRate?: number;
    actualFuelEnergy?: number;
  }>;
  totalGenerators: number;
  totalFuelConsumption: Array<{
    fuelId: number;
    fuelName: string;
    consumptionRate: number;
  }>;
}
```

2. **Markdown形式のテンプレートに発電設備セクションを追加** (107-156行目)

```markdown
## ⚡ 発電設備

**📋 テンプレート:** {template}
**🔧 発電設備:** {generatorName} (手動選択: {manual})
**⛽ 燃料:** {fuelName} (手動選択: {manual})
**💊 増産剤:** {proliferatorType} ({proliferatorMode}モード)

| 発電設備 | 必要台数 | 単体出力 | 総出力 | 燃料 | 燃料消費量/秒 |
| -------- | -------- | -------- | ------ | ---- | ------------- |

{powerGenerationTable}

**⚡ 総発電設備:** {totalGenerators} 台
**⛽ 総燃料消費:**
{totalFuelConsumption}
```

3. **CSV/Excel形式に PowerGeneration シートを追加** (183-239行目)

新しいシート定義:

```csv
# PowerGeneration
RequiredPower,Template,ManualGenerator,ManualFuel,ProliferatorType,ProliferatorMode,ProliferatorSpeedBonus,ProliferatorProductionBonus
{requiredPower},{template},{manualGenerator},{manualFuel},{proliferatorType},{proliferatorMode},{speedBonus},{productionBonus}

# PowerGenerators
GeneratorID,GeneratorName,GeneratorType,Count,BaseOutput,ActualOutputPerUnit,TotalOutput,FuelID,FuelName,FuelConsumptionRate,ActualFuelEnergy
{generatorData}
```

4. **画像エクスポートに発電設備ビューを追加** (279-329行目)

```typescript
includeViews: {
  statistics: boolean;
  powerGraph: boolean;
  buildingCost: boolean;
  powerGeneration: boolean; // 追加
}
```

#### IMPORT_FUNCTIONALITY.md の更新

1. **共通データ構造に発電設備情報を追加** (30-72行目)

```typescript
export interface ImportResult {
  success: boolean;
  plan?: SavedPlan;
  extractedData?: {
    // 既存...
    powerGeneration?: ExportPowerGeneration;
  };
  errors: ImportError[];
  warnings: ImportWarning[];
}
```

2. **Markdown形式のパース対象に発電設備を追加** (74-199行目)

発電設備セクションの抽出関数:

```typescript
function extractPowerGeneration(markdown: string): ExportPowerGeneration | undefined;
```

3. **CSV形式に PowerGeneration シートの処理を追加** (314-639行目)

シート抽出関数:

```typescript
function extractPowerGenerationFromSheets(
  sheets: Record<string, string[][]>
): ExportPowerGeneration | undefined;
```

4. **プラン構築に発電設備設定の復元を追加** (840-934行目)

```typescript
function buildPlanFromExtractedData(data: any): SavedPlan {
  // 既存...

  // 発電設備設定の復元
  if (data.powerGeneration) {
    plan.powerGenerationSettings = {
      template: data.powerGeneration.template,
      manualGenerator: data.powerGeneration.manualGenerator,
      manualFuel: data.powerGeneration.manualFuel,
      proliferator: data.powerGeneration.proliferatorSettings,
    };
  }

  return plan;
}
```

### Phase 2: 型定義の拡張

**対象ファイル:**

- `src/types/export.ts` (新規作成)
- `src/types/import.ts` (新規作成)
- `src/types/saved-plan.ts` (既存ファイルの拡張)

**実装内容:**

1. `src/types/export.ts` を作成し、エクスポート用の型定義を集約
2. `src/types/import.ts` を作成し、インポート用の型定義を集約
3. `src/types/saved-plan.ts` に発電設備設定を追加:

```typescript
export interface SavedPlan {
  // 既存...
  powerGenerationSettings?: {
    template: string;
    manualGenerator?: string;
    manualFuel?: string;
    proliferator?: {
      type: string;
      mode: string;
      speedBonus: number;
      productionBonus: number;
    };
  };
}
```

### Phase 3: データ変換ロジックの実装

**対象ファイル:**

- `src/lib/export/dataTransformer.ts` (新規作成)

**実装内容:**

計算結果と設定から `ExportData` への変換関数:

```typescript
export function transformToExportData(
  calculationResult: CalculationResult,
  statistics: ProductionStatistics,
  powerBreakdown: PowerBreakdown,
  powerGeneration: PowerGenerationResult,
  settings: GlobalSettings,
  settingsStore: SettingsStore
): ExportData;
```

発電設備データの変換:

```typescript
function transformPowerGeneration(
  powerGeneration: PowerGenerationResult,
  requiredPower: number,
  template: string,
  manualGenerator: string | null,
  manualFuel: string | null,
  proliferator: ProliferatorConfig
): ExportPowerGeneration;
```

### Phase 4: Markdown エクスポートの実装

**対象ファイル:**

- `src/lib/export/markdownExporter.ts` (新規作成)

**実装内容:**

Markdown形式の生成関数:

```typescript
export function exportToMarkdown(exportData: ExportData, options: MarkdownExportOptions): string;
```

発電設備セクションの生成:

```typescript
function generatePowerGenerationSection(
  powerGeneration: ExportPowerGeneration,
  options: MarkdownExportOptions
): string;
```

### Phase 5: CSV エクスポートの実装

**対象ファイル:**

- `src/lib/export/csvExporter.ts` (新規作成)

**実装内容:**

CSV形式の生成関数 (複数シート対応):

```typescript
export function exportToCSV(exportData: ExportData, options: CSVExportOptions): string;
```

PowerGeneration シートの生成:

```typescript
function generatePowerGenerationSheet(powerGeneration: ExportPowerGeneration): string;
```

### Phase 6: Excel エクスポートの実装

**対象ファイル:**

- `src/lib/export/excelExporter.ts` (新規作成)

**必要なライブラリ:**

```bash
npm install xlsx
npm install -D @types/xlsx
```

**実装内容:**

Excel形式の生成関数:

```typescript
export function exportToExcel(exportData: ExportData, options: CSVExportOptions): Blob;
```

`xlsx` ライブラリを使用してワークブックを作成し、各シートを追加。

### Phase 7: 画像エクスポートの実装

**対象ファイル:**

- `src/lib/export/imageExporter.ts` (新規作成)

**必要なライブラリ:**

```bash
npm install html2canvas
npm install -D @types/html2canvas
```

**実装内容:**

画像形式の生成関数:

```typescript
export async function exportToImage(
  exportData: ExportData,
  options: ImageExportOptions
): Promise<Blob>;
```

PowerGenerationView コンポーネントを含めたレンダリング。

### Phase 8: Markdown インポートの実装

**対象ファイル:**

- `src/lib/import/markdownImporter.ts` (新規作成)

**実装内容:**

Markdown形式のパース関数:

```typescript
export async function importFromMarkdown(
  file: File,
  options: MarkdownImportOptions
): Promise<MarkdownImportResult>;
```

発電設備セクションの抽出:

```typescript
function extractPowerGeneration(markdown: string): ExportPowerGeneration | undefined;
```

### Phase 9: CSV インポートの実装

**対象ファイル:**

- `src/lib/import/csvImporter.ts` (新規作成)

**実装内容:**

CSV形式のパース関数:

```typescript
export async function importFromCSV(
  file: File,
  options: CSVImportOptions
): Promise<CSVImportResult>;
```

PowerGeneration シートの処理:

```typescript
function extractPowerGenerationFromSheets(
  sheets: Record<string, string[][]>
): ExportPowerGeneration | undefined;
```

### Phase 10: Excel インポートの実装

**対象ファイル:**

- `src/lib/import/excelImporter.ts` (新規作成)

**実装内容:**

Excel形式のパース関数:

```typescript
export async function importFromExcel(
  file: File,
  options: ExcelImportOptions
): Promise<CSVImportResult>;
```

`xlsx` ライブラリを使用してワークブックを読み込み、CSV形式と同じ処理ロジックを適用。

### Phase 11: データ検証の実装

**対象ファイル:**

- `src/lib/import/validation.ts` (新規作成)

**実装内容:**

インポートデータの検証関数:

```typescript
export function validateExtractedData(data: any): ValidationResult;
```

発電設備データの検証:

```typescript
function validatePowerGeneration(powerGeneration: ExportPowerGeneration): ValidationResult;
```

### Phase 12: プラン構築の実装

**対象ファイル:**

- `src/lib/import/planBuilder.ts` (新規作成)

**実装内容:**

インポートデータから SavedPlan への変換:

```typescript
export function buildPlanFromExtractedData(data: any): SavedPlan;
```

発電設備設定の復元:

```typescript
function restorePowerGenerationSettings(
  powerGeneration: ExportPowerGeneration
): SavedPlan["powerGenerationSettings"];
```

### Phase 13: メインエクスポート関数の実装

**対象ファイル:**

- `src/lib/export/index.ts` (新規作成)

**実装内容:**

統合エクスポート関数:

```typescript
export async function exportPlan(
  calculationResult: CalculationResult,
  statistics: ProductionStatistics,
  powerBreakdown: PowerBreakdown,
  powerGeneration: PowerGenerationResult,
  settings: GlobalSettings,
  settingsStore: SettingsStore,
  options: ExportOptions
): Promise<Blob>;
```

形式に応じた分岐処理を実装。

### Phase 14: メインインポート関数の実装

**対象ファイル:**

- `src/lib/import/index.ts` (新規作成)

**実装内容:**

統合インポート関数:

```typescript
export async function importPlan(file: File, options: ImportOptions): Promise<ImportResult>;
```

ファイル拡張子に応じた分岐処理を実装。

### Phase 15: エクスポートダイアログの実装

**対象ファイル:**

- `src/components/ExportDialog/index.tsx` (新規作成)
- `src/components/ExportDialog/FormatSelector.tsx` (新規作成)
- `src/components/ExportDialog/OptionsPanel.tsx` (新規作成)
- `src/components/ExportDialog/MarkdownOptions.tsx` (新規作成)
- `src/components/ExportDialog/CSVOptions.tsx` (新規作成)
- `src/components/ExportDialog/ImageOptions.tsx` (新規作成)

**実装内容:**

エクスポートダイアログ UI の実装。形式選択、オプション設定、プレビュー機能を含む。

### Phase 16: インポートダイアログの実装

**対象ファイル:**

- `src/components/ImportDialog/index.tsx` (新規作成)
- `src/components/ImportDialog/FileSelector.tsx` (新規作成)
- `src/components/ImportDialog/ImportResultDisplay.tsx` (新規作成)

**実装内容:**

インポートダイアログ UI の実装。ファイル選択（ドラッグ&ドロップ対応）、結果表示、エラー表示を含む。

### Phase 17: Header への統合

**対象ファイル:**

- `src/components/Layout/Header.tsx` (既存ファイルの拡張)

**実装内容:**

既存のヘッダー「保存/読み込み」ボタンに統合:

- 「保存」ボタン → ドロップダウンメニュー（LocalStorage, Markdown, CSV, Excel, 画像）
- 「読み込み」ボタン → ファイル選択ダイアログ（LocalStorage, ファイルインポート）

### Phase 18: テストの追加

**対象ファイル:**

- `src/lib/export/__tests__/dataTransformer.test.ts` (新規作成)
- `src/lib/export/__tests__/markdownExporter.test.ts` (新規作成)
- `src/lib/export/__tests__/csvExporter.test.ts` (新規作成)
- `src/lib/export/__tests__/excelExporter.test.ts` (新規作成)
- `src/lib/import/__tests__/markdownImporter.test.ts` (新規作成)
- `src/lib/import/__tests__/csvImporter.test.ts` (新規作成)
- `src/lib/import/__tests__/validation.test.ts` (新規作成)
- `src/lib/import/__tests__/planBuilder.test.ts` (新規作成)
- `tests/e2e/export-import.spec.ts` (新規作成)

**実装内容:**

単体テストとE2Eテストを追加。カバレッジ目標: 85%以上。

## 重要な設計判断

1. **発電設備の設定を SavedPlan に追加**: 完全なプラン復元のため
2. **計算結果ではなく設定を保存**: インポート時に再計算することで整合性を保つ
3. **全形式で発電設備情報をサポート**: ユーザーの利便性を最大化
4. **段階的実装**: 仕様書 → 型定義 → ロジック → UI の順で実装

## 確定した実装方針

### 既存機能との統合

- **既存の `planExport.ts` (JSON形式)**: ヘッダーの「保存」ドロップダウンに統合
- **既存の `urlShare.ts` (URL共有)**: 独立して保持（軽量共有用）
- **UI統合**: 既存のヘッダー「保存/読み込み」ボタンを拡張

### 実装優先順位（確定版）

1. **Phase 1: 基盤とMarkdown**（ライブラリ不要）
2. **Phase 2: CSV**（ライブラリ不要）
3. **Phase 3: Excelエクスポート**（`xlsx` 動的ロード）
4. **Phase 4: 画像エクスポート**（`html2canvas` 動的ロード）
5. **Phase 5: Excelインポート**（既存 `xlsx` 使用）

### 技術的判断

- **ライブラリ**: 動的インポート（bundle size最適化）
- **CSV形式**: 単一シート構造（複数シートはExcelのみ）
- **レシピ識別**: SIDを優先、名前はフォールバック
- **発電設備増産剤**: 専用設定として保存
- **バージョン管理**: エクスポートファイルに含める（将来の互換性対応）

### 画像インポート

今回の実装には含めず、将来の拡張として残す。

## 注意点

- `settingsStore` の発電設備設定を永続化する
- インポート時のバリデーションを厳格に行う
- ユーザーへの明確なエラーメッセージを提供
- バージョン情報を全エクスポート形式に含める

## タスクリスト（更新版）

### ✅ Phase 0: 仕様書更新（完了）

- [x] EXPORT_FUNCTIONALITY.md の更新
  - [x] バージョン情報の追加
  - [x] CSV形式を単一シート構造に変更
  - [x] 動的インポートの実装方法を明記
  - [x] UI統合方法の更新
  - [x] 実装優先順位の更新
- [x] IMPORT_FUNCTIONALITY.md の更新
  - [x] 画像インポートを「将来の拡張」に移動
  - [x] バージョン検証ロジックの追加
  - [x] CSV形式を単一シート構造に変更
  - [x] レシピSID優先使用を明記
- [x] POWER_GENERATION_EXPORT_IMPORT_PLAN.md の更新
  - [x] 実装方針の確定
  - [x] タスクリストの更新

### Phase 1: 基盤とMarkdown（ライブラリ不要）

- [ ] データ構造の定義
  - [ ] src/types/export.ts を作成
  - [ ] src/types/import.ts を作成
  - [ ] src/types/saved-plan.ts に発電設備設定を追加
  - [ ] src/constants/exportVersion.ts を作成
- [ ] Markdown形式の実装
  - [ ] src/lib/export/dataTransformer.ts を実装
  - [ ] src/lib/export/markdownExporter.ts を実装
  - [ ] src/lib/export/filenameGenerator.ts を実装
- [ ] Markdownインポートの実装
  - [ ] src/lib/import/markdownImporter.ts を実装
  - [ ] src/lib/import/validation.ts を実装（基本機能）
  - [ ] src/lib/import/planBuilder.ts を実装（基本機能）
- [ ] UI基盤の実装
  - [ ] Header に保存ドロップダウンメニューを追加
  - [ ] ExportDialog の基本構造を実装
  - [ ] ImportDialog の基本構造を実装

### Phase 2: CSV形式（ライブラリ不要）

- [ ] CSV形式の実装
  - [ ] src/lib/export/csvExporter.ts を実装（単一シート）
  - [ ] src/lib/import/csvImporter.ts を実装
- [ ] プレビュー機能の追加
  - [ ] Markdownプレビュー
  - [ ] CSVテーブルプレビュー
- [ ] テストの追加
  - [ ] Markdown/CSV形式の単体テスト
  - [ ] E2Eテスト（基本フロー）

### Phase 3: Excelエクスポート（`xlsx` 動的ロード）

- [ ] Excelエクスポートの実装
  - [ ] npm install xlsx を実行
  - [ ] src/lib/export/excelExporter.ts を実装（動的インポート）
- [ ] バージョン検証の強化
  - [ ] バージョン互換性チェック機能
  - [ ] マイグレーション処理の基盤

### Phase 4: 画像エクスポート（`html2canvas` 動的ロード）

- [ ] 画像エクスポートの実装
  - [ ] npm install html2canvas を実行
  - [ ] src/lib/export/imageExporter.ts を実装（動的インポート）
- [ ] 品質最適化
  - [ ] 高解像度対応
  - [ ] メモリ使用量の最適化

### Phase 5: Excelインポート（既存 `xlsx` 使用）

- [ ] Excelインポートの実装
  - [ ] src/lib/import/excelImporter.ts を実装
  - [ ] データ検証の強化
- [ ] エラーハンドリングの完成
  - [ ] 詳細なエラーメッセージ
  - [ ] リカバリー処理

### Phase 6: UI完成とテスト

- [ ] UI完成
  - [ ] 全形式のオプション設定UI
  - [ ] プレビュー機能の完成
- [ ] 統合テスト
  - [ ] 全形式のE2Eテスト
  - [ ] カバレッジ目標: 85%以上
  - [ ] パフォーマンステスト

---

_このプランは Issue #66 の実装計画です。発電設備のエクスポート・インポート機能を段階的に実装します。_
