/**
 * Custom Settings Template Types
 *
 * ユーザー定義テンプレート機能の型定義
 */

import type { GlobalSettings } from "./index";

/**
 * カスタムテンプレートのメタデータ
 */
export interface CustomSettingsTemplateMeta {
  /** UUID v4（crypto.randomUUID() で生成） */
  id: string;
  /** テンプレート名（1〜40文字、重複不可） */
  name: string;
  /** メモ（0〜120文字、オプション） */
  note?: string;
  /** 作成日時（Unix timestamp） */
  createdAt: number;
  /** 更新日時（Unix timestamp） */
  updatedAt: number;
}

/**
 * カスタムテンプレート
 */
export interface CustomSettingsTemplate {
  /** メタデータ */
  meta: CustomSettingsTemplateMeta;
  /** 設定値 */
  settings: GlobalSettings;
}

/**
 * カスタムテンプレートの状態（ストア用）
 */
export interface CustomSettingsTemplateState {
  /** テンプレートの辞書（id -> template） */
  templates: Record<string, CustomSettingsTemplate>;
}

/**
 * カスタムテンプレート ID の型（型安全のため）
 * シリアライズ時は `custom:<uuid>` 形式の文字列として保存
 */
export type CustomTemplateId = `custom:${string}`;

/**
 * カスタムテンプレート ID かどうかを判定する型ガード
 */
export function isCustomTemplateId(value: string): value is CustomTemplateId {
  return value.startsWith("custom:");
}

/**
 * カスタムテンプレート ID から UUID を抽出
 */
export function extractCustomTemplateId(id: CustomTemplateId): string {
  return id.replace(/^custom:/, "");
}

/**
 * UUID からカスタムテンプレート ID を生成
 */
export function createCustomTemplateId(uuid: string): CustomTemplateId {
  return `custom:${uuid}` as CustomTemplateId;
}
