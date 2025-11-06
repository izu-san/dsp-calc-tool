/**
 * History Utilities - Main Export
 *
 * 履歴管理関連のユーティリティを責務ごとに分割:
 * - events.ts: 履歴イベント処理（undo/redo、状態管理）
 * - formatters.ts: 履歴説明のフォーマット（多言語対応）
 * - restoration.ts: 履歴からの状態復元
 * - recorder.ts: 履歴記録処理
 * - regenerator.ts: 履歴説明の再生成
 * - description.ts: 履歴説明生成
 * - debouncer.ts: 履歴記録のデバウンス
 */

export * from "./events";
export * from "./formatters";
export * from "./restoration";
export * from "./recorder";
export * from "./regenerator";
export * from "./description";
export * from "./debouncer";
