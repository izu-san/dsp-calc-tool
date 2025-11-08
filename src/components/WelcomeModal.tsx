import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { createPortal } from "react-dom";
import { useGameDataStore } from "../stores/gameDataStore";
import { cn } from "../utils/classNames";
import { MODAL_GLOW, HOVER_CARD_GLOW } from "../constants/theme";

const TUTORIAL_SEEN_KEY = "dsp_calc_tutorial_seen";

export function WelcomeModal() {
  const { t } = useTranslation();
  const { locale, setLocale } = useGameDataStore();
  const [isOpen, setIsOpen] = useState(() => {
    const seen = localStorage.getItem(TUTORIAL_SEEN_KEY);
    return !seen;
  });
  const [currentStep, setCurrentStep] = useState(0);

  const languages = [
    { code: "ja", label: "日本語", flag: "🇯🇵" },
    { code: "en", label: "English", flag: "🇺🇸" },
  ];

  const currentLanguage = languages.find(lang => lang.code === locale) || languages[0];

  const handleLanguageSwitch = () => {
    const nextLocale = locale === "ja" ? "en" : "ja";
    setLocale(nextLocale);
  };

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem(TUTORIAL_SEEN_KEY, "true");
  };

  const handleSkip = () => {
    setIsOpen(false);
    localStorage.setItem(TUTORIAL_SEEN_KEY, "true");
  };

  // Escキーでモーダルを閉じる
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const steps = [
    {
      title: t("welcomeToCalculator"),
      content: (
        <div className="space-y-4">
          <p className="text-gray-300">{t("calculatorDescription")}</p>
          <div className="bg-dark-700/50 backdrop-blur-sm rounded-lg p-4 border border-neon-blue/30">
            <h3 className="font-semibold text-neon-cyan mb-2">{t("mainFeatures")}</h3>
            <ul className="list-disc list-inside space-y-1 text-gray-300">
              <li>{t("automaticProductionTree")}</li>
              <li>{t("alternativeRecipeSelection")}</li>
              <li>{t("bottleneckDetection")}</li>
              <li>{t("whatIfSimulation")}</li>
              <li>{t("planSaveShare")}</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      title: t("basicUsage"),
      content: (
        <div className="space-y-4">
          <div className="bg-dark-700/50 backdrop-blur-sm rounded-lg p-4 border border-neon-blue/30">
            <h3 className="font-semibold text-neon-cyan mb-2">{t("step1SelectRecipe")}</h3>
            <p className="text-gray-300 text-sm">{t("step1Description")}</p>
          </div>

          <div className="bg-dark-700/50 backdrop-blur-sm rounded-lg p-4 border border-neon-blue/30">
            <h3 className="font-semibold text-neon-cyan mb-2">{t("step2SetTarget")}</h3>
            <p className="text-gray-300 text-sm">{t("step2Description")}</p>
          </div>

          <div className="bg-dark-700/50 backdrop-blur-sm rounded-lg p-4 border border-neon-blue/30">
            <h3 className="font-semibold text-neon-cyan mb-2">{t("step3AdjustSettings")}</h3>
            <p className="text-gray-300 text-sm">{t("step3Description")}</p>
          </div>

          <div className="bg-dark-700/50 backdrop-blur-sm rounded-lg p-4 border border-neon-blue/30">
            <h3 className="font-semibold text-neon-cyan mb-2">{t("step4CheckResults")}</h3>
            <p className="text-gray-300 text-sm">{t("step4Description")}</p>
          </div>
        </div>
      ),
    },
    {
      title: t("convenientFeatures"),
      content: (
        <div className="space-y-4">
          <div className="bg-dark-700/50 backdrop-blur-sm rounded-lg p-4 border border-neon-blue/30">
            <h3 className="font-semibold text-neon-cyan mb-2">{t("urlSharing")}</h3>
            <p className="text-gray-300 text-sm">{t("urlSharingDescription")}</p>
          </div>

          <div className="bg-dark-700/50 backdrop-blur-sm rounded-lg p-4 border border-neon-blue/30">
            <h3 className="font-semibold text-neon-cyan mb-2">{t("planSaving")}</h3>
            <p className="text-gray-300 text-sm">{t("planSavingDescription")}</p>
          </div>

          <div className="bg-dark-700/50 backdrop-blur-sm rounded-lg p-4 border border-neon-blue/30">
            <h3 className="font-semibold text-neon-cyan mb-2">{t("whatIfSimulatorFeature")}</h3>
            <p className="text-gray-300 text-sm">{t("whatIfSimulatorDescription")}</p>
          </div>

          <div className="bg-dark-700/50 backdrop-blur-sm rounded-lg p-4 border border-neon-blue/30">
            <h3 className="font-semibold text-neon-cyan mb-2">{t("templateFeature")}</h3>
            <p className="text-gray-300 text-sm">{t("templateFeatureDescription")}</p>
          </div>
        </div>
      ),
    },
  ];

  if (!isOpen) return null;

  const modal = (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[10000] p-4 animate-fadeIn"
      data-testid="welcome-modal"
    >
      <div
        className={`bg-dark-700/95 backdrop-blur-md border-2 border-neon-blue/40 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-fadeInScale ${MODAL_GLOW.blue}`}
      >
        {/* Header */}
        <div className="sticky top-0 bg-dark-700/95 backdrop-blur-md border-b border-neon-blue/40 p-6 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-2">{steps[currentStep].title}</h2>
              <div className="flex gap-1">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    data-testid={`welcome-step-indicator-${index + 1}`}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      index <= currentStep ? "bg-neon-blue/40" : "bg-dark-600"
                    }`}
                  />
                ))}
              </div>
            </div>
            {/* 言語切替ボタン */}
            <button
              onClick={handleLanguageSwitch}
              className={cn(
                "px-3 py-2 bg-neon-cyan/30 border border-neon-cyan/40 text-white rounded-lg hover:bg-neon-cyan/40 hover:border-neon-cyan transition-all ripple-effect flex items-center gap-2 ml-4",
                HOVER_CARD_GLOW.cyan
              )}
              aria-label={t("changeLanguage")}
              title={t("changeLanguage")}
              data-testid="welcome-language-switch"
            >
              <span>{currentLanguage.flag}</span>
              <span className="text-sm">{currentLanguage.label}</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">{steps[currentStep].content}</div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-dark-700/95 backdrop-blur-md border-t border-neon-blue/40 p-6 pt-4">
          <div className="flex justify-between items-center">
            <div data-testid="welcome-step-progress" className="text-sm text-space-300">
              {t("stepProgress", { current: currentStep + 1, total: steps.length })}
            </div>

            <div className="flex gap-2">
              {currentStep === 0 && (
                <button
                  data-testid="welcome-skip-button"
                  onClick={handleSkip}
                  className="px-4 py-2 text-space-300 hover:text-white transition-colors"
                >
                  {t("skip")}
                </button>
              )}

              {currentStep > 0 && (
                <button
                  data-testid="welcome-back-button"
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="px-4 py-2 bg-dark-600 hover:bg-dark-500 text-white rounded-lg transition-colors"
                >
                  {t("back")}
                </button>
              )}

              {currentStep < steps.length - 1 ? (
                <button
                  data-testid="welcome-next-button"
                  onClick={() => setCurrentStep(currentStep + 1)}
                  className="px-6 py-2 bg-neon-blue/40 hover:bg-neon-blue/50 text-white rounded-lg font-medium transition-colors"
                >
                  {t("next")}
                </button>
              ) : (
                <button
                  data-testid="welcome-start-button"
                  onClick={handleClose}
                  className="px-6 py-2 bg-neon-green/30 hover:bg-neon-green/40 text-white rounded-lg font-medium transition-colors"
                >
                  {t("getStarted")}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
