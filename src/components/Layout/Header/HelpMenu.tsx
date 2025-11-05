import { useState } from "react";
import { useTranslation } from "react-i18next";
import { HelpModal } from "../../HelpModal/index";

/**
 * ヘルプメニューコンポーネント
 * ヘッダーに配置されるシンプルなボタン
 */
export function HelpMenu() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        data-testid="help-menu-trigger"
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-neon-purple/30 border border-neon-purple/40 text-white rounded-lg hover:bg-neon-purple/40 hover:border-neon-purple hover:shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all ripple-effect flex items-center gap-2"
        title={t("help")}
      >
        <span>📖</span>
        {t("help")}
      </button>

      <HelpModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
