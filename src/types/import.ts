/**
 * Import data types
 * 
 * インポート機能で使用する型定義
 */

import type { SavedPlan } from './saved-plan';
import type { GlobalSettings } from './settings';
import type {
  ExportStatistics,
  ExportRawMaterial,
  ExportProduct,
  ExportMachine,
  ExportPowerConsumption,
  ExportConveyorBelts,
  ExportPowerGeneration,
} from './export';

/**
 * インポート結果
 */
export interface ImportResult {
  /** インポート成功フラグ */
  success: boolean;
  /** 抽出されたデータ */
  extractedData: ExtractedPlanInfo;
  /** エラーリスト */
  errors: ImportError[];
  /** 警告リスト */
  warnings: ImportWarning[];
  /** バージョン情報 (optional) */
  versionInfo?: {
    /** インポートされたバージョン */
    imported: string;
    /** 現在のバージョン */
    current: string;
    /** 互換性フラグ */
    compatible: boolean;
  };
}

/**
 * インポートエラー
 */
export interface ImportError {
  /** エラーの種類 */
  type: 'parse' | 'validation' | 'missing_data' | 'unsupported_version';
  /** エラーメッセージ */
  message: string;
  /** 詳細情報 (optional) */
  details?: unknown;
}

/**
 * インポート警告
 */
export interface ImportWarning {
  /** 警告の種類 */
  type: 'version_mismatch' | 'partial_data' | 'unrecognized_field';
  /** 警告メッセージ */
  message: string;
  /** 詳細情報 (optional) */
  details?: unknown;
}

/**
 * プラン情報（検証用）
 */
export interface PlanInfoForValidation {
  /** プラン名 */
  name: string;
  /** 作成日時 */
  timestamp: number;
  /** レシピのシステムID */
  recipeSID?: number;
  /** レシピ名 */
  recipeName?: string;
  /** 目標生産量 */
  targetQuantity: number;
}

/**
 * 抽出されたプラン情報
 */
export interface ExtractedPlanInfo {
  /** プラン名 */
  planName?: string;
  /** タイムスタンプ */
  timestamp?: number;
  /** レシピSID */
  recipeSID?: number;
  /** レシピ名 */
  recipeName?: string;
  /** 目標生産量 */
  targetQuantity?: number;
  /** グローバル設定 */
  settings?: Partial<GlobalSettings>;
  /** ノードオーバーライド設定 */
  nodeOverrides?: Record<string, unknown>;
  /** 発電設備設定 */
  powerGenerationSettings?: unknown;
}

/**
 * インポートオプション
 */
export interface ImportOptions {
  /** データ検証を行うか */
  validateData: boolean;
  /** 厳格モード（エラーで停止） */
  strictMode: boolean;
  /** 部分的なインポートを許可するか */
  allowPartialImport: boolean;
  /** エラーを自動修正するか */
  autoFixErrors: boolean;
  /** バージョン検証を行うか */
  checkVersion: boolean;
}

/**
 * プラン情報（インポート用）
 */
export interface ImportPlanInfo {
  /** プラン名 */
  name: string;
  /** 作成日時 */
  timestamp: number;
  /** レシピのシステムID（優先使用） */
  recipeSID?: number;
  /** レシピ名（SID見つからない場合のフォールバック） */
  recipeName: string;
  /** 目標生産量 */
  targetQuantity: number;
  /** グローバル設定 (optional) */
  settings?: GlobalSettings;
  /** 発電設備設定 (optional) */
  powerGenerationSettings?: {
    /** テンプレート名 */
    template: string;
    /** 手動選択した発電設備 */
    manualGenerator?: string;
    /** 手動選択した燃料 */
    manualFuel?: string;
    /** 増産剤設定 */
    proliferator?: {
      type: string;
      mode: string;
      speedBonus: number;
      productionBonus: number;
    };
  };
}

/**
 * Markdownインポート結果
 */
export interface MarkdownImportResult {
  /** インポート成功フラグ */
  success: boolean;
  /** 部分的に復元されたプラン (optional) */
  plan?: Partial<SavedPlan>;
  /** 抽出されたデータ */
  extractedData: {
    /** プラン名 */
    planName?: string;
    /** レシピ名 */
    recipeName?: string;
    /** レシピSID */
    recipeSID?: number;
    /** 目標生産量 */
    targetQuantity?: number;
    /** タイムスタンプ */
    timestamp?: number;
    /** 統計情報 */
    statistics?: {
      totalMachines?: number;
      totalPower?: number;
      rawMaterialCount?: number;
    };
    /** 原材料リスト */
    rawMaterials?: Array<{
      itemName: string;
      consumptionRate: number;
    }>;
    /** 最終製品リスト */
    finalProducts?: Array<{
      itemName: string;
      productionRate: number;
    }>;
    /** 発電設備情報 (optional) */
    powerGeneration?: ExportPowerGeneration;
  };
  /** エラーリスト */
  errors: ImportError[];
  /** 警告リスト */
  warnings: ImportWarning[];
}

/**
 * Markdownインポートオプション
 */
export interface MarkdownImportOptions {
  /** データ検証を行うか */
  validateData: boolean;
  /** 厳格モード */
  strictMode: boolean;
}

/**
 * CSVインポート結果
 */
export interface CSVImportResult {
  /** インポート成功フラグ */
  success: boolean;
  /** 復元されたプラン (optional) */
  plan?: SavedPlan;
  /** 抽出されたデータ */
  extractedData: {
    /** プラン情報 */
    planInfo: ImportPlanInfo;
    /** 統計情報 */
    statistics: ExportStatistics;
    /** 原材料リスト */
    rawMaterials: ExportRawMaterial[];
    /** 製品リスト */
    products: ExportProduct[];
    /** 機械リスト */
    machines: ExportMachine[];
    /** 電力消費情報 */
    powerConsumption: ExportPowerConsumption;
    /** ベルト要件情報 */
    conveyorBelts: ExportConveyorBelts;
    /** 発電設備情報 (optional) */
    powerGeneration?: ExportPowerGeneration;
  };
  /** エラーリスト */
  errors: ImportError[];
  /** 警告リスト */
  warnings: ImportWarning[];
}

/**
 * CSVインポートオプション
 */
export interface CSVImportOptions {
  /** データ検証を行うか */
  validateData: boolean;
  /** 厳格モード */
  strictMode: boolean;
  /** 部分的なインポートを許可するか */
  allowPartialImport: boolean;
  /** エラーを自動修正するか */
  autoFixErrors: boolean;
  /** バージョン検証を行うか */
  checkVersion: boolean;
}

/**
 * Excelインポートオプション
 */
export interface ExcelImportOptions extends CSVImportOptions {
  /** シート名のカスタマイズ */
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

/**
 * データ検証結果
 */
export interface ValidationResult {
  /** 検証が成功したか */
  isValid: boolean;
  /** エラーリスト */
  errors: ImportError[];
  /** 警告リスト */
  warnings: ImportWarning[];
}

