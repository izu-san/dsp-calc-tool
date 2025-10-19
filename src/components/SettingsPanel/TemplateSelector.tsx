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
      <label className="block text-sm font-medium text-neon-cyan mb-3 flex items-center gap-2">
        <span className="text-lg">🎮</span>
        {t('template')}
      </label>
      
      {/* Main 4 Templates */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        {templateOrder.map((templateId) => {
          const template = SETTINGS_TEMPLATES[templateId];
          return (
            <button
              key={templateId}
              onClick={() => handleTemplateClick(templateId)}
              className="px-3 py-2 text-sm font-medium rounded-lg border-2 border-neon-blue/40 bg-neon-blue/20 backdrop-blur-sm text-white hover:border-neon-blue hover:bg-neon-blue/30 hover:scale-105 active:scale-95 transition-all shadow-[0_0_10px_rgba(0,136,255,0.3)] hover:shadow-[0_0_15px_rgba(0,136,255,0.5)] ripple-effect"
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
        className="w-full px-3 py-2 text-sm font-medium rounded-lg border-2 border-neon-green/40 bg-neon-green/20 backdrop-blur-sm text-white hover:border-neon-green hover:bg-neon-green/30 hover:scale-105 active:scale-95 transition-all shadow-[0_0_10px_rgba(0,255,136,0.3)] hover:shadow-[0_0_15px_rgba(0,255,136,0.5)] ripple-effect"
        title={t('powerSaverDesc')}
      >
        <span className="mr-1">{SETTINGS_TEMPLATES.powerSaver.icon}</span>
        {t('powerSaver')}
      </button>

      {/* Confirmation Modal */}
      {showConfirm && currentTemplate && createPortal(
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-fadeIn">
          <div className="bg-dark-700/95 backdrop-blur-md border-2 border-neon-purple/40 rounded-xl shadow-[0_0_30px_rgba(168,85,247,0.3)] max-w-md w-full p-6 animate-fadeInScale">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-3xl p-2 bg-neon-purple/20 border border-neon-purple/50 rounded-lg shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                {currentTemplate.icon}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]">
                  {t(selectedTemplate!)} {t('applyQuestion')}
                </h3>
                <p className="text-sm text-space-200">
                  {t(`${selectedTemplate!}Desc`)}
                </p>
              </div>
            </div>

            <div className="bg-dark-800/50 border border-neon-blue/30 backdrop-blur-sm rounded-lg p-4 mb-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-space-300">{t('conveyorBelt')}:</span>
                <span className="font-medium text-neon-cyan">
                  Mk.{currentTemplate.settings.conveyorBelt.tier.toUpperCase().replace('MK', '')}
                  {currentTemplate.settings.conveyorBelt.stackCount > 1 && ` (${currentTemplate.settings.conveyorBelt.stackCount} ${t('stacks')})`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-space-300">{t('sorter')}:</span>
                <span className="font-medium text-neon-cyan">
                  {currentTemplate.settings.sorter.tier === 'pile' ? t('pilingSorter') : `Mk.${currentTemplate.settings.sorter.tier.toUpperCase().replace('MK', '')}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-space-300">{t('proliferator')}:</span>
                <span className="font-medium text-neon-cyan">
                  {currentTemplate.settings.proliferator.type === 'none' 
                    ? t('none')
                    : `${currentTemplate.settings.proliferator.type.toUpperCase()} (${currentTemplate.settings.proliferator.mode === 'production' ? t('productionMode') : t('speedMode')})`
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-space-300">{t('miningResearch')}:</span>
                <span className="font-medium text-neon-cyan">
                  {currentTemplate.settings.miningSpeedResearch}% (+{currentTemplate.settings.miningSpeedResearch - 100}%)
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                className="flex-1 px-4 py-2 text-sm font-medium rounded-lg border-2 border-neon-blue/40 bg-dark-700/50 text-space-200 hover:border-neon-blue hover:bg-neon-blue/20 hover:text-neon-cyan transition-all ripple-effect"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 px-4 py-2 text-sm font-medium rounded-lg border-2 border-neon-green bg-neon-green/30 text-white hover:bg-neon-green/40 transition-all shadow-[0_0_15px_rgba(0,255,136,0.4)] hover:shadow-[0_0_20px_rgba(0,255,136,0.6)] ripple-effect"
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
