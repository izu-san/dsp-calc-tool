import { useTranslation } from 'react-i18next';

export function ErrorUI({ error, errorInfo, onReset, onClearData }: {
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  onReset: () => void;
  onClearData: () => void;
}) {
  const { t } = useTranslation();

  const handleClearData = () => {
    if (confirm(t('confirmClearData'))) {
      onClearData();
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-gray-800 rounded-lg shadow-xl p-8">
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {t('errorOccurred')}
          </h1>
          <p className="text-gray-400">
            {t('errorApology')}
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-gray-900 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-red-400 mb-2">
              {t('errorDetails')}
            </h2>
            <pre className="text-sm text-gray-300 overflow-x-auto">
              {error.toString()}
            </pre>
            
            {errorInfo && (
              <details className="mt-4">
                <summary className="cursor-pointer text-blue-400 hover:text-blue-300">
                  {t('showStackTrace')}
                </summary>
                <pre className="text-xs text-gray-400 mt-2 overflow-x-auto">
                  {errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={onReset}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            {t('reloadPage')}
          </button>

          <button
            onClick={handleClearData}
            className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
          >
            {t('clearDataRestart')}
          </button>

          <a
            href="/"
            className="block w-full px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium text-center transition-colors"
          >
            {t('backToHome')}
          </a>
        </div>

        <div className="mt-6 p-4 bg-yellow-900 border border-yellow-700 rounded-lg">
          <p className="text-sm text-yellow-200">
            {t('errorTip')}
          </p>
        </div>
      </div>
    </div>
  );
}
