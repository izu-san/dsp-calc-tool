import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

interface VersionInfo {
  version: number;
  timestamp: number;
  description?: string;
}

interface VersionHistoryDialogProps {
  isOpen: boolean;
  selectedPlanId: string | null;
  versions: VersionInfo[];
  onClose: () => void;
  onLoadVersion: (planId: string, version: number) => void;
  onCompareVersions: (baseVersion: number, compareVersion: number) => void;
}

/**
 * バージョン履歴ダイアログ
 */
export function VersionHistoryDialog({
  isOpen,
  selectedPlanId,
  versions,
  onClose,
  onLoadVersion,
  onCompareVersions,
}: VersionHistoryDialogProps) {
  const { t } = useTranslation();

  if (!isOpen || !selectedPlanId) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-dark-700/95 backdrop-blur-md border-2 border-purple-500/40 rounded-xl shadow-[0_0_30px_rgba(168,85,247,0.3)] max-w-2xl w-full max-h-[80vh] overflow-y-auto animate-fadeInScale">
        <h2 className="text-2xl font-bold mb-6 text-white drop-shadow-[0_0_8px_rgba(168,85,247,0.6)] flex items-center gap-2 px-6 pt-6">
          📚 {t("versionHistory")}
        </h2>

        <div className="px-6 pb-6 space-y-6">
          {versions.length === 0 ? (
            <p className="text-space-200 text-sm">{t("noVersions")}</p>
          ) : (
            <div className="space-y-3">
              {versions.map((version, index) => (
                <div
                  key={version.version}
                  className="p-4 bg-dark-800/50 border border-purple-500/20 rounded-lg hover:bg-dark-800 hover:border-purple-500/40 transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1">
                      <div className="font-medium text-white">
                        {t("version")} {version.version}
                      </div>
                      <div className="text-sm text-space-200">
                        {new Date(version.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {index > 0 && (
                        <button
                          onClick={() => {
                            onCompareVersions(versions[index - 1].version, version.version);
                          }}
                          className="px-3 py-1 bg-yellow-500/20 border-2 border-yellow-500/40 text-white rounded-lg hover:bg-yellow-500/30 hover:border-yellow-500 hover:scale-105 active:scale-95 transition-all shadow-[0_0_10px_rgba(251,191,36,0.3)] hover:shadow-[0_0_15px_rgba(251,191,36,0.5)] ripple-effect text-sm font-medium"
                        >
                          🔍 {t("compare")}
                        </button>
                      )}
                      <button
                        onClick={() => onLoadVersion(selectedPlanId, version.version)}
                        className="px-3 py-1 bg-neon-blue/20 border-2 border-neon-blue/40 text-white rounded-lg hover:bg-neon-blue/30 hover:border-neon-blue hover:scale-105 active:scale-95 transition-all shadow-[0_0_10px_rgba(0,136,255,0.3)] hover:shadow-[0_0_15px_rgba(0,136,255,0.5)] ripple-effect text-sm font-medium"
                      >
                        {t("load")}
                      </button>
                    </div>
                  </div>
                  {version.description && (
                    <div className="text-sm text-space-100 mt-2 pt-2 border-t border-purple-500/20">
                      {version.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-dark-800/50 border-2 border-space-500/40 text-white rounded-lg hover:bg-dark-800 hover:border-space-400 hover:scale-105 active:scale-95 transition-all ripple-effect font-medium"
          >
            {t("close")}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
