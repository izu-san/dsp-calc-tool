import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { HelpModal } from "../../HelpModal/index";
import { cn } from "../../../utils/classNames";
import { HOVER_CARD_GLOW } from "../../../constants/theme";

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
        className={cn(
          "px-3 py-2 bg-dark-700/80 border border-space-600/70 text-space-100 rounded-md hover:bg-dark-600 hover:border-space-500 transition-colors flex items-center gap-2",
          HOVER_CARD_GLOW.purple
        )}
        title={t("help")}
        aria-label={t("help")}
      >
        <span aria-hidden="true">?</span>
        {t("help")}
      </button>

      <HelpModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
