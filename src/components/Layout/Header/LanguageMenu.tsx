import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useGameDataStore } from "../../../stores/gameDataStore";
import { cn } from "../../../utils/classNames";
import { HOVER_CARD_GLOW, ICON_GLOW, MODAL_GLOW } from "../../../constants/theme";

/**
 * 言語切替ドロップダウンメニューコンポーネント
 */
export function LanguageMenu() {
  const { locale, setLocale, isLoading } = useGameDataStore();
  const { t } = useTranslation();

  const languages = [
    { code: "ja", label: "日本語", flag: "🇯🇵" },
    { code: "en", label: "English", flag: "🇺🇸" },
  ];

  const currentLanguage = languages.find(lang => lang.code === locale) || languages[0];

  // Ctrl+L で言語切り替え
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return;
      }

      if (e.ctrlKey || e.metaKey) {
        if (e.key === "l") {
          e.preventDefault();
          const currentLocale = locale;
          const nextLocale = currentLocale === "ja" ? "en" : "ja";
          setLocale(nextLocale);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [locale, setLocale]);

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          data-testid="language-menu-trigger"
          disabled={isLoading}
          className={cn(
            "px-3 py-2 bg-dark-700/80 border border-space-600/70 text-space-100 rounded-md hover:bg-dark-600 hover:border-space-500 disabled:bg-dark-700/50 disabled:border-space-700 disabled:text-space-500 disabled:cursor-not-allowed transition-colors flex items-center gap-2",
            HOVER_CARD_GLOW.cyan
          )}
          title={t("changeLanguage")}
          aria-label={t("changeLanguage")}
        >
          <span aria-hidden="true">Lang</span>
          <span>{currentLanguage.flag}</span>
          <span>{currentLanguage.label}</span>
          {isLoading && (
            <div
              className={cn(
                "animate-spin rounded-full h-4 w-4 border-b-2 border-neon-cyan",
                ICON_GLOW.cyan
              )}
            ></div>
          )}
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className={cn(
            "min-w-[200px] bg-dark-700/95 backdrop-blur-md border border-space-600/70 rounded-md animate-fadeInScale z-50",
            MODAL_GLOW.blue
          )}
          align="end"
          sideOffset={5}
        >
          {languages.map(({ code, label, flag }) => (
            <DropdownMenu.Item
              key={code}
              data-testid={`language-menu-item-${code}`}
              onClick={() => setLocale(code)}
              className={`px-4 py-2 text-space-100 cursor-pointer outline-none hover:bg-dark-600/70 transition-colors ${
                locale === code ? "bg-space-700/80" : ""
              }`}
            >
              <div className="flex items-center gap-2">
                <span>{flag}</span>
                <span>{label}</span>
                {locale === code && <span className="ml-auto">✓</span>}
              </div>
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
