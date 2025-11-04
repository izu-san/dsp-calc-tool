import { useEffect, useState } from "react";

/**
 * 値をデバウンスするカスタムフック
 *
 * 入力値が指定された遅延時間内に変更されなくなるまで、
 * 最終的な値の反映を遅延させます。
 * これにより、高頻度で発生するイベント（検索入力など）の
 * パフォーマンスを改善できます。
 *
 * @param value - デバウンスする値
 * @param delay - デバウンス遅延時間（ミリ秒）
 * @returns デバウンスされた値
 *
 * @example
 * ```tsx
 * const [searchQuery, setSearchQuery] = useState('');
 * const debouncedSearchQuery = useDebounce(searchQuery, 300);
 *
 * // debouncedSearchQuery は searchQuery が 300ms 変更されなくなるまで更新されない
 * useEffect(() => {
 *   // 重い処理をここで実行
 *   performExpensiveSearch(debouncedSearchQuery);
 * }, [debouncedSearchQuery]);
 * ```
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // 値が変更されたらタイマーをセット
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // クリーンアップ: 次の effect 実行前または unmount 時にタイマーをクリア
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
