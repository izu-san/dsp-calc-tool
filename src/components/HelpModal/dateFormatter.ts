/**
 * 日付フォーマットユーティリティ
 */

import i18n from "../../i18n";

/**
 * ISO 8601 形式の日付文字列を JST (UTC+9) でフォーマット
 */
export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    const locale = i18n.language || "ja";
    const isJa = locale === "ja";

    // JST (UTC+9) に変換
    const jstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);
    const jstYear = jstDate.getUTCFullYear();
    const jstMonth = jstDate.getUTCMonth() + 1;
    const jstDay = jstDate.getUTCDate();
    const jstHour = jstDate.getUTCHours();
    const jstMinute = jstDate.getUTCMinutes();

    if (isJa) {
      return `${jstYear}年${jstMonth}月${jstDay}日 ${String(jstHour).padStart(2, "0")}:${String(jstMinute).padStart(2, "0")}`;
    } else {
      return `${jstYear}-${String(jstMonth).padStart(2, "0")}-${String(jstDay).padStart(2, "0")} ${String(jstHour).padStart(2, "0")}:${String(jstMinute).padStart(2, "0")}`;
    }
  } catch {
    return dateString;
  }
}
