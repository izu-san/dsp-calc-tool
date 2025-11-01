/**
 * Main import function
 *
 * ファイル形式に応じて適切なインポーターを呼び出す
 */

import type { CSVImportResult, ImportOptions, ImportError } from "../../types/import";
import { importFromCSV } from "./csvImporter";
import { importFromExcel } from "./excelImporter";

/**
 * ファイルからプランをインポートする
 * @param file インポートするファイル
 * @param options インポートオプション
 * @returns インポート結果
 */
export async function importPlan(
  file: File,
  options: ImportOptions = {
    validateData: true,
    strictMode: false,
    allowPartialImport: true,
    autoFixErrors: true,
    checkVersion: true,
  }
): Promise<CSVImportResult | { success: boolean; errors: ImportError[] }> {
  const fileExtension = file.name.split(".").pop()?.toLowerCase();

  switch (fileExtension) {
    case "csv":
      try {
        const csvText = await file.text();
        return importFromCSV(csvText, options);
      } catch (error) {
        return {
          success: false,
          errors: [
            {
              type: "parse",
              message: error instanceof Error ? error.message : "Failed to read CSV file",
            },
          ],
        };
      }

    case "xlsx":
      try {
        return await importFromExcel(file, options);
      } catch (error) {
        return {
          success: false,
          errors: [
            {
              type: "parse",
              message: error instanceof Error ? error.message : "Failed to read Excel file",
            },
          ],
        };
      }

    case "md":
    case "markdown":
      // Markdown インポートは別の処理フローで処理されるため、ここではエラーを返す
      return {
        success: false,
        errors: [
          {
            type: "parse",
            message: "Markdown import should use importFromMarkdown directly",
          },
        ],
      };

    default:
      return {
        success: false,
        errors: [
          {
            type: "parse",
            message: `Unsupported file format: ${fileExtension || "unknown"}`,
          },
        ],
      };
  }
}
