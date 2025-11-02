/**
 * エクスポートファイル名を生成する
 * @param planName プラン名
 * @param format 拡張子 (例: 'json', 'md', 'csv', 'xlsx', 'png')
 * @returns 生成されたファイル名
 */
export function generateExportFilename(planName: string, format: string): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");

  // Remove only invalid filename characters (Windows: < > : " / \ | ? *)
  // Keep Unicode characters (Japanese, etc.) as modern browsers support them
  const sanitizedPlanName = planName
    .replace(/[<>:"/\\|?*]/g, "") // Remove invalid chars
    .replace(/\s+/g, "_") // Replace spaces with underscores
    .replace(/\.+$/, ""); // Remove trailing dots

  // If sanitized plan name is empty, use timestamp-based name
  if (!sanitizedPlanName || sanitizedPlanName.trim() === "") {
    return `Plan_${year}${month}${day}_${hours}${minutes}.${format}`;
  }

  return `${sanitizedPlanName}_${year}${month}${day}_${hours}${minutes}.${format}`;
}
