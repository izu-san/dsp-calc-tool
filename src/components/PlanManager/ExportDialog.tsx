import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveToLocalStorage: (planName: string, includeOverrides: boolean) => void;
  onExportToFile: (format: 'json' | 'markdown', planName: string, includeOverrides: boolean) => void;
  defaultPlanName: string;
  includeOverridesDefault: boolean;
}

export function ExportDialog({
  isOpen,
  onClose,
  onSaveToLocalStorage,
  onExportToFile,
  defaultPlanName,
  includeOverridesDefault,
}: ExportDialogProps) {
  const { t } = useTranslation();
  const [planName, setPlanName] = useState(defaultPlanName);
  const [includeOverrides, setIncludeOverrides] = useState(includeOverridesDefault);

  if (!isOpen) return null;

  const handleClose = () => {
    setPlanName(defaultPlanName);
    setIncludeOverrides(includeOverridesDefault);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4 dark:text-white">{t('save')}</h2>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2 dark:text-gray-300">
            {t('planName')}
          </label>
          <input
            type="text"
            value={planName}
            onChange={(e) => setPlanName(e.target.value)}
            placeholder={defaultPlanName}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
          />
        </div>

        {/* Save to LocalStorage */}
        <button
          onClick={() => {
            onSaveToLocalStorage(planName || defaultPlanName, includeOverrides);
            handleClose();
          }}
          className="w-full mb-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
        >
          💾 {t('saveToLocalStorage')}
        </button>

        {/* Export Buttons */}
        <div className="mb-4">
          <p className="text-sm font-medium mb-2 dark:text-gray-300">{t('exportToFile')}</p>
          <div className="flex gap-2">
            <button
              onClick={() => {
                onExportToFile('json', planName || defaultPlanName, includeOverrides);
                handleClose();
              }}
              className="flex-1 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-sm"
            >
              JSON
            </button>
            <button
              onClick={() => {
                onExportToFile('markdown', planName || defaultPlanName, includeOverrides);
                handleClose();
              }}
              className="flex-1 px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600 text-sm"
            >
              Markdown
            </button>
          </div>
        </div>

        {/* Include overrides option */}
        <div className="mb-4 flex items-center gap-2">
          <input
            id="includeOverridesOnSave"
            type="checkbox"
            checked={includeOverrides}
            onChange={(e) => setIncludeOverrides(e.target.checked)}
            className="h-4 w-4"
          />
          <label htmlFor="includeOverridesOnSave" className="text-sm dark:text-gray-200">
            {t('includeNodeOverrides')}
          </label>
        </div>

        <button
          onClick={handleClose}
          className="w-full px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded hover:bg-gray-400 dark:hover:bg-gray-600"
        >
          {t('cancel')}
        </button>
      </div>
    </div>
  );
}
