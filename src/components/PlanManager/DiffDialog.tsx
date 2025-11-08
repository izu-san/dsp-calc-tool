import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { PlanDiffView } from "../PlanDiffView";
import type { PlanDiffEntry } from "../../utils/planDiff";

interface DiffDialogProps {
  isOpen: boolean;
  diffBaseVersion: number | null;
  diffCompareVersion: number | null;
  diffs: PlanDiffEntry[] | null;
  onClose: () => void;
}

/**
 * バージョン差分表示ダイアログ
 */
export function DiffDialog({
  isOpen,
  diffBaseVersion,
  diffCompareVersion,
  diffs,
  onClose,
}: DiffDialogProps) {
  const { t } = useTranslation();

  if (!isOpen || diffBaseVersion === null || diffCompareVersion === null || !diffs) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-[#070a10] border-2 border-yellow-500/40 rounded-xl shadow-[0_0_30px_rgba(251,191,36,0.3)] max-w-4xl w-full max-h-[80vh] overflow-y-auto animate-fadeInScale">
        <div className="sticky top-0 bg-[#070a10] border-b border-yellow-500/30 z-10 px-6 pt-6 pb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white drop-shadow-[0_0_8px_rgba(251,191,36,0.6)] flex items-center gap-2">
              🔍 {t("compareVersions")}
            </h2>
            <button
              onClick={onClose}
              className="px-3 py-1 bg-red-500/20 border-2 border-red-500/40 text-white rounded-lg hover:bg-red-500/30 hover:border-red-500 hover:scale-105 active:scale-95 transition-all shadow-[0_0_10px_rgba(239,68,68,0.3)] hover:shadow-[0_0_15px_rgba(239,68,68,0.5)] ripple-effect text-sm font-medium"
            >
              {t("close")}
            </button>
          </div>
        </div>

        <div className="px-6 pb-6 space-y-6">
          <div className="bg-yellow-500/10 border-2 border-yellow-500/30 rounded-lg p-4">
            <div className="text-sm text-yellow-200">
              {t("comparingVersion")} {diffBaseVersion} → {t("version")} {diffCompareVersion}
            </div>
          </div>

          <PlanDiffView diffs={diffs} />
        </div>
      </div>
    </div>,
    document.body
  );
}
