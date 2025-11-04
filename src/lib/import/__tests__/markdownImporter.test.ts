import { describe, it, expect } from "vitest";
import { importFromMarkdown } from "../markdownImporter";

describe("markdownImporter", () => {
  describe("importFromMarkdown", () => {
    it("完全なMarkdownドキュメントから情報を抽出", () => {
      const markdown = `# Test Production Plan

**Export Version:** 1.0.0
**Export Date:** 2025-01-15T12:34:56Z
**Recipe:** Iron Ingot (SID: 1)
**Target Quantity:** 60/min

## Statistics
- Total Machines: 10
- Total Power: 3.60 kW

## Raw Materials
| Item | Consumption Rate |
|---|---|
| Iron Ore | 120 /min |
`;

      const result = importFromMarkdown(markdown);

      expect(result.success).toBe(true);
      expect(result.extractedData.planName).toBe("Test Production Plan");
      expect(result.extractedData.recipeSID).toBe(1);
      expect(result.extractedData.recipeName).toBe("Iron Ingot");
      expect(result.extractedData.targetQuantity).toBe(60);
      expect(result.errors).toHaveLength(0);
    });

    it("プラン名の抽出", () => {
      const markdown = `# My Awesome Plan

Some content
`;

      const result = importFromMarkdown(markdown);

      expect(result.extractedData.planName).toBe("My Awesome Plan");
    });

    it("Export Dateの抽出", () => {
      const markdown = `# Plan

**Export Date:** 2025-01-15T12:34:56Z
`;

      const result = importFromMarkdown(markdown);

      expect(result.extractedData.timestamp).toBeDefined();
      const date = new Date(result.extractedData.timestamp!);
      expect(date.getFullYear()).toBe(2025);
      expect(date.getMonth()).toBe(0); // January is 0
      expect(date.getDate()).toBe(15);
    });

    it("Recipe SIDの抽出", () => {
      const markdown = `# Plan

**Recipe:** Iron Ingot (SID: 123)
`;

      const result = importFromMarkdown(markdown);

      expect(result.extractedData.recipeSID).toBe(123);
      expect(result.extractedData.recipeName).toBe("Iron Ingot");
    });

    it("Target Quantityの抽出（/min）", () => {
      const markdown = `# Plan

**Target Quantity:** 120/min
`;

      const result = importFromMarkdown(markdown);

      expect(result.extractedData.targetQuantity).toBe(120);
    });

    it("Target Quantityの抽出（小数点）", () => {
      const markdown = `# Plan

**Target Quantity:** 45.5/min
`;

      const result = importFromMarkdown(markdown);

      expect(result.extractedData.targetQuantity).toBe(45.5);
    });

    it("Recipe SIDが見つからない場合のエラー", () => {
      const markdown = `# Plan

**Recipe:** Iron Ingot
**Target Quantity:** 60/min
`;

      const result = importFromMarkdown(markdown);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe("missing_data");
      expect(result.errors[0].message).toContain("Recipe SID");
    });

    it("Target Quantityが見つからない場合の警告とデフォルト値", () => {
      const markdown = `# Plan

**Recipe:** Iron Ingot (SID: 1)
`;

      const result = importFromMarkdown(markdown);

      expect(result.success).toBe(true);
      expect(result.extractedData.targetQuantity).toBe(1);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].type).toBe("partial_data");
      expect(result.warnings[0].message).toContain("Target Quantity");
    });

    it("最小限の情報のみの場合", () => {
      const markdown = `# Minimal Plan

**Recipe:** Test Recipe (SID: 999)
`;

      const result = importFromMarkdown(markdown);

      expect(result.success).toBe(true);
      expect(result.extractedData.planName).toBe("Minimal Plan");
      expect(result.extractedData.recipeSID).toBe(999);
      expect(result.extractedData.recipeName).toBe("Test Recipe");
      expect(result.extractedData.targetQuantity).toBe(1); // default
    });

    it("空のMarkdownドキュメント", () => {
      const markdown = "";

      const result = importFromMarkdown(markdown);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe("missing_data");
    });

    it("フォーマットが崩れたMarkdown", () => {
      const markdown = `This is not a valid export

Random text
More random text
`;

      const result = importFromMarkdown(markdown);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("Recipe行にSIDが含まれているが数値でない場合", () => {
      const markdown = `# Plan

**Recipe:** Test Recipe (SID: invalid)
`;

      const result = importFromMarkdown(markdown);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
    });

    it("複数行にわたるRecipe情報", () => {
      const markdown = `# Plan

**Recipe:** Very Long Recipe Name With Spaces (SID: 456)
**Target Quantity:** 30/min
`;

      const result = importFromMarkdown(markdown);

      expect(result.extractedData.recipeSID).toBe(456);
      expect(result.extractedData.recipeName).toBe("Very Long Recipe Name With Spaces");
      expect(result.extractedData.targetQuantity).toBe(30);
    });

    it("日本語のプラン名", () => {
      const markdown = `# テスト生産計画

**Recipe:** Iron Ingot (SID: 1)
**Target Quantity:** 60/min
`;

      const result = importFromMarkdown(markdown);

      expect(result.extractedData.planName).toBe("テスト生産計画");
    });

    it("特殊文字を含むプラン名", () => {
      const markdown = `# Plan-2025 (v1.2) #Special

**Recipe:** Test Recipe (SID: 1)
**Target Quantity:** 60/min
`;

      const result = importFromMarkdown(markdown);

      expect(result.extractedData.planName).toContain("Plan-2025");
    });
  });
});
