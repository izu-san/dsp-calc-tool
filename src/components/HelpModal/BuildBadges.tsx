import { useTranslation } from "react-i18next";

interface BuildStatusBadgeProps {
  status: "success" | "failure" | "unknown";
  workflowUrl?: string;
}

export function BuildStatusBadge({ status, workflowUrl }: BuildStatusBadgeProps) {
  const { t } = useTranslation();

  const statusText =
    status === "success"
      ? t("buildStatusSuccess")
      : status === "failure"
        ? t("buildStatusFailure")
        : t("buildStatusUnknown");

  const badgeContent = (
    <span
      className={`px-3 py-1 rounded-lg text-sm font-medium ${
        status === "success"
          ? "bg-green-600/30 border border-green-600/50 text-green-400"
          : status === "failure"
            ? "bg-red-600/30 border border-red-600/50 text-red-400"
            : "bg-gray-600/30 border border-gray-600/50 text-gray-400"
      }`}
    >
      {status === "success" ? "✓" : status === "failure" ? "✗" : "?"} {statusText}
    </span>
  );

  if (workflowUrl) {
    return (
      <a
        href={workflowUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block hover:opacity-80 transition-opacity"
      >
        {badgeContent}
      </a>
    );
  }

  return badgeContent;
}

interface TestCoverageBadgeProps {
  percentage: number;
  reportUrl?: string;
}

export function TestCoverageBadge({ percentage, reportUrl }: TestCoverageBadgeProps) {
  const { t } = useTranslation();

  const getColorClass = (percent: number) => {
    if (percent >= 85) {
      return "bg-green-600/30 border border-green-600/50 text-green-400";
    } else if (percent >= 70) {
      return "bg-yellow-600/30 border border-yellow-600/50 text-yellow-400";
    } else {
      return "bg-red-600/30 border border-red-600/50 text-red-400";
    }
  };

  const badgeContent = (
    <span className={`px-3 py-1 rounded-lg text-sm font-medium ${getColorClass(percentage)}`}>
      {t("testCoveragePercentage", { percentage: percentage.toFixed(1) })}
    </span>
  );

  if (reportUrl) {
    return (
      <a
        href={reportUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block hover:opacity-80 transition-opacity"
      >
        {badgeContent}
      </a>
    );
  }

  return badgeContent;
}
