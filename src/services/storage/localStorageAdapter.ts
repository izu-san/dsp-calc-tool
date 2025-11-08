/**
 * localStorage アダプタ
 *
 * Zustand の persist middleware で使用するカスタムストレージ実装。
 * シリアライズ・デシリアライズ処理を集約し、テスト時はインメモリ実装に差し替え可能。
 */

import type { Result } from "../../lib/calculator/result";
import { logger } from "../../utils/logger";
import type { GlobalSettings } from "../../types";
import {
  serializeSettings,
  deserializeSettings,
  trySerializeSettings,
  tryDeserializeSettings,
} from "../../utils/storageSerializer";

export interface StorageAdapter {
  getItem: (name: string) => string | null;
  setItem: (name: string, value: string) => void;
  removeItem: (name: string) => void;
}

export interface PersistedState<T> {
  state: T;
  version?: number;
}

/**
 * localStorage を使用した永続化アダプタ
 */
export function createLocalStorageAdapter<T extends { settings?: GlobalSettings }>(options?: {
  deserialize?: (data: unknown) => Result<T>;
  serialize?: (state: T) => unknown;
  useResultTypes?: boolean; // trySerializeSettings / tryDeserializeSettings を使用するか
}): StorageAdapter {
  const customDeserialize = options?.deserialize;
  const customSerialize = options?.serialize;
  const useResultTypes = options?.useResultTypes ?? true; // デフォルトでResult型を使用

  return {
    getItem: (name: string) => {
      if (typeof window === "undefined" || !window.localStorage) {
        return null;
      }

      try {
        const str = localStorage.getItem(name);
        if (!str) return null;

        const parsed = JSON.parse(str) as { state: unknown; version?: number };

        // カスタムデシリアライザがある場合
        if (customDeserialize && parsed.state) {
          const result = customDeserialize(parsed.state);
          if (!result.ok) {
            logger.warn(`Failed to deserialize ${name}:`, result.error);
            return null;
          }
          return JSON.stringify({ state: result.value, version: parsed.version });
        }

        // settings フィールドを持つ場合は自動でデシリアライズ
        if (parsed.state && typeof parsed.state === "object" && "settings" in parsed.state) {
          const stateObj = parsed.state as { settings?: unknown };
          if (stateObj.settings) {
            if (useResultTypes) {
              // Result型を使用したデシリアライズ
              const result = tryDeserializeSettings(stateObj.settings);
              if (!result.ok) {
                logger.warn(`Failed to deserialize settings in ${name}:`, result.error);
                return null;
              }
              return JSON.stringify({
                state: { ...stateObj, settings: result.value },
                version: parsed.version,
              });
            } else {
              // 従来の null チェック方式
              const deserializedSettings = deserializeSettings(stateObj.settings);
              if (deserializedSettings) {
                return JSON.stringify({
                  state: { ...stateObj, settings: deserializedSettings },
                  version: parsed.version,
                });
              }
            }
          }
        }

        return str;
      } catch (error) {
        logger.error(`Failed to read from localStorage (${name}):`, error);
        return null;
      }
    },

    setItem: (name: string, value: string) => {
      if (typeof window === "undefined" || !window.localStorage) {
        return;
      }

      try {
        const parsed = JSON.parse(value) as PersistedState<T>;

        // カスタムシリアライザがある場合
        if (customSerialize) {
          const serialized = customSerialize(parsed.state);
          localStorage.setItem(
            name,
            JSON.stringify({ state: serialized, version: parsed.version })
          );
          return;
        }

        // settings フィールドを持つ場合は自動でシリアライズ
        if (parsed.state && typeof parsed.state === "object" && "settings" in parsed.state) {
          const stateObj = parsed.state as { settings?: GlobalSettings };
          if (stateObj.settings) {
            if (useResultTypes) {
              // Result型を使用したシリアライズ
              const result = trySerializeSettings(stateObj.settings);
              if (!result.ok) {
                logger.error(`Failed to serialize settings in ${name}:`, result.error);
                return;
              }
              localStorage.setItem(
                name,
                JSON.stringify({
                  state: { ...stateObj, settings: result.value },
                  version: parsed.version,
                })
              );
            } else {
              // 従来のシリアライズ方式
              const serialized = serializeSettings(stateObj.settings);
              localStorage.setItem(
                name,
                JSON.stringify({
                  state: { ...stateObj, settings: serialized },
                  version: parsed.version,
                })
              );
            }
            return;
          }
        }

        localStorage.setItem(name, value);
      } catch (error) {
        logger.error(`Failed to write to localStorage (${name}):`, error);
      }
    },

    removeItem: (name: string) => {
      if (typeof window === "undefined" || !window.localStorage) {
        return;
      }

      try {
        localStorage.removeItem(name);
      } catch (error) {
        logger.error(`Failed to remove from localStorage (${name}):`, error);
      }
    },
  };
}

/**
 * テスト用インメモリストレージ
 */
export function createInMemoryStorageAdapter(): StorageAdapter {
  const storage = new Map<string, string>();

  return {
    getItem: (name: string) => storage.get(name) ?? null,
    setItem: (name: string, value: string) => {
      storage.set(name, value);
    },
    removeItem: (name: string) => {
      storage.delete(name);
    },
  };
}
