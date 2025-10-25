/**
 * カスタムエラークラス
 * 
 * アプリケーション全体で統一されたエラーハンドリングを提供する。
 * 各エラーには `code` と `details` を持たせることで、エラーの種類と詳細情報を明確にする。
 */

/**
 * DSP計算機のベースエラークラス
 */
export class DSPCalculatorError extends Error {
  public readonly code: string;
  public readonly details?: unknown;

  /**
   * @param message - エラーメッセージ
   * @param code - エラーコード（例: DATA_LOAD_ERROR）
   * @param details - エラーの詳細情報（オプション）
   */
  constructor(
    message: string,
    code: string,
    details?: unknown
  ) {
    super(message);
    this.name = 'DSPCalculatorError';
    this.code = code;
    this.details = details;
  }
}

/**
 * データ読み込みエラー
 * XMLファイルの読み込みやパースに失敗した場合に使用
 */
export class DataLoadError extends DSPCalculatorError {
  constructor(message: string, details?: unknown) {
    super(message, 'DATA_LOAD_ERROR', details);
    this.name = 'DataLoadError';
  }
}

/**
 * 計算エラー
 * 生産チェーン計算中にエラーが発生した場合に使用
 */
export class CalculationError extends DSPCalculatorError {
  constructor(message: string, details?: unknown) {
    super(message, 'CALCULATION_ERROR', details);
    this.name = 'CalculationError';
  }
}

/**
 * バリデーションエラー
 * ユーザー入力やデータの検証に失敗した場合に使用
 */
export class ValidationError extends DSPCalculatorError {
  constructor(message: string, details?: unknown) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

/**
 * パースエラー
 * XMLやJSONのパースに失敗した場合に使用
 */
export class ParseError extends DSPCalculatorError {
  constructor(message: string, details?: unknown) {
    super(message, 'PARSE_ERROR', details);
    this.name = 'ParseError';
  }
}

/**
 * ストレージエラー
 * localStorageの読み書きに失敗した場合に使用
 */
export class StorageError extends DSPCalculatorError {
  constructor(message: string, details?: unknown) {
    super(message, 'STORAGE_ERROR', details);
    this.name = 'StorageError';
  }
}

