import { useTranslation } from 'react-i18next';
import { ProliferatorSettings } from './ProliferatorSettings';
import { MachineRankSettings } from './MachineRankSettings';
import { ConveyorBeltSettings } from './ConveyorBeltSettings';
import { TemplateSelector } from './TemplateSelector';
import { AlternativeRecipeSelector } from '../AlternativeRecipeSelector';
import { WhatIfSimulator } from '../WhatIfSimulator';
import { useRecipeSelectionStore } from '../../stores/recipeSelectionStore';
import { useGameDataStore } from '../../stores/gameDataStore';

export function SettingsPanel() {
  const { t } = useTranslation();
  const { selectedRecipe, calculationResult } = useRecipeSelectionStore();
  const { data } = useGameDataStore();
  
  // Check if the production chain has any items with alternatives
  const hasAlternatives = selectedRecipe && data && calculationResult ? (() => {
    const itemsInChain = new Set<number>();
    
    // Collect all items from the calculation result tree
    const collectItems = (node: any) => {
      if (node.recipe) {
        node.recipe.Items.forEach((item: any) => {
          itemsInChain.add(item.id);
        });
      }
      if (node.children) {
        node.children.forEach((child: any) => collectItems(child));
      }
    };
    
    // Start from rootNode
    collectItems(calculationResult.rootNode);
    
    // Check if any of these items have multiple recipes
    for (const itemId of itemsInChain) {
      const recipes = data.recipesByItemId.get(itemId) || [];
      if (recipes.length > 1) {
        return true;
      }
    }
    return false;
  })() : false;
  
  return (
    <div className="space-y-4">
      <div>
        {/* Template Selector */}
        <TemplateSelector />
        
        {/* Proliferator Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 mb-3">
          <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-2">💊 {t('proliferator')}</h4>
          <ProliferatorSettings />
        </div>

        {/* Machine Rank Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 mb-3">
          <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-2">🏭 {t('machineRank')}</h4>
          <MachineRankSettings />
        </div>

        {/* Conveyor Belt Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 mb-3">
          <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-2">🛤️ {t('conveyorBelt')}</h4>
          <ConveyorBeltSettings />
        </div>

        {/* Alternative Recipe Settings - Only show when selected recipe has alternatives */}
        {hasAlternatives && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 mb-3">
            <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-2">🔀 {t('alternativeRecipes')}</h4>
            <AlternativeRecipeSelector />
          </div>
        )}

        {/* What-If Simulator - Only show when recipe is selected */}
        {selectedRecipe && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
            <WhatIfSimulator />
          </div>
        )}
      </div>
    </div>
  );
}
