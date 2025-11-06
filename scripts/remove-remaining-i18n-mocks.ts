/**
 * 残りのテストファイルからi18nモックを削除するスクリプト
 */

import fs from "fs";
import path from "path";

// テストファイルを再帰的に検索
function findTestFiles(dir: string): string[] {
  const files: string[] = [];

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        files.push(...findTestFiles(fullPath));
      } else if (entry.isFile() && entry.name.endsWith(".test.tsx")) {
        files.push(fullPath);
      }
    }
  } catch {
    // ディレクトリが読めない場合はスキップ
  }

  return files;
}

async function main() {
  // 全テストファイルを検索
  const testFiles = findTestFiles("src");

  console.log(`Found ${testFiles.length} test files`);

  // i18nモックのパターン
  const mockPatterns = [
    // パターン1: // i18n モック から始まる
    /\/\/\s*i18n\s*モック\s*\nvi\.mock\("react-i18next"[\s\S]*?\}\)\);?\n*/gi,

    // パターン2: // Mock i18next から始まる
    /\/\/\s*Mock\s+i18next\s*\nvi\.mock\("react-i18next"[\s\S]*?\}\)\);?\n*/gi,

    // パターン3: // i18nextをモック から始まる
    /\/\/\s*i18next.*モック\s*\nvi\.mock\("react-i18next"[\s\S]*?\}\)\);?\n*/gi,

    // パターン4: コメントなし、vi.mock("react-i18next" から (useTranslationのみ)
    /vi\.mock\("react-i18next",\s*\(\)\s*=>\s*\(\{[\s\S]*?useTranslation:[\s\S]*?t:\s*\(key:\s*string\)[\s\S]*?\}\)\);?\n*/gi,
  ];

  let processedCount = 0;
  let removedCount = 0;

  for (const filePath of testFiles) {
    let content = fs.readFileSync(filePath, "utf-8");
    const originalContent = content;

    // 各パターンで置換を試みる
    for (const pattern of mockPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        console.log(`  Found mock in: ${filePath}`);
        content = content.replace(pattern, "");
      }
    }

    // 変更があった場合のみファイルを更新
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, "utf-8");
      removedCount++;
      console.log(`  ✓ Removed mock from: ${filePath}`);
    }

    processedCount++;
  }

  console.log(`\n✅ Processed ${processedCount} files`);
  console.log(`🗑️  Removed i18n mocks from ${removedCount} files`);
}

main().catch(console.error);
