import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { HelpModal } from "../../HelpModal/index";
import { CARD_GLOW } from "../../../constants/theme";

/**
 * ヘルプメニューコンポーネント
 * ヘッダーに配置されるシンプルなボタン
 */
export function HelpMenu() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  // Ctrl+? または F1 でHelpModalを開く/閉じる
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return;
      }

      if (e.key === "F1" || (e.ctrlKey && e.key === "?")) {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <>
      <button
        data-testid="help-menu-trigger"
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-neon-purple/30 border border-neon-purple/40 text-white rounded-lg hover:bg-neon-purple/40 hover:border-neon-purple hover:${CARD_GLOW.purple} transition-all ripple-effect flex items-center gap-2"
        title={t("help")}
        aria-label={t("help")}
      >
        <span>📖</span>
        {t("help")}
      </button>

      <HelpModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
