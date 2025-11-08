import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

interface ShareUrlDialogProps {
  isOpen: boolean;
  shareURL: string;
  copySuccess: boolean;
  includeOverridesOnShare: boolean;
  onClose: () => void;
  onCopyURL: () => void;
  onToggleIncludeOverrides: (include: boolean) => void;
}

/**
 * URL共有ダイアログ
 */
export function ShareUrlDialog({
  isOpen,
  shareURL,
  copySuccess,
  includeOverridesOnShare,
  onClose,
  onCopyURL,
  onToggleIncludeOverrides,
}: ShareUrlDialogProps) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-dark-700/95 backdrop-blur-md border-2 border-neon-purple/40 rounded-xl shadow-[0_0_30px_rgba(168,85,247,0.3)] max-w-2xl w-full p-6 animate-fadeInScale">
        <h2 className="text-2xl font-bold mb-4 text-white drop-shadow-[0_0_8px_rgba(168,85,247,0.6)] flex items-center gap-2">
          🔗 {t("shareURL")}
        </h2>

        <p className="text-sm text-space-200 mb-4">{t("shareUrlDescription")}</p>

        <div className="mb-4">
          <label className="block text-sm font-semibold mb-2 text-neon-cyan">
            {t("sharedUrl")}
          </label>
          <div className="flex gap-2">
            <input
              data-testid="share-url-input"
              type="text"
              value={shareURL}
              readOnly
              className="flex-1 px-3 py-2 border-2 border-neon-purple/30 rounded-lg bg-dark-800/50 text-white text-sm font-mono backdrop-blur-sm"
              onClick={e => e.currentTarget.select()}
            />
            <button
              data-testid="copy-url-button"
              onClick={onCopyURL}
              className={`px-4 py-2 rounded-lg text-white font-medium transition-all hover:scale-105 active:scale-95 ${
                copySuccess
                  ? "bg-green-500/20 border-2 border-green-500/40 shadow-[0_0_15px_rgba(34,197,94,0.5)]"
                  : "bg-neon-blue/20 border-2 border-neon-blue/40 hover:bg-neon-blue/30 hover:border-neon-blue shadow-[0_0_10px_rgba(0,136,255,0.3)] hover:shadow-[0_0_15px_rgba(0,136,255,0.5)]"
              } ripple-effect`}
            >
              {copySuccess ? `✓ ${t("copied")}` : `📋 ${t("copy")}`}
            </button>
          </div>
        </div>

        {/* Include overrides in URL */}
        <div className="mb-4 flex items-center gap-2">
          <input
            data-testid="include-overrides-on-share-checkbox"
            id="includeOverridesOnShare"
            type="checkbox"
            checked={includeOverridesOnShare}
            onChange={e => onToggleIncludeOverrides(e.target.checked)}
            className="h-4 w-4 accent-neon-purple"
          />
          <label htmlFor="includeOverridesOnShare" className="text-sm text-white">
            {t("includeNodeOverridesInURL")}
          </label>
        </div>

        <div className="bg-yellow-500/10 border-2 border-yellow-500/30 rounded-lg p-3 mb-4">
          <p className="text-sm text-yellow-300">{t("urlWarning")}</p>
        </div>

        <button
          data-testid="share-dialog-close-button"
          onClick={onClose}
          className="w-full px-4 py-2 bg-dark-800/50 border-2 border-space-500/40 text-white rounded-lg hover:bg-dark-800 hover:border-space-400 hover:scale-105 active:scale-95 transition-all ripple-effect font-medium"
        >
          {t("close")}
        </button>
      </div>
    </div>,
    document.body
  );
}
