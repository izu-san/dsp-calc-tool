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
 */
function isValidVersion(version: unknown): version is string {
  return typeof version === "string" && version.trim() !== "" && /^\d+\.\d+\.\d+/.test(version);
}

/**
 * Gitの最新タグからバージョンを取得（フォールバック付き）
 * CI/CD環境や shallow clone でも安全に動作するように設計
 */
function getAppVersion(): string {
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
    ...(process.env.NODE_ENV === "test" || process.env.VITEST
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
    // threadsプールを使用（forksより安定）
    pool: "threads",
    // @ts-expect-error - Vitestの型定義が不完全
    poolOptions: {
      threads: {
        singleThread: false,
        maxThreads: 2, // 並列実行数を大幅に制限してメモリ不足を防ぐ
        minThreads: 1,
      },
    },
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
        manualChunks: {
          // React core libraries
          "react-vendor": ["react", "react-dom"],
          // UI component libraries
          "ui-vendor": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-label",
            "@radix-ui/react-select",
            "@radix-ui/react-switch",
            "@radix-ui/react-tabs",
            "@radix-ui/react-tooltip",
          ],
          // Chart and visualization
          "chart-vendor": ["chart.js", "react-chartjs-2", "d3-sankey", "d3-zoom"],
          // Utilities and parsers
          "utils-vendor": [
            "decimal.js",
            "dompurify",
            "fast-xml-parser",
            "lz-string",
            "js-cookie",
            "zod",
          ],
          // Internationalization
          "i18n-vendor": ["i18next", "react-i18next"],
          // State management
          "state-vendor": ["zustand"],
        },
      },
    },
    // Increase chunk size warning limit to 800KB
    chunkSizeWarningLimit: 800,
  },
});
