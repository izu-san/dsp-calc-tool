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
  extractedData?: {
    version?: string;  // エクスポート形式のバージョン
    exportDate?: number;  // エクスポート日時
    planInfo: PlanInfo;
    statistics: ExportStatistics;
    rawMaterials: ExportRawMaterial[];
    products: ExportProduct[];
    machines: ExportMachine[];
    powerConsumption: ExportPowerConsumption;
    conveyorBelts: ExportConveyorBelts;
    powerGeneration?: ExportPowerGeneration;
  };
  errors: ImportError[];
  warnings: ImportWarning[];
  versionInfo?: {
    imported: string;
    current: string;
    compatible: boolean;
  };
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
  checkVersion: boolean;  // バージョン検証を行うか
}

export interface PlanInfo {
  name: string;
  timestamp: number;
  recipeSID?: number;  // レシピのシステムID（優先使用）
  recipeName: string;  // レシピ名（SID見つからない場合のフォールバック）
  targetQuantity: number;
  settings?: GlobalSettings;
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
    powerGeneration?: ExportPowerGeneration;
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
    
    // 発電設備情報の抽出
    const powerGeneration = extractPowerGeneration(markdown);
    
    // データ検証
    const validation = validateMarkdownData({
      basicInfo,
      statistics,
      rawMaterials,
      finalProducts,
      powerGeneration
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
          finalProducts,
          powerGeneration
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
      finalProducts,
      powerGeneration
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
        finalProducts,
        powerGeneration
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

function extractPowerGeneration(markdown: string): ExportPowerGeneration | undefined {
  const result: Partial<ExportPowerGeneration> = {};
  
  // 発電設備セクションの抽出
  const powerGenerationMatch = markdown.match(/## ⚡ 発電設備\s*\n((?:.*\n)*?)(?=##|$)/);
  if (!powerGenerationMatch) {
    return undefined;
  }
  
  const sectionContent = powerGenerationMatch[1];
  
  // テンプレートの抽出
  const templateMatch = sectionContent.match(/\*\*📋 テンプレート:\*\* (.+)/);
  if (templateMatch) {
    result.template = templateMatch[1].trim();
  }
  
  // 発電設備の抽出
  const generatorMatch = sectionContent.match(/\*\*🔧 発電設備:\*\* (.+?) \(手動選択: (.+?)\)/);
  if (generatorMatch) {
    result.manualGenerator = generatorMatch[2].trim() === 'Yes' ? generatorMatch[1].trim() : undefined;
  }
  
  // 燃料の抽出
  const fuelMatch = sectionContent.match(/\*\*⛽ 燃料:\*\* (.+?) \(手動選択: (.+?)\)/);
  if (fuelMatch) {
    result.manualFuel = fuelMatch[2].trim() === 'Yes' ? fuelMatch[1].trim() : undefined;
  }
  
  // 増産剤の抽出
  const proliferatorMatch = sectionContent.match(/\*\*💊 増産剤:\*\* (.+?) \((.+?)モード\)/);
  if (proliferatorMatch) {
    result.proliferatorSettings = {
      type: proliferatorMatch[1].trim(),
      mode: proliferatorMatch[2].trim(),
      speedBonus: 0, // デフォルト値
      productionBonus: 0 // デフォルト値
    };
  }
  
  // 発電設備テーブルの抽出
  const tableMatch = sectionContent.match(/\| 発電設備 \| 必要台数 \| 単体出力 \| 総出力 \| 燃料 \| 燃料消費量\/秒 \|\s*\n\|.*\n((?:\|.*\n)*)/);
  if (tableMatch) {
    const tableContent = tableMatch[1];
    const rows = tableContent.split('\n').filter(row => row.trim() && row.includes('|'));
    
    result.generators = [];
    rows.forEach(row => {
      const columns = row.split('|').map(col => col.trim()).filter(col => col);
      if (columns.length >= 6) {
        const generatorName = columns[1];
        const count = parseFloat(columns[2]);
        const baseOutput = parseFloat(columns[3]);
        const totalOutput = parseFloat(columns[4]);
        const fuelName = columns[5] || undefined;
        const fuelConsumptionRate = parseFloat(columns[6]) || undefined;
        
        if (generatorName && !isNaN(count) && !isNaN(baseOutput) && !isNaN(totalOutput)) {
          result.generators!.push({
            generatorId: 0, // デフォルト値
            generatorName,
            generatorType: '', // デフォルト値
            count,
            baseOutput,
            actualOutputPerUnit: baseOutput,
            totalOutput,
            fuelName,
            fuelConsumptionRate
          });
        }
      }
    });
  }
  
  // 総発電設備数の抽出
  const totalGeneratorsMatch = sectionContent.match(/\*\*⚡ 総発電設備:\*\* (\d+) 台/);
  if (totalGeneratorsMatch) {
    result.totalGenerators = parseInt(totalGeneratorsMatch[1]);
  }
  
  // 総燃料消費の抽出
  const fuelConsumptionMatch = sectionContent.match(/\*\*⛽ 総燃料消費:\*\*\s*\n((?:.*\n)*?)(?=\*\*|$)/);
  if (fuelConsumptionMatch) {
    const fuelContent = fuelConsumptionMatch[1];
    result.totalFuelConsumption = [];
    
    const fuelLines = fuelContent.split('\n').filter(line => line.trim());
    fuelLines.forEach(line => {
      const fuelMatch = line.match(/(.+?):\s*(.+)/);
      if (fuelMatch) {
        const fuelName = fuelMatch[1].trim();
        const consumptionRate = parseFloat(fuelMatch[2].trim());
        
        if (!isNaN(consumptionRate)) {
          result.totalFuelConsumption!.push({
            fuelId: 0, // デフォルト値
            fuelName,
            consumptionRate
          });
        }
      }
    });
  }
  
  return result as ExportPowerGeneration;
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
      conveyorBelts: extractConveyorBeltsFromSheets(sheets),
      powerGeneration: extractPowerGenerationFromSheets(sheets)
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

**CSV形式は単一ファイル構造**: コメント行（`#`で始まる）でセクションを区切る

```typescript
function parseCSVContent(content: string): Record<string, string[][]> {
  const sections: Record<string, string[][]> = {};
  const lines = content.split('\n');
  let currentSection = '';
  let currentSectionData: string[][] = [];
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // 空行やコメントをスキップ
    if (!trimmedLine || trimmedLine.startsWith('//')) {
      continue;
    }
    
    // セクションヘッダーの検出 (# SectionName)
    if (trimmedLine.startsWith('# ')) {
      // 前のセクションを保存
      if (currentSection && currentSectionData.length > 0) {
        sections[currentSection] = currentSectionData;
      }
      
      // 新しいセクションの開始
      currentSection = trimmedLine.substring(2).trim();
      currentSectionData = [];
      continue;
    }
    
    // データ行の処理
    const row = parseCSVRow(trimmedLine);
    if (row.length > 0) {
      currentSectionData.push(row);
    }
  }
  
  // 最後のセクションを保存
  if (currentSection && currentSectionData.length > 0) {
    sections[currentSection] = currentSectionData;
  }
  
  return sections;
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

function extractPowerGenerationFromSheets(sheets: Record<string, string[][]>): ExportPowerGeneration | undefined {
  if (!sheets.PowerGeneration || !sheets.PowerGenerators) {
    return undefined;
  }
  
  const powerGenerationSheet = sheets.PowerGeneration;
  const powerGeneratorsSheet = sheets.PowerGenerators;
  
  if (powerGenerationSheet.length < 2) {
    return undefined;
  }
  
  const result: Partial<ExportPowerGeneration> = {};
  
  // PowerGeneration シートから基本情報を抽出
  const headerRow = powerGenerationSheet[0];
  const dataRow = powerGenerationSheet[1];
  
  for (let i = 0; i < headerRow.length && i < dataRow.length; i++) {
    const header = headerRow[i];
    const value = dataRow[i];
    
    switch (header) {
      case 'RequiredPower':
        result.requiredPower = parseFloat(value);
        break;
      case 'Template':
        result.template = value;
        break;
      case 'ManualGenerator':
        result.manualGenerator = value || undefined;
        break;
      case 'ManualFuel':
        result.manualFuel = value || undefined;
        break;
      case 'ProliferatorType':
        if (value && !result.proliferatorSettings) {
          result.proliferatorSettings = {
            type: value,
            mode: '',
            speedBonus: 0,
            productionBonus: 0
          };
        }
        break;
      case 'ProliferatorMode':
        if (result.proliferatorSettings) {
          result.proliferatorSettings.mode = value;
        }
        break;
      case 'ProliferatorSpeedBonus':
        if (result.proliferatorSettings) {
          result.proliferatorSettings.speedBonus = parseFloat(value) || 0;
        }
        break;
      case 'ProliferatorProductionBonus':
        if (result.proliferatorSettings) {
          result.proliferatorSettings.productionBonus = parseFloat(value) || 0;
        }
        break;
    }
  }
  
  // PowerGenerators シートから発電設備情報を抽出
  if (powerGeneratorsSheet.length > 1) {
    const generatorsHeader = powerGeneratorsSheet[0];
    result.generators = [];
    
    for (let i = 1; i < powerGeneratorsSheet.length; i++) {
      const row = powerGeneratorsSheet[i];
      if (row.length < generatorsHeader.length) continue;
      
      const generator: any = {};
      
      for (let j = 0; j < generatorsHeader.length && j < row.length; j++) {
        const header = generatorsHeader[j];
        const value = row[j];
        
        switch (header) {
          case 'GeneratorID':
            generator.generatorId = parseInt(value) || 0;
            break;
          case 'GeneratorName':
            generator.generatorName = value;
            break;
          case 'GeneratorType':
            generator.generatorType = value;
            break;
          case 'Count':
            generator.count = parseFloat(value) || 0;
            break;
          case 'BaseOutput':
            generator.baseOutput = parseFloat(value) || 0;
            break;
          case 'ActualOutputPerUnit':
            generator.actualOutputPerUnit = parseFloat(value) || 0;
            break;
          case 'TotalOutput':
            generator.totalOutput = parseFloat(value) || 0;
            break;
          case 'FuelID':
            generator.fuelId = parseInt(value) || undefined;
            break;
          case 'FuelName':
            generator.fuelName = value || undefined;
            break;
          case 'FuelConsumptionRate':
            generator.fuelConsumptionRate = parseFloat(value) || undefined;
            break;
          case 'ActualFuelEnergy':
            generator.actualFuelEnergy = parseFloat(value) || undefined;
            break;
        }
      }
      
      if (generator.generatorName && generator.count > 0) {
        result.generators.push(generator);
      }
    }
  }
  
  // 総発電設備数を計算
  if (result.generators) {
    result.totalGenerators = result.generators.reduce((sum, gen) => sum + gen.count, 0);
  }
  
  // 総燃料消費を計算
  if (result.generators) {
    const fuelConsumptionMap = new Map<number, number>();
    
    result.generators.forEach(gen => {
      if (gen.fuelId && gen.fuelConsumptionRate) {
        const current = fuelConsumptionMap.get(gen.fuelId) || 0;
        fuelConsumptionMap.set(gen.fuelId, current + gen.fuelConsumptionRate);
      }
    });
    
    result.totalFuelConsumption = Array.from(fuelConsumptionMap.entries()).map(([fuelId, rate]) => ({
      fuelId,
      fuelName: '', // デフォルト値
      consumptionRate: rate
    }));
  }
  
  return result as ExportPowerGeneration;
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
    nodeOverrides: {},
    powerGenerationSettings: data.powerGeneration ? {
      template: data.powerGeneration.template,
      manualGenerator: data.powerGeneration.manualGenerator,
      manualFuel: data.powerGeneration.manualFuel,
      proliferator: data.powerGeneration.proliferatorSettings
    } : undefined
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

function findRecipeSID(recipeSID?: number, recipeName?: string): number | null {
  const gameData = useGameDataStore.getState().data;
  if (!gameData) return null;
  
  // 1. SIDが指定されていれば優先使用
  if (recipeSID !== undefined) {
    if (gameData.recipes.has(recipeSID)) {
      return recipeSID;
    }
    console.warn(`Recipe SID ${recipeSID} not found, falling back to name search`);
  }
  
  // 2. SIDが見つからない場合は名前で検索
  if (recipeName) {
    for (const [sid, recipe] of gameData.recipes) {
      if (recipe.name === recipeName) {
        console.info(`Recipe found by name: "${recipeName}" -> SID ${sid}`);
        return sid;
      }
    }
    console.warn(`Recipe not found by name: "${recipeName}"`);
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

## 将来の拡張性

### 画像形式インポート（実験的機能）

**現在のステータス**: 今回の実装には含めず、将来の拡張として残す

**技術的可能性**: 中程度
- OCR（Tesseract.js）による文字認識
- 統計サマリーの数値抽出
- 基本的なアイテム名の抽出

**主な課題**:
- 認識精度の問題（特に日本語テキスト）
- 処理時間の長さ
- テーブル構造の自動認識
- ユーザビリティの課題

**推奨実装方針**（将来実装する場合）:
1. プロトタイプ実装（統計サマリーのみ）
2. ユーザーテスト
3. フィードバックに基づく段階的拡張

詳細は別途検討。

### バージョン互換性の将来対応

**現在のバージョン**: 1.0.0

**将来のバージョンアップ時の対応**:
- マイナーバージョンアップ: 後方互換性あり
- メジャーバージョンアップ: マイグレーション処理が必要
- バージョン情報はエクスポートデータに含める

**マイグレーション処理の方針**:
```typescript
export function migrateData(
  data: ExportData,
  fromVersion: string,
  toVersion: string
): ExportData {
  // バージョン間のデータ変換処理
  // 例: 1.0.0 → 2.0.0 の変換
}
```

---

*この仕様書は、Dyson Sphere Program 生産チェーン計算機のインポート機能強化プロジェクトの詳細仕様を記載しています。*
