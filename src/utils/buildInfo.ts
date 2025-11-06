import { getDataPath } from "./paths";
import { createLogger } from "./logger";

const logger = createLogger("BuildInfo");

export interface BuildStatus {
  status: "success" | "failure" | "unknown";
  workflowUrl?: string;
}

export interface TestCoverage {
  percentage: number;
  reportUrl?: string;
}

export interface BuildInfo {
  buildTime: string;
  appVersion: string;
  buildStatus?: BuildStatus;
  testCoverage?: TestCoverage;
  dataLastUpdated?: string;
}

const DEFAULT_BUILD_INFO: BuildInfo = {
  buildTime: import.meta.env.BUILD_TIME || new Date().toISOString(),
  appVersion: import.meta.env.APP_VERSION || "0.0.0",
};

/**
 * ビルド情報を読み込む
 */
export async function loadBuildInfo(): Promise<BuildInfo> {
  try {
    const path = getDataPath("data/build-info.json");
    const response = await fetch(path);

    if (!response.ok) {
      logger.warn(`Failed to load build-info.json: ${response.status}`);
      return DEFAULT_BUILD_INFO;
    }

    const data: BuildInfo = await response.json();

    // バリデーション
    if (typeof data.buildTime !== "string" || typeof data.appVersion !== "string") {
      logger.warn("Invalid build-info.json structure");
      return DEFAULT_BUILD_INFO;
    }

    return data;
  } catch (error) {
    logger.warn(`Failed to load build-info.json: ${error}`);
    return DEFAULT_BUILD_INFO;
  }
}
