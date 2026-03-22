import react from "@vitejs/plugin-react";
import { execSync } from "child_process";
import { readFileSync } from "fs";
import path from "path";
import { defineConfig } from "vitest/config";

// package.jsonからバージョンを取得
let packageJson: { version?: string };
try {
  packageJson = JSON.parse(readFileSync("./package.json", "utf-8"));
} catch (error) {
  console.error("Failed to read package.json:", error);
  packageJson = {};
}

/**
 * バージョン文字列が有効か検証する
 * セマンティックバージョニング（SemVer）の仕様に準拠:
 * - MAJOR.MINOR.PATCH (必須)
 * - -PRERELEASE (オプション、ハイフンで始まる)
 * - +BUILD (オプション、プラスで始まる)
 */
function isValidVersion(version: unknown): version is string {
  if (typeof version !== "string") {
    return false;
  }
  const trimmed = version.trim();
  if (trimmed === "") {
    return false;
  }
  // SemVer形式: MAJOR.MINOR.PATCH[-PRERELEASE][+BUILD]
  // 例: "1.2.3", "1.2.3-beta.1", "1.2.3+build.123", "1.2.3-beta.1+build.123"
  // prerelease/build識別子は、ドットで区切られた非空の識別子のリストでなければならない
  // 連続するドット（..）や、ドットで始まる/終わる識別子（.alpha、alpha.）は許可しない
  // MAJOR、MINOR、PATCHは先頭ゼロを持たない非負整数（SemVer 2.0.0仕様）
  // (?:0|[1-9]\d*) は 0 または 1-9 で始まる数値（先頭ゼロなし）を許可
  return /^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/.test(
    trimmed
  );
}

/**
 * Gitの最新タグからバージョンを取得（フォールバック付き）
 * CI/CD環境や shallow clone でも安全に動作するように設計
 */
function getAppVersion(): string {
  // テスト環境では execSync を避けて package.json のバージョンを直接使用
  // これによりテスト実行時の副作用を防ぐ
  // process.env.VITEST は vitest が自動的に設定する環境変数（GitHub ActionsのCI環境でも設定される）
  // process.env.NODE_ENV === "test" もチェックして、より確実にテスト環境を検出
  const isTestEnv = process.env.NODE_ENV === "test" || process.env.VITEST !== undefined;

  if (isTestEnv) {
    if (isValidVersion(packageJson.version)) {
      return packageJson.version;
    }
    return "0.0.0";
  }

  // まず Git タグから取得を試みる
  try {
    const latestTag = execSync("git describe --tags --abbrev=0", {
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
    })
      .trim()
      .replace(/^v/, ""); // vプレフィックスを除去

    if (isValidVersion(latestTag)) {
      return latestTag;
    }

    // Gitタグは取得できたが、形式が無効な場合
    console.warn(`Invalid Git tag format "${latestTag}", falling back to package.json version`);
  } catch (error) {
    // Gitタグが取得できない場合（shallow clone、タグなし、git未使用など）はフォールバック
    // エラーは警告として記録するが、ビルドは続行する
    console.warn("Failed to get Git tag, falling back to package.json version:", error);
  }

  // フォールバック: package.jsonのバージョンを使用
  if (isValidVersion(packageJson.version)) {
    return packageJson.version;
  }

  // 最終フォールバック: 有効なバージョンが取得できない場合
  console.warn(
    `Invalid or missing version in package.json (${packageJson.version}), using default "0.0.0"`
  );
  return "0.0.0";
}

const appVersion = getAppVersion();

const manualChunkGroups = {
  "react-vendor": ["react", "react-dom"],
  "ui-vendor": [
    "@radix-ui/react-dialog",
    "@radix-ui/react-label",
    "@radix-ui/react-select",
    "@radix-ui/react-switch",
    "@radix-ui/react-tabs",
    "@radix-ui/react-tooltip",
  ],
  "chart-vendor": ["chart.js", "react-chartjs-2", "d3-sankey", "d3-zoom"],
  "utils-vendor": ["decimal.js", "dompurify", "fast-xml-parser", "lz-string", "js-cookie", "zod"],
  "i18n-vendor": ["i18next", "react-i18next"],
  "state-vendor": ["zustand"],
} as const;

function getManualChunkName(moduleId: string): string | undefined {
  const normalizedId = moduleId.replaceAll("\\", "/");

  for (const [chunkName, packages] of Object.entries(manualChunkGroups)) {
    if (packages.some(packageName => normalizedId.includes(`/node_modules/${packageName}/`))) {
      return chunkName;
    }
  }

  return undefined;
}

// https://vite.dev/config/
export default defineConfig({
  // カスタムドメイン (dsp-calc.com) を使用
  base: "/",
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    "import.meta.env.APP_VERSION": JSON.stringify(appVersion),
    "import.meta.env.BUILD_TIME": JSON.stringify(new Date().toISOString()),
    "import.meta.env.GITHUB_REPO_URL": JSON.stringify("https://github.com/izu-san/dsp-calc-tool"),
    // テスト環境でのみ使用する環境変数（本番環境では環境変数から読み込む）
    // CI環境では未設定の可能性があるため、テスト用のデフォルト値を設定
    // ただし、本番ビルドには影響しないように、process.env.NODE_ENVが'test'の場合のみ設定
    ...(process.env.NODE_ENV === "test" || process.env.VITEST !== undefined
      ? {
          "import.meta.env.VITE_GOOGLE_FORM_URL": JSON.stringify(
            process.env.VITE_GOOGLE_FORM_URL ||
              "https://docs.google.com/forms/d/e/TEST_FORM_ID/viewform"
          ),
        }
      : {}),
  },
  test: {
    globals: true,
    environment: "happy-dom",
    setupFiles: "./src/test/setup.ts",
    exclude: [
      "node_modules/**",
      "dist/**",
      "tests/e2e/**",
      "tests/fixtures/**",
      "**/*.e2e.spec.ts",
    ],
    // ワーカープロセスのクラッシュを防ぐための設定
    // threadsプールを使用しつつ、並列度を抑えてメモリ不足を防ぐ
    pool: "threads",
    maxWorkers: 2,
    fileParallelism: true,
    // テストタイムアウトを増やして重いテストの強制終了を防ぐ
    testTimeout: 15000,
    hookTimeout: 15000,
    // ファイル並列実行数を制限
    maxConcurrency: 3,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "src/test/",
        "**/*.d.ts",
        "**/*.config.*",
        "**/mockData",
        "dist/",
        "tests/e2e/",
        "tests/fixtures/",
      ],
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: getManualChunkName,
      },
    },
    // Increase chunk size warning limit to 800KB
    chunkSizeWarningLimit: 800,
  },
});
