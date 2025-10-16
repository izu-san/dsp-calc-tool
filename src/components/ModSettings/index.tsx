import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useGameDataStore } from '../../stores/gameDataStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { loadGameData } from '../../lib/parser';

export function ModSettings() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [uploadError, setUploadError] = useState<string>('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const { updateData } = useGameDataStore();
  const { settings, setProliferatorMultiplier } = useSettingsStore();

  // Custom proliferator multipliers (with fallback for old saved data)
  const [productionMultiplier, setProductionMultiplier] = useState(
    settings.proliferatorMultiplier?.production ?? 1
  );
  const [speedMultiplier, setSpeedMultiplier] = useState(
    settings.proliferatorMultiplier?.speed ?? 1
  );

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadError('');
    setUploadSuccess(false);

    // Validate file type
    if (!file.name.endsWith('.xml')) {
      setUploadError(t('invalidFileType'));
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError(t('fileTooLarge'));
      return;
    }

    try {
      const text = await file.text();

      // Basic XML validation
      if (!text.includes('<?xml') || !text.includes('<RecipeArray>')) {
        setUploadError(t('invalidRecipesXML'));
        return;
      }

      // Security: Check for potentially malicious content
      const dangerousPatterns = [
        /<script/i,
        /javascript:/i,
        /on\w+=/i, // onclick, onerror, etc.
        /<iframe/i,
        /<embed/i,
        /<object/i,
      ];

      for (const pattern of dangerousPatterns) {
        if (pattern.test(text)) {
          setUploadError(t('securityError'));
          return;
        }
      }

      // Parse the XML
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, 'text/xml');

      // Check for parsing errors
      const parserError = xmlDoc.querySelector('parsererror');
      if (parserError) {
        setUploadError(t('xmlParsingError'));
        return;
      }

      // Validate structure
      const recipes = xmlDoc.querySelectorAll('Recipe');
      if (recipes.length === 0) {
        setUploadError(t('noRecipesFound'));
        return;
      }

      // Update game data with custom recipes
      try {
        // Parse with custom recipes XML
        const customData = await loadGameData(text);
        
        updateData(customData);
        setUploadSuccess(true);
        
        // Auto-close success message after 3 seconds
        setTimeout(() => setUploadSuccess(false), 3000);
      } catch (error) {
        setUploadError(t('failedToParseCustomRecipes') + ': ' + (error as Error).message);
      }
    } catch (error) {
      setUploadError(t('failedToReadFile') + ': ' + (error as Error).message);
    }

    // Reset input
    event.target.value = '';
  };

  const handleApplyCustomProliferator = () => {
    setProliferatorMultiplier(productionMultiplier, speedMultiplier);
    setUploadSuccess(true);
    setUploadError('');
    setTimeout(() => setUploadSuccess(false), 3000);
  };

  const handleResetToDefault = async () => {
    if (confirm(t('confirmResetToDefault'))) {
      try {
        const data = await loadGameData();
        updateData(data);
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 3000);
      } catch (error) {
        setUploadError(t('failedToReset') + ': ' + (error as Error).message);
      }
    }
  };

  return (
    <>
      {/* Hidden trigger button (Ctrl+Shift+M) */}
      <button
        onClick={() => setIsOpen(true)}
        className="hidden"
        id="mod-settings-trigger"
        aria-hidden="true"
      />

      {/* Keyboard shortcut listener */}
      {typeof window !== 'undefined' && (
        <div
          className="hidden"
          ref={(el) => {
            if (el && !el.dataset.listenerAdded) {
              el.dataset.listenerAdded = 'true';
              window.addEventListener('keydown', (e) => {
                if (e.ctrlKey && e.shiftKey && e.key === 'M') {
                  e.preventDefault();
                  setIsOpen(true);
                }
              });
            }
          }}
        />
      )}

      {/* Modal */}
      {isOpen && createPortal(
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-gray-900 border-2 border-red-500 rounded-xl shadow-2xl max-w-2xl w-full p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🔧</span>
                <div>
                  <h2 className="text-xl font-bold text-red-400">{t('modSettings')}</h2>
                  <p className="text-xs text-gray-400">{t('advancedSettingsForModded')}</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Warning Banner */}
            <div className="bg-yellow-900/30 border border-yellow-500/50 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="flex-1 text-sm text-yellow-200">
                  <p className="font-semibold mb-1">⚠️ {t('advancedFeatures')}</p>
                  <p className="text-xs">{t('advancedFeaturesWarning')}</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Custom Recipes Upload */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  📄 {t('customRecipesXML')}
                </h3>
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <p className="text-sm text-gray-300 mb-3">
                    {t('uploadCustomRecipesDesc')}
                  </p>
                  
                  <div className="flex items-center gap-3">
                    <label className="flex-1">
                      <input
                        type="file"
                        accept=".xml"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="recipes-upload"
                      />
                      <div className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <span className="text-sm font-medium">{t('uploadXML')}</span>
                      </div>
                    </label>
                    
                    <button
                      onClick={handleResetToDefault}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
                    >
                      {t('resetToDefault')}
                    </button>
                  </div>

                  {uploadError && (
                    <div className="mt-3 p-3 bg-red-900/30 border border-red-500/50 rounded text-sm text-red-200">
                      ❌ {uploadError}
                    </div>
                  )}

                  {uploadSuccess && (
                    <div className="mt-3 p-3 bg-green-900/30 border border-green-500/50 rounded text-sm text-green-200">
                      ✅ {t('recipesUpdatedSuccessfully')}
                    </div>
                  )}
                </div>
              </div>

              {/* Custom Proliferator Multipliers */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  💊 {t('customProliferatorMultipliers')}
                </h3>
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <p className="text-sm text-gray-300 mb-4">
                    {t('customProliferatorMultipliersDesc')}
                  </p>

                  <div className="grid grid-cols-1 gap-4 mb-4">
                    {/* Production Multiplier */}
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">
                        {t('productionMultiplierLabel')}
                      </label>
                      <input
                        type="number"
                        step="1"
                        min="1"
                        value={productionMultiplier}
                        onChange={(e) => setProductionMultiplier(parseFloat(e.target.value))}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {t('current')}: Mk.I {(0.125 * productionMultiplier * 100).toFixed(1)}%, 
                        Mk.II {(0.20 * productionMultiplier * 100).toFixed(1)}%, 
                        Mk.III {(0.25 * productionMultiplier * 100).toFixed(1)}%
                      </p>
                    </div>

                    {/* Speed Multiplier */}
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">
                        {t('speedMultiplierLabel')}
                      </label>
                      <input
                        type="number"
                        step="1"
                        min="1"
                        value={speedMultiplier}
                        onChange={(e) => setSpeedMultiplier(parseFloat(e.target.value))}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {t('current')}: Mk.I {(0.25 * speedMultiplier * 100).toFixed(1)}%, 
                        Mk.II {(0.50 * speedMultiplier * 100).toFixed(1)}%, 
                        Mk.III {(1.00 * speedMultiplier * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleApplyCustomProliferator}
                    className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    {t('applyCustomMultipliers')}
                  </button>

                  <p className="text-xs text-gray-400 mt-2 text-center">
                    {t('defaultMultipliers')}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-gray-700">
              <p className="text-xs text-gray-500 text-center">
                {t('pressCtrlShiftM')}
              </p>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
