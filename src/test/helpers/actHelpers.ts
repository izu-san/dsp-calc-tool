/**
 * act() ヘルパー関数
 * 非同期状態更新を適切にラップし、警告を削減
 */

import { act } from "react";
import { waitFor } from "@testing-library/react";

/**
 * 非同期状態更新を適切にラップするヘルパー関数
 * @param callback 実行するコールバック関数
 */
export const actAsync = async (callback: () => void | Promise<void>) => {
  await act(async () => {
    await callback();
  });
};

/**
 * イベント発火と状態更新を適切にラップするヘルパー関数
 * @param eventCallback イベント発火のコールバック
 * @param assertionCallback アサーションのコールバック
 */
export const actAndWaitFor = async (eventCallback: () => void, assertionCallback: () => void) => {
  await act(async () => {
    eventCallback();
  });
  await waitFor(assertionCallback);
};

/**
 * 複数の非同期操作を順次実行するヘルパー関数
 * @param operations 実行する操作の配列
 */
export const actSequence = async (operations: (() => void | Promise<void>)[]) => {
  for (const operation of operations) {
    await actAsync(operation);
  }
};

/**
 * タイムアウト付きの非同期状態更新
 * @param callback 実行するコールバック関数
 * @param timeout タイムアウト時間（ミリ秒）
 */
export const actWithTimeout = async (callback: () => void | Promise<void>, timeout = 1000) => {
  await act(async () => {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Timeout")), timeout);
    });

    const operationPromise = Promise.resolve(callback());

    await Promise.race([operationPromise, timeoutPromise]);
  });
};

/**
 * 状態更新の完了を待つヘルパー関数
 * @param condition 完了条件
 * @param timeout タイムアウト時間（ミリ秒）
 */
export const waitForStateUpdate = async (condition: () => boolean, timeout = 1000) => {
  await act(async () => {
    await waitFor(condition, { timeout });
  });
};

/**
 * モック関数の呼び出しを待つヘルパー関数
 * @param mockFunction モック関数
 * @param timeout タイムアウト時間（ミリ秒）
 */
export const waitForMockCall = async (mockFunction: any, timeout = 1000) => {
  await act(async () => {
    await waitFor(
      () => {
        expect(mockFunction).toHaveBeenCalled();
      },
      { timeout }
    );
  });
};

/**
 * 非同期状態更新のデバッグ用ヘルパー
 * @param callback 実行するコールバック関数
 * @param label デバッグラベル
 */
export const actWithDebug = async (callback: () => void | Promise<void>, label = "act") => {
  console.log(`[DEBUG] Starting ${label}`);

  await act(async () => {
    try {
      await callback();
      console.log(`[DEBUG] Completed ${label}`);
    } catch (error) {
      console.error(`[DEBUG] Error in ${label}:`, error);
      throw error;
    }
  });
};

/**
 * 複数の状態更新をバッチ処理するヘルパー関数
 * @param updates 状態更新の配列
 */
export const actBatch = async (updates: (() => void | Promise<void>)[]) => {
  await act(async () => {
    await Promise.all(updates.map(update => Promise.resolve(update())));
  });
};

/**
 * 条件付きの状態更新
 * @param condition 実行条件
 * @param callback 実行するコールバック関数
 */
export const actIf = async (condition: boolean, callback: () => void | Promise<void>) => {
  if (condition) {
    await actAsync(callback);
  }
};

/**
 * リトライ機能付きの状態更新
 * @param callback 実行するコールバック関数
 * @param maxRetries 最大リトライ回数
 * @param delay リトライ間隔（ミリ秒）
 */
export const actWithRetry = async (
  callback: () => void | Promise<void>,
  maxRetries = 3,
  delay = 100
) => {
  let retries = 0;

  while (retries < maxRetries) {
    try {
      await actAsync(callback);
      return;
    } catch (error) {
      retries++;
      if (retries >= maxRetries) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};
