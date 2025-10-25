# インポート機能強化 - 詳細仕様書

## 概要

Dyson Sphere Program 生産チェーン計算機のインポート機能を強化し、以下の3つの形式でのデータ取り込みを可能にする。

- **Markdown形式**: 基本情報のみの部分復元
- **CSV形式**: 完全なプラン復元
- **Excel形式**: 完全なプラン復元（複数シート対応）

## 実装方針

### 段階的実装アプローチ

**Phase 1: CSV形式のインポート**
- 最も実装しやすい
- データ構造が明確
- 検証ロジックが単純

**Phase 2: Excel形式のインポート**
- CSV形式の拡張
- 複数シートの処理
- より詳細なメタデータ

**Phase 3: Markdown形式のインポート**
- 基本情報のみの抽出
- 部分的な復元
- ユーザーへの制限の明示

## データ構造設計

### 共通データ構造

```typescript
// src/types/import.ts

export interface ImportResult {
  success: boolean;
  plan?: SavedPlan;
  extractedData?: any;
  errors: ImportError[];
  warnings: ImportWarning[];
}

export interface ImportError {
  code: string;
  message: string;
  row?: number;
  column?: string;
}

export interface ImportWarning {
  code: string;
  message: string;
  suggestion?: string;
}

export interface ImportOptions {
  validateData: boolean;
  strictMode: boolean;
  allowPartialImport: boolean;
  autoFixErrors: boolean;
}

export interface PlanInfo {
  name: string;
  timestamp: number;
  recipeName: string;
  targetQuantity: number;
  settings?: GlobalSettings;
}
```

## Markdown形式インポート

### パース可能な情報の定義

```typescript
// src/lib/import/markdownImporter.ts

export interface MarkdownImportResult {
  success: boolean;
  plan?: Partial<SavedPlan>;
  extractedData: {
    planName?: string;
    recipeName?: string;
    targetQuantity?: number;
    timestamp?: number;
    statistics?: {
      totalMachines?: number;
      totalPower?: number;
      rawMaterialCount?: number;
    };
    rawMaterials?: Array<{
      itemName: string;
      consumptionRate: number;
    }>;
    finalProducts?: Array<{
      itemName: string;
      productionRate: number;
    }>;
  };
  errors: ImportError[];
  warnings: ImportWarning[];
}

export async function importFromMarkdown(
  file: File,
  options: MarkdownImportOptions
): Promise<MarkdownImportResult> {
  try {
    const content = await readFileContent(file);
    const markdown = parseMarkdownContent(content);
    
    // 基本情報の抽出
    const basicInfo = extractBasicInfo(markdown);
    if (!basicInfo.planName || !basicInfo.recipeName || !basicInfo.targetQuantity) {
      return {
        success: false,
        extractedData: {},
        errors: [{
          code: 'MISSING_BASIC_INFO',
          message: 'プラン名、レシピ名、または目標数量が見つかりません'
        }],
        warnings: []
      };
    }
    
    // 統計情報の抽出
    const statistics = extractStatistics(markdown);
    
    // 原材料情報の抽出
    const rawMaterials = extractRawMaterials(markdown);
    
    // 最終製品情報の抽出
    const finalProducts = extractFinalProducts(markdown);
    
    // データ検証
    const validation = validateMarkdownData({
      basicInfo,
      statistics,
      rawMaterials,
      finalProducts
    });
    
    if (!validation.isValid) {
      return {
        success: false,
        extractedData: {
          planName: basicInfo.planName,
          recipeName: basicInfo.recipeName,
          targetQuantity: basicInfo.targetQuantity,
          timestamp: basicInfo.timestamp,
          statistics,
          rawMaterials,
          finalProducts
        },
        errors: validation.errors,
        warnings: validation.warnings
      };
    }
    
    // 部分的なプランオブジェクトの構築
    const plan = buildPartialPlan({
      basicInfo,
      statistics,
      rawMaterials,
      finalProducts
    });
    
    return {
      success: true,
      plan,
      extractedData: {
        planName: basicInfo.planName,
        recipeName: basicInfo.recipeName,
        targetQuantity: basicInfo.targetQuantity,
        timestamp: basicInfo.timestamp,
        statistics,
        rawMaterials,
        finalProducts
      },
      errors: [],
      warnings: validation.warnings
    };
    
  } catch (error) {
    return {
      success: false,
      extractedData: {},
      errors: [{
        code: 'PARSE_ERROR',
        message: `Markdown解析エラー: ${error.message}`
      }],
      warnings: []
    };
  }
}
```

### 基本情報の抽出

```typescript
function extractBasicInfo(markdown: string): {
  planName?: string;
  recipeName?: string;
  targetQuantity?: number;
  timestamp?: number;
} {
  const result: any = {};
  
  // プラン名の抽出
  const planNameMatch = markdown.match(/# 🏭 生産プラン: (.+)/);
  if (planNameMatch) {
    result.planName = planNameMatch[1].trim();
  }
  
  // 目標レシピの抽出
  const recipeMatch = markdown.match(/\*\*🎯 目標レシピ:\*\* (.+) - (\d+(?:\.\d+)?)\/秒/);
  if (recipeMatch) {
    result.recipeName = recipeMatch[1].trim();
    result.targetQuantity = parseFloat(recipeMatch[2]);
  }
  
  // 作成日時の抽出
  const timestampMatch = markdown.match(/\*\*📅 作成日時:\*\* (.+)/);
  if (timestampMatch) {
    const dateStr = timestampMatch[1].trim();
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      result.timestamp = date.getTime();
    }
  }
  
  return result;
}
```

### 統計情報の抽出

```typescript
function extractStatistics(markdown: string): {
  totalMachines?: number;
  totalPower?: number;
  rawMaterialCount?: number;
} {
  const result: any = {};
  
  // 統計サマリーテーブルの抽出
  const statsTableMatch = markdown.match(/## 📊 統計サマリー\s*\n\|.*\n\|.*\n((?:\|.*\n)*)/);
  if (statsTableMatch) {
    const tableContent = statsTableMatch[1];
    
    // 総機械数の抽出
    const machinesMatch = tableContent.match(/\| 🔧 総機械数 \| ([^|]+) \|/);
    if (machinesMatch) {
      const machinesStr = machinesMatch[1].replace(/台/g, '').trim();
      result.totalMachines = parseFloat(machinesStr);
    }
    
    // 総電力消費の抽出
    const powerMatch = tableContent.match(/\| ⚡ 総電力消費 \| ([^|]+) \|/);
    if (powerMatch) {
      const powerStr = powerMatch[1].replace(/MW/g, '').trim();
      result.totalPower = parseFloat(powerStr) * 1000; // MW to kW
    }
    
    // 原材料数の抽出
    const rawMaterialsMatch = tableContent.match(/\| 🪨 原材料数 \| ([^|]+) \|/);
    if (rawMaterialsMatch) {
      const rawMaterialsStr = rawMaterialsMatch[1].replace(/種類/g, '').trim();
      result.rawMaterialCount = parseInt(rawMaterialsStr);
    }
  }
  
  return result;
}
```

### 原材料情報の抽出

```typescript
function extractRawMaterials(markdown: string): Array<{
  itemName: string;
  consumptionRate: number;
}> {
  const result: Array<{ itemName: string; consumptionRate: number }> = [];
  
  // 原材料テーブルの抽出
  const rawMaterialsMatch = markdown.match(/## 🪨 原材料\s*\n\|.*\n\|.*\n((?:\|.*\n)*)/);
  if (rawMaterialsMatch) {
    const tableContent = rawMaterialsMatch[1];
    const rows = tableContent.split('\n').filter(row => row.trim() && row.includes('|'));
    
    rows.forEach(row => {
      const columns = row.split('|').map(col => col.trim()).filter(col => col);
      if (columns.length >= 3) {
        const itemName = columns[1];
        const consumptionRate = parseFloat(columns[2].replace(/個\/秒/g, '').trim());
        
        if (itemName && !isNaN(consumptionRate)) {
          result.push({ itemName, consumptionRate });
        }
      }
    });
  }
  
  return result;
}
```

## CSV形式インポート

### CSV形式のパース仕様

```typescript
// src/lib/import/csvImporter.ts

export interface CSVImportResult {
  success: boolean;
  plan?: SavedPlan;
  extractedData: {
    planInfo: PlanInfo;
    statistics: ExportStatistics;
    rawMaterials: ExportRawMaterial[];
    products: ExportProduct[];
    machines: ExportMachine[];
    powerConsumption: ExportPowerConsumption;
    conveyorBelts: ExportConveyorBelts;
  };
  errors: ImportError[];
  warnings: ImportWarning[];
}

export async function importFromCSV(
  file: File,
  options: CSVImportOptions
): Promise<CSVImportResult> {
  try {
    const content = await readFileContent(file);
    const sheets = parseCSVContent(content);
    
    // 各シートの存在確認
    const sheetValidation = validateSheets(sheets);
    if (!sheetValidation.isValid) {
      return {
        success: false,
        extractedData: {} as any,
        errors: sheetValidation.errors,
        warnings: sheetValidation.warnings
      };
    }
    
    // Overview シートから基本情報を抽出
    const planInfo = extractPlanInfoFromOverview(sheets.Overview);
    if (!planInfo) {
      return {
        success: false,
        extractedData: {} as any,
        errors: [{
          code: 'MISSING_OVERVIEW',
          message: 'Overview シートから基本情報を抽出できませんでした'
        }],
        warnings: []
      };
    }
    
    // 各シートからデータを抽出
    const extractedData = {
      planInfo,
      statistics: extractStatisticsFromSheets(sheets),
      rawMaterials: extractRawMaterialsFromSheets(sheets),
      products: extractProductsFromSheets(sheets),
      machines: extractMachinesFromSheets(sheets),
      powerConsumption: extractPowerConsumptionFromSheets(sheets),
      conveyorBelts: extractConveyorBeltsFromSheets(sheets)
    };
    
    // データ検証
    const dataValidation = validateExtractedData(extractedData);
    if (!dataValidation.isValid) {
      return {
        success: false,
        extractedData,
        errors: dataValidation.errors,
        warnings: dataValidation.warnings
      };
    }
    
    // プランオブジェクトの構築
    const plan = buildPlanFromExtractedData(extractedData);
    
    return {
      success: true,
      plan,
      extractedData,
      errors: [],
      warnings: dataValidation.warnings
    };
    
  } catch (error) {
    return {
      success: false,
      extractedData: {} as any,
      errors: [{
        code: 'PARSE_ERROR',
        message: `CSV解析エラー: ${error.message}`
      }],
      warnings: []
    };
  }
}
```

### CSV内容のパース

```typescript
function parseCSVContent(content: string): Record<string, string[][]> {
  const sheets: Record<string, string[][]> = {};
  const lines = content.split('\n');
  let currentSheet = '';
  let currentSheetData: string[][] = [];
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // シートヘッダーの検出
    if (trimmedLine.startsWith('# ')) {
      // 前のシートを保存
      if (currentSheet && currentSheetData.length > 0) {
        sheets[currentSheet] = currentSheetData;
      }
      
      // 新しいシートの開始
      currentSheet = trimmedLine.substring(2).trim();
      currentSheetData = [];
      continue;
    }
    
    // データ行の処理
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const row = parseCSVRow(trimmedLine);
      if (row.length > 0) {
        currentSheetData.push(row);
      }
    }
  }
  
  // 最後のシートを保存
  if (currentSheet && currentSheetData.length > 0) {
    sheets[currentSheet] = currentSheetData;
  }
  
  return sheets;
}

function parseCSVRow(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}
```

### 各シートからのデータ抽出

```typescript
function extractPlanInfoFromOverview(overviewSheet: string[][]): PlanInfo | null {
  if (!overviewSheet || overviewSheet.length < 2) {
    return null;
  }
  
  const planInfo: Partial<PlanInfo> = {};
  
  // ヘッダー行をスキップしてデータ行を処理
  for (let i = 1; i < overviewSheet.length; i++) {
    const row = overviewSheet[i];
    if (row.length < 2) continue;
    
    const metric = row[0];
    const value = row[1];
    
    switch (metric) {
      case 'Plan Name':
        planInfo.name = value;
        break;
      case 'Target Recipe':
        planInfo.recipeName = value;
        break;
      case 'Target Quantity':
        planInfo.targetQuantity = parseFloat(value);
        break;
      case 'Created':
        planInfo.timestamp = new Date(value).getTime();
        break;
    }
  }
  
  // 必須フィールドの検証
  if (!planInfo.name || !planInfo.recipeName || !planInfo.targetQuantity) {
    return null;
  }
  
  return planInfo as PlanInfo;
}

function extractStatisticsFromSheets(sheets: Record<string, string[][]>): ExportStatistics {
  const statistics: Partial<ExportStatistics> = {};
  
  if (sheets.Overview) {
    for (const row of sheets.Overview) {
      if (row.length < 2) continue;
      
      const metric = row[0];
      const value = row[1];
      
      switch (metric) {
        case 'Total Machines':
          statistics.totalMachines = parseFloat(value);
          break;
        case 'Total Power':
          statistics.totalPower = parseFloat(value) * 1000; // MW to kW
          break;
        case 'Raw Materials':
          statistics.rawMaterialCount = parseInt(value);
          break;
        case 'Items':
          statistics.itemCount = parseInt(value);
          break;
      }
    }
  }
  
  return statistics as ExportStatistics;
}

function extractRawMaterialsFromSheets(sheets: Record<string, string[][]>): ExportRawMaterial[] {
  const rawMaterials: ExportRawMaterial[] = [];
  
  if (sheets.RawMaterials) {
    // ヘッダー行をスキップ
    for (let i = 1; i < sheets.RawMaterials.length; i++) {
      const row = sheets.RawMaterials[i];
      if (row.length < 3) continue;
      
      const itemId = parseInt(row[0]);
      const itemName = row[1];
      const consumptionRate = parseFloat(row[2]);
      
      if (!isNaN(itemId) && itemName && !isNaN(consumptionRate)) {
        rawMaterials.push({
          itemId,
          itemName,
          consumptionRate,
          unit: 'items/sec'
        });
      }
    }
  }
  
  return rawMaterials;
}

function extractProductsFromSheets(sheets: Record<string, string[][]>): ExportProduct[] {
  const products: ExportProduct[] = [];
  
  if (sheets.Products) {
    // ヘッダー行をスキップ
    for (let i = 1; i < sheets.Products.length; i++) {
      const row = sheets.Products[i];
      if (row.length < 6) continue;
      
      const itemId = parseInt(row[0]);
      const itemName = row[1];
      const productionRate = parseFloat(row[2]);
      const consumptionRate = parseFloat(row[3]);
      const netProduction = parseFloat(row[4]);
      
      if (!isNaN(itemId) && itemName && !isNaN(productionRate)) {
        products.push({
          itemId,
          itemName,
          productionRate,
          consumptionRate: isNaN(consumptionRate) ? 0 : consumptionRate,
          netProduction: isNaN(netProduction) ? 0 : netProduction,
          unit: 'items/sec'
        });
      }
    }
  }
  
  return products;
}

function extractMachinesFromSheets(sheets: Record<string, string[][]>): ExportMachine[] {
  const machines: ExportMachine[] = [];
  
  if (sheets.Machines) {
    // ヘッダー行をスキップ
    for (let i = 1; i < sheets.Machines.length; i++) {
      const row = sheets.Machines[i];
      if (row.length < 5) continue;
      
      const machineId = parseInt(row[0]);
      const machineName = row[1];
      const count = parseFloat(row[2]);
      const powerPerMachine = parseFloat(row[3]);
      const totalPower = parseFloat(row[4]);
      
      if (!isNaN(machineId) && machineName && !isNaN(count)) {
        machines.push({
          machineId,
          machineName,
          count,
          powerPerMachine: isNaN(powerPerMachine) ? 0 : powerPerMachine,
          totalPower: isNaN(totalPower) ? 0 : totalPower
        });
      }
    }
  }
  
  return machines;
}
```

## Excel形式インポート

### Excel形式のパース仕様

```typescript
// src/lib/import/excelImporter.ts

import * as XLSX from 'xlsx';

export async function importFromExcel(
  file: File,
  options: ExcelImportOptions
): Promise<CSVImportResult> {
  try {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    
    // ワークブックからシートを抽出
    const sheets: Record<string, string[][]> = {};
    
    workbook.SheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      sheets[sheetName] = jsonData as string[][];
    });
    
    // CSV形式と同じ処理を実行
    return await processSheets(sheets, options);
    
  } catch (error) {
    return {
      success: false,
      extractedData: {} as any,
      errors: [{
        code: 'EXCEL_PARSE_ERROR',
        message: `Excel解析エラー: ${error.message}`
      }],
      warnings: []
    };
  }
}

async function processSheets(
  sheets: Record<string, string[][]>,
  options: ExcelImportOptions
): Promise<CSVImportResult> {
  // CSV形式と同じ処理ロジックを使用
  return await importFromCSVSheets(sheets, options);
}
```

## データ検証とエラーハンドリング

### データ検証の詳細仕様

```typescript
// src/lib/import/validation.ts

export interface ValidationResult {
  isValid: boolean;
  errors: ImportError[];
  warnings: ImportWarning[];
}

export function validateExtractedData(data: any): ValidationResult {
  const errors: ImportError[] = [];
  const warnings: ImportWarning[] = [];
  
  // 基本情報の検証
  if (!data.planInfo) {
    errors.push({
      code: 'MISSING_PLAN_INFO',
      message: 'プラン情報が見つかりません'
    });
  } else {
    if (!data.planInfo.name) {
      errors.push({
        code: 'MISSING_PLAN_NAME',
        message: 'プラン名が指定されていません'
      });
    }
    
    if (!data.planInfo.recipeName) {
      errors.push({
        code: 'MISSING_RECIPE_NAME',
        message: 'レシピ名が指定されていません'
      });
    }
    
    if (!data.planInfo.targetQuantity || data.planInfo.targetQuantity <= 0) {
      errors.push({
        code: 'INVALID_TARGET_QUANTITY',
        message: '目標数量が無効です'
      });
    }
  }
  
  // 統計情報の検証
  if (data.statistics) {
    if (data.statistics.totalMachines && data.statistics.totalMachines < 0) {
      warnings.push({
        code: 'NEGATIVE_MACHINE_COUNT',
        message: '機械数が負の値です',
        suggestion: 'データを確認してください'
      });
    }
    
    if (data.statistics.totalPower && data.statistics.totalPower < 0) {
      warnings.push({
        code: 'NEGATIVE_POWER',
        message: '電力消費が負の値です',
        suggestion: 'データを確認してください'
      });
    }
  }
  
  // 原材料の検証
  if (data.rawMaterials) {
    data.rawMaterials.forEach((material: any, index: number) => {
      if (!material.itemName) {
        errors.push({
          code: 'MISSING_ITEM_NAME',
          message: `原材料 ${index + 1} のアイテム名が指定されていません`,
          row: index + 1
        });
      }
      
      if (material.consumptionRate < 0) {
        warnings.push({
          code: 'NEGATIVE_CONSUMPTION',
          message: `原材料 ${material.itemName} の消費量が負の値です`,
          suggestion: 'データを確認してください'
        });
      }
    });
  }
  
  // 機械の検証
  if (data.machines) {
    data.machines.forEach((machine: any, index: number) => {
      if (!machine.machineName) {
        errors.push({
          code: 'MISSING_MACHINE_NAME',
          message: `機械 ${index + 1} の名前が指定されていません`,
          row: index + 1
        });
      }
      
      if (machine.count < 0) {
        warnings.push({
          code: 'NEGATIVE_MACHINE_COUNT',
          message: `機械 ${machine.machineName} の数量が負の値です`,
          suggestion: 'データを確認してください'
        });
      }
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

export function validateSheets(sheets: Record<string, string[][]>): ValidationResult {
  const errors: ImportError[] = [];
  const warnings: ImportWarning[] = [];
  
  // 必須シートの存在確認
  const requiredSheets = ['Overview'];
  requiredSheets.forEach(sheetName => {
    if (!sheets[sheetName]) {
      errors.push({
        code: 'MISSING_SHEET',
        message: `${sheetName} シートが見つかりません`
      });
    }
  });
  
  // 各シートの構造検証
  Object.entries(sheets).forEach(([sheetName, sheetData]) => {
    if (sheetData.length < 2) {
      warnings.push({
        code: 'EMPTY_SHEET',
        message: `${sheetName} シートにデータがありません`,
        suggestion: 'このシートは無視されます'
      });
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}
```

## プラン構築の詳細仕様

### プランオブジェクトの構築

```typescript
// src/lib/import/planBuilder.ts

export function buildPlanFromExtractedData(data: any): SavedPlan {
  // 基本プラン情報の構築
  const plan: SavedPlan = {
    name: data.planInfo.name,
    timestamp: data.planInfo.timestamp || Date.now(),
    recipeSID: 0, // レシピ名からSIDを逆引き
    targetQuantity: data.planInfo.targetQuantity,
    settings: buildSettingsFromData(data),
    alternativeRecipes: {},
    nodeOverrides: {}
  };
  
  // レシピ名からSIDを逆引き
  const recipeSID = findRecipeSIDByName(data.planInfo.recipeName);
  if (recipeSID) {
    plan.recipeSID = recipeSID;
  } else {
    // レシピが見つからない場合の警告
    console.warn(`レシピ "${data.planInfo.recipeName}" が見つかりません`);
  }
  
  // 設定情報の復元
  plan.settings = buildSettingsFromData(data);
  
  return plan;
}

function buildSettingsFromData(data: any): GlobalSettings {
  // デフォルト設定から開始
  const settings: GlobalSettings = {
    machineRank: {
      smelter: 'arc',
      assembler: 'mk1',
      chemicalPlant: 'standard',
      matrixLab: 'standard'
    },
    proliferator: {
      type: 'none',
      mode: 'production'
    },
    conveyorBelt: {
      tier: 'mk1'
    },
    sorter: {
      tier: 'mk1'
    },
    miningSpeedBonus: 100,
    alternativeRecipes: new Map(),
    proliferatorMultiplier: { production: 1, speed: 1 }
  };
  
  // データから設定を復元（可能な範囲で）
  if (data.statistics) {
    // 統計情報から設定を推測
    if (data.statistics.totalPower > 10000) {
      // 高電力消費の場合、高効率機械を使用している可能性
      settings.machineRank.assembler = 'mk2';
    }
  }
  
  if (data.rawMaterials && data.rawMaterials.length > 0) {
    // 原材料の種類から採掘設定を推測
    const hasRareMaterials = data.rawMaterials.some((material: any) => 
      material.itemName.includes('希少') || material.itemName.includes('Rare')
    );
    
    if (hasRareMaterials) {
      settings.miningSpeedBonus = 200; // 希少資源用の採掘速度
    }
  }
  
  return settings;
}

function findRecipeSIDByName(recipeName: string): number | null {
  // ゲームデータストアからレシピを検索
  const gameData = useGameDataStore.getState().data;
  if (!gameData) return null;
  
  for (const [sid, recipe] of gameData.recipes) {
    if (recipe.name === recipeName) {
      return sid;
    }
  }
  
  return null;
}
```

## ユーザーインターフェース設計

### インポートダイアログの構成

```typescript
// src/components/ImportDialog/index.tsx

export interface ImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (plan: SavedPlan) => void;
}

export function ImportDialog({
  isOpen,
  onClose,
  onImport
}: ImportDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  
  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setImportResult(null);
  };
  
  const handleImport = async () => {
    if (!selectedFile) return;
    
    setIsImporting(true);
    try {
      const result = await importFile(selectedFile);
      setImportResult(result);
    } catch (error) {
      setImportResult({
        success: false,
        errors: [{ code: 'IMPORT_ERROR', message: error.message }],
        warnings: []
      });
    } finally {
      setIsImporting(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full">
        {/* ヘッダー */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold dark:text-white flex items-center gap-2">
            📥 プランインポート
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>
        
        {/* ファイル選択 */}
        <div className="mb-6">
          <FileSelector onFileSelect={handleFileSelect} />
        </div>
        
        {/* インポート結果 */}
        {importResult && (
          <ImportResultDisplay 
            result={importResult}
            onImport={onImport}
            onClose={onClose}
          />
        )}
        
        {/* アクションボタン */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            キャンセル
          </button>
          <button
            onClick={handleImport}
            disabled={!selectedFile || isImporting}
            className="px-4 py-2 bg-neon-blue text-white rounded hover:bg-neon-blue/80 disabled:opacity-50"
          >
            {isImporting ? 'インポート中...' : 'インポート'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

### ファイル選択コンポーネント

```typescript
// src/components/ImportDialog/FileSelector.tsx

export function FileSelector({ onFileSelect }: FileSelectorProps) {
  const [dragActive, setDragActive] = useState(false);
  
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      onFileSelect(files[0]);
    }
  };
  
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      onFileSelect(files[0]);
    }
  };
  
  return (
    <div
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
        dragActive
          ? 'border-neon-blue bg-neon-blue/10'
          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
      }`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <div className="space-y-4">
        <div className="text-4xl">📁</div>
        <div>
          <p className="text-lg font-medium dark:text-white">
            ファイルをドラッグ&ドロップ
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            または
          </p>
          <label className="cursor-pointer text-neon-blue hover:text-neon-blue/80">
            ファイルを選択
            <input
              type="file"
              accept=".csv,.xlsx,.md"
              onChange={handleFileInput}
              className="hidden"
            />
          </label>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          対応形式: CSV, Excel (.xlsx), Markdown (.md)
        </div>
      </div>
    </div>
  );
}
```

### インポート結果表示コンポーネント

```typescript
// src/components/ImportDialog/ImportResultDisplay.tsx

export function ImportResultDisplay({
  result,
  onImport,
  onClose
}: ImportResultDisplayProps) {
  if (result.success) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-green-600 dark:text-green-400">✅</span>
          <h3 className="font-medium text-green-800 dark:text-green-200">
            インポート成功
          </h3>
        </div>
        <p className="text-sm text-green-700 dark:text-green-300 mb-4">
          プラン「{result.plan?.name}」を正常にインポートしました。
        </p>
        {result.warnings.length > 0 && (
          <div className="mb-4">
            <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
              警告
            </h4>
            <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
              {result.warnings.map((warning, index) => (
                <li key={index}>• {warning.message}</li>
              ))}
            </ul>
          </div>
        )}
        <div className="flex gap-2">
          <button
            onClick={() => onImport(result.plan!)}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            プランを読み込み
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            閉じる
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-red-600 dark:text-red-400">❌</span>
        <h3 className="font-medium text-red-800 dark:text-red-200">
          インポート失敗
        </h3>
      </div>
      <div className="space-y-2">
        <h4 className="font-medium text-red-800 dark:text-red-200">
          エラー
        </h4>
        <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
          {result.errors.map((error, index) => (
            <li key={index}>• {error.message}</li>
          ))}
        </ul>
      </div>
      {result.warnings.length > 0 && (
        <div className="mt-4">
          <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
            警告
          </h4>
          <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
            {result.warnings.map((warning, index) => (
              <li key={index}>• {warning.message}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

## 実装アーキテクチャ

### ディレクトリ構造

```
src/lib/import/
├── index.ts              // メインインポート関数
├── markdownImporter.ts   // Markdown形式
├── csvImporter.ts        // CSV形式
├── excelImporter.ts      // Excel形式
├── validation.ts         // データ検証
├── planBuilder.ts        // プラン構築
├── helpers.ts            // ヘルパー関数
└── errorHandling.ts      // エラーハンドリング

src/components/ImportDialog/
├── index.tsx             // インポートダイアログ
├── FileSelector.tsx       // ファイル選択
├── ImportResultDisplay.tsx // 結果表示
└── ImportOptions.tsx      // オプション設定
```

### メインインポート関数

```typescript
// src/lib/import/index.ts

export async function importPlan(
  file: File,
  options: ImportOptions
): Promise<ImportResult> {
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  
  switch (fileExtension) {
    case 'csv':
      return await importFromCSV(file, options);
    case 'xlsx':
      return await importFromExcel(file, options);
    case 'md':
      return await importFromMarkdown(file, options);
    default:
      throw new Error(`Unsupported file format: ${fileExtension}`);
  }
}
```

## 制限事項と注意点

### Markdown形式の制限
- 完全なプラン復元は不可能
- 基本情報（プラン名、レシピ、数量）のみ
- 設定情報の復元は困難

### CSV/Excel形式の制限
- レシピ名からSIDの逆引きが必要
- 設定情報の完全復元は困難
- データ整合性の検証が必要

### 全形式共通の制限
- ゲームデータの変更による互換性問題
- バージョン間の差異
- データ検証の重要性

## 実装の優先順位

### Phase 1: CSV形式のインポート
1. CSV形式の実装
2. 基本的なUI
3. データ検証
4. ユーザーテスト

### Phase 2: Excel形式のインポート
1. Excel形式の実装
2. 複数シートの処理
3. オプション設定UI
4. データ検証の強化

### Phase 3: Markdown形式のインポート
1. Markdown形式の実装
2. 基本情報の抽出
3. 部分復元の制限明示
4. ユーザーガイダンス

### Phase 4: UI完成
1. インポートダイアログ
2. ファイル選択機能
3. 結果表示機能
4. エラーハンドリング

## テスト戦略

### 単体テスト
- 各インポート関数のテスト
- データ検証ロジックのテスト
- エラーハンドリングのテスト

### 統合テスト
- エンドツーエンドのインポートテスト
- 異なるファイル形式でのテスト
- データ整合性のテスト

### E2Eテスト
- ユーザーインターフェースのテスト
- ファイルアップロードのテスト
- エラー表示のテスト

## 画像形式インポート（実験的機能）

### 技術的可能性の検討

#### **OCR（光学文字認識）技術**

**実現可能性: 中程度**
- 統計データの数値は比較的読み取りやすい
- テーブル構造の認識が課題
- 日本語対応のOCRエンジンが必要

**技術スタック:**
```typescript
// 候補ライブラリ
import Tesseract from 'tesseract.js'; // JavaScript OCR
import { createWorker } from 'tesseract.js';

// 実装例
async function extractTextFromImage(imageFile: File): Promise<string> {
  const worker = await createWorker('jpn'); // 日本語対応
  const { data: { text } } = await worker.recognize(imageFile);
  await worker.terminate();
  return text;
}
```

#### **画像解析の課題**

**技術的制約:**
- **フォント認識**: ゲーム内フォントの認識精度
- **レイアウト解析**: テーブル構造の自動認識
- **数値抽出**: 小数点、単位の正確な認識
- **日本語処理**: アイテム名の正確な抽出

**実装の複雑さ:**
```typescript
// 理想的な処理フロー
1. 画像前処理（ノイズ除去、コントラスト調整）
2. テーブル領域の検出
3. セル単位での文字認識
4. データ構造の復元
5. 検証とエラーハンドリング
```

#### **実現可能な範囲**

**比較的容易:**
- 統計サマリーの数値（総機械数、電力消費など）
- 基本的なアイテム名
- 単純な数値データ

**困難:**
- 複雑なテーブル構造
- 小さなフォントサイズ
- 背景色とのコントラストが低い場合
- 特殊な記号や単位

### 実装アプローチ

#### **段階的実装**

```typescript
// src/lib/import/imageImporter.ts

export interface ImageImportResult {
  success: boolean;
  extractedData: {
    statistics?: {
      totalMachines?: number;
      totalPower?: number;
      rawMaterialCount?: number;
    };
    rawMaterials?: Array<{
      itemName: string;
      consumptionRate: number;
    }>;
    // その他の抽出可能なデータ
  };
  confidence: number; // 認識精度（0-100）
  errors: ImportError[];
  warnings: ImportWarning[];
}

export async function importFromImage(
  file: File,
  options: ImageImportOptions
): Promise<ImageImportResult> {
  try {
    // 1. 画像前処理
    const processedImage = await preprocessImage(file, options);
    
    // 2. OCR実行
    const extractedText = await extractTextFromImage(processedImage);
    
    // 3. データ構造の解析
    const parsedData = await parseExtractedText(extractedText);
    
    // 4. データ検証
    const validation = validateImageData(parsedData);
    
    return {
      success: validation.isValid,
      extractedData: parsedData,
      confidence: calculateConfidence(parsedData),
      errors: validation.errors,
      warnings: validation.warnings
    };
    
  } catch (error) {
    return {
      success: false,
      extractedData: {},
      confidence: 0,
      errors: [{
        code: 'IMAGE_PARSE_ERROR',
        message: `画像解析エラー: ${error.message}`
      }],
      warnings: []
    };
  }
}
```

#### **画像前処理**

```typescript
async function preprocessImage(
  file: File,
  options: ImageImportOptions
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  const img = new Image();
  
  return new Promise((resolve) => {
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      
      // 画像を描画
      ctx.drawImage(img, 0, 0);
      
      // 前処理の適用
      if (options.enhanceContrast) {
        enhanceContrast(ctx, canvas.width, canvas.height);
      }
      
      if (options.removeNoise) {
        removeNoise(ctx, canvas.width, canvas.height);
      }
      
      resolve(canvas);
    };
    
    img.src = URL.createObjectURL(file);
  });
}

function enhanceContrast(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  // コントラスト調整
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.min(255, data[i] * 1.2);     // R
    data[i + 1] = Math.min(255, data[i + 1] * 1.2); // G
    data[i + 2] = Math.min(255, data[i + 2] * 1.2); // B
  }
  
  ctx.putImageData(imageData, 0, 0);
}
```

### 実用性の評価

#### **メリット**
- スクリーンショットからの直接インポート
- 手動入力の手間を削減
- 既存の画像データの活用

#### **デメリット**
- **認識精度の問題**: 特に日本語テキスト
- **処理時間**: OCR処理に時間がかかる
- **メンテナンス**: フォント変更への対応
- **ユーザビリティ**: エラーが多発する可能性

### 現実的な実装方針

#### **Phase 1: プロトタイプ実装**
```typescript
// 基本的なOCR機能のみ
export async function importBasicStatsFromImage(
  file: File
): Promise<{
  totalMachines?: number;
  totalPower?: number;
  confidence: number;
}> {
  // 統計サマリーの数値のみを抽出
  // 高精度な認識を目指す
}
```

#### **Phase 2: 段階的拡張**
- 原材料データの抽出
- 機械データの抽出
- エラーハンドリングの強化

#### **Phase 3: 完全実装**
- 全データの抽出
- 高精度な認識
- ユーザビリティの向上

### 技術的制約と対策

#### **制約**
- **ブラウザ制約**: 大きな画像ファイルの処理
- **精度問題**: 日本語OCRの限界
- **パフォーマンス**: 処理時間の長さ

#### **対策**
```typescript
// Web Workersを使用した非同期処理
export class ImageImportWorker {
  private worker: Worker;
  
  constructor() {
    this.worker = new Worker('/workers/imageImport.worker.js');
  }
  
  async processImage(file: File): Promise<ImageImportResult> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Image processing timeout'));
      }, 30000);
      
      this.worker.onmessage = (event) => {
        clearTimeout(timeout);
        resolve(event.data);
      };
      
      this.worker.postMessage({ file });
    });
  }
}
```

### 結論

**技術的可能性: 中程度**
- 基本的な数値データの抽出は可能
- 完全なプラン復元は困難
- ユーザビリティの課題が大きい

**推奨実装方針:**
1. **プロトタイプ実装**: 統計サマリーのみ
2. **ユーザーテスト**: 実際の使用感を確認
3. **段階的拡張**: 成功した場合のみ本格実装

**現実的な判断:**
- CSV/Excel形式のインポートを優先
- 画像インポートは実験的機能として位置づけ
- ユーザーフィードバックに基づく判断

---

*この仕様書は、Dyson Sphere Program 生産チェーン計算機のインポート機能強化プロジェクトの詳細仕様を記載しています。*
