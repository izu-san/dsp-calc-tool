import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useToast } from "../../components/ToastProvider/useToast";

export type SubmitMethod = "github" | "form";

/**
 * GitHubリポジトリのURLを取得する
 */
function getGitHubRepoUrl(): string {
  return import.meta.env.GITHUB_REPO_URL || "https://github.com/izu-san/dsp-calc-tool";
}

/**
 * GitHub Issues作成ページへのURLを生成する
 */
function getGitHubIssueUrl(): string {
  const githubRepoUrl = getGitHubRepoUrl();
  return `${githubRepoUrl}/issues/new?template=feedback.md&labels=feedback`;
}

/**
 * Google FormのURLを取得する（環境変数から）
 */
function getGoogleFormUrl(): string {
  return import.meta.env.VITE_GOOGLE_FORM_URL || "";
}

export function FeedbackForm() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [submitMethod, setSubmitMethod] = useState<SubmitMethod>("github");

  const handleGitHubIssueClick = () => {
    const url = getGitHubIssueUrl();
    window.open(url, "_blank");
    showToast(t("feedbackForm.success.github"), undefined, "success", 5000);
  };

  const handleGoogleFormClick = () => {
    const googleFormUrl = getGoogleFormUrl();
    if (!googleFormUrl) {
      showToast(t("feedbackForm.error.formNotConfigured"), undefined, "error", 5000);
      return;
    }
    window.open(googleFormUrl, "_blank");
    showToast(t("feedbackForm.success.form"), undefined, "success", 5000);
  };

  return (
    <div className="space-y-4" data-testid="feedback-form">
      {/* 送信方法選択 */}
      <div className="space-y-2" data-testid="feedback-form-submit-method-field">
        <label className="text-sm font-medium text-white">
          {t("feedbackForm.submitMethod.label")}
          <span className="text-red-400 ml-1">*</span>
        </label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="submitMethod"
              value="github"
              checked={submitMethod === "github"}
              onChange={e => setSubmitMethod(e.target.value as SubmitMethod)}
              className="w-4 h-4 bg-dark-700 border border-neon-purple/40 rounded text-neon-purple focus:ring-2 focus:ring-neon-purple/50"
              data-testid="feedback-form-submit-method-github"
            />
            <span className="text-white">{t("feedbackForm.submitMethod.github")}</span>
          </label>
          {getGoogleFormUrl() && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="submitMethod"
                value="form"
                checked={submitMethod === "form"}
                onChange={e => setSubmitMethod(e.target.value as SubmitMethod)}
                className="w-4 h-4 bg-dark-700 border border-neon-purple/40 rounded text-neon-purple focus:ring-2 focus:ring-neon-purple/50"
                data-testid="feedback-form-submit-method-form"
              />
              <span className="text-white">{t("feedbackForm.submitMethod.form")}</span>
            </label>
          )}
        </div>
        <p className="text-xs text-space-400">{t("feedbackForm.submitMethod.description")}</p>
      </div>

      {/* GitHub Issueで報告の場合 */}
      {submitMethod === "github" && (
        <div className="bg-dark-800/50 backdrop-blur-sm rounded-lg p-4 border border-neon-purple/30">
          <p className="text-space-200 mb-4">{t("feedbackForm.githubIssue.description")}</p>
          <button
            type="button"
            onClick={handleGitHubIssueClick}
            className="inline-block px-4 py-2 bg-neon-purple/30 border border-neon-purple/50 text-white rounded-lg hover:bg-neon-purple/40 hover:border-neon-purple hover:shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all ripple-effect"
            data-testid="feedback-form-github-issue-button"
          >
            {t("feedbackForm.githubIssue.button")}
          </button>
        </div>
      )}

      {/* Google Formで報告の場合 */}
      {submitMethod === "form" && (
        <div className="bg-dark-800/50 backdrop-blur-sm rounded-lg p-4 border border-neon-purple/30">
          <p className="text-space-200 mb-4">{t("feedbackForm.googleForm.description")}</p>
          <button
            type="button"
            onClick={handleGoogleFormClick}
            className="inline-block px-4 py-2 bg-neon-purple/30 border border-neon-purple/50 text-white rounded-lg hover:bg-neon-purple/40 hover:border-neon-purple hover:shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all ripple-effect"
            data-testid="feedback-form-google-form-button"
          >
            {t("feedbackForm.googleForm.button")}
          </button>
        </div>
      )}
    </div>
  );
}
