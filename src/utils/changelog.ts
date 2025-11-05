import { getDataPath } from "./paths";
import { createLogger } from "./logger";

const logger = createLogger("Changelog");

/**
 * チェンジログを読み込む
 * @param locale - 言語コード（'ja' または 'en'）
 */
export async function loadChangelog(locale: "ja" | "en" = "ja"): Promise<string | null> {
  try {
    const path = getDataPath(`CHANGELOG_${locale}.md`);
    const response = await fetch(path);

    if (!response.ok) {
      logger.warn(`Failed to load CHANGELOG_${locale}.md: ${response.status}`);
      return null;
    }

    return await response.text();
  } catch (error) {
    logger.warn(`Failed to load CHANGELOG_${locale}.md: ${error}`);
    return null;
  }
}
