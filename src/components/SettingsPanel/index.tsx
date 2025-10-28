import { useTranslation } from 'react-i18next';
import { ProliferatorSettings } from './ProliferatorSettings';
import { MachineRankSettings } from './MachineRankSettings';
import { ConveyorBeltSettings } from './ConveyorBeltSettings';
import { PhotonGenerationSettings } from './PhotonGenerationSettings';
import { TemplateSelector } from './TemplateSelector';
import { AlternativeRecipeSelector } from '../AlternativeRecipeSelector';
import { WhatIfSimulator } from '../WhatIfSimulator';
import { useRecipeSelectionStore } from '../../stores/recipeSelectionStore';
import { useGameDataStore } from '../../stores/gameDataStore';
import type { RecipeTreeNode } from '../../types';

export function SettingsPanel() {
  const { t } = useTranslation();
  const { selectedRecipe, calculationResult } = useRecipeSelectionStore();
  const { data } = useGameDataStore();
  
  // Check if the production chain has any items with alternatives
  const hasAlternatives = selectedRecipe && data && calculationResult ? (() => {
    const itemsInChain = new Set<number>();
    
    // Collect all items from the calculation result tree
    const collectItems = (node: RecipeTreeNode) => {
      if (node.recipe) {
        node.recipe.Items.forEach((item) => {
          itemsInChain.add(item.id);
        });
      }
      // Also collect item IDs from raw material nodes
      if (node.isRawMaterial && node.itemId) {
        itemsInChain.add(node.itemId);
      }
      if (node.children) {
        node.children.forEach((child) => collectItems(child));
      }
    };
    
    // Start from rootNode
    collectItems(calculationResult.rootNode);
    
    // Check if any of these items have multiple recipes OR can be mined AND have recipes
    for (const itemId of itemsInChain) {
      const recipes = data.recipesByItemId.get(itemId) || [];
      const hasMultipleRecipes = recipes.length > 1;
      const canBeMined = data.allItems.get(itemId)?.miningFrom !== undefined;
      const hasRecipes = recipes.length > 0;
      
      // Show if: has multiple recipes, OR can be mined and has at least one recipe
      if (hasMultipleRecipes || (canBeMined && hasRecipes)) {
        return true;
      }
    }
    return false;
  })() : false;
  
  // Check if the production chain includes Critical Photon (id: 1208)
  const hasCriticalPhoton = calculationResult ? (() => {
    const CRITICAL_PHOTON_ID = 1208;
    
    // Collect all items from the calculation result tree
    const hasItem = (node: RecipeTreeNode): boolean => {
      if (node.recipe) {
        // Check if any item in this recipe is Critical Photon
        if (node.recipe.Items && node.recipe.Items.some((item) => item.id === CRITICAL_PHOTON_ID)) {
          return true;
        }
        if (node.recipe.Results && node.recipe.Results.some((item) => item.id === CRITICAL_PHOTON_ID)) {
          return true;
        }
      }
      // Check children recursively
      if (node.children) {
        return node.children.some((child) => hasItem(child));
      }
      return false;
    };
    
    return hasItem(calculationResult.rootNode);
  })() : false;
  
  return (
    <div className="space-y-4">
      <div>
        {/* Template Selector */}
        <TemplateSelector />
        
        {/* Proliferator Settings */}
        <div className="bg-dark-700/30 rounded-lg border border-neon-magenta/30 p-3 mb-3 backdrop-blur-sm hover:border-neon-magenta/50 transition-all stagger-item hover-lift">
          <h4 className="text-md font-semibold text-neon-magenta mb-2">💊 {t('proliferator')}</h4>
          <ProliferatorSettings />
        </div>

        {/* Machine Rank Settings */}
        <div className="bg-dark-700/30 rounded-lg border border-neon-blue/30 p-3 mb-3 backdrop-blur-sm hover:border-neon-blue/50 transition-all stagger-item hover-lift">
          <h4 className="text-md font-semibold text-neon-blue mb-2">🏭 {t('machineRank')}</h4>
          <MachineRankSettings />
        </div>

        {/* Conveyor Belt Settings */}
        <div className="bg-dark-700/30 rounded-lg border border-neon-cyan/30 p-3 mb-3 backdrop-blur-sm hover:border-neon-cyan/50 transition-all stagger-item hover-lift">
          <h4 className="text-md font-semibold text-neon-cyan mb-2">🛤️ {t('conveyorBelt')}</h4>
          <ConveyorBeltSettings />
        </div>

        {/* Photon Generation Settings - Only show when Critical Photon is in the production chain */}
        {hasCriticalPhoton && (
          <div className="bg-dark-700/30 rounded-lg border border-neon-yellow/30 p-3 mb-3 backdrop-blur-sm hover:border-neon-yellow/50 transition-all animate-fadeInScale hover-lift">
            <h4 className="text-md font-semibold text-neon-yellow mb-2">⚡ {t('photonGeneration')}</h4>
            <PhotonGenerationSettings />
          </div>
        )}

        {/* Alternative Recipe Settings - Only show when selected recipe has alternatives */}
        {hasAlternatives && (
          <div className="bg-dark-700/30 rounded-lg border border-neon-green/30 p-3 mb-3 backdrop-blur-sm hover:border-neon-green/50 transition-all animate-fadeInScale hover-lift">
            <h4 className="text-md font-semibold text-neon-green mb-2">🔀 {t('alternativeRecipes')}</h4>
            <AlternativeRecipeSelector />
          </div>
        )}

        {/* What-If Simulator - Only show when recipe is selected */}
        {selectedRecipe && (
          <div className="bg-dark-700/30 rounded-lg border border-neon-purple/30 p-3 backdrop-blur-sm hover:border-neon-purple/50 transition-all animate-fadeInScale hover-lift">
            <WhatIfSimulator />
          </div>
        )}
      </div>
    </div>
  );
}
