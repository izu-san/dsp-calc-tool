import * as Tabs from "@radix-ui/react-tabs";
import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { CARD_GLOW, ICON_GLOW, MODAL_GLOW, NEON_GLOW, TEXT_GLOW } from "../../constants/theme";
import { cn } from "../../utils/classNames";
import { PatchInfoView } from "../PatchInfoView";
import { formatDate } from "./dateFormatter";
import { FeedbackForm } from "./FeedbackForm";
import { QualityPolicy } from "./QualityPolicy";
import { ReliabilityIndicator } from "./ReliabilityIndicator";
import { useHelpModalLifecycle } from "./useHelpModalLifecycle";
import { useSanitizedMarkdown } from "./useSanitizedMarkdown";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("about");
  const firstTabRef = useRef<HTMLButtonElement>(null);

  const { versionInfo, changelog, loadingVersionInfo, loadingChangelog } = useHelpModalLifecycle(
    isOpen,
    onClose,
    firstTabRef
  );

  const { renderMarkdown } = useSanitizedMarkdown();

  if (!isOpen) return null;

  const githubRepoUrl =
    import.meta.env.GITHUB_REPO_URL || "https://github.com/izu-san/dsp-calc-tool";
  // version-info.jsonのappVersionを優先、なければビルド時のAPP_VERSIONを使用
  const appVersion = versionInfo?.appVersion || import.meta.env.APP_VERSION || "0.0.0";
  const buildTime = import.meta.env.BUILD_TIME || "";

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // モーダル背景クリック時のみ閉じる
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
      style={{ zIndex: 99999 }}
      onMouseDown={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-modal-title"
    >
      <div
        className={cn(
          "bg-dark-700/95 backdrop-blur-md border-2 border-neon-purple/40 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col relative animate-fadeInScale",
          MODAL_GLOW.purple
        )}
        style={{ zIndex: 100000 }}
        onClick={e => e.stopPropagation()}
        data-testid="help-modal"
      >
        {/* Header */}
        <div className="p-6 border-b border-neon-purple/30 flex items-center justify-between bg-dark-800/50">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "p-2 bg-neon-purple/20 border border-neon-purple/50 rounded-lg",
                CARD_GLOW.purple
              )}
            >
              <span className="text-2xl">📖</span>
            </div>
            <div>
              <h2
                id="help-modal-title"
                className={cn("text-2xl font-bold text-white", TEXT_GLOW.purple)}
              >
                {t("help")}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-space-300 hover:text-neon-purple transition-all hover:scale-110 ripple-effect p-2 rounded-lg hover:bg-neon-purple/10"
            aria-label={t("close")}
            data-testid="help-modal-close"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <Tabs.Root
          value={activeTab}
          onValueChange={setActiveTab}
          activationMode="automatic"
          className="flex-1 flex flex-col overflow-hidden"
        >
          <Tabs.List
            className="flex px-6 pt-4 gap-1 bg-gradient-to-b from-dark-800/50 to-dark-700/30 border-b-2 border-neon-purple/30"
            onClick={e => e.stopPropagation()}
          >
            <Tabs.Trigger
              ref={firstTabRef}
              value="about"
              className={cn(
                "px-5 py-2.5 rounded-t-lg text-space-300 bg-dark-700/50 border-2 border-b-0 border-neon-purple/40 hover:text-white hover:bg-dark-600/70 hover:border-neon-purple/70 transition-all duration-200 cursor-pointer font-medium relative data-[state=active]:text-white data-[state=active]:bg-neon-purple/30 data-[state=active]:border-neon-purple data-[state=active]:border-b-neon-purple/30 data-[state=active]:z-10 focus-visible:outline-2 focus-visible:outline-neon-cyan focus-visible:outline-offset-2 focus-visible:border-neon-cyan",
                `hover:${ICON_GLOW.purple}`,
                `data-[state=active]:${NEON_GLOW.purpleStrong}`
              )}
            >
              {t("about")}
            </Tabs.Trigger>
            <Tabs.Trigger
              value="changelog"
              className={cn(
                "px-5 py-2.5 rounded-t-lg text-space-300 bg-dark-700/50 border-2 border-b-0 border-neon-purple/40 hover:text-white hover:bg-dark-600/70 hover:border-neon-purple/70 transition-all duration-200 cursor-pointer font-medium relative data-[state=active]:text-white data-[state=active]:bg-neon-purple/30 data-[state=active]:border-neon-purple data-[state=active]:border-b-neon-purple/30 data-[state=active]:z-10 focus-visible:outline-2 focus-visible:outline-neon-cyan focus-visible:outline-offset-2 focus-visible:border-neon-cyan",
                `hover:${ICON_GLOW.purple}`,
                `data-[state=active]:${NEON_GLOW.purpleStrong}`
              )}
            >
              {t("changelog")}
            </Tabs.Trigger>
            <Tabs.Trigger
              value="faq"
              className={cn(
                "px-5 py-2.5 rounded-t-lg text-space-300 bg-dark-700/50 border-2 border-b-0 border-neon-purple/40 hover:text-white hover:bg-dark-600/70 hover:border-neon-purple/70 transition-all duration-200 cursor-pointer font-medium relative data-[state=active]:text-white data-[state=active]:bg-neon-purple/30 data-[state=active]:border-neon-purple data-[state=active]:border-b-neon-purple/30 data-[state=active]:z-10 focus-visible:outline-2 focus-visible:outline-neon-cyan focus-visible:outline-offset-2 focus-visible:border-neon-cyan",
                `hover:${ICON_GLOW.purple}`,
                `data-[state=active]:${NEON_GLOW.purpleStrong}`
              )}
            >
              {t("faqLabel")}
            </Tabs.Trigger>
            <Tabs.Trigger
              value="keyboardShortcuts"
              className={cn(
                "px-5 py-2.5 rounded-t-lg text-space-300 bg-dark-700/50 border-2 border-b-0 border-neon-purple/40 hover:text-white hover:bg-dark-600/70 hover:border-neon-purple/70 transition-all duration-200 cursor-pointer font-medium relative data-[state=active]:text-white data-[state=active]:bg-neon-purple/30 data-[state=active]:border-neon-purple data-[state=active]:border-b-neon-purple/30 data-[state=active]:z-10 focus-visible:outline-2 focus-visible:outline-neon-cyan focus-visible:outline-offset-2 focus-visible:border-neon-cyan",
                `hover:${ICON_GLOW.purple}`,
                `data-[state=active]:${NEON_GLOW.purpleStrong}`
              )}
            >
              {t("keyboardShortcuts")}
            </Tabs.Trigger>
            <Tabs.Trigger
              value="patchDiff"
              className={cn(
                "px-5 py-2.5 rounded-t-lg text-space-300 bg-dark-700/50 border-2 border-b-0 border-neon-purple/40 hover:text-white hover:bg-dark-600/70 hover:border-neon-purple/70 transition-all duration-200 cursor-pointer font-medium relative data-[state=active]:text-white data-[state=active]:bg-neon-purple/30 data-[state=active]:border-neon-purple data-[state=active]:border-b-neon-purple/30 data-[state=active]:z-10 focus-visible:outline-2 focus-visible:outline-neon-cyan focus-visible:outline-offset-2 focus-visible:border-neon-cyan",
                `hover:${ICON_GLOW.purple}`,
                `data-[state=active]:${NEON_GLOW.purpleStrong}`
              )}
            >
              {t("patchDiff")}
            </Tabs.Trigger>
            <Tabs.Trigger
              value="feedback"
              className={cn(
                "px-5 py-2.5 rounded-t-lg text-space-300 bg-dark-700/50 border-2 border-b-0 border-neon-purple/40 hover:text-white hover:bg-dark-600/70 hover:border-neon-purple/70 transition-all duration-200 cursor-pointer font-medium relative data-[state=active]:text-white data-[state=active]:bg-neon-purple/30 data-[state=active]:border-neon-purple data-[state=active]:border-b-neon-purple/30 data-[state=active]:z-10 focus-visible:outline-2 focus-visible:outline-neon-cyan focus-visible:outline-offset-2 focus-visible:border-neon-cyan",
                `hover:${ICON_GLOW.purple}`,
                `data-[state=active]:${NEON_GLOW.purpleStrong}`
              )}
            >
              {t("feedback")}
            </Tabs.Trigger>
          </Tabs.List>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            {/* About Tab */}
            <Tabs.Content
              value="about"
              className="space-y-4"
              onClick={e => e.stopPropagation()}
              data-testid="help-tab-about"
            >
              <h3 className="text-xl font-bold text-neon-purple mb-4">{t("about")}</h3>

              {loadingVersionInfo ? (
                <div className="text-center py-8 text-space-300">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-purple mx-auto"></div>
                  <p className="mt-4">{t("loadingGameData")}</p>
                </div>
              ) : versionInfo ? (
                <div className="space-y-4">
                  {/* Primary Version */}
                  <div className="bg-dark-800/50 backdrop-blur-sm rounded-lg p-4 border border-neon-purple/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-space-300">{t("primaryVersion")}</p>
                        <p className="text-xl font-bold text-neon-purple mt-1">
                          {versionInfo.primaryVersion}
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-green-600/30 border border-green-600/50 text-green-400 rounded-lg text-sm">
                        {t("supportedVersion")}
                      </span>
                    </div>
                  </div>

                  {/* All Versions */}
                  <div className="bg-dark-800/50 backdrop-blur-sm rounded-lg p-4 border border-neon-purple/30">
                    <h4 className="text-lg font-semibold text-white mb-3">{t("gameVersions")}</h4>
                    <div className="space-y-2">
                      {versionInfo.gameVersions.map((gameVersion, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-dark-700/50 rounded border border-neon-purple/20"
                        >
                          <div className="flex-1">
                            <p className="text-white font-medium">{gameVersion.version}</p>
                            {gameVersion.note && (
                              <p className="text-xs text-space-400 mt-1">{gameVersion.note}</p>
                            )}
                            <p className="text-xs text-space-400 mt-1">
                              {t("dataLastUpdated")}: {formatDate(gameVersion.dataLastUpdated)}
                            </p>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-lg text-sm ${
                              gameVersion.supported
                                ? "bg-green-600/30 border border-green-600/50 text-green-400"
                                : "bg-red-600/30 border border-red-600/50 text-red-400"
                            }`}
                          >
                            {gameVersion.supported
                              ? t("supportedVersion")
                              : t("unsupportedVersion")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* App Info */}
                  <div className="bg-dark-800/50 backdrop-blur-sm rounded-lg p-4 border border-neon-purple/30">
                    <h4 className="text-lg font-semibold text-white mb-3">{t("appVersion")}</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-space-300">{t("appVersion")}:</span>
                        <span className="text-white font-medium">{appVersion}</span>
                      </div>
                      {buildTime && (
                        <div className="flex justify-between">
                          <span className="text-space-300">{t("buildTime")}:</span>
                          <span className="text-white font-medium">{formatDate(buildTime)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Reliability Indicator */}
                  <ReliabilityIndicator />

                  {/* Quality Policy */}
                  <QualityPolicy />

                  {/* Repository Link */}
                  <div className="bg-dark-800/50 backdrop-blur-sm rounded-lg p-4 border border-neon-purple/30">
                    <h4 className="text-lg font-semibold text-white mb-3">{t("repository")}</h4>
                    <a
                      href={githubRepoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-neon-purple hover:text-neon-cyan transition-colors underline"
                    >
                      {githubRepoUrl}
                    </a>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-space-300">
                  <p>{t("versionInfoNotAvailable")}</p>
                </div>
              )}
            </Tabs.Content>

            {/* Changelog Tab */}
            <Tabs.Content
              value="changelog"
              className="space-y-4"
              onClick={e => e.stopPropagation()}
              data-testid="help-tab-changelog"
            >
              <h3 className="text-xl font-bold text-neon-purple mb-4">{t("changelog")}</h3>

              {loadingChangelog ? (
                <div className="text-center py-8 text-space-300">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-purple mx-auto"></div>
                  <p className="mt-4">{t("loadingGameData")}</p>
                </div>
              ) : changelog ? (
                <div
                  className="prose prose-invert max-w-none bg-dark-800/50 backdrop-blur-sm rounded-lg p-4 border border-neon-purple/30"
                  onClick={e => e.stopPropagation()}
                >
                  {renderMarkdown(changelog)}
                </div>
              ) : (
                <div className="text-center py-8 text-space-300">
                  <p>{t("changelogNotAvailable")}</p>
                </div>
              )}
            </Tabs.Content>

            {/* FAQ Tab */}
            <Tabs.Content
              value="faq"
              className="space-y-4"
              onClick={e => e.stopPropagation()}
              data-testid="help-tab-faq"
            >
              <h3 className="text-xl font-bold text-neon-purple mb-4">{t("faqLabel")}</h3>

              {(() => {
                const faqCategories = t("faq.categories", { returnObjects: true }) as Record<
                  string,
                  { title: string; questions: Array<{ question: string; answer: string }> }
                >;
                return Object.entries(faqCategories).map(([categoryKey, category]) => (
                  <div
                    key={categoryKey}
                    className="bg-dark-800/50 backdrop-blur-sm rounded-lg p-4 border border-neon-purple/30"
                  >
                    <h4 className="text-lg font-semibold text-white mb-3">{category.title}</h4>
                    <div className="space-y-4">
                      {category.questions.map((q, index) => (
                        <div key={index} className="border-l-2 border-neon-purple/50 pl-4">
                          <p className="font-semibold text-neon-purple mb-2">{q.question}</p>
                          <p className="text-space-200 whitespace-pre-line">{q.answer}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ));
              })()}
            </Tabs.Content>

            {/* Keyboard Shortcuts Tab */}
            <Tabs.Content
              value="keyboardShortcuts"
              className="space-y-4"
              onClick={e => e.stopPropagation()}
              data-testid="help-tab-keyboard-shortcuts"
            >
              <h3 className="text-xl font-bold text-neon-purple mb-4">{t("keyboardShortcuts")}</h3>

              <div className="space-y-4">
                {/* Undo */}
                <div className="bg-dark-800/50 backdrop-blur-sm rounded-lg p-4 border border-neon-purple/30">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">{t("shortcuts.undo")}</span>
                    <kbd className="px-2 py-1 bg-dark-700 text-neon-cyan rounded border border-neon-cyan/50">
                      {t("shortcutKeys.ctrlZ")}
                    </kbd>
                  </div>
                </div>

                {/* Redo */}
                <div className="bg-dark-800/50 backdrop-blur-sm rounded-lg p-4 border border-neon-purple/30">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">{t("shortcuts.redo")}</span>
                    <kbd className="px-2 py-1 bg-dark-700 text-neon-cyan rounded border border-neon-cyan/50">
                      {t("shortcutKeys.ctrlY")}
                    </kbd>
                  </div>
                </div>

                {/* Mod Settings */}
                <div className="bg-dark-800/50 backdrop-blur-sm rounded-lg p-4 border border-neon-purple/30">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">{t("shortcuts.modSettings")}</span>
                    <kbd className="px-2 py-1 bg-dark-700 text-neon-cyan rounded border border-neon-cyan/50">
                      {t("shortcutKeys.ctrlShiftM")}
                    </kbd>
                  </div>
                </div>

                {/* Language Switch */}
                <div className="bg-dark-800/50 backdrop-blur-sm rounded-lg p-4 border border-neon-purple/30">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">
                      {t("shortcuts.languageSwitch")}
                    </span>
                    <kbd className="px-2 py-1 bg-dark-700 text-neon-cyan rounded border border-neon-cyan/50">
                      {t("shortcutKeys.ctrlL")}
                    </kbd>
                  </div>
                </div>

                {/* Help Modal */}
                <div className="bg-dark-800/50 backdrop-blur-sm rounded-lg p-4 border border-neon-purple/30">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">{t("shortcuts.helpModal")}</span>
                    <div className="flex gap-2">
                      <kbd className="px-2 py-1 bg-dark-700 text-neon-cyan rounded border border-neon-cyan/50">
                        {t("shortcutKeys.ctrlQuestion")}
                      </kbd>
                      <span className="text-space-300">/</span>
                      <kbd className="px-2 py-1 bg-dark-700 text-neon-cyan rounded border border-neon-cyan/50">
                        {t("shortcutKeys.f1")}
                      </kbd>
                    </div>
                  </div>
                </div>

                {/* Close Modal */}
                <div className="bg-dark-800/50 backdrop-blur-sm rounded-lg p-4 border border-neon-purple/30">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">{t("shortcuts.closeModal")}</span>
                    <kbd className="px-2 py-1 bg-dark-700 text-neon-cyan rounded border border-neon-cyan/50">
                      {t("shortcutKeys.escape")}
                    </kbd>
                  </div>
                </div>

                {/* Accessibility Policy */}
                <div className="bg-dark-800/50 backdrop-blur-sm rounded-lg p-4 border border-neon-purple/30">
                  <h4 className="text-lg font-semibold text-white mb-3">
                    {t("accessibility.policy")}
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <h5 className="font-medium text-neon-purple mb-2">
                        {t("accessibility.keyboardNavigation")}
                      </h5>
                      <p className="text-space-200">
                        {t("accessibility.keyboardNavigationDescription")}
                      </p>
                    </div>
                    <div>
                      <h5 className="font-medium text-neon-purple mb-2">
                        {t("accessibility.screenReader")}
                      </h5>
                      <p className="text-space-200">{t("accessibility.screenReaderDescription")}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Tabs.Content>

            {/* Patch Diff Tab */}
            <Tabs.Content
              value="patchDiff"
              className="space-y-4"
              onClick={e => e.stopPropagation()}
              data-testid="help-tab-patch-diff"
            >
              <PatchInfoView />
            </Tabs.Content>

            {/* Feedback Tab */}
            <Tabs.Content
              value="feedback"
              className="space-y-4"
              onClick={e => e.stopPropagation()}
              data-testid="help-tab-feedback"
            >
              <h3 className="text-xl font-bold text-neon-purple mb-4">{t("feedbackForm.title")}</h3>

              {/* Bug Report Info */}
              <div className="bg-dark-800/50 backdrop-blur-sm rounded-lg p-4 border border-neon-purple/30">
                <h4 className="text-lg font-semibold text-white mb-3">
                  {t("support.bugReportInfo")}
                </h4>
                <ul className="list-disc list-inside space-y-1 text-space-200">
                  {(() => {
                    const items = t("support.bugReportInfoItems", {
                      returnObjects: true,
                    }) as string[];
                    return items.map((item, index) => <li key={index}>{item}</li>);
                  })()}
                </ul>
              </div>

              {/* Response Policy */}
              <div className="bg-dark-800/50 backdrop-blur-sm rounded-lg p-4 border border-neon-purple/30">
                <h4 className="text-lg font-semibold text-white mb-3">
                  {t("support.responsePolicy")}
                </h4>
                <p className="text-space-200">{t("support.responsePolicyDescription")}</p>
              </div>

              <FeedbackForm />
            </Tabs.Content>
          </div>
        </Tabs.Root>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
