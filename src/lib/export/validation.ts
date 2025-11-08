/**
 * エクスポートオプションのバリデーション
 *
 * zod スキーマを使用して、UI からの入力を安全に検証する
 */

import { z } from "zod";

/**
 * 画像エクスポートオプションのスキーマ
 */
export const ImageExportOptionsSchema = z.object({
  resolution: z.enum(["1x", "2x", "4x"], {
    message: "Resolution must be 1x, 2x, or 4x",
  }),
  format: z.enum(["png", "jpeg", "webp"], {
    message: "Format must be png, jpeg, or webp",
  }),
  quality: z
    .number()
    .int()
    .min(0, { message: "Quality must be at least 0" })
    .max(100, { message: "Quality must be at most 100" }),
  includeViews: z.object({
    productionTree: z.boolean(),
    statistics: z.boolean(),
    powerGraph: z.boolean(),
    buildingCost: z.boolean(),
    powerGeneration: z.boolean(),
  }),
  customLayout: z.boolean(),
  backgroundColor: z
    .string()
    .regex(/^#([0-9A-F]{3}){1,2}$/i, {
      message: "Background color must be a valid hex color (e.g., #FFF or #FFFFFF)",
    })
    .or(
      z.string().regex(/^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/, {
        message: "Background color must be a valid rgb color (e.g., rgb(255, 255, 255))",
      })
    )
    .or(
      z.string().regex(/^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)$/, {
        message: "Background color must be a valid rgba color (e.g., rgba(255, 255, 255, 0.5))",
      })
    ),
  padding: z.number().int().min(0, { message: "Padding must be at least 0" }),
});

/**
 * 画像エクスポートオプションの型推論
 */
export type ValidatedImageExportOptions = z.infer<typeof ImageExportOptionsSchema>;

/**
 * 画像エクスポートオプションをバリデートする
 *
 * @param options - バリデート対象のオプション
 * @returns バリデート結果
 */
export function validateImageExportOptions(options: unknown) {
  return ImageExportOptionsSchema.safeParse(options);
}

/**
 * デフォルトの画像エクスポートオプション
 */
export const defaultImageExportOptions: ValidatedImageExportOptions = {
  resolution: "2x",
  format: "png",
  quality: 95,
  includeViews: {
    productionTree: true,
    statistics: true,
    powerGraph: true,
    buildingCost: true,
    powerGeneration: true,
  },
  customLayout: false,
  backgroundColor: "#1a202c",
  padding: 20,
};
