/**
 * Export version management
 * 
 * エクスポートデータのバージョン管理
 */

/**
 * 現在のエクスポート形式バージョン
 */
export const EXPORT_VERSION = '1.0.0';

/**
 * バージョン情報
 */
export interface VersionInfo {
  /** メジャーバージョン */
  major: number;
  /** マイナーバージョン */
  minor: number;
  /** パッチバージョン */
  patch: number;
}

/**
 * バージョン文字列をパースする
 * @param version - バージョン文字列 (例: "1.0.0")
 * @returns パースされたバージョン情報
 */
export function parseVersion(version: string): VersionInfo {
  const parts = version.split('.');
  
  return {
    major: parseInt(parts[0] || '0', 10),
    minor: parseInt(parts[1] || '0', 10),
    patch: parseInt(parts[2] || '0', 10),
  };
}

/**
 * バージョンの互換性をチェックする
 * 
 * ルール:
 * - メジャーバージョンが異なる場合は互換性なし
 * - マイナーバージョンは後方互換性あり（新しいバージョンは古いデータを読める）
 * 
 * @param exportedVersion - エクスポートされたデータのバージョン
 * @param currentVersion - 現在のアプリケーションバージョン
 * @returns 互換性があれば true
 */
export function isCompatibleVersion(
  exportedVersion: string,
  currentVersion: string = EXPORT_VERSION
): boolean {
  const exported = parseVersion(exportedVersion);
  const current = parseVersion(currentVersion);
  
  // メジャーバージョンが異なる場合は互換性なし
  if (exported.major !== current.major) {
    return false;
  }
  
  // マイナーバージョンは後方互換性あり
  // 古いマイナーバージョンのデータは新しいバージョンで読める
  return exported.minor <= current.minor;
}

/**
 * バージョン間のマイグレーションが必要かチェックする
 * @param exportedVersion - エクスポートされたデータのバージョン
 * @param currentVersion - 現在のアプリケーションバージョン
 * @returns マイグレーションが必要なら true
 */
export function needsMigration(
  exportedVersion: string,
  currentVersion: string = EXPORT_VERSION
): boolean {
  const exported = parseVersion(exportedVersion);
  const current = parseVersion(currentVersion);
  
  // バージョンが異なり、互換性がある場合はマイグレーションが必要
  return (
    (exported.major !== current.major ||
      exported.minor !== current.minor ||
      exported.patch !== current.patch) &&
    isCompatibleVersion(exportedVersion, currentVersion)
  );
}

