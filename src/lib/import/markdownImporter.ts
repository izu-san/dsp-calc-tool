/**
 * Markdown importer
 * 
 * Markdown 形式のファイルをパースして ImportResult を返す
 */

import type { ImportResult, ExtractedPlanInfo, ImportError, ImportWarning } from '../../types/import';

/**
 * Markdown 形式のテキストをパースする
 * 
 * @param markdown - Markdown テキスト
 * @returns パース結果
 */
export function importFromMarkdown(
  markdown: string
): ImportResult {
  const extractedData: ExtractedPlanInfo = {};
  const errors: ImportError[] = [];
  const warnings: ImportWarning[] = [];
  
  try {
    // プラン名を抽出
    const planName = extractPlanName(markdown);
    if (planName) {
      extractedData.planName = planName;
    }
    
    // レシピSIDを抽出
    const recipeSID = extractRecipeSID(markdown);
    if (recipeSID !== null) {
      extractedData.recipeSID = recipeSID;
    } else {
      errors.push({
        type: 'missing_data',
        message: 'Recipe SID not found in Markdown.',
      });
    }
    
    // レシピ名を抽出
    const recipeName = extractRecipeName(markdown);
    if (recipeName) {
      extractedData.recipeName = recipeName;
    }
    
    // 目標生産量を抽出
    const targetQuantity = extractTargetQuantity(markdown);
    if (targetQuantity !== null) {
      extractedData.targetQuantity = targetQuantity;
    } else {
      warnings.push({
        type: 'partial_data',
        message: 'Target Quantity not found, defaulting to 1.',
      });
      extractedData.targetQuantity = 1;
    }
    
    // エクスポート日時を抽出
    const exportDate = extractExportDate(markdown);
    if (exportDate) {
      extractedData.timestamp = exportDate;
    }
    
    return {
      success: errors.length === 0,
      extractedData,
      errors,
      warnings,
    };
  } catch (error) {
    errors.push({
      type: 'parse',
      message: error instanceof Error ? error.message : 'Unknown parse error',
    });
    return {
      success: false,
      extractedData,
      errors,
      warnings,
    };
  }
}

/**
 * プラン名を抽出する
 */
function extractPlanName(markdown: string): string | null {
  // "# Plan Name" 形式から抽出
  const match = markdown.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : null;
}

/**
 * レシピSIDを抽出する
 */
function extractRecipeSID(markdown: string): number | null {
  // "**Recipe:** Recipe Name (SID: 123)" 形式から抽出
  const match = markdown.match(/\*\*Recipe:\*\*\s*.*?\(SID:\s*(\d+)\)/i);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * レシピ名を抽出する
 */
function extractRecipeName(markdown: string): string | null {
  // "**Recipe:** Recipe Name (SID: 123)" 形式から抽出
  const match = markdown.match(/\*\*Recipe:\*\*\s*(.+?)\s*\(SID:/i);
  return match ? match[1].trim() : null;
}

/**
 * 目標生産量を抽出する
 */
function extractTargetQuantity(markdown: string): number | null {
  // "**Target Quantity:** 10/min" 形式から抽出
  const match = markdown.match(/\*\*Target Quantity:\*\*\s*([\d.]+)\/min/i);
  return match ? parseFloat(match[1]) : null;
}

/**
 * エクスポート日時を抽出する
 */
function extractExportDate(markdown: string): number | null {
  // "**Export Date:** 2025-01-15T12:34:56Z" 形式から抽出
  const match = markdown.match(/\*\*Export Date:\*\*\s*(.+?)(?:\n|$)/i);
  if (match) {
    const date = new Date(match[1].trim());
    return isNaN(date.getTime()) ? null : date.getTime();
  }
  return null;
}

