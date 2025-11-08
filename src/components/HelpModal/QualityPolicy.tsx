import { useTranslation } from "react-i18next";

export function QualityPolicy() {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      {/* 設計思想 */}
      <div className="bg-dark-800/50 backdrop-blur-sm rounded-lg p-4 border border-neon-purple/30">
        <h4 className="text-lg font-semibold text-white mb-3">{t("designPhilosophy")}</h4>
        <p className="text-space-200 whitespace-pre-line text-sm leading-relaxed">
          {t("designPhilosophyDescription")}
        </p>
      </div>

      {/* 品質保証ポリシー */}
      <div className="bg-dark-800/50 backdrop-blur-sm rounded-lg p-4 border border-neon-purple/30">
        <h4 className="text-lg font-semibold text-white mb-3">{t("qualityPolicy")}</h4>
        <p className="text-space-200 whitespace-pre-line text-sm leading-relaxed">
          {t("qualityPolicyDescription")}
        </p>
      </div>
    </div>
  );
}
