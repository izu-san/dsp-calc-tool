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
  version: string;  // エクスポート形式のバージョン (例: "1.0.0")
  exportDate: number;  // エクスポート日時 (Unix timestamp)
  planInfo: PlanInfo;
  statistics: ExportStatistics;
  rawMaterials: ExportRawMaterial[];
  intermediateProducts: ExportProduct[];
  finalProducts: ExportProduct[];
  machines: ExportMachine[];
  powerConsumption: ExportPowerConsumption;
  conveyorBelts: ExportConveyorBelts;
  powerGeneration?: ExportPowerGeneration;
}

export interface PlanInfo {
  name: string;
  timestamp: number;
  recipeSID: number;  // レシピのシステムID（インポート時の逆引き用）
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

## Markdown形式エクスポート

### 出力テンプレート

```markdown
# 🏭 生産プラン: {planName}
**📅 作成日時:** {timestamp}  
**📦 エクスポートバージョン:** {version}  
**🎯 目標レシピ:** {recipeName} (SID: {recipeSID}) - {targetQuantity}/秒  
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

## ⚡ 発電設備
**📋 テンプレート:** {template}
**🔧 発電設備:** {generatorName} (手動選択: {manual})
**⛽ 燃料:** {fuelName} (手動選択: {manual})
**💊 増産剤:** {proliferatorType} ({proliferatorMode}モード)

| 発電設備 | 必要台数 | 単体出力 | 総出力 | 燃料 | 燃料消費量/秒 |
|---------|---------|---------|--------|------|-------------|
{powerGenerationTable}

**⚡ 総発電設備:** {totalGenerators} 台
**⛽ 総燃料消費:**
{totalFuelConsumption}

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

### CSV形式の構造

**注意**: CSV形式は単一シートのみサポート。複数シート構造が必要な場合はExcel形式を使用してください。

**CSV形式 (単一ファイル)**:
```csv
# Metadata
Version,1.0.0
ExportDate,2025-10-27T12:00:00Z

# Plan Info
PlanName,高級プロセッサー生産
RecipeSID,123
RecipeName,高級プロセッサー
TargetQuantity,10.0

# Statistics
TotalMachines,45
TotalPower,12.5
RawMaterialCount,3
ItemCount,15

# RawMaterials
ItemID,ItemName,ConsumptionRate,Unit
1001,鉄鉱石,15.5,items/sec
1002,銅鉱石,10.0,items/sec

# Products
ItemID,ItemName,ProductionRate,ConsumptionRate,NetProduction,Unit
2001,鉄インゴット,15.5,10.0,5.5,items/sec

# Machines
MachineID,MachineName,Count,PowerPerMachine,TotalPower
3001,製錬設備 Mk.II,10,360,3600

# PowerConsumption
Category,Power,Percentage
Machines,10500,85.5
Sorters,1780,14.5
Total,12280,100

# ConveyorBelts
Type,Count,Saturation
InputBelts,15,75.5
OutputBelts,10,60.0
TotalBelts,25,67.8

# PowerGeneration (optional)
RequiredPower,Template,ManualGenerator,ManualFuel,ProliferatorType,ProliferatorMode
12.28,Thermal,火力発電所,石炭,Mk.III,production

# PowerGenerators (optional)
GeneratorID,GeneratorName,GeneratorType,Count,BaseOutput,TotalOutput,FuelID,FuelName,FuelConsumptionRate
4001,火力発電所,Thermal,3,2.16,6.48,1003,石炭,0.5
```

### Excel形式の構造

**Excel形式では複数シートをサポート:**

**1. Overview シート**
```
Metric,Value,Unit,Description
Version,1.0.0,,エクスポートバージョン
Export Date,2025-10-27T12:00:00Z,timestamp,エクスポート日時
Plan Name,高級プロセッサー生産,,プラン名
Recipe SID,123,,レシピシステムID
Recipe Name,高級プロセッサー,,レシピ名
Target Quantity,10.0,items/sec,目標生産量
Total Machines,45,units,総機械数
Total Power,12.5,MW,総電力消費
Raw Materials,3,types,原材料種類数
Items,15,types,アイテム種類数
```

**2. RawMaterials シート**
```
ItemID,ItemName,ConsumptionRate,Unit
1001,鉄鉱石,15.5,items/sec
1002,銅鉱石,10.0,items/sec
```

**3. Products シート**
```
ItemID,ItemName,ProductionRate,ConsumptionRate,NetProduction,Unit
2001,鉄インゴット,15.5,10.0,5.5,items/sec
```

**4. Machines シート**
```
MachineID,MachineName,Count,PowerPerMachine,TotalPower
3001,製錬設備 Mk.II,10,360,3600
```

**5. PowerConsumption シート**
```
Category,Power,Percentage
Machines,10500,85.5
Sorters,1780,14.5
Total,12280,100
```

**6. ConveyorBelts シート**
```
Type,Count,Saturation
InputBelts,15,75.5
OutputBelts,10,60.0
TotalBelts,25,67.8
```

**7. PowerGeneration シート** (発電設備がある場合)
```
RequiredPower,Template,ManualGenerator,ManualFuel,ProliferatorType,ProliferatorMode,SpeedBonus,ProductionBonus
12.28,Thermal,火力発電所,石炭,Mk.III,production,25,0
```

**8. PowerGenerators シート** (発電設備がある場合)
```
GeneratorID,GeneratorName,GeneratorType,Count,BaseOutput,ActualOutputPerUnit,TotalOutput,FuelID,FuelName,FuelConsumptionRate,ActualFuelEnergy
4001,火力発電所,Thermal,3,2.16,2.16,6.48,1003,石炭,0.5,2700
```

### 実装仕様

```typescript
// src/lib/export/csvExporter.ts

export interface CSVExportOptions {
  includeRawMaterials: boolean;
  includeProducts: boolean;
  includeMachines: boolean;
  includePowerConsumption: boolean;
  includeConveyorBelts: boolean;
  includePowerGeneration: boolean;
  decimalPlaces: number;
  separator: ',' | ';' | '\t';
  encoding: 'utf-8' | 'utf-8-bom';
}

export function exportToCSV(
  exportData: ExportData,
  options: CSVExportOptions
): string {
  // CSV形式（単一シート）の実装
  // コメント区切りで各セクションを表現
}

// src/lib/export/excelExporter.ts

export interface ExcelExportOptions extends CSVExportOptions {
  sheetNames?: {
    overview?: string;
    rawMaterials?: string;
    products?: string;
    machines?: string;
    powerConsumption?: string;
    conveyorBelts?: string;
    powerGeneration?: string;
    powerGenerators?: string;
  };
}

export async function exportToExcel(
  exportData: ExportData,
  options: ExcelExportOptions
): Promise<Blob> {
  // ❌ 静的インポート（避ける）
  // import * as XLSX from 'xlsx';
  
  // ✅ 動的インポート（推奨）
  const XLSX = await import('xlsx');
  
  // Excel形式（複数シート）の実装
  const workbook = XLSX.utils.book_new();
  
  // 各シートを追加
  // ...
  
  // Blobとして返す
  const wbout = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
  return new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
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

**4. 発電設備ビューのスクリーンショット**
- 発電設備リスト
- 燃料消費量
- 発電設備設定

**5. カスタムレイアウト**
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
    powerGeneration: boolean;
  };
  customLayout: boolean;
  backgroundColor: string;
  padding: number;
}

export async function exportToImage(
  exportData: ExportData,
  options: ImageExportOptions
): Promise<Blob> {
  // ❌ 静的インポート（避ける）
  // import html2canvas from 'html2canvas';
  
  // ✅ 動的インポート（推奨）
  const html2canvas = (await import('html2canvas')).default;
  
  // html2canvasを使用した実装
  // 必要なコンポーネントを一時的にDOMに追加してキャプチャ
  const element = document.createElement('div');
  // ...レンダリング処理...
  
  const canvas = await html2canvas(element, {
    scale: options.resolution === '4x' ? 4 : options.resolution === '2x' ? 2 : 1,
    backgroundColor: options.backgroundColor,
  });
  
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => resolve(blob!),
      `image/${options.format}`,
      options.quality / 100
    );
  });
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

**重要**: 両ライブラリは動的インポートで使用し、bundle sizeを最適化する。

## ユーザーインターフェース設計

### UI統合方針

**既存のヘッダー「保存/読み込み」機能に統合:**

```typescript
// src/components/Layout/Header.tsx の拡張

// 既存:
// - 「保存」ボタン → LocalStorage
// - 「読み込み」ボタン → LocalStorage

// 変更後:
// - 「保存」ボタン → ドロップダウンメニュー
//   - LocalStorage (既存) ✓
//   - Markdown形式
//   - CSV形式
//   - Excel形式
//   - 画像形式
// - 「読み込み」ボタン → ファイル選択ダイアログ
//   - LocalStorage (既存) ✓
//   - ファイルからインポート（Markdown/CSV/Excel）
```

### エクスポートダイアログの構成

```typescript
// src/components/ExportDialog/index.tsx

export interface ExportDialogProps {
  exportData: ExportData;
  isOpen: boolean;
  onClose: () => void;
}

// ダイアログの構成:
// 1. 形式選択タブ (Markdown/CSV/Excel/画像)
// 2. オプション設定パネル
// 3. プレビューエリア（Phase 2以降）
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
- ✅ 原材料を含める
- ✅ 製品を含める
- ✅ 機械を含める
- ✅ 電力消費を含める
- ✅ ベルト要件を含める
- ✅ 発電設備を含める
- 小数点以下: [2] [4] [6] 桁
- 区切り文字: [,] [;] [Tab]
- エンコーディング: [UTF-8] [UTF-8 BOM]

**Excel形式:**
- CSV形式と同じオプション
- 複数シートで構造化
- シート名のカスタマイズ可能

**画像形式:**
- 解像度: [1x] [2x] [4x]
- 形式: [PNG] [JPEG] [WebP]
- 品質: [スライダー 0-100]
- 含めるビュー:
  - ✅ 統計ビュー
  - ✅ 電力グラフ
  - ✅ 建設コスト
  - ✅ 発電設備
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
  powerGeneration: PowerGenerationResult,
  options: ExportOptions
): Promise<Blob> {
  switch (options.format) {
    case 'markdown':
      return exportToMarkdown(calculationResult, statistics, powerBreakdown, powerGeneration, options.markdown!);
    case 'csv':
      return exportToCSV(calculationResult, statistics, powerBreakdown, powerGeneration, options.csv!);
    case 'excel':
      return exportToExcel(calculationResult, statistics, powerBreakdown, powerGeneration, options.csv!);
    case 'image':
      return exportToImage(calculationResult, powerGeneration, options.image!);
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

### Phase 1: 基盤とMarkdown（ライブラリ不要）
1. **データ構造の定義**
   - `src/types/export.ts` を作成
   - バージョン管理定数の定義
   - エラーハンドリングの実装
2. **Markdown形式の実装**
   - `src/lib/export/markdownExporter.ts` を実装
   - データ変換ロジックを実装
   - ファイル名生成を実装
3. **UI基盤の実装**
   - Header に保存ドロップダウンメニューを追加
   - ExportDialog の基本構造を実装
   - Markdownオプション設定パネルを実装

### Phase 2: CSV形式（ライブラリ不要）
1. **CSV形式の実装**
   - `src/lib/export/csvExporter.ts` を実装（単一シート構造）
   - コメント区切りのセクション生成
2. **プレビュー機能の追加**
   - Markdownプレビュー
   - CSVテーブルプレビュー
3. **統合テスト**
   - Markdown/CSV形式のテスト
   - ユーザーフィードバック収集

### Phase 3: Excelエクスポート（`xlsx` 動的ロード）
1. **Excel形式の実装**
   - `npm install xlsx` を実行
   - `src/lib/export/excelExporter.ts` を実装（複数シート対応）
   - 動的インポートで実装
2. **Excelオプション設定UI**
   - シート名カスタマイズ
3. **バージョン検証ロジックの強化**
   - `src/constants/exportVersion.ts` を実装
   - バージョン互換性チェック

### Phase 4: 画像エクスポート（`html2canvas` 動的ロード）
1. **画像形式の実装**
   - `npm install html2canvas` を実行
   - `src/lib/export/imageExporter.ts` を実装
   - 動的インポートで実装
2. **カスタムレイアウト機能**
   - 複数ビューの結合
   - 高解像度対応
3. **品質最適化**
   - 画像圧縮
   - メモリ使用量の最適化

### Phase 5: UI完成と最適化
1. **エクスポートダイアログの完成**
   - 全形式のオプション設定UI
   - プレビュー機能の完成
   - エラーハンドリングの強化
2. **パフォーマンス最適化**
   - 非同期処理の最適化
   - プログレス表示
3. **E2Eテストの追加**
   - 全形式のエクスポートテスト
   - カバレッジ目標: 85%以上

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

### 既存機能との統合
- **既存の `planExport.ts` (JSON形式) の統合**
  - 現在: LocalStorageに保存
  - 統合後: 保存ドロップダウンの「LocalStorage」オプションとして統合
  - 互換性: 既存のJSONデータ構造を維持
- **既存の `urlShare.ts` (URL共有) の保持**
  - 現在: URLパラメータでプラン共有
  - 今後: エクスポート機能とは独立して保持
  - 用途: 簡易的な共有（軽量データのみ）

### 追加形式の検討
- **PDF形式のエクスポート**
  - 印刷用の高品質レポート
  - jsPDFライブラリの使用を検討
- **JSONエクスポート/インポート**
  - 完全なプラン復元（APIバックアップ用）
  - 既存の`planExport.ts`との統合
- **カスタムテンプレート形式**
  - ユーザー定義のMarkdownテンプレート
  - コミュニティでの共有

### 機能拡張
- **バッチエクスポート**
  - 複数のプランを一度にエクスポート
  - ZIP形式でまとめてダウンロード
- **自動バックアップ**
  - 定期的な自動保存
  - バージョン履歴管理
- **クラウドストレージ連携**
  - Google Drive / Dropbox連携
  - プランの同期機能

### パフォーマンス向上
- **キャッシュ機能**
  - エクスポートデータのメモ化
  - 頻繁なエクスポート時の高速化
- **並列処理**
  - Web Workersでの非同期エクスポート
  - UIのブロッキング回避
- **ストリーミング処理**
  - 大規模プランの段階的エクスポート
  - メモリ使用量の最適化

---

*この仕様書は、Dyson Sphere Program 生産チェーン計算機のエクスポート機能強化プロジェクトの詳細仕様を記載しています。*
