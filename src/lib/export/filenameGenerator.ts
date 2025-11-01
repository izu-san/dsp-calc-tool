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

  const sanitizedPlanName = planName.replace(/[^a-zA-Z0-9_ -]/g, "").replace(/ /g, "_");

  return `${sanitizedPlanName}_${year}${month}${day}_${hours}${minutes}.${format}`;
}
