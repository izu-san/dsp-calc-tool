import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { useSettingsStore } from "../../stores/settingsStore";
import {
  SETTINGS_TEMPLATES,
  extractCustomTemplateId,
  isCustomTemplateId,
} from "../../types/settings";
import { cn } from "../../utils/classNames";
import {
  CARD_GLOW,
  MODAL_GLOW,
  ICON_GLOW,
  TEXT_GLOW,
  BORDER_COLOR,
} from "../../constants/theme";

export function TemplateSelector() {
  const { t } = useTranslation();
  const {
    applyTemplate,
    customTemplates,
    createCustomTemplate,
    updateCustomTemplate,
    deleteCustomTemplate,
    applyCustomTemplate,
    selectedTemplate,
    settings,
  } = useSettingsStore();

  // デフォルトテンプレート用の状態
  const [showDefaultConfirm, setShowDefaultConfirm] = useState(false);
  const [selectedDefaultTemplate, setSelectedDefaultTemplate] = useState<
    keyof typeof SETTINGS_TEMPLATES | null
  >(null);

  // カスタムテンプレート用の状態
  const [showCustomConfirm, setShowCustomConfirm] = useState(false);
  const [selectedCustomTemplateId, setSelectedCustomTemplateId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [templateNote, setTemplateNote] = useState("");
  const [nameError, setNameError] = useState("");
  const [showOverwriteConfirm, setShowOverwriteConfirm] = useState(false);
  const [overwriteTargetId, setOverwriteTargetId] = useState<string | null>(null);

  // Escキーでモーダルを閉じる
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showOverwriteConfirm) {
          setShowOverwriteConfirm(false);
          setOverwriteTargetId(null);
        } else if (showDefaultConfirm) {
          setShowDefaultConfirm(false);
          setSelectedDefaultTemplate(null);
        } else if (showCustomConfirm) {
          setShowCustomConfirm(false);
          setSelectedCustomTemplateId(null);
        } else if (showCreateModal) {
          setShowCreateModal(false);
          setTemplateName("");
          setTemplateNote("");
          setNameError("");
        } else if (showEditModal) {
          setShowEditModal(false);
          setEditingTemplateId(null);
          setTemplateName("");
          setTemplateNote("");
          setNameError("");
        } else if (showDeleteConfirm) {
          setShowDeleteConfirm(false);
          setSelectedCustomTemplateId(null);
        }
      }
    };

    if (
      showDefaultConfirm ||
      showCustomConfirm ||
      showCreateModal ||
      showEditModal ||
      showDeleteConfirm ||
      showOverwriteConfirm
    ) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [
    showDefaultConfirm,
    showCustomConfirm,
    showCreateModal,
    showEditModal,
    showDeleteConfirm,
    showOverwriteConfirm,
    setOverwriteTargetId,
  ]);

  const templateOrder: (keyof typeof SETTINGS_TEMPLATES)[] = [
    "earlyGame",
    "midGame",
    "lateGame",
    "endGame",
  ];

  // デフォルトテンプレートのハンドラー
  const handleDefaultTemplateClick = (templateId: keyof typeof SETTINGS_TEMPLATES) => {
    setSelectedDefaultTemplate(templateId);
    setShowDefaultConfirm(true);
  };

  const handleDefaultConfirm = () => {
    if (selectedDefaultTemplate) {
      applyTemplate(selectedDefaultTemplate);
      setShowDefaultConfirm(false);
      setSelectedDefaultTemplate(null);
    }
  };

  const handleDefaultCancel = () => {
    setShowDefaultConfirm(false);
    setSelectedDefaultTemplate(null);
  };

  // カスタムテンプレートのハンドラー
  const handleCustomTemplateClick = (id: string) => {
    setSelectedCustomTemplateId(id);
    setShowCustomConfirm(true);
  };

  const handleCustomConfirm = () => {
    if (selectedCustomTemplateId) {
      applyCustomTemplate(selectedCustomTemplateId);
      setShowCustomConfirm(false);
      setSelectedCustomTemplateId(null);
    }
  };

  const handleCustomCancel = () => {
    setShowCustomConfirm(false);
    setSelectedCustomTemplateId(null);
  };

  // 作成モーダル
  const handleCreateClick = () => {
    setTemplateName("");
    setTemplateNote("");
    setNameError("");
    setShowCreateModal(true);
  };

  const handleCreateConfirm = () => {
    const trimmedName = templateName.trim();
    if (!trimmedName) {
      setNameError(t("templateName") + " は必須です");
      return;
    }
    // 全角スペースのみのチェック（trim()では削除されないため）
    // eslint-disable-next-line no-irregular-whitespace
    if (trimmedName.replace(/　/g, "") === "") {
      setNameError(t("templateName") + " は必須です");
      return;
    }
    if (trimmedName.length < 1 || trimmedName.length > 40) {
      setNameError(t("templateName") + " は1〜40文字で入力してください");
      return;
    }
    if (templateName !== trimmedName) {
      setNameError(t("templateName") + " の前後には空白を含めないでください");
      return;
    }

    // 重複チェック
    const existingTemplate = Object.values(customTemplates || {}).find(
      t => t.meta.name === trimmedName
    );
    if (existingTemplate) {
      setOverwriteTargetId(existingTemplate.meta.id);
      setShowOverwriteConfirm(true);
      return;
    }

    try {
      createCustomTemplate(trimmedName, templateNote.trim() || undefined);
      setShowCreateModal(false);
      setTemplateName("");
      setTemplateNote("");
      setNameError("");
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("Maximum number")) {
          setNameError(t("customTemplateMaxReached"));
        } else if (error.message.includes("already exists")) {
          setNameError(t("customTemplateDuplicateName"));
        } else {
          setNameError(error.message);
        }
      }
    }
  };

  const handleCreateCancel = () => {
    setShowCreateModal(false);
    setTemplateName("");
    setTemplateNote("");
    setNameError("");
  };

  // 上書き確認
  const handleOverwriteConfirm = () => {
    if (!overwriteTargetId) return;

    const trimmedName = templateName.trim();
    try {
      updateCustomTemplate(
        overwriteTargetId,
        trimmedName,
        templateNote.trim() || undefined,
        settings
      );
      setShowOverwriteConfirm(false);
      setShowCreateModal(false);
      setTemplateName("");
      setTemplateNote("");
      setNameError("");
      setOverwriteTargetId(null);
    } catch (error) {
      if (error instanceof Error) {
        setNameError(error.message);
      }
    }
  };

  const handleOverwriteCancel = () => {
    setShowOverwriteConfirm(false);
    setOverwriteTargetId(null);
  };

  // 編集モーダル
  const handleEditClick = (id: string) => {
    const template = customTemplates?.[id];
    if (!template) return;

    setEditingTemplateId(id);
    setTemplateName(template.meta.name);
    setTemplateNote(template.meta.note || "");
    setNameError("");
    setShowEditModal(true);
  };

  const handleEditConfirm = () => {
    if (!editingTemplateId) return;

    const trimmedName = templateName.trim();
    if (!trimmedName) {
      setNameError(t("templateName") + " は必須です");
      return;
    }
    // 全角スペースのみのチェック（trim()では削除されないため）
    // eslint-disable-next-line no-irregular-whitespace
    if (trimmedName.replace(/　/g, "") === "") {
      setNameError(t("templateName") + " は必須です");
      return;
    }
    if (trimmedName.length < 1 || trimmedName.length > 40) {
      setNameError(t("templateName") + " は1〜40文字で入力してください");
      return;
    }
    if (templateName !== trimmedName) {
      setNameError(t("templateName") + " の前後には空白を含めないでください");
      return;
    }

    const trimmedNote = templateNote.trim();
    if (trimmedNote.length > 120) {
      setNameError(t("templateNote") + " は120文字以内で入力してください");
      return;
    }

    try {
      updateCustomTemplate(editingTemplateId, trimmedName, trimmedNote || undefined);
      setShowEditModal(false);
      setEditingTemplateId(null);
      setTemplateName("");
      setTemplateNote("");
      setNameError("");
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("already exists")) {
          setNameError(t("customTemplateDuplicateName"));
        } else {
          setNameError(error.message);
        }
      }
    }
  };

  const handleEditCancel = () => {
    setShowEditModal(false);
    setEditingTemplateId(null);
    setTemplateName("");
    setTemplateNote("");
    setNameError("");
  };

  // 現在の設定で上書き
  const handleOverwriteWithCurrent = () => {
    if (!editingTemplateId) return;

    try {
      updateCustomTemplate(editingTemplateId, undefined, undefined, settings);
      setShowEditModal(false);
      setEditingTemplateId(null);
    } catch (error) {
      if (error instanceof Error) {
        setNameError(error.message);
      }
    }
  };

  // 削除確認
  const handleDeleteClick = (id: string) => {
    setSelectedCustomTemplateId(id);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedCustomTemplateId) {
      deleteCustomTemplate(selectedCustomTemplateId);
      setShowDeleteConfirm(false);
      setSelectedCustomTemplateId(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setSelectedCustomTemplateId(null);
  };

  // 機械ランクの値をフォーマットするヘルパー
  const formatMachineRank = (recipeType: string, rank: string): string => {
    const rankMap: Record<string, Record<string, string>> = {
      Smelt: {
        arc: t("arcSmelter"),
        plane: t("planeSmelter"),
        negentropy: t("negentropySmelter"),
      },
      Assemble: {
        mk1: t("mk1"),
        mk2: t("mk2"),
        mk3: t("mk3"),
        recomposing: t("recomposingAssembler"),
      },
      Chemical: {
        standard: t("chemicalPlantStandard"),
        quantum: t("quantumChemicalPlant"),
      },
      Research: {
        standard: t("matrixLabStandard"),
        "self-evolution": t("selfEvolutionLab"),
      },
    };

    return rankMap[recipeType]?.[rank] || rank;
  };

  // テンプレート設定の差分表示用ヘルパー
  const renderTemplateSettings = (templateSettings: typeof settings) => {
    const machineRankLabels: Record<string, string> = {
      Smelt: t("smelter"),
      Assemble: t("assembler"),
      Chemical: t("chemicalPlant"),
      Research: t("matrixLab"),
      Refine: t("oilRefinery"),
      Particle: t("particleCollider"),
    };

    const machineRankIcons: Record<string, string> = {
      Smelt: "🔥",
      Assemble: "⚙️",
      Chemical: "🧪",
      Research: "🔬",
      Refine: "🛢️",
      Particle: "⚛️",
    };

    const hasAlternativeRecipes = templateSettings.alternativeRecipes.size > 0;
    const hasNonDefaultMultiplier =
      templateSettings.proliferatorMultiplier.production !== 1 ||
      templateSettings.proliferatorMultiplier.speed !== 1;
    const hasPhotonSettings =
      templateSettings.photonGeneration.useGravitonLens ||
      templateSettings.photonGeneration.rayTransmissionEfficiency > 0 ||
      templateSettings.photonGeneration.gravitonLensProliferator.type !== "none";

    return (
      <div
        className="bg-dark-800/50 border border-neon-blue/30 backdrop-blur-sm rounded-lg p-4 mb-4 space-y-2 text-sm max-h-96 overflow-y-auto"
        data-testid="template-settings-preview"
      >
        {/* コンベアベルト */}
        <div className="flex justify-between">
          <span className="text-space-300">{t("conveyorBelt")}:</span>
          <span className="font-medium text-neon-cyan">
            Mk.{templateSettings.conveyorBelt.tier.toUpperCase().replace("MK", "")}
            {templateSettings.conveyorBelt.stackCount > 1 &&
              ` (${templateSettings.conveyorBelt.stackCount} ${t("stacks")})`}
          </span>
        </div>

        {/* ソーター */}
        <div className="flex justify-between">
          <span className="text-space-300">{t("sorter")}:</span>
          <span className="font-medium text-neon-cyan">
            {templateSettings.sorter.tier === "pile"
              ? t("pilingSorter")
              : `Mk.${templateSettings.sorter.tier.toUpperCase().replace("MK", "")}`}
          </span>
        </div>

        {/* 増産剤 */}
        <div className="flex justify-between">
          <span className="text-space-300">{t("proliferator")}:</span>
          <span className="font-medium text-neon-cyan">
            {templateSettings.proliferator.type === "none"
              ? t("none")
              : `${templateSettings.proliferator.type.toUpperCase()} (${templateSettings.proliferator.mode === "production" ? t("productionMode") : t("speedMode")})`}
          </span>
        </div>

        {/* 増産剤倍率（デフォルト以外の場合のみ表示） */}
        {hasNonDefaultMultiplier && (
          <div className="flex justify-between">
            <span className="text-space-300">{t("proliferatorMultiplier")}:</span>
            <span className="font-medium text-neon-cyan">
              {t("productionMode")}: {templateSettings.proliferatorMultiplier.production}x,{" "}
              {t("speedMode")}: {templateSettings.proliferatorMultiplier.speed}x
            </span>
          </div>
        )}

        {/* 機械ランク */}
        {(
          Object.keys(templateSettings.machineRank) as Array<
            keyof typeof templateSettings.machineRank
          >
        )
          .filter(recipeType => recipeType !== "Refine" && recipeType !== "Particle")
          .map(recipeType => (
            <div key={recipeType} className="flex justify-between">
              <span className="text-space-300">
                {machineRankIcons[recipeType]} {machineRankLabels[recipeType]}:
              </span>
              <span className="font-medium text-neon-cyan">
                {formatMachineRank(recipeType, templateSettings.machineRank[recipeType])}
              </span>
            </div>
          ))}

        {/* 採掘速度研究 */}
        <div className="flex justify-between">
          <span className="text-space-300">{t("miningResearch")}:</span>
          <span className="font-medium text-neon-cyan">
            {templateSettings.miningSpeedResearch}% (+
            {templateSettings.miningSpeedResearch - 100}%)
          </span>
        </div>

        {/* 代替レシピ（設定されている場合のみ表示） */}
        {hasAlternativeRecipes && (
          <div className="flex justify-between">
            <span className="text-space-300">{t("alternativeRecipe")}:</span>
            <span className="font-medium text-neon-cyan">
              {templateSettings.alternativeRecipes.size} {t("items")}
            </span>
          </div>
        )}

        {/* 光子生成設定（設定されている場合のみ表示） */}
        {hasPhotonSettings && (
          <>
            <div className="border-t border-neon-blue/20 pt-2 mt-2">
              <div className="text-xs font-medium text-neon-purple mb-1">
                {t("photonGeneration")}
              </div>
            </div>
            {templateSettings.photonGeneration.useGravitonLens && (
              <div className="flex justify-between pl-2">
                <span className="text-space-300">{t("useGravitonLens")}:</span>
                <span className="font-medium text-neon-cyan">{t("yes")}</span>
              </div>
            )}
            {templateSettings.photonGeneration.rayTransmissionEfficiency > 0 && (
              <div className="flex justify-between pl-2">
                <span className="text-space-300">{t("rayTransmissionEfficiency")}:</span>
                <span className="font-medium text-neon-cyan">
                  {templateSettings.photonGeneration.rayTransmissionEfficiency / 100}%
                </span>
              </div>
            )}
            {templateSettings.photonGeneration.gravitonLensProliferator.type !== "none" && (
              <div className="flex justify-between pl-2">
                <span className="text-space-300">
                  {t("gravitonLens")} {t("proliferator")}:
                </span>
                <span className="font-medium text-neon-cyan">
                  {templateSettings.photonGeneration.gravitonLensProliferator.type.toUpperCase()} (
                  {templateSettings.photonGeneration.gravitonLensProliferator.mode === "production"
                    ? t("productionMode")
                    : t("speedMode")}
                  )
                </span>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  const currentDefaultTemplate = selectedDefaultTemplate
    ? SETTINGS_TEMPLATES[selectedDefaultTemplate]
    : null;
  const currentCustomTemplate = selectedCustomTemplateId
    ? customTemplates[selectedCustomTemplateId]
    : null;

  // カスタムテンプレートを配列に変換（作成日時の降順）
  const customTemplateList = Object.values(customTemplates || {}).sort(
    (a, b) => b.meta.createdAt - a.meta.createdAt
  );

  // 選択中のテンプレートを判定
  const isDefaultTemplateSelected = (templateId: keyof typeof SETTINGS_TEMPLATES) => {
    return selectedTemplate === templateId;
  };

  const isCustomTemplateSelected = (id: string) => {
    if (!selectedTemplate || !isCustomTemplateId(selectedTemplate)) return false;
    return extractCustomTemplateId(selectedTemplate) === id;
  };

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-neon-cyan mb-3 flex items-center gap-2">
        <span className="text-lg">🎮</span>
        {t("template")}
      </label>

      {/* デフォルトテンプレート */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        {templateOrder.map(templateId => {
          const template = SETTINGS_TEMPLATES[templateId];
          const isSelected = isDefaultTemplateSelected(templateId);
          return (
            <button
              key={templateId}
              data-testid={`template-button-${templateId}`}
              onClick={() => handleDefaultTemplateClick(templateId)}
              className={cn(
                "px-3 py-2 text-sm font-medium rounded-lg border-2 backdrop-blur-sm text-white transition-all",
                isSelected
                  ? "border-neon-blue bg-neon-blue/40 ${CARD_GLOW.blueStrong}"
                  : "border-neon-blue/40 bg-neon-blue/20 hover:border-neon-blue hover:bg-neon-blue/30 hover:scale-105 active:scale-95",
                "${ICON_GLOW.blue} hover:${CARD_GLOW.blueStrong} ripple-effect"
              )}
              title={t(`${templateId}Desc`)}
            >
              <span className="mr-1">{template.icon}</span>
              {t(templateId)}
            </button>
          );
        })}
      </div>

      {/* Power Saver Template */}
      <button
        data-testid="template-button-powerSaver"
        onClick={() => handleDefaultTemplateClick("powerSaver")}
        className={cn(
          "w-full px-3 py-2 text-sm font-medium rounded-lg border-2 backdrop-blur-sm text-white transition-all mb-4",
          isDefaultTemplateSelected("powerSaver")
            ? "border-neon-green bg-neon-green/40 ${CARD_GLOW.greenStrong}"
            : "border-neon-green/40 bg-neon-green/20 hover:border-neon-green hover:bg-neon-green/30 hover:scale-105 active:scale-95",
          "${ICON_GLOW.green} hover:${CARD_GLOW.greenStrong} ripple-effect"
        )}
        title={t("powerSaverDesc")}
      >
        <span className="mr-1">{SETTINGS_TEMPLATES.powerSaver.icon}</span>
        {t("powerSaver")}
      </button>

      {/* カスタムテンプレートセクション */}
      <div
        className="border-t border-neon-purple/30 pt-4 mt-4"
        data-testid="custom-template-section"
      >
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-neon-purple flex items-center gap-2">
            <span className="text-lg">⭐</span>
            {t("customTemplate")}
          </label>
          <button
            data-testid="create-custom-template-button"
            onClick={handleCreateClick}
            disabled={!customTemplates || Object.keys(customTemplates || {}).length >= 50}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-lg border-2 border-neon-purple/40 bg-neon-purple/20 backdrop-blur-sm text-white",
              "hover:border-neon-purple hover:bg-neon-purple/30 hover:scale-105 active:scale-95 transition-all",
              "shadow-[0_0_10px_rgba(168,85,247,0.3)] hover:${CARD_GLOW.purpleStrong} ripple-effect",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            )}
            title={
              !customTemplates || Object.keys(customTemplates || {}).length >= 50
                ? t("customTemplateMaxReached")
                : t("createCustomTemplate")
            }
          >
            ＋ {t("createCustomTemplate")}
          </button>
        </div>

        {/* カスタムテンプレート一覧 */}
        {customTemplateList.length === 0 ? (
          <div
            className="text-center py-8 text-space-300 text-sm"
            data-testid="custom-template-empty-state"
          >
            {t("customTemplateEmptyState")}
          </div>
        ) : (
          <div className="space-y-2">
            {customTemplateList.map(template => {
              const id = template.meta.id;
              const isSelected = isCustomTemplateSelected(id);
              return (
                <div
                  key={id}
                  data-testid={`custom-template-card-${id}`}
                  className={cn(
                    "px-3 py-2 rounded-lg border-2 backdrop-blur-sm transition-all",
                    isSelected
                      ? "border-neon-purple bg-neon-purple/40 shadow-[0_0_15px_rgba(168,85,247,0.6)]"
                      : "border-neon-purple/40 bg-neon-purple/20 hover:border-neon-purple hover:bg-neon-purple/30"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <button
                      data-testid={`custom-template-apply-button-${id}`}
                      onClick={() => handleCustomTemplateClick(id)}
                      className="flex-1 text-left"
                    >
                      <div className="font-medium text-white">{template.meta.name}</div>
                      {template.meta.note && (
                        <div className="text-xs text-space-200 mt-1">{template.meta.note}</div>
                      )}
                      <div className="text-xs text-space-300 mt-1">
                        {new Date(template.meta.updatedAt).toLocaleDateString()}
                      </div>
                    </button>
                    <div className="flex items-center gap-1 ml-2">
                      <button
                        data-testid={`edit-custom-template-${id}`}
                        onClick={() => handleEditClick(id)}
                        className="px-2 py-1 text-xs text-neon-cyan hover:text-neon-blue transition-colors"
                        title={t("editCustomTemplate")}
                      >
                        ✏️
                      </button>
                      <button
                        data-testid={`delete-custom-template-${id}`}
                        onClick={() => handleDeleteClick(id)}
                        className="px-2 py-1 text-xs text-neon-red hover:text-red-400 transition-colors"
                        title={t("deleteCustomTemplate")}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* デフォルトテンプレート確認モーダル */}
      {showDefaultConfirm &&
        currentDefaultTemplate &&
        createPortal(
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-fadeIn"
            data-testid="template-confirm-modal"
          >
            <div className="bg-dark-700/95 backdrop-blur-md border-2 border-neon-purple/40 rounded-xl ${MODAL_GLOW.purple} max-w-md w-full p-6 animate-fadeInScale">
              <div className="flex items-center gap-3 mb-4">
                <div className="text-3xl p-2 bg-neon-purple/20 border border-neon-purple/50 rounded-lg ${CARD_GLOW.purple}">
                  {currentDefaultTemplate.icon}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white ${TEXT_GLOW.purple}">
                    {t(selectedDefaultTemplate!)} {t("applyQuestion")}
                  </h3>
                  <p className="text-sm text-space-200">{t(`${selectedDefaultTemplate!}Desc`)}</p>
                </div>
              </div>

              {renderTemplateSettings(currentDefaultTemplate.settings)}

              <div className="flex gap-3">
                <button
                  data-testid="template-confirm-cancel-button"
                  onClick={handleDefaultCancel}
                  className={cn(
                    "flex-1 px-4 py-2 text-sm font-medium rounded-lg border-2 border-neon-blue/40 bg-dark-700/50 text-space-200",
                    "hover:border-neon-blue hover:bg-neon-blue/20 hover:text-neon-cyan transition-all ripple-effect"
                  )}
                >
                  {t("cancel")}
                </button>
                <button
                  data-testid="template-confirm-apply-button"
                  onClick={handleDefaultConfirm}
                  className={cn(
                    "flex-1 px-4 py-2 text-sm font-medium rounded-lg border-2 border-neon-green bg-neon-green/30 text-white",
                    "hover:bg-neon-green/40 transition-all",
                    "${CARD_GLOW.greenStrong} hover:shadow-[0_0_20px_rgba(0,255,136,0.6)] ripple-effect"
                  )}
                >
                  {t("apply")}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* カスタムテンプレート確認モーダル */}
      {showCustomConfirm &&
        currentCustomTemplate &&
        createPortal(
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-fadeIn"
            data-testid="custom-template-confirm-modal"
          >
            <div className="bg-dark-700/95 backdrop-blur-md border-2 border-neon-purple/40 rounded-xl ${MODAL_GLOW.purple} max-w-md w-full p-6 animate-fadeInScale">
              <div className="flex items-center gap-3 mb-4">
                <div className="text-3xl p-2 bg-neon-purple/20 border border-neon-purple/50 rounded-lg ${CARD_GLOW.purple}">
                  ⭐
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white ${TEXT_GLOW.purple}">
                    {currentCustomTemplate.meta.name} {t("applyQuestion")}
                  </h3>
                  <p className="text-sm text-space-200">
                    {t("customTemplate")} •{" "}
                    {new Date(currentCustomTemplate.meta.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {renderTemplateSettings(currentCustomTemplate.settings)}

              <div className="flex gap-3">
                <button
                  data-testid="custom-template-confirm-cancel-button"
                  onClick={handleCustomCancel}
                  className={cn(
                    "flex-1 px-4 py-2 text-sm font-medium rounded-lg border-2 border-neon-blue/40 bg-dark-700/50 text-space-200",
                    "hover:border-neon-blue hover:bg-neon-blue/20 hover:text-neon-cyan transition-all ripple-effect"
                  )}
                >
                  {t("cancel")}
                </button>
                <button
                  data-testid="custom-template-confirm-apply-button"
                  onClick={handleCustomConfirm}
                  className={cn(
                    "flex-1 px-4 py-2 text-sm font-medium rounded-lg border-2 border-neon-green bg-neon-green/30 text-white",
                    "hover:bg-neon-green/40 transition-all",
                    "${CARD_GLOW.greenStrong} hover:shadow-[0_0_20px_rgba(0,255,136,0.6)] ripple-effect"
                  )}
                >
                  {t("apply")}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* 作成モーダル */}
      {showCreateModal &&
        createPortal(
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-fadeIn"
            data-testid="create-template-modal"
          >
            <div className="bg-dark-700/95 backdrop-blur-md border-2 border-neon-purple/40 rounded-xl ${MODAL_GLOW.purple} max-w-md w-full p-6 animate-fadeInScale">
              <div className="flex items-center gap-3 mb-4">
                <div className="text-3xl p-2 bg-neon-purple/20 border border-neon-purple/50 rounded-lg ${CARD_GLOW.purple}">
                  ＋
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white ${TEXT_GLOW.purple}">
                    {t("createCustomTemplate")}
                  </h3>
                  <p className="text-sm text-space-200">{t("customTemplateEmptyState")}</p>
                </div>
              </div>

              <div className="space-y-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-neon-cyan mb-2">
                    {t("templateName")} <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={templateName}
                    onChange={e => {
                      setTemplateName(e.target.value);
                      setNameError("");
                    }}
                    maxLength={40}
                    className={cn(
                      "w-full px-3 py-2 bg-dark-800/50 border rounded-lg text-white",
                      "focus:outline-none focus:ring-2 focus:ring-neon-purple",
                      nameError ? "border-red-400" : "border-neon-purple/40"
                    )}
                    placeholder={t("templateName")}
                    data-testid="template-name-input"
                  />
                  {nameError && (
                    <p className="text-red-400 text-xs mt-1" data-testid="template-name-error">
                      {nameError}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-neon-cyan mb-2">
                    {t("templateNote")}
                  </label>
                  <textarea
                    value={templateNote}
                    onChange={e => {
                      setTemplateNote(e.target.value);
                      setNameError("");
                    }}
                    maxLength={120}
                    rows={3}
                    className={cn(
                      "w-full px-3 py-2 bg-dark-800/50 border border-neon-purple/40 rounded-lg text-white",
                      "focus:outline-none focus:ring-2 focus:ring-neon-purple resize-none"
                    )}
                    placeholder={t("templateNote")}
                    data-testid="template-note-input"
                  />
                  <p className="text-xs text-space-300 mt-1">
                    {templateNote.length}/120 {t("characters")}
                  </p>
                </div>

                {/* 現在の設定のプレビュー */}
                <div>
                  <label className="block text-sm font-medium text-neon-cyan mb-2">
                    {t("currentSettings")}
                  </label>
                  {renderTemplateSettings(settings)}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  data-testid="create-template-cancel-button"
                  onClick={handleCreateCancel}
                  className={cn(
                    "flex-1 px-4 py-2 text-sm font-medium rounded-lg border-2 border-neon-blue/40 bg-dark-700/50 text-space-200",
                    "hover:border-neon-blue hover:bg-neon-blue/20 hover:text-neon-cyan transition-all ripple-effect"
                  )}
                >
                  {t("cancel")}
                </button>
                <button
                  data-testid="create-template-save-button"
                  onClick={handleCreateConfirm}
                  className={cn(
                    "flex-1 px-4 py-2 text-sm font-medium rounded-lg border-2 border-neon-green bg-neon-green/30 text-white",
                    "hover:bg-neon-green/40 transition-all",
                    "${CARD_GLOW.greenStrong} hover:shadow-[0_0_20px_rgba(0,255,136,0.6)] ripple-effect"
                  )}
                >
                  {t("save")}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* 編集モーダル */}
      {showEditModal &&
        editingTemplateId &&
        customTemplates?.[editingTemplateId] &&
        createPortal(
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-fadeIn"
            data-testid="edit-template-modal"
          >
            <div className="bg-dark-700/95 backdrop-blur-md border-2 border-neon-purple/40 rounded-xl ${MODAL_GLOW.purple} max-w-md w-full p-6 animate-fadeInScale">
              <div className="flex items-center gap-3 mb-4">
                <div className="text-3xl p-2 bg-neon-purple/20 border border-neon-purple/50 rounded-lg ${CARD_GLOW.purple}">
                  ✏️
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white ${TEXT_GLOW.purple}">
                    {t("editCustomTemplate")}
                  </h3>
                  <p className="text-sm text-space-200">
                    {customTemplates?.[editingTemplateId]?.meta.name}
                  </p>
                </div>
              </div>

              <div className="space-y-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-neon-cyan mb-2">
                    {t("templateName")} <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={templateName}
                    onChange={e => {
                      setTemplateName(e.target.value);
                      setNameError("");
                    }}
                    maxLength={40}
                    className={cn(
                      "w-full px-3 py-2 bg-dark-800/50 border rounded-lg text-white",
                      "focus:outline-none focus:ring-2 focus:ring-neon-purple",
                      nameError ? "border-red-400" : "border-neon-purple/40"
                    )}
                    placeholder={t("templateName")}
                    data-testid="edit-template-name-input"
                  />
                  {nameError && (
                    <p className="text-red-400 text-xs mt-1" data-testid="edit-template-name-error">
                      {nameError}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-neon-cyan mb-2">
                    {t("templateNote")}
                  </label>
                  <textarea
                    value={templateNote}
                    onChange={e => {
                      setTemplateNote(e.target.value);
                      setNameError("");
                    }}
                    maxLength={120}
                    rows={3}
                    className={cn(
                      "w-full px-3 py-2 bg-dark-800/50 border border-neon-purple/40 rounded-lg text-white",
                      "focus:outline-none focus:ring-2 focus:ring-neon-purple resize-none"
                    )}
                    placeholder={t("templateNote")}
                    data-testid="edit-template-note-input"
                  />
                  <p className="text-xs text-space-300 mt-1">
                    {templateNote.length}/120 {t("characters")}
                  </p>
                </div>

                {/* 現在の設定で上書きボタン */}
                <button
                  data-testid="overwrite-with-current-button"
                  onClick={handleOverwriteWithCurrent}
                  className={cn(
                    "w-full px-4 py-2 text-sm font-medium rounded-lg border-2 border-neon-yellow/40 bg-neon-yellow/20 text-white",
                    "hover:border-neon-yellow hover:bg-neon-yellow/30 transition-all ripple-effect"
                  )}
                >
                  {t("overwriteWithCurrentSettings")}
                </button>
              </div>

              <div className="flex gap-3">
                <button
                  data-testid="edit-template-cancel-button"
                  onClick={handleEditCancel}
                  className={cn(
                    "flex-1 px-4 py-2 text-sm font-medium rounded-lg border-2 border-neon-blue/40 bg-dark-700/50 text-space-200",
                    "hover:border-neon-blue hover:bg-neon-blue/20 hover:text-neon-cyan transition-all ripple-effect"
                  )}
                >
                  {t("cancel")}
                </button>
                <button
                  data-testid="edit-template-save-button"
                  onClick={handleEditConfirm}
                  className={cn(
                    "flex-1 px-4 py-2 text-sm font-medium rounded-lg border-2 border-neon-green bg-neon-green/30 text-white",
                    "hover:bg-neon-green/40 transition-all",
                    "${CARD_GLOW.greenStrong} hover:shadow-[0_0_20px_rgba(0,255,136,0.6)] ripple-effect"
                  )}
                >
                  {t("save")}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* 削除確認モーダル */}
      {showDeleteConfirm &&
        selectedCustomTemplateId &&
        customTemplates?.[selectedCustomTemplateId] &&
        createPortal(
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-fadeIn"
            data-testid="delete-template-modal"
          >
            <div className="bg-dark-700/95 backdrop-blur-md border-2 border-neon-red/40 rounded-xl ${MODAL_GLOW.red} max-w-md w-full p-6 animate-fadeInScale">
              <div className="flex items-center gap-3 mb-4">
                <div className="text-3xl p-2 bg-neon-red/20 border border-neon-red/50 rounded-lg ${CARD_GLOW.red}">
                  🗑️
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white ${TEXT_GLOW.red}">
                    {t("deleteCustomTemplate")}
                  </h3>
                  <p className="text-sm text-space-200">
                    {t("confirmDeletePlan")}:{" "}
                    {customTemplates?.[selectedCustomTemplateId]?.meta.name}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  data-testid="delete-template-cancel-button"
                  onClick={handleDeleteCancel}
                  className={cn(
                    "flex-1 px-4 py-2 text-sm font-medium rounded-lg border-2 border-neon-blue/40 bg-dark-700/50 text-space-200",
                    "hover:border-neon-blue hover:bg-neon-blue/20 hover:text-neon-cyan transition-all ripple-effect"
                  )}
                >
                  {t("cancel")}
                </button>
                <button
                  data-testid="delete-template-confirm-button"
                  onClick={handleDeleteConfirm}
                  className={cn(
                    "flex-1 px-4 py-2 text-sm font-medium rounded-lg border-2 border-neon-red bg-neon-red/30 text-white",
                    "hover:bg-neon-red/40 transition-all",
                    "${CARD_GLOW.redStrong} hover:shadow-[0_0_20px_rgba(255,0,0,0.6)] ripple-effect"
                  )}
                >
                  {t("delete")}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* 上書き確認モーダル */}
      {showOverwriteConfirm &&
        overwriteTargetId &&
        customTemplates?.[overwriteTargetId] &&
        createPortal(
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-fadeIn"
            data-testid="overwrite-confirm-modal"
          >
            <div className="bg-dark-700/95 backdrop-blur-md border-2 border-neon-yellow/40 rounded-xl ${MODAL_GLOW.yellow} max-w-md w-full p-6 animate-fadeInScale">
              <div className="flex items-center gap-3 mb-4">
                <div className="text-3xl p-2 bg-neon-yellow/20 border border-neon-yellow/50 rounded-lg ${CARD_GLOW.yellow}">
                  ⚠️
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white ${TEXT_GLOW.yellow}">
                    {t("customTemplateConfirmOverwrite")}
                  </h3>
                  <p className="text-sm text-space-200">
                    {customTemplates?.[overwriteTargetId]?.meta.name}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  data-testid="overwrite-confirm-cancel-button"
                  onClick={handleOverwriteCancel}
                  className={cn(
                    "flex-1 px-4 py-2 text-sm font-medium rounded-lg border-2 border-neon-blue/40 bg-dark-700/50 text-space-200",
                    "hover:border-neon-blue hover:bg-neon-blue/20 hover:text-neon-cyan transition-all ripple-effect"
                  )}
                >
                  {t("cancel")}
                </button>
                <button
                  data-testid="overwrite-confirm-button"
                  onClick={handleOverwriteConfirm}
                  className={cn(
                    "flex-1 px-4 py-2 text-sm font-medium rounded-lg border-2 border-neon-yellow bg-neon-yellow/30 text-white",
                    "hover:bg-neon-yellow/40 transition-all",
                    "${CARD_GLOW.yellowStrong} hover:shadow-[0_0_20px_rgba(255,255,0,0.6)] ripple-effect"
                  )}
                >
                  {t("overwrite")}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
