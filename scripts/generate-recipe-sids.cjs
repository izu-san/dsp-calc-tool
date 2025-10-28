#!/usr/bin/env node

/**
 * レシピのSIDとレシピ名（日本語・英語）のテーブルをMarkdown形式で生成するスクリプト
 *
 * 使用方法:
 * node scripts/generate-recipe-sids.cjs
 *
 * 出力先: docs/testing/RECIPE_SIDS.md
 */

const fs = require("fs");
const path = require("path");
const { XMLParser } = require("fast-xml-parser");

// XMLファイルのパス
const RECIPES_JA_PATH = path.join(__dirname, "../public/data/Recipes/Recipes_ja.xml");
const RECIPES_EN_PATH = path.join(__dirname, "../public/data/Recipes/Recipes_en.xml");
const OUTPUT_PATH = path.join(__dirname, "../docs/testing/RECIPE_SIDS.md");

/**
 * XMLファイルをパースしてレシピデータを抽出
 * @param {string} filePath - XMLファイルのパス
 * @returns {Array<{sid: string, name: string}>} レシピデータの配列
 */
function parseRecipesXml(filePath) {
  try {
    const xmlContent = fs.readFileSync(filePath, "utf8");
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      textNodeName: "#text",
    });

    const jsonData = parser.parse(xmlContent);
    const recipes = [];

    // ArrayOfRecipe.Recipe の配列を処理
    const recipeArray = jsonData.ArrayOfRecipe?.Recipe;
    if (Array.isArray(recipeArray)) {
      recipeArray.forEach(recipe => {
        if (recipe.SID && recipe.name) {
          recipes.push({
            sid: recipe.SID.toString(),
            name: recipe.name.toString(),
          });
        }
      });
    } else if (recipeArray && typeof recipeArray === "object") {
      // 単一のRecipeの場合
      if (recipeArray.SID && recipeArray.name) {
        recipes.push({
          sid: recipeArray.SID.toString(),
          name: recipeArray.name.toString(),
        });
      }
    }

    return recipes;
  } catch (error) {
    console.error(`Error parsing ${filePath}:`, error.message);
    throw error;
  }
}

/**
 * レシピデータをSIDでマージ
 * @param {Array<{sid: string, name: string}>} jaRecipes - 日本語レシピデータ
 * @param {Array<{sid: string, name: string}>} enRecipes - 英語レシピデータ
 * @returns {Array<{sid: string, nameJa: string, nameEn: string}>} マージされたレシピデータ
 */
function mergeRecipesBySid(jaRecipes, enRecipes) {
  const mergedMap = new Map();

  // 日本語レシピを追加
  jaRecipes.forEach(recipe => {
    mergedMap.set(recipe.sid, {
      sid: recipe.sid,
      nameJa: recipe.name,
      nameEn: "",
    });
  });

  // 英語レシピをマージ
  enRecipes.forEach(recipe => {
    if (mergedMap.has(recipe.sid)) {
      mergedMap.get(recipe.sid).nameEn = recipe.name;
    } else {
      // 日本語にない英語レシピの場合
      mergedMap.set(recipe.sid, {
        sid: recipe.sid,
        nameJa: "",
        nameEn: recipe.name,
      });
    }
  });

  return Array.from(mergedMap.values()).sort((a, b) => {
    // SIDで数値ソート
    const sidA = parseInt(a.sid, 10);
    const sidB = parseInt(b.sid, 10);
    return sidA - sidB;
  });
}

/**
 * Markdownテーブルを生成
 * @param {Array<{sid: string, nameJa: string, nameEn: string}>} recipes - レシピデータ
 * @returns {string} Markdownテーブル
 */
function generateMarkdownTable(recipes) {
  const header = "| SID | レシピ名 (日本語) | Recipe Name (English) |\n";
  const separator = "|-----|------------------|----------------------|\n";

  const rows = recipes
    .map(recipe => {
      const nameJa = recipe.nameJa || "-";
      const nameEn = recipe.nameEn || "-";
      return `| ${recipe.sid} | ${nameJa} | ${nameEn} |`;
    })
    .join("\n");

  return header + separator + rows;
}

/**
 * メイン処理
 */
function main() {
  try {
    console.log("レシピSIDテーブル生成を開始...");

    // XMLファイルをパース
    console.log("日本語レシピファイルを読み込み中...");
    const jaRecipes = parseRecipesXml(RECIPES_JA_PATH);
    console.log(`${jaRecipes.length}件の日本語レシピを読み込みました`);

    console.log("英語レシピファイルを読み込み中...");
    const enRecipes = parseRecipesXml(RECIPES_EN_PATH);
    console.log(`${enRecipes.length}件の英語レシピを読み込みました`);

    // レシピデータをマージ
    console.log("レシピデータをマージ中...");
    const mergedRecipes = mergeRecipesBySid(jaRecipes, enRecipes);
    console.log(`${mergedRecipes.length}件のレシピをマージしました`);

    // Markdownテーブルを生成
    console.log("Markdownテーブルを生成中...");
    const markdownTable = generateMarkdownTable(mergedRecipes);

    // 出力ファイルのディレクトリが存在しない場合は作成
    const outputDir = path.dirname(OUTPUT_PATH);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // ファイルに出力
    const outputContent = `# レシピSID一覧

このファイルは自動生成されています。
\`scripts/generate-recipe-sids.cjs\` を実行して更新してください。

## レシピ一覧

${markdownTable}

---
生成日時: ${new Date().toISOString()}
`;

    fs.writeFileSync(OUTPUT_PATH, outputContent, "utf8");
    console.log(`✅ レシピSIDテーブルを ${OUTPUT_PATH} に出力しました`);
  } catch (error) {
    console.error("❌ エラーが発生しました:", error.message);
    process.exit(1);
  }
}

// スクリプトが直接実行された場合のみメイン処理を実行
if (require.main === module) {
  main();
}

module.exports = {
  parseRecipesXml,
  mergeRecipesBySid,
  generateMarkdownTable,
};
