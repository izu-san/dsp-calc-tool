import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { loadBuildInfo, type BuildInfo } from "../../utils/buildInfo";
import { BuildStatusBadge, TestCoverageBadge } from "./BuildBadges";
import i18n from "../../i18n";

export function ReliabilityIndicator() {
  const { t } = useTranslation();
  const [buildInfo, setBuildInfo] = useState<BuildInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBuildInfo()
      .then(info => {
        setBuildInfo(info);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="bg-dark-800/50 backdrop-blur-sm rounded-lg p-4 border border-neon-purple/30">
        <div className="text-center py-4 text-space-300">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-neon-purple mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!buildInfo) {
    return null;
  }

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      const locale = i18n.language || "ja";
      const isJa = locale === "ja";

      // JST (UTC+9) に変換
      const jstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);
      const jstYear = jstDate.getUTCFullYear();
      const jstMonth = jstDate.getUTCMonth() + 1;
      const jstDay = jstDate.getUTCDate();
      const jstHour = jstDate.getUTCHours();
      const jstMinute = jstDate.getUTCMinutes();

      if (isJa) {
        return `${jstYear}年${jstMonth}月${jstDay}日 ${String(jstHour).padStart(2, "0")}:${String(jstMinute).padStart(2, "0")}`;
      } else {
        return `${jstYear}-${String(jstMonth).padStart(2, "0")}-${String(jstDay).padStart(2, "0")} ${String(jstHour).padStart(2, "0")}:${String(jstMinute).padStart(2, "0")}`;
      }
    } catch {
      return dateString;
    }
  };

  return (
    <div className="bg-dark-800/50 backdrop-blur-sm rounded-lg p-4 border border-neon-purple/30">
      <h4 className="text-lg font-semibold text-white mb-3">{t("reliabilityIndicator")}</h4>

      <div className="space-y-3">
        {/* ビルドステータスバッジ */}
        {buildInfo.buildStatus && (
          <div className="flex items-center justify-between">
            <span className="text-space-300 text-sm">{t("buildStatus")}:</span>
            <BuildStatusBadge
              status={buildInfo.buildStatus.status}
              workflowUrl={buildInfo.buildStatus.workflowUrl}
            />
          </div>
        )}

        {/* テストカバレッジバッジ */}
        {buildInfo.testCoverage && (
          <div className="flex items-center justify-between">
            <span className="text-space-300 text-sm">{t("testCoverage")}:</span>
            <TestCoverageBadge
              percentage={buildInfo.testCoverage.percentage}
              reportUrl={buildInfo.testCoverage.reportUrl}
            />
          </div>
        )}

        {/* ビルド日時 */}
        {buildInfo.buildTime && (
          <div className="flex items-center justify-between">
            <span className="text-space-300 text-sm">{t("buildTime")}:</span>
            <span className="text-white font-medium text-sm">
              {formatDate(buildInfo.buildTime)}
            </span>
          </div>
        )}

        {/* データ更新日時 */}
        {buildInfo.dataLastUpdated && (
          <div className="flex items-center justify-between">
            <span className="text-space-300 text-sm">{t("dataLastUpdated")}:</span>
            <span className="text-white font-medium text-sm">
              {formatDate(buildInfo.dataLastUpdated)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
