import { Suspense, lazy } from "react";
import { useTranslation } from "react-i18next";
import { HistoryToolbar } from "./Header/HistoryToolbar";
import { LanguageMenu } from "./Header/LanguageMenu";
import { HelpMenu } from "./Header/HelpMenu";
import { cn } from "../../utils/classNames";
import { TEXT_GLOW } from "../../constants/theme";

// Lazy load heavy components
const PlanManagerMenu = lazy(() =>
  import("./Header/PlanManagerMenu").then(m => ({ default: m.PlanManagerMenu }))
);

/**
 * アプリケーションのヘッダーコンポーネント
 */
export function Header() {
  const { t } = useTranslation();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-dark-600/95 border-b border-space-700/80">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-0 right-0 h-px bg-space-500/35"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1
              className={cn("text-xl font-semibold tracking-normal text-space-50", TEXT_GLOW.cyan)}
            >
              {t("title")}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <HistoryToolbar />
            <Suspense fallback={<div className="w-8 h-8"></div>}>
              <PlanManagerMenu />
            </Suspense>
            <HelpMenu />
            <LanguageMenu />
          </div>
        </div>
      </div>
    </header>
  );
}
