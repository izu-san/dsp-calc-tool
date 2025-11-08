/**
 * Zustand セレクタ自動生成ユーティリティ
 *
 * ストア全体を購読する代わりに、個別のプロパティを購読するセレクタを自動生成する。
 * これにより無関係な状態変更による再レンダリングを抑制できる。
 *
 * @example
 * ```ts
 * export const useMyStore = create<MyStore>()((set) => ({ ... }));
 * export const useMyStoreSelectors = createSelectors(useMyStore);
 *
 * // 使用側
 * const value = useMyStoreSelectors.use.value(); // value だけを購読
 * const actions = useMyStoreSelectors.use.actions(); // actions だけを購読
 * ```
 */

import type { StoreApi, UseBoundStore } from "zustand";

type WithSelectors<S> = S extends { getState: () => infer T }
  ? S & { use: { [K in keyof T]: () => T[K] } }
  : never;

export function createSelectors<S extends UseBoundStore<StoreApi<object>>>(
  store: S
): WithSelectors<S> {
  const storeWithSelectors = store as WithSelectors<typeof store>;
  storeWithSelectors.use = {} as WithSelectors<typeof store>["use"];

  for (const key of Object.keys(store.getState())) {
    (storeWithSelectors.use as Record<string, () => unknown>)[key] = () =>
      store(state => state[key as keyof typeof state]);
  }

  return storeWithSelectors;
}
