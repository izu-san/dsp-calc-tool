import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import path from "path";

// package.jsonからバージョンを取得
const packageJson = JSON.parse(readFileSync("./package.json", "utf-8"));

function getAppVersion(): string {
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

// テストカバレッジ情報を取得
function getTestCoverage():
  | {
      percentage: number;
      reportUrl?: string;
    }
  | undefined {
  try {
    // coverage/coverage-final.jsonからカバレッジ情報を取得
    const coveragePath = path.join(process.cwd(), "coverage", "coverage-final.json");

    if (!existsSync(coveragePath)) {
      return undefined;
    }

    const coverageData = JSON.parse(readFileSync(coveragePath, "utf-8"));

    // vitestのカバレッジレポートの形式を確認
    // coverage-final.jsonにはtotalプロパティが含まれる場合がある
    let percentage: number;

    if (coverageData.total && typeof coverageData.total.statements?.pct === "number") {
      // totalプロパティが存在する場合（全体的なカバレッジ率）
      percentage = coverageData.total.statements.pct;
    } else {
      // ファイル単位でカバレッジを計算
      let totalStatements = 0;
      let coveredStatements = 0;

      for (const filePath of Object.keys(coverageData)) {
        // totalプロパティはスキップ
        if (filePath === "total") continue;

        const fileCoverage = coverageData[filePath];
        if (fileCoverage && fileCoverage.s) {
          // s: statements coverage
          for (const statementKey of Object.keys(fileCoverage.s)) {
            totalStatements++;
            if (fileCoverage.s[statementKey] > 0) {
              coveredStatements++;
            }
          }
        }
      }

      percentage = totalStatements > 0 ? (coveredStatements / totalStatements) * 100 : 0;
    }

    // CodecovレポートURLを生成（CI環境の場合）
    let reportUrl: string | undefined;
    const githubServerUrl = process.env.GITHUB_SERVER_URL;
    const githubRepository = process.env.GITHUB_REPOSITORY;
    const githubSha = process.env.GITHUB_SHA;

    if (githubServerUrl && githubRepository && githubSha) {
      // CodecovのレポートURLを生成
      reportUrl = `https://app.codecov.io/gh/${githubRepository}/commit/${githubSha}`;
    }

    return {
      percentage: Math.round(percentage * 10) / 10, // 小数点第1位まで
      ...(reportUrl && { reportUrl }),
    };
  } catch (error) {
    console.warn("Failed to get test coverage:", error);
    return undefined;
  }
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
