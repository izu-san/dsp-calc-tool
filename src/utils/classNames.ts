import clsx, { type ClassValue } from "clsx";

/**
 * Tailwind CSS のクラス名を結合するためのユーティリティ関数
 *
 * @param inputs - クラス名、オブジェクト、配列など
 * @returns 結合されたクラス名文字列
 *
 * @example
 * ```ts
 * cn('px-4', 'py-2', { 'bg-blue': true, 'text-white': false })
 * // => 'px-4 py-2 bg-blue'
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
