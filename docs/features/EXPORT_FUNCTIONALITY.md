# エクスポート機能強化 - 詳細仕様書

## 概要

Dyson Sphere Program 生産チェーン計算機のエクスポート機能を強化し、以下の3つの形式でのデータ出力を可能にする。

- **Markdown形式**: Reddit/Discord投稿用
- **CSV/Excel形式**: スプレッドシート分析用  
- **画像形式**: スクリーンショット共有用

## 実装方針

### 段階的実装アプローチ

**Phase 1: データ基盤の整備**
- エクスポート用のデータ変換関数群
- 共通のデータ構造定義
- フォーマット固有の変換ロジック

**Phase 2: Markdown形式**
- 既存の統計データを活用
- シンプルな実装から開始
- ユーザーフィードバック収集

**Phase 3: CSV形式**
- スプレッドシート分析用
- データの正規化と構造化
- 数値精度の保持

**Phase 4: 画像形式**
- 既存コンポーネントの再利用
- 高品質な画像生成
- カスタマイズ可能なレイアウト

## データ構造設計

### 共通データ構造

```typescript
// src/types/export.ts

export interface ExportData {
  planInfo: PlanInfo;
  statistics: ExportStatistics;
  rawMaterials: ExportRawMaterial[];
  intermediateProducts: ExportProduct[];
  finalProducts: ExportProduct[];
  machines: ExportMachine[];
  powerConsumption: ExportPowerConsumption;
  conveyorBelts: ExportConveyorBelts;
}

export interface PlanInfo {
  name: string;
  timestamp: number;
  recipeName: string;
  targetQuantity: number;
  settings: GlobalSettings;
}

export interface ExportStatistics {
  totalMachines: number;
  totalPower: number;
  rawMaterialCount: number;
  itemCount: number;
}

export interface ExportRawMaterial {
  itemId: number;
  itemName: string;
  consumptionRate: number;
  unit: string;
}

export interface ExportProduct {
  itemId: number;
  itemName: string;
  productionRate: number;
  consumptionRate: number;
  netProduction: number;
  unit: string;
}

export interface ExportMachine {
  machineId: number;
  machineName: string;
  count: number;
  powerPerMachine: number;
  totalPower: number;
}

export interface ExportPowerConsumption {
  machines: number;
  sorters: number;
  total: number;
  breakdown: ExportMachine[];
}

export interface ExportConveyorBelts {
  inputs: number;
  outputs: number;
  total: number;
  saturation: number;
}
```

## Markdown形式エクスポート

### 出力テンプレート

```markdown
# 🏭 生産プラン: {planName}
**📅 作成日時:** {timestamp}  
**🎯 目標レシピ:** {recipeName} - {targetQuantity}/秒  
**⚙️ 設定:** {settings}

## 📊 統計サマリー
| 項目 | 値 |
|------|-----|
| 🔧 総機械数 | {totalMachines} 台 |
| ⚡ 総電力消費 | {totalPower} MW |
| 🪨 原材料数 | {rawMaterialCount} 種類 |
| 📦 アイテム数 | {itemCount} 種類 |

## 🪨 原材料
| アイテム名 | 消費量/秒 | 単位 |
|-----------|-----------|------|
{rawMaterialsTable}

## 🔄 中間製品
| アイテム名 | 生産量/秒 | 消費量/秒 | 純生産量/秒 |
|-----------|-----------|-----------|-------------|
{intermediateProductsTable}

## 🎯 最終製品
| アイテム名 | 生産量/秒 | 単位 |
|-----------|-----------|------|
{finalProductsTable}

## ⚡ 電力消費
| 機械名 | 必要数 | 単体電力 | 総電力 | 割合 |
|--------|--------|----------|--------|------|
{powerConsumptionTable}

## 🚛 ベルト要件
| 項目 | 数 |
|------|-----|
| 📥 入力ベルト | {inputBelts} |
| 📤 出力ベルト | {outputBelts} |
| 📊 総ベルト数 | {totalBelts} |
| 📈 飽和率 | {saturation}% |

---
*このプランは [DSP Calculator](https://github.com/izu-san/dsp-calc-tool) で生成されました*
```

### 実装仕様

```typescript
// src/lib/export/markdownExporter.ts

export interface MarkdownExportOptions {
  includeIcons: boolean;        // 絵文字アイコンの有無
  includeTimestamp: boolean;   // タイムスタンプの有無
  includeSettings: boolean;     // 設定情報の有無
  tableFormat: 'simple' | 'grid'; // テーブル形式
  includeFooter: boolean;       // フッターの有無
}

export function exportToMarkdown(
  calculationResult: CalculationResult,
  statistics: ProductionStatistics,
  powerBreakdown: PowerBreakdown,
  options: MarkdownExportOptions
): string {
  // 実装詳細
}
```

## CSV/Excel形式エクスポート

### シート構造

**1. Overview シート**
```csv
Metric,Value,Unit,Description
Plan Name,{planName},,プラン名
Created,{timestamp},timestamp,作成日時
Target Recipe,{recipeName},,目標レシピ
Target Quantity,{targetQuantity},items/sec,目標生産量
Total Machines,{totalMachines},units,総機械数
Total Power,{totalPower},MW,総電力消費
Raw Materials,{rawMaterialCount},types,原材料種類数
Items,{itemCount},types,アイテム種類数
Power Efficiency,{powerEfficiency},MW/unit,電力効率
```

**2. RawMaterials シート**
```csv
ItemID,ItemName,ConsumptionRate,Unit,Percentage,Source,Notes
{itemId},{itemName},{consumptionRate},items/sec,{percentage}%,{source},{notes}
```

**3. Products シート**
```csv
ItemID,ItemName,ProductionRate,ConsumptionRate,NetProduction,Unit,Type,Percentage
{itemId},{itemName},{productionRate},{consumptionRate},{netProduction},items/sec,{type},{percentage}%
```

**4. Machines シート**
```csv
MachineID,MachineName,Count,PowerPerMachine,TotalPower,Percentage,Category,Notes
{machineId},{machineName},{count},{powerPerMachine},{totalPower},{percentage}%,{category},{notes}
```

**5. Power シート**
```csv
Category,Power,Percentage,Description
Machines,{machinePower},{machinePercentage}%,機械の電力消費
Sorters,{sorterPower},{sorterPercentage}%,ソーターの電力消費
Total,{totalPower},100%,総電力消費
```

**6. Belts シート**
```csv
Type,Count,Saturation,Description
Input Belts,{inputBelts},{inputSaturation}%,入力ベルト
Output Belts,{outputBelts},{outputSaturation}%,出力ベルト
Total Belts,{totalBelts},{totalSaturation}%,総ベルト数
```

**7. Logistics シート**
```csv
Type,Count,PowerPerUnit,TotalPower,Description
Sorters,{sorterCount},{sorterPowerPerUnit},{sorterTotalPower},ソーター
Conveyor Belts,{beltCount},0,0,ベルト
Total Logistics,{totalLogistics},{logisticsPowerPerUnit},{logisticsTotalPower},総物流
```

### 実装仕様

```typescript
// src/lib/export/csvExporter.ts

export interface CSVExportOptions {
  includeOverview: boolean;
  includeRawMaterials: boolean;
  includeProducts: boolean;
  includeMachines: boolean;
  includePower: boolean;
  includeBelts: boolean;
  includeLogistics: boolean;
  decimalPlaces: number;
  separator: ',' | ';' | '\t';
  encoding: 'utf-8' | 'utf-8-bom';
}

export function exportToCSV(
  calculationResult: CalculationResult,
  statistics: ProductionStatistics,
  powerBreakdown: PowerBreakdown,
  options: CSVExportOptions
): string {
  // 実装詳細
}

// src/lib/export/excelExporter.ts

export function exportToExcel(
  calculationResult: CalculationResult,
  statistics: ProductionStatistics,
  powerBreakdown: PowerBreakdown,
  options: CSVExportOptions
): Blob {
  // xlsx ライブラリを使用した実装
}
```

## 画像形式エクスポート

### 生成対象

**1. 統計ビューのスクリーンショット**
- 統計サマリーカード
- 原材料リスト
- 中間製品リスト
- 最終製品リスト

**2. 電力グラフのスクリーンショット**
- 電力消費の円グラフ
- 機械別電力消費リスト
- 電力サマリー

**3. 建設コストビューのスクリーンショット**
- 機械リスト
- ベルト・ソーターリスト
- 採掘計算機

**4. カスタムレイアウト**
- 複数ビューの結合
- カスタムCSSスタイリング
- 高解像度対応

### 実装仕様

```typescript
// src/lib/export/imageExporter.ts

export interface ImageExportOptions {
  resolution: '1x' | '2x' | '4x';
  format: 'png' | 'jpeg' | 'webp';
  quality: number; // 0-100
  includeViews: {
    statistics: boolean;
    powerGraph: boolean;
    buildingCost: boolean;
  };
  customLayout: boolean;
  backgroundColor: string;
  padding: number;
}

export async function exportToImage(
  calculationResult: CalculationResult,
  options: ImageExportOptions
): Promise<Blob> {
  // html2canvasを使用した実装
}
```

### 技術スタック

**必要なライブラリ:**
```json
{
  "html2canvas": "^1.4.1",
  "xlsx": "^0.18.5"
}
```

## ユーザーインターフェース設計

### エクスポートダイアログの構成

```typescript
// src/components/ExportDialog/index.tsx

export interface ExportDialogProps {
  calculationResult: CalculationResult;
  statistics: ProductionStatistics;
  powerBreakdown: PowerBreakdown;
  isOpen: boolean;
  onClose: () => void;
}

// ダイアログの構成:
// 1. 形式選択タブ (Markdown/CSV/画像)
// 2. オプション設定パネル
// 3. プレビューエリア
// 4. アクションボタン (エクスポート/キャンセル)
```

### オプション設定の詳細

**Markdown形式:**
- ✅ 絵文字アイコンを含める
- ✅ タイムスタンプを含める
- ✅ 設定情報を含める
- ✅ フッターを含める
- テーブル形式: [Simple] [Grid]

**CSV形式:**
- ✅ Overview シート
- ✅ RawMaterials シート
- ✅ Products シート
- ✅ Machines シート
- ✅ Power シート
- ✅ Belts シート
- ✅ Logistics シート
- 小数点以下: [2] [4] [6] 桁
- 区切り文字: [,] [;] [Tab]

**画像形式:**
- 解像度: [1x] [2x] [4x]
- 形式: [PNG] [JPEG] [WebP]
- 品質: [スライダー 0-100]
- 含めるビュー:
  - ✅ 統計ビュー
  - ✅ 電力グラフ
  - ✅ 建設コスト
- カスタムレイアウト: [チェックボックス]

## 実装アーキテクチャ

### ディレクトリ構造

```
src/lib/export/
├── index.ts              // メインエクスポート関数
├── dataTransformer.ts    // データ変換ロジック
├── markdownExporter.ts   // Markdown形式
├── csvExporter.ts        // CSV形式
├── excelExporter.ts       // Excel形式
├── imageExporter.ts       // 画像形式
├── helpers.ts            // ヘルパー関数
├── errorHandling.ts      // エラーハンドリング
└── filenameGenerator.ts  // ファイル名生成

src/components/ExportDialog/
├── index.tsx             // エクスポートダイアログ
├── FormatSelector.tsx     // 形式選択
├── OptionsPanel.tsx       // オプション設定
├── PreviewPanel.tsx       // プレビュー機能
├── MarkdownOptions.tsx    // Markdown形式オプション
├── CSVOptions.tsx         // CSV形式オプション
└── ImageOptions.tsx       // 画像形式オプション
```

### メインエクスポート関数

```typescript
// src/lib/export/index.ts

export interface ExportOptions {
  format: 'markdown' | 'csv' | 'excel' | 'image';
  markdown?: MarkdownExportOptions;
  csv?: CSVExportOptions;
  image?: ImageExportOptions;
}

export async function exportPlan(
  calculationResult: CalculationResult,
  statistics: ProductionStatistics,
  powerBreakdown: PowerBreakdown,
  options: ExportOptions
): Promise<Blob> {
  switch (options.format) {
    case 'markdown':
      return exportToMarkdown(calculationResult, statistics, powerBreakdown, options.markdown!);
    case 'csv':
      return exportToCSV(calculationResult, statistics, powerBreakdown, options.csv!);
    case 'excel':
      return exportToExcel(calculationResult, statistics, powerBreakdown, options.csv!);
    case 'image':
      return exportToImage(calculationResult, options.image!);
    default:
      throw new Error(`Unsupported export format: ${options.format}`);
  }
}
```

## エラーハンドリング

### エラー型の定義

```typescript
// src/lib/export/errorHandling.ts

export class ExportError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ExportError';
  }
}

export class ImageExportError extends ExportError {
  constructor(message: string, code: string, details?: unknown) {
    super(message, code, details);
    this.name = 'ImageExportError';
  }
}
```

### フォールバック処理

```typescript
export async function handleExportError(
  error: unknown,
  fallbackOptions: ExportOptions
): Promise<Blob> {
  console.warn('Export failed, trying fallback options:', error);
  
  try {
    // 低品質での再試行
    const fallbackSettings = {
      ...fallbackOptions,
      image: {
        ...fallbackOptions.image,
        resolution: '1x' as const,
        quality: 70
      }
    };
    
    return await exportPlan(fallbackSettings);
  } catch (fallbackError) {
    throw new ExportError(
      'Export failed with fallback options',
      'FALLBACK_FAILED',
      { originalError: error, fallbackError }
    );
  }
}
```

## ファイル名生成

### ファイル名の規則

```typescript
// src/lib/export/filenameGenerator.ts

export function generateFilename(
  planName: string,
  format: 'markdown' | 'csv' | 'excel' | 'png' | 'jpeg' | 'webp',
  timestamp: number
): string {
  const date = new Date(timestamp);
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
  const timeStr = date.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
  
  const baseName = planName.replace(/[^a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g, '_');
  const extension = format === 'excel' ? 'xlsx' : format;
  
  return `${baseName}_${dateStr}_${timeStr}.${extension}`;
}
```

## 実装の優先順位

### Phase 1: 基盤実装
1. データ構造の定義
2. 基本的なエクスポート関数
3. エラーハンドリング
4. ファイル名生成

### Phase 2: Markdown形式
1. Markdown形式の実装
2. 基本的なUI
3. プレビュー機能
4. ユーザーテスト

### Phase 3: CSV形式
1. CSV形式の実装
2. Excel形式の実装
3. オプション設定UI
4. データ検証

### Phase 4: 画像形式
1. html2canvas統合
2. 画像生成ロジック
3. 品質最適化
4. 非同期処理

### Phase 5: UI完成
1. エクスポートダイアログ
2. オプション設定パネル
3. プレビュー機能
4. エラーハンドリング

## テスト戦略

### 単体テスト
- 各エクスポート関数のテスト
- データ変換ロジックのテスト
- エラーハンドリングのテスト

### 統合テスト
- エンドツーエンドのエクスポートテスト
- 異なるデータセットでのテスト
- パフォーマンステスト

### E2Eテスト
- ユーザーインターフェースのテスト
- ファイルダウンロードのテスト
- エラー表示のテスト

## パフォーマンス考慮事項

### メモリ使用量
- 大量データの処理最適化
- 画像生成時のメモリ効率
- ガベージコレクションの最適化

### 処理時間
- 非同期処理の活用
- Web Workersの使用
- プログレス表示

### ファイルサイズ
- 画像圧縮の最適化
- CSVデータの効率化
- 不要なデータの除外

## 将来の拡張性

### 追加形式の検討
- PDF形式のエクスポート
- JSON形式のエクスポート
- カスタムテンプレート形式

### 機能拡張
- バッチエクスポート
- スケジュールエクスポート
- クラウドストレージ連携

### パフォーマンス向上
- キャッシュ機能
- 並列処理
- ストリーミング処理

---

*この仕様書は、Dyson Sphere Program 生産チェーン計算機のエクスポート機能強化プロジェクトの詳細仕様を記載しています。*
