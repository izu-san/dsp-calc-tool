import { execSync } from "child_process";
import fs from "fs";

/**
 * RECIPE_SIDS.mdを生成または確認
 */
export async function ensureRecipeSidsGenerated(mdPath: string): Promise<void> {
  if (fs.existsSync(mdPath)) {
    return;
  }

  console.log("RECIPE_SIDS.md not found, generating...");

  try {
    execSync("pnpm run generate:recipe-sids", {
      cwd: process.cwd(),
      stdio: "inherit",
    });
  } catch (error) {
    throw new Error(
      `Failed to generate RECIPE_SIDS.md: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  // 生成後も存在しない場合はエラー
  if (!fs.existsSync(mdPath)) {
    throw new Error("RECIPE_SIDS.md was not generated successfully");
  }
}

/**
 * RECIPE_SIDS.mdからSIDリストを抽出
 */
export function extractSidsFromMarkdown(mdContent: string): {
  items: string[];
  buildings: string[];
} {
  const sids: string[] = [];

  for (const line of mdContent.split(/\r?\n/)) {
    // テーブルの行は `| 1101 | 鉄インゴット | Iron Ingot |` のようになっている想定
    const match = line.match(/^\|\s*(\d{3,4})\s*\|/);
    if (match) {
      sids.push(match[1]);
    }
  }

  if (sids.length === 0) {
    throw new Error("No SIDs found in RECIPE_SIDS.md");
  }

  return {
    items: sids.filter(sid => sid.startsWith("1")),
    buildings: sids.filter(sid => sid.startsWith("2")),
  };
}
