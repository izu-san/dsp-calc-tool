import { useRef } from 'react';
import { useTranslation } from 'react-i18next';

interface ImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImportFile: (file: File) => void;
  onLoadFromLocalStorage: (key: string) => void;
  onDeletePlan: (key: string) => void;
  recentPlans: { key: string; name: string; timestamp: number }[];
  mergeOverridesDefault: boolean;
  onMergeOverridesChange: (merge: boolean) => void;
}

export function ImportDialog({
  isOpen,
  onClose,
  onImportFile,
  onLoadFromLocalStorage,
  onDeletePlan,
  recentPlans,
  mergeOverridesDefault,
  onMergeOverridesChange,
}: ImportDialogProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImportFile(file);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4 dark:text-white">{t('load')}</h2>

        {/* File Import */}
        <div className="mb-6">
          <label htmlFor="file-import" className="block text-sm font-medium mb-2 dark:text-gray-300">
            {t('loadFromFile')}
          </label>
          <input
            id="file-import"
            ref={fileInputRef}
            type="file"
            accept=".json,.md,.markdown"
            onChange={handleFileChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {t('supportedFormats')}: JSON (.json), Markdown (.md)
          </p>
        </div>

        {/* Recent Plans */}
        <div>
          <h3 className="text-lg font-semibold mb-2 dark:text-white">{t('recentPlans')}</h3>
          {/* Merge overrides option */}
          <div className="mb-3 flex items-center gap-2">
            <input
              id="mergeOverridesOnLoad"
              type="checkbox"
              checked={mergeOverridesDefault}
              onChange={(e) => onMergeOverridesChange(e.target.checked)}
              className="h-4 w-4"
            />
            <label htmlFor="mergeOverridesOnLoad" className="text-sm dark:text-gray-200">
              {t('mergeNodeOverridesOnLoad')}
            </label>
          </div>
          {recentPlans.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm">{t('noPlans')}</p>
          ) : (
            <div className="space-y-2">
              {recentPlans.map((plan) => (
                <div
                  key={plan.key}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-650"
                >
                  <div className="flex-1">
                    <div className="font-medium dark:text-white">{plan.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(plan.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onLoadFromLocalStorage(plan.key)}
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-sm"
                    >
                      {t('load')}
                    </button>
                    <button
                      onClick={() => onDeletePlan(plan.key)}
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 text-sm"
                    >
                      {t('delete')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-4 px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded hover:bg-gray-400 dark:hover:bg-gray-600"
        >
          {t('close')}
        </button>
      </div>
    </div>
  );
}
