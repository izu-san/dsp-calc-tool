/**
 * Plan Import Service
 * Handles importing plans from various formats
 */

import { importPlan } from "../../lib/import";
import {
  buildSavedPlanFromExportData,
  parseExportDataFromJSON,
} from "../../lib/import/jsonImporter";
import { importFromMarkdown } from "../../lib/import/markdownImporter";
import { buildPlanFromImport } from "../../lib/import/planBuilder";
import { validatePlanInfo } from "../../lib/import/validation";
import type { GameData, GlobalSettings, SavedPlan } from "../../types";
import type { ImportResult } from "./types";
import { createLogger } from "../../utils/logger";

const logger = createLogger("PlanImportService");

export interface PlanImportParams {
  file: File;
  gameData: GameData;
  currentSettings: GlobalSettings;
}

/**
 * Import plan from JSON file
 */
export async function importPlanFromJSON(
  params: PlanImportParams
): Promise<ImportResult & { plan?: SavedPlan }> {
  try {
    const text = await params.file.text();
    const exportData = parseExportDataFromJSON(text);
    const plan = buildSavedPlanFromExportData(exportData, params.gameData, params.currentSettings);

    return {
      success: true,
      plan,
    };
  } catch (error) {
    logger.error("Failed to import plan from JSON", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Import plan from Markdown file
 */
export async function importPlanFromMarkdown(
  params: PlanImportParams
): Promise<ImportResult & { plan?: SavedPlan }> {
  try {
    const text = await params.file.text();
    const importResult = importFromMarkdown(text);

    if (!importResult.success) {
      const errors = importResult.errors.map(e => e.message).join("\n");
      return {
        success: false,
        error: errors,
      };
    }

    // Build plan info from extracted data
    const planInfo = {
      name:
        importResult.extractedData.planName || params.file.name.replace(/\.(md|markdown)$/i, ""),
      timestamp: importResult.extractedData.timestamp || Date.now(),
      recipeSID: importResult.extractedData.recipeSID || 0,
      recipeName: importResult.extractedData.recipeName || "",
      targetQuantity: importResult.extractedData.targetQuantity || 1,
    };

    // Validate plan info
    const validation = validatePlanInfo(planInfo, params.gameData);
    if (!validation.isValid) {
      const errors = validation.errors.map(e => e.message).join("\n");
      return {
        success: false,
        error: errors,
      };
    }

    // Build SavedPlan
    const plan = buildPlanFromImport(planInfo, params.gameData, params.currentSettings);
    if (!plan) {
      return {
        success: false,
        error: "Failed to build plan from import",
      };
    }

    // Log warnings if any
    if (validation.warnings.length > 0) {
      const warnings = validation.warnings.map(w => w.message).join("\n");
      logger.warn(`Import warnings:\n${warnings}`);
    }

    return {
      success: true,
      plan,
    };
  } catch (error) {
    logger.error("Failed to import plan from Markdown", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Import plan from CSV or Excel file
 */
export async function importPlanFromCSVOrExcel(
  params: PlanImportParams
): Promise<ImportResult & { plan?: SavedPlan }> {
  try {
    const importResult = await importPlan(params.file, {
      validateData: true,
      strictMode: false,
      allowPartialImport: true,
      autoFixErrors: true,
      checkVersion: true,
    });

    if (!importResult.success) {
      const errors =
        "errors" in importResult
          ? importResult.errors.map(e => e.message).join("\n")
          : "Unknown import error";
      return {
        success: false,
        error: errors,
      };
    }

    if (!("extractedData" in importResult)) {
      return {
        success: false,
        error: "Invalid import result format",
      };
    }

    // Log errors as warnings (partial import allowed)
    if (importResult.errors.length > 0) {
      const errors = importResult.errors.map(e => e.message).join("\n");
      logger.warn(`Import errors (continuing anyway):\n${errors}`);
    }

    // Validate plan info
    const planInfo = {
      name: importResult.extractedData.planInfo.name,
      timestamp: importResult.extractedData.planInfo.timestamp,
      recipeSID: importResult.extractedData.planInfo.recipeSID,
      recipeName: importResult.extractedData.planInfo.recipeName,
      targetQuantity: importResult.extractedData.planInfo.targetQuantity,
    };

    const validation = validatePlanInfo(planInfo, params.gameData);
    if (!validation.isValid) {
      const errors = validation.errors.map(e => e.message).join("\n");
      return {
        success: false,
        error: errors,
      };
    }

    // Build SavedPlan
    const plan = buildPlanFromImport(planInfo, params.gameData, params.currentSettings);
    if (!plan) {
      return {
        success: false,
        error: "Failed to build plan from import",
      };
    }

    // Log warnings if any
    if (importResult.warnings.length > 0 || validation.warnings.length > 0) {
      const warnings = [
        ...importResult.warnings.map(w => w.message),
        ...validation.warnings.map(w => w.message),
      ].join("\n");
      logger.warn(`Import warnings:\n${warnings}`);
    }

    return {
      success: true,
      plan,
    };
  } catch (error) {
    logger.error("Failed to import plan from CSV/Excel", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Import plan from file based on file extension
 */
export async function importPlanFromFile(
  params: PlanImportParams
): Promise<ImportResult & { plan?: SavedPlan }> {
  const fileExtension = params.file.name.split(".").pop()?.toLowerCase();

  switch (fileExtension) {
    case "json":
      return importPlanFromJSON(params);
    case "md":
    case "markdown":
      return importPlanFromMarkdown(params);
    case "csv":
    case "xlsx":
      return importPlanFromCSVOrExcel(params);
    default:
      return {
        success: false,
        error: `Unsupported file format: ${fileExtension || "unknown"}`,
      };
  }
}
