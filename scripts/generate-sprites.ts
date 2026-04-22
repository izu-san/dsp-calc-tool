import Spritesmith from "spritesmith";
import fs from "fs";
import path from "path";
import sharp from "sharp";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface SpriteResult {
  image: Buffer;
  coordinates: Record<string, { x: number; y: number; width: number; height: number }>;
  properties: { width: number; height: number };
}

async function generateSprite(
  inputDirs: string | string[],
  outputImage: string,
  outputJson: string,
  name: string
): Promise<void> {
  console.log(`🎨 Generating ${name} sprite...`);

  // すべてのPNGファイルを取得。同名IDは先に指定したディレクトリを優先する。
  const dirs = Array.isArray(inputDirs) ? inputDirs : [inputDirs];
  const iconFileMap = new Map<string, string>();
  for (const inputDir of dirs) {
    for (const fileName of fs.readdirSync(inputDir).filter(f => f.endsWith(".png"))) {
      if (!iconFileMap.has(fileName)) {
        iconFileMap.set(fileName, path.join(inputDir, fileName));
      }
    }
  }
  const iconFiles = Array.from(iconFileMap.values());

  if (iconFiles.length === 0) {
    console.warn(`⚠️  No PNG files found in ${dirs.join(", ")}`);
    return;
  }

  console.log(`   Found ${iconFiles.length} icons to process`);

  // スプライトシート生成
  const result = await new Promise<SpriteResult>((resolve, reject) => {
    Spritesmith.run(
      {
        src: iconFiles,
        algorithm: "binary-tree", // 効率的なパッキングアルゴリズム
        padding: 2, // アイコン間のスペース
      },
      (err: Error | null, result: SpriteResult) => {
        if (err) reject(err);
        else resolve(result);
      }
    );
  });

  // 出力ディレクトリの作成
  const outputDir = path.dirname(outputImage);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // PNG画像を保存
  fs.writeFileSync(outputImage, result.image);

  // WebP形式でも保存
  const outputImageWebp = outputImage.replace(".png", ".webp");
  await sharp(result.image).webp({ quality: 90, effort: 6 }).toFile(outputImageWebp);

  // 座標データをJSON形式で保存（itemIdをキーにする）
  const coordinates: Record<number, { x: number; y: number; width: number; height: number }> = {};
  for (const [filePath, coords] of Object.entries(result.coordinates)) {
    const fileName = path.basename(filePath, ".png");
    const itemId = parseInt(fileName, 10);
    if (!isNaN(itemId)) {
      coordinates[itemId] = coords;
    }
  }

  const spriteData = {
    width: result.properties.width,
    height: result.properties.height,
    coordinates,
  };

  fs.writeFileSync(outputJson, JSON.stringify(spriteData, null, 2));

  console.log(`   ✅ ${name} sprite generated: ${iconFiles.length} icons`);
  console.log(`   📐 Size: ${result.properties.width}x${result.properties.height}px`);
  console.log(`   🖼️  PNG: ${path.relative(process.cwd(), outputImage)}`);
  console.log(`   🖼️  WebP: ${path.relative(process.cwd(), outputImageWebp)}`);
  console.log(`   📄 Data: ${path.relative(process.cwd(), outputJson)}`);
}

async function main() {
  console.log("🚀 Starting sprite generation...\n");

  const publicDir = path.join(__dirname, "../public/data");

  // Items スプライト（Items + Machines を統合）
  // Items/Icons を優先し、Items に存在しない Machines/Icons を追加する
  await generateSprite(
    [path.join(publicDir, "Items/Icons"), path.join(publicDir, "Machines/Icons")],
    path.join(publicDir, "sprites/items-sprite.png"),
    path.join(publicDir, "sprites/items-sprite.json"),
    "Items (used for both Items and Machines)"
  );
  console.log("");

  // Recipes スプライト
  await generateSprite(
    path.join(publicDir, "Recipes/Icons"),
    path.join(publicDir, "sprites/recipes-sprite.png"),
    path.join(publicDir, "sprites/recipes-sprite.json"),
    "Recipes"
  );

  console.log("\n✅ All sprites generated successfully!");
  console.log("\n📊 Summary:");
  console.log("   - Items sprite: public/data/sprites/items-sprite.png (shared with Machines)");
  console.log("   - Recipes sprite: public/data/sprites/recipes-sprite.png");
  console.log("\n💡 These sprites will be automatically copied to dist/ during build.");
}

main().catch(error => {
  console.error("❌ Error generating sprites:", error);
  process.exit(1);
});
