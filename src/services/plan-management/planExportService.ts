/**
 * Plan Export Service
 * Handles exporting plans to various formats
 */

import { exportToCSV } from "../../lib/export/csvExporter";
import { transformToExportData } from "../../lib/export/dataTransformer";
import { exportToExcel } from "../../lib/export/excelExporter";
import { generateExportFilename } from "../../lib/export/filenameGenerator";
import { exportMultipleViews, exportToImage } from "../../lib/export/imageExporter";
import { exportToMarkdown } from "../../lib/export/markdownExporter";
import type {
  CalculationResult,
  GlobalSettings,
  Recipe,
  GameTemplate,
  PowerGeneratorType,
  ProliferatorConfig,
} from "../../types";
import type { ImageExportOptions } from "../../types/export";
import { createLogger } from "../../utils/logger";
import type { ExportResult } from "./types";

const logger = createLogger("PlanExportService");

export interface PlanExportParams {
  calculationResult: CalculationResult;
  selectedRecipe: Recipe;
  targetQuantity: number;
  settings: GlobalSettings;
  planName: string;
  powerGenerationSettings: {
    template: GameTemplate;
    manualGenerator: PowerGeneratorType | null;
    manualFuel: string | null;
    powerFuelProliferator: ProliferatorConfig;
  };
  items: Map<number, { name: string }>;
}

export interface PlanImageExportParams extends PlanExportParams {
  options: ImageExportOptions;
}

/**
 * Download a blob as a file
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export plan to JSON format
 */
export async function exportPlanToJSON(params: PlanExportParams): Promise<ExportResult> {
  try {
    const exportData = transformToExportData(
      params.calculationResult,
      params.selectedRecipe,
      params.targetQuantity,
      params.settings,
      params.planName,
      Date.now(),
      params.powerGenerationSettings,
      { items: params.items }
    );

    const filename = generateExportFilename(params.planName, "json");
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json;charset=utf-8",
    });

    downloadBlob(blob, filename);
    return { success: true };
  } catch (error) {
    logger.error("Failed to export plan to JSON", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Export plan to Markdown format
 */
export async function exportPlanToMarkdown(params: PlanExportParams): Promise<ExportResult> {
  try {
    const exportData = transformToExportData(
      params.calculationResult,
      params.selectedRecipe,
      params.targetQuantity,
      params.settings,
      params.planName,
      Date.now(),
      params.powerGenerationSettings,
      { items: params.items }
    );

    const markdown = exportToMarkdown(exportData);
    const filename = generateExportFilename(params.planName, "md");
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });

    downloadBlob(blob, filename);
    return { success: true };
  } catch (error) {
    logger.error("Failed to export plan to Markdown", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Export plan to CSV format
 */
export async function exportPlanToCSV(params: PlanExportParams): Promise<ExportResult> {
  try {
    const exportData = transformToExportData(
      params.calculationResult,
      params.selectedRecipe,
      params.targetQuantity,
      params.settings,
      params.planName,
      Date.now(),
      params.powerGenerationSettings,
      { items: params.items }
    );

    const csv = exportToCSV(exportData);
    const filename = generateExportFilename(params.planName, "csv");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });

    downloadBlob(blob, filename);
    return { success: true };
  } catch (error) {
    logger.error("Failed to export plan to CSV", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Export plan to Excel format
 */
export async function exportPlanToExcel(params: PlanExportParams): Promise<ExportResult> {
  try {
    const exportData = transformToExportData(
      params.calculationResult,
      params.selectedRecipe,
      params.targetQuantity,
      params.settings,
      params.planName,
      Date.now(),
      params.powerGenerationSettings,
      { items: params.items }
    );

    const blob = await exportToExcel(exportData);
    const filename = generateExportFilename(params.planName, "xlsx");

    downloadBlob(blob, filename);
    return { success: true };
  } catch (error) {
    logger.error("Failed to export plan to Excel", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Export plan to image format
 */
export async function exportPlanToImage(params: PlanImageExportParams): Promise<ExportResult> {
  try {
    const selectors: string[] = [];

    // Add selectors for each view based on options
    if (params.options.includeViews.productionTree) {
      selectors.push("#production-tree-view");
    }
    if (params.options.includeViews.statistics) {
      selectors.push("#statistics-view");
    }
    if (params.options.includeViews.powerGraph) {
      selectors.push("#power-graph-view");
    }
    if (params.options.includeViews.buildingCost) {
      selectors.push("#building-cost-view");
    }
    if (params.options.includeViews.powerGeneration) {
      selectors.push("#power-generation-view");
    }

    // Filter to only visible selectors
    const visibleSelectors = selectors.filter(selector => {
      const element = document.querySelector(selector);
      return element !== null && (element as HTMLElement).offsetParent !== null;
    });

    if (visibleSelectors.length === 0) {
      return {
        success: false,
        error:
          "表示されているビューがありません。生産チェーン、統計、建設コスト、または発電設備のタブを開いてから画像エクスポートしてください。",
      };
    }

    // Export image(s)
    let blob: Blob;
    if (visibleSelectors.length === 1) {
      blob = await exportToImage(visibleSelectors[0], params.options);
    } else {
      blob = await exportMultipleViews(visibleSelectors, params.options);
    }

    const ext = params.options.format;
    const filename = generateExportFilename(params.planName, ext);

    downloadBlob(blob, filename);
    return { success: true };
  } catch (error) {
    logger.error("Failed to export plan to image", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Export plan to specified format
 */
export async function exportPlan(
  format: "json" | "markdown" | "csv" | "excel",
  params: PlanExportParams
): Promise<ExportResult> {
  switch (format) {
    case "json":
      return exportPlanToJSON(params);
    case "markdown":
      return exportPlanToMarkdown(params);
    case "csv":
      return exportPlanToCSV(params);
    case "excel":
      return exportPlanToExcel(params);
    default:
      return {
        success: false,
        error: `Unsupported format: ${format}`,
      };
  }
}
