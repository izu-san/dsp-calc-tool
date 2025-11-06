import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { execSync } from "child_process";
import path from "path";

// package.jsonからバージョンを取得
const packageJson = JSON.parse(readFileSync("./package.json", "utf-8"));

// Gitの最新タグからバージョンを取得（フォールバック付き）
function getAppVersion(): string {
  try {
    const latestTag = execSync("git describe --tags --abbrev=0", {
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
    })
      .trim()
      .replace(/^v/, "");

    if (latestTag && latestTag !== "") {
      return latestTag;
    }
  } catch (error) {
    console.warn("Failed to get Git tag, using package.json version:", error);
  }

  return packageJson.version;
}

// GitHub Actionsの環境変数からビルドステータスを取得
function getBuildStatus():
  | {
      status: "success" | "failure" | "unknown";
      workflowUrl?: string;
    }
  | undefined {
  const githubServerUrl = process.env.GITHUB_SERVER_URL;
  const githubRepository = process.env.GITHUB_REPOSITORY;
  const githubRunId = process.env.GITHUB_RUN_ID;

  if (githubServerUrl && githubRepository && githubRunId) {
    const workflowUrl = `${githubServerUrl}/${githubRepository}/actions/runs/${githubRunId}`;
    return {
      status: "success", // CIで実行されている場合は成功とみなす
      workflowUrl,
    };
  }

  return undefined;
}

// テストカバレッジ情報を取得（将来の拡張用）
function getTestCoverage():
  | {
      percentage: number;
      reportUrl?: string;
    }
  | undefined {
  // 現在はカバレッジ情報を取得できないため、undefinedを返す
  // 将来的にCIでカバレッジレポートを生成した場合、ここでパースする
  return undefined;
}

// version-info.jsonからデータ更新日時を取得
function getDataLastUpdated(): string | undefined {
  try {
    const versionInfoPath = path.join(process.cwd(), "public", "data", "version-info.json");
    const versionInfo = JSON.parse(readFileSync(versionInfoPath, "utf-8"));
    return versionInfo.dataLastUpdated;
  } catch {
    // version-info.jsonが存在しない、またはパースエラーの場合はundefinedを返す
    return undefined;
  }
}

// build-info.jsonを生成
function generateBuildInfo(): void {
  const appVersion = getAppVersion();
  const buildTime = new Date().toISOString();
  const buildStatus = getBuildStatus();
  const testCoverage = getTestCoverage();
  const dataLastUpdated = getDataLastUpdated();

  const buildInfo = {
    buildTime,
    appVersion,
    ...(buildStatus && { buildStatus }),
    ...(testCoverage && { testCoverage }),
    ...(dataLastUpdated && { dataLastUpdated }),
  };

  // dist/data/ に生成
  const distDir = path.join(process.cwd(), "dist", "data");
  const distPath = path.join(distDir, "build-info.json");
  mkdirSync(distDir, { recursive: true });
  writeFileSync(distPath, JSON.stringify(buildInfo, null, 2), "utf-8");
  console.log(`✓ Generated build-info.json: ${distPath}`);

  // public/data/ にもコピー（開発環境で使用）
  const publicDir = path.join(process.cwd(), "public", "data");
  const publicPath = path.join(publicDir, "build-info.json");
  mkdirSync(publicDir, { recursive: true });
  writeFileSync(publicPath, JSON.stringify(buildInfo, null, 2), "utf-8");
  console.log(`✓ Copied build-info.json: ${publicPath}`);
}

generateBuildInfo();
