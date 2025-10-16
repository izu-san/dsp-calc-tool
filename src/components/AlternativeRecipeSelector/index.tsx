import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameDataStore } from '../../stores/gameDataStore';
import { useRecipeSelectionStore } from '../../stores/recipeSelectionStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { ItemIcon } from '../ItemIcon';
import { formatNumber } from '../../utils/format';
import { parseColorTags } from '../../utils/html';
import { isRawMaterial } from '../../constants/rawMaterials';
import { RecipeComparisonModal } from '../RecipeComparisonModal';
import type { Recipe } from '../../types';

export function AlternativeRecipeSelector() {
  const { t } = useTranslation();
  const { data } = useGameDataStore();
  const { selectedRecipe: currentRecipe, calculationResult } = useRecipeSelectionStore();
  const { settings, setAlternativeRecipe } = useSettingsStore();
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [comparisonModal, setComparisonModal] = useState<{ itemId: number; itemName: string; recipes: Recipe[]; canBeMined: boolean; miningFrom?: string } | null>(null);

  if (!data || !currentRecipe) return null;

  // Get all items used in the calculation result that have alternatives
  const itemsWithAlternatives = useMemo(() => {
    if (!currentRecipe || !calculationResult) return [];
    
    // Collect all item IDs from current recipe tree (inputs recursively)
    const relevantItemIds = new Set<number>();
    
    const collectItemIds = (node: any) => {
      if (node.recipe) {
        node.recipe.Items.forEach((item: any) => {
          relevantItemIds.add(item.id);
        });
      }
      if (node.children) {
        node.children.forEach((child: any) => collectItemIds(child));
      }
    };
    
    // Start from rootNode
    collectItemIds(calculationResult.rootNode);
    
    // Filter to items with multiple recipes OR items that can be mined AND have recipes
    return Array.from(data.recipesByItemId.entries())
      .filter(([itemId, recipes]) => {
        const hasMultipleRecipes = recipes.length > 1;
        const canBeMined = isRawMaterial(itemId);
        const hasRecipes = recipes.length > 0;
        
        // Show if: has multiple recipes, OR can be mined and has at least one recipe
        return relevantItemIds.has(itemId) && (hasMultipleRecipes || (canBeMined && hasRecipes));
      })
      .map(([itemId, recipes]) => {
        const item = data.allItems.get(itemId);
        return {
          itemId,
          itemName: item?.name || `Item ${itemId}`,
          recipes: recipes.sort((a, b) => a.SID - b.SID),
          canBeMined: isRawMaterial(itemId),
          miningFrom: item?.miningFrom || '',
        };
      })
      .sort((a, b) => a.itemName.localeCompare(b.itemName));
  }, [data, currentRecipe, calculationResult]);

  const toggleExpand = (itemId: number) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const handleRecipeSelect = (itemId: number, recipeId: number) => {
    setAlternativeRecipe(itemId, recipeId);
  };

  const getRecipeDetails = (recipe: Recipe) => {
    const inputs = recipe.Items.map(item => ({
      name: item.name,
      count: item.count,
      id: item.id,
    }));
    const outputs = recipe.Results.map(item => ({
      name: item.name,
      count: item.count,
      id: item.id,
    }));
    const timeSeconds = recipe.TimeSpend / 60;
    
    return { inputs, outputs, timeSeconds };
  };

  if (itemsWithAlternatives.length === 0) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        {t('noAlternativeRecipesFound')}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
        {t('selectPreferredRecipesDesc')}
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {itemsWithAlternatives.map(({ itemId, itemName, recipes, canBeMined, miningFrom }) => {
          const isExpanded = expandedItems.has(itemId);
          // Use -1 to represent mining option
          const defaultOption = canBeMined ? -1 : recipes[0]?.SID;
          const selectedRecipeId = settings.alternativeRecipes.get(itemId) ?? defaultOption;

          return (
            <div key={itemId} className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
              {/* Item Header */}
              <div
                onClick={() => toggleExpand(itemId)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <ItemIcon itemId={itemId} size={32} />
                  <div className="text-left">
                    <div className="font-medium text-gray-900 dark:text-white">{itemName}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {canBeMined && recipes.length > 0
                        ? `${recipes.length} ${t('recipes')} + ${t('mining')}`
                        : canBeMined
                          ? t('miningOnly')
                          : `${recipes.length} ${t('alternativeRecipes')}`
                      }
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Compare Button */}
                  {(canBeMined || recipes.length > 1) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setComparisonModal({ itemId, itemName, recipes, canBeMined, miningFrom });
                      }}
                      className="px-2 py-1 text-xs bg-purple-600 dark:bg-purple-700 text-white rounded hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors flex items-center gap-1 whitespace-nowrap"
                      title={t('compareRecipes')}
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <span className="hidden sm:inline">{t('compare')}</span>
                    </button>
                  )}
                  <span className="text-xs text-blue-600 dark:text-blue-400 font-medium truncate max-w-[120px]">
                    {selectedRecipeId === -1
                      ? `⛏️ ${t('mining')}`
                      : recipes.find(r => r.SID === selectedRecipeId)?.name || 'None selected'
                    }
                  </span>
                  <span className={`transition-transform dark:text-gray-400 flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </div>
              </div>

              {/* Recipe Options */}
              {isExpanded && (
                <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 p-3 space-y-2">
                  {/* Mining option */}
                  {canBeMined && (
                    <button
                      onClick={() => handleRecipeSelect(itemId, -1)}
                      className={`
                        w-full p-3 rounded-lg border-2 transition-all text-left
                        ${selectedRecipeId === -1
                          ? 'bg-amber-50 dark:bg-amber-900/30 border-amber-400 dark:border-amber-600 ring-2 ring-amber-300 dark:ring-amber-700'
                          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 hover:border-amber-300 dark:hover:border-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                        }
                      `}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">⛏️</span>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {t('mining')}
                          </div>
                          {!settings.alternativeRecipes.has(itemId) && (
                            <span className="text-yellow-500 dark:text-yellow-400 text-sm" title={t('defaultOption')}>⭐</span>
                          )}
                        </div>
                        {selectedRecipeId === -1 && (
                          <span className="text-amber-600 dark:text-amber-400 font-medium text-sm">✓ {t('selected')}</span>
                        )}
                      </div>

                      <div className="text-xs">
                        <div className="text-gray-500 dark:text-gray-400 font-medium mb-1">
                          {t('source')}: {miningFrom ? parseColorTags(miningFrom) : 'Various locations'}
                        </div>
                        <div className="text-gray-600 dark:text-gray-300">
                          {t('noInputsRequired')}
                        </div>
                      </div>
                    </button>
                  )}

                  {/* Recipe options */}
                  {recipes.map(recipe => {
                    const { inputs, outputs, timeSeconds } = getRecipeDetails(recipe);
                    const isSelected = selectedRecipeId === recipe.SID;
                    const isDefault = !canBeMined && !settings.alternativeRecipes.has(itemId) && recipe.SID === recipes[0].SID;

                    return (
                      <button
                        key={recipe.SID}
                        onClick={() => handleRecipeSelect(itemId, recipe.SID)}
                        className={`
                          w-full p-3 rounded-lg border-2 transition-all text-left
                          ${isSelected
                            ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-400 dark:border-blue-600 ring-2 ring-blue-300 dark:ring-blue-700'
                            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                          }
                        `}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="font-medium text-gray-900 dark:text-white">
                              {recipe.name}
                            </div>
                            {isDefault && (
                              <span className="text-yellow-500 dark:text-yellow-400 text-sm" title={t('defaultRecipe')}>⭐</span>
                            )}
                          </div>
                          {isSelected && (
                            <span className="text-blue-600 dark:text-blue-400 font-medium text-sm">✓ {t('selected')}</span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-xs">
                          {/* Inputs */}
                          <div>
                            <div className="text-gray-500 dark:text-gray-400 font-medium mb-1">{t('inputs')}:</div>
                            <div className="space-y-0.5">
                              {inputs.map((input, idx) => (
                                <div key={idx} className="flex items-center gap-1">
                                  <ItemIcon itemId={input.id} size={16} />
                                  <span className="text-gray-700 dark:text-gray-300 truncate">
                                    {input.name} ×{input.count}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Outputs */}
                          <div>
                            <div className="text-gray-500 dark:text-gray-400 font-medium mb-1">{t('outputs')}:</div>
                            <div className="space-y-0.5">
                              {outputs.map((output, idx) => (
                                <div key={idx} className="flex items-center gap-1">
                                  <ItemIcon itemId={output.id} size={16} />
                                  <span className="text-gray-700 dark:text-gray-300 truncate">
                                    {output.name} ×{output.count}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-xs">
                          <span className="text-gray-500 dark:text-gray-400">
                            {t('time')}: {formatNumber(timeSeconds)}s
                          </span>
                          <span className="text-gray-500 dark:text-gray-400">
                            {t('type')}: {recipe.Type}
                          </span>
                          {recipe.productive && (
                            <span className="text-green-600 dark:text-green-400 font-medium">🧪 {t('productionModeOK')}</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Recipe Comparison Modal */}
      {comparisonModal && (
        <RecipeComparisonModal
          itemId={comparisonModal.itemId}
          itemName={comparisonModal.itemName}
          recipes={comparisonModal.recipes}
          canBeMined={comparisonModal.canBeMined}
          miningFrom={comparisonModal.miningFrom}
          isOpen={true}
          onClose={() => setComparisonModal(null)}
          onSelectRecipe={(recipeId) => setAlternativeRecipe(comparisonModal.itemId, recipeId)}
        />
      )}
    </div>
  );
}
