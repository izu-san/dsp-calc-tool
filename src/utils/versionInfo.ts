import { getDataPath } from "./paths";
import { createLogger } from "./logger";

const logger = createLogger("VersionInfo");

export interface GameVersion {
  version: string;
  supported: boolean;
  dataLastUpdated: string;
  note?: string;
}

export interface VersionInfo {
  gameVersions: GameVersion[];
  primaryVersion: string;
  dataLastUpdated: string;
  appVersion: string;
}

const DEFAULT_VERSION_INFO: VersionInfo = {
  gameVersions: [],
  primaryVersion: "",
  dataLastUpdated: "",
  appVersion: "0.0.0",
};

/**
 * バージョン情報を読み込む
 */
export async function loadVersionInfo(): Promise<VersionInfo> {
  try {
    const path = getDataPath("data/version-info.json");
    const response = await fetch(path);

    if (!response.ok) {
      logger.warn(`Failed to load version-info.json: ${response.status}`);
      return DEFAULT_VERSION_INFO;
    }

    const data: VersionInfo = await response.json();

    // バリデーション
    if (
      !Array.isArray(data.gameVersions) ||
      typeof data.primaryVersion !== "string" ||
      typeof data.dataLastUpdated !== "string" ||
      typeof data.appVersion !== "string"
    ) {
      logger.warn("Invalid version-info.json structure");
      return DEFAULT_VERSION_INFO;
    }

    return data;
  } catch (error) {
    logger.warn(`Failed to load version-info.json: ${error}`);
    return DEFAULT_VERSION_INFO;
  }
}
