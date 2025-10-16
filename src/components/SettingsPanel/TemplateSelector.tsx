import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '../../stores/settingsStore';
import { SETTINGS_TEMPLATES } from '../../types/settings';

export function TemplateSelector() {
  const { t } = useTranslation();
  const { applyTemplate } = useSettingsStore();
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<keyof typeof SETTINGS_TEMPLATES | null>(null);

  const handleTemplateClick = (templateId: keyof typeof SETTINGS_TEMPLATES) => {
    setSelectedTemplate(templateId);
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    if (selectedTemplate) {
      applyTemplate(selectedTemplate);
      setShowConfirm(false);
      setSelectedTemplate(null);
    }
  };

  const handleCancel = () => {
    setShowConfirm(false);
    setSelectedTemplate(null);
  };

  const templateOrder: (keyof typeof SETTINGS_TEMPLATES)[] = [
    'earlyGame',
    'midGame',
    'lateGame',
    'endGame',
  ];

  const currentTemplate = selectedTemplate ? SETTINGS_TEMPLATES[selectedTemplate] : null;

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        🎮 {t('template')}
      </label>
      
      {/* Main 4 Templates */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        {templateOrder.map((templateId) => {
          const template = SETTINGS_TEMPLATES[templateId];
          return (
            <button
              key={templateId}
              onClick={() => handleTemplateClick(templateId)}
              className="px-3 py-2 text-sm font-medium rounded-lg border transition-all hover:scale-105 active:scale-95 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30"
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
        onClick={() => handleTemplateClick('powerSaver')}
        className="w-full px-3 py-2 text-sm font-medium rounded-lg border transition-all hover:scale-105 active:scale-95 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-300 dark:border-green-700 text-green-700 dark:text-green-300 hover:from-green-100 hover:to-emerald-100 dark:hover:from-green-900/30 dark:hover:to-emerald-900/30"
        title={t('powerSaverDesc')}
      >
        <span className="mr-1">{SETTINGS_TEMPLATES.powerSaver.icon}</span>
        {t('powerSaver')}
      </button>

      {/* Confirmation Modal */}
      {showConfirm && currentTemplate && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">{currentTemplate.icon}</span>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {t(selectedTemplate!)} {t('applyQuestion')}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t(`${selectedTemplate!}Desc`)}
                </p>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 mb-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">{t('conveyorBelt')}:</span>
                <span className="font-medium dark:text-white">
                  Mk.{currentTemplate.settings.conveyorBelt.tier.toUpperCase().replace('MK', '')}
                  {currentTemplate.settings.conveyorBelt.stackCount > 1 && ` (${currentTemplate.settings.conveyorBelt.stackCount} ${t('stacks')})`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">{t('sorter')}:</span>
                <span className="font-medium dark:text-white">
                  {currentTemplate.settings.sorter.tier === 'pile' ? t('pilingSorter') : `Mk.${currentTemplate.settings.sorter.tier.toUpperCase().replace('MK', '')}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">{t('proliferator')}:</span>
                <span className="font-medium dark:text-white">
                  {currentTemplate.settings.proliferator.type === 'none' 
                    ? t('none')
                    : `${currentTemplate.settings.proliferator.type.toUpperCase()} (${currentTemplate.settings.proliferator.mode === 'production' ? t('productionMode') : t('speedMode')})`
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">{t('miningResearch')}:</span>
                <span className="font-medium dark:text-white">
                  {currentTemplate.settings.miningSpeedResearch}% (+{currentTemplate.settings.miningSpeedResearch - 100}%)
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                className="flex-1 px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                {t('apply')}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
