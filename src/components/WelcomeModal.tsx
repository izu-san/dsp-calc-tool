import { useState } from "react";
import { useTranslation } from "react-i18next";
import { createPortal } from "react-dom";

const TUTORIAL_SEEN_KEY = "dsp_calc_tutorial_seen";

export function WelcomeModal() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(() => {
    const seen = localStorage.getItem(TUTORIAL_SEEN_KEY);
    return !seen;
  });
  const [currentStep, setCurrentStep] = useState(0);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem(TUTORIAL_SEEN_KEY, "true");
  };

  const handleSkip = () => {
    setIsOpen(false);
    localStorage.setItem(TUTORIAL_SEEN_KEY, "true");
  };

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
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[10000] p-4"
      data-testid="welcome-modal"
    >
      <div className="bg-gray-800 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-6 pb-4">
          <h2 className="text-2xl font-bold text-white mb-2">{steps[currentStep].title}</h2>
          <div className="flex gap-1">
            {steps.map((_, index) => (
              <div
                key={index}
                data-testid={`welcome-step-indicator-${index + 1}`}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  index <= currentStep ? "bg-blue-500" : "bg-gray-600"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">{steps[currentStep].content}</div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-800 border-t border-gray-700 p-6 pt-4">
          <div className="flex justify-between items-center">
            <div data-testid="welcome-step-progress" className="text-sm text-gray-400">
              {t("stepProgress", { current: currentStep + 1, total: steps.length })}
            </div>

            <div className="flex gap-2">
              {currentStep === 0 && (
                <button
                  data-testid="welcome-skip-button"
                  onClick={handleSkip}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  {t("skip")}
                </button>
              )}

              {currentStep > 0 && (
                <button
                  data-testid="welcome-back-button"
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  {t("back")}
                </button>
              )}

              {currentStep < steps.length - 1 ? (
                <button
                  data-testid="welcome-next-button"
                  onClick={() => setCurrentStep(currentStep + 1)}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  {t("next")}
                </button>
              ) : (
                <button
                  data-testid="welcome-start-button"
                  onClick={handleClose}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
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
