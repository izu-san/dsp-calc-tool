/**
 * エラーハンドラーユーティリティ
 *
 * 統一されたエラーハンドリングロジックを提供する。
 * 標準的な try-catch パターンで使用するヘルパー関数群。
 */

import { logger } from "./logger";
import { DSPCalculatorError } from "./errors";

/**
 * エラーを処理してユーザー向けメッセージを返す
 *
 * @param error - 処理するエラー
 * @param context - エラーのコンテキスト（どこでエラーが発生したか）
 * @returns ユーザー向けエラーメッセージ
 *
 * @example
 * ```ts
 * try {
 *   await loadGameData();
 * } catch (error) {
 *   const message = handleError(error, 'Failed to load game data');
 *   set({ error: message });
 * }
 * ```
 */
export function handleError(error: unknown, context?: string): string {
  // カスタムエラーの場合
  if (error instanceof DSPCalculatorError) {
    logger.error(`${context || "Error"}: ${error.message}`, error);
    return error.message;
  }

  // 標準Errorの場合
  if (error instanceof Error) {
    logger.error(`${context || "Error"}: ${error.message}`, error);
    return error.message;
  }

  // その他の場合（文字列、number、オブジェクトなど）
  const message = `Unknown error: ${String(error)}`;
  logger.error(context || "Error", new Error(message));
  return message;
}

/**
 * エラーが特定の型かどうかをチェックする型ガード
 *
 * @param error - チェックするエラー
 * @param errorType - チェックする型のコンストラクタ
 * @returns errorが指定された型のインスタンスかどうか
 *
 * @example
 * ```ts
 * if (isErrorType(error, DataLoadError)) {
 *   // DataLoadError固有の処理
 * }
 * ```
 */
export function isErrorType<T extends DSPCalculatorError>(
  error: unknown,
  errorType: new (...args: unknown[]) => T
): error is T {
  return error instanceof errorType;
}

/**
 * エラーメッセージを安全に取得する
 *
 * @param error - エラーオブジェクト
 * @param fallback - エラーからメッセージを取得できない場合のフォールバック
 * @returns エラーメッセージ
 */
export function getErrorMessage(error: unknown, fallback = "An unknown error occurred"): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return fallback;
}
