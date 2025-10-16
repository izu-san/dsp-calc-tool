import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import * as Tabs from '@radix-ui/react-tabs';
import type { Recipe } from '../../types';
import { RecipeGrid } from './RecipeGrid';
import { useFavoritesStore } from '../../stores/favoritesStore';

interface RecipeSelectorProps {
  recipes: Recipe[];
  onRecipeSelect: (recipe: Recipe) => void;
  selectedRecipeId?: number;
}

export function RecipeSelector({ recipes, onRecipeSelect, selectedRecipeId }: RecipeSelectorProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'1' | '2'>('1');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const { favoriteRecipes } = useFavoritesStore();

  // Get unique categories from recipes
  const categories = useMemo(() => {
    const types = new Set<string>();
    recipes.forEach(recipe => {
      if (recipe.Type) {
        types.add(recipe.Type);
      }
    });
    return ['all', ...Array.from(types).sort()];
  }, [recipes]);

  // Generate search suggestions
  const searchSuggestions = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return [];
    
    const suggestions = new Set<string>();
    const query = searchQuery.toLowerCase();
    
    recipes.forEach(recipe => {
      // Recipe name suggestions
      if (recipe.name.toLowerCase().includes(query)) {
        suggestions.add(recipe.name);
      }
      
      // Input item suggestions
      recipe.Items?.forEach(item => {
        if (item.name?.toLowerCase().includes(query)) {
          suggestions.add(item.name);
        }
      });
      
      // Output item suggestions
      recipe.Results?.forEach(result => {
        if (result.name?.toLowerCase().includes(query)) {
          suggestions.add(result.name);
        }
      });
    });
    
    return Array.from(suggestions).slice(0, 5);
  }, [searchQuery, recipes]);

  // Filter recipes based on search query and category (enhanced with ingredient search)
  const filteredRecipes = useMemo(() => {
    return recipes.filter(recipe => {
      // Favorites filter
      if (showOnlyFavorites && !favoriteRecipes.has(recipe.SID)) {
        return false;
      }

      // Category filter
      if (selectedCategory !== 'all' && recipe.Type !== selectedCategory) {
        return false;
      }

      // Search filter (enhanced with ingredients)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const nameMatch = recipe.name.toLowerCase().includes(query);
        const sidMatch = recipe.SID.toString().includes(query);
        
        // Search in input items
        const inputMatch = recipe.Items?.some(item => 
          item.name?.toLowerCase().includes(query)
        ) || false;
        
        // Search in output items
        const outputMatch = recipe.Results?.some(result => 
          result.name?.toLowerCase().includes(query)
        ) || false;
        
        return nameMatch || sidMatch || inputMatch || outputMatch;
      }

      return true;
    });
  }, [recipes, searchQuery, selectedCategory, showOnlyFavorites, favoriteRecipes]);

  // Get category icon path and label (memoized to update when language changes)
  const getCategoryInfo = useMemo(() => (category: string): { icon?: string; label: string } => {
    if (category === 'all') return { label: t('categoryAll') };
    
    const categoryIconMap: Record<string, { icon: string; label: string }> = {
      'Smelt': { icon: '/data/Machines/Icons/2302.png', label: t('categorySmelt') },
      'Assemble': { icon: '/data/Machines/Icons/2303.png', label: t('categoryAssemble') },
      'Chemical': { icon: '/data/Machines/Icons/2309.png', label: t('categoryChemical') },
      'Research': { icon: '/data/Machines/Icons/2901.png', label: t('categoryResearch') },
      'Refine': { icon: '/data/Machines/Icons/2308.png', label: t('categoryRefine') },
      'Particle': { icon: '/data/Machines/Icons/2310.png', label: t('categoryParticle') },
      'Fractionate': { icon: '/data/Machines/Icons/2314.png', label: t('categoryFractionate') },
    };
    
    return categoryIconMap[category] || { label: category };
  }, [t]);

  return (
    <div className="space-y-4">
      {/* Search Box with Autocomplete */}
      <div className="relative">
        <input
          type="text"
          placeholder={t('searchRecipesItemsMaterials')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ✕
          </button>
        )}
        
        {/* Autocomplete Dropdown */}
        {showSuggestions && searchSuggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            <div className="p-2">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 px-2">{t('suggestions')}</div>
              {searchSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setSearchQuery(suggestion);
                    setShowSuggestions(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-300 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    {suggestion}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Search Help */}
      {searchQuery && filteredRecipes.length === 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-500 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <div className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-1">
                {t('noResultsFound')}
              </div>
              <div className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
                <p>{t('trySearchingFor')}</p>
                <ul className="list-disc list-inside ml-2 space-y-0.5">
                  <li>{t('searchHintRecipeNames')}</li>
                  <li>{t('searchHintMaterialNames')}</li>
                  <li>{t('searchHintProductNames')}</li>
                  <li>{t('searchHintRecipeIDs')}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {/* Favorites Toggle */}
        <button
          onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            showOnlyFavorites
              ? 'bg-yellow-500 dark:bg-yellow-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          ⭐ {t('favorites')} {favoriteRecipes.size > 0 && `(${favoriteRecipes.size})`}
        </button>
        
        {/* Category Buttons */}
        {categories.map((category) => {
          const categoryInfo = getCategoryInfo(category);
          return (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                selectedCategory === category
                  ? 'bg-blue-600 dark:bg-blue-700 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {categoryInfo.icon && (
                <img 
                  src={categoryInfo.icon} 
                  alt={categoryInfo.label}
                  className="w-5 h-5 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              )}
              {categoryInfo.label}
            </button>
          );
        })}
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-500 dark:text-gray-400">
        {filteredRecipes.length} {filteredRecipes.length !== 1 ? t('recipes') : t('recipe')} {t('found')}
        {searchQuery && (
          <span>
            {' '}{t('for')}{' '}
            <span className="font-semibold text-blue-600 dark:text-blue-400">"{searchQuery}"</span>
            <span className="text-xs ml-2 text-gray-400 dark:text-gray-500">
              ({t('searchingInNamesIDsInputsOutputs')})
            </span>
          </span>
        )}
      </div>

      <Tabs.Root value={activeTab} onValueChange={(value) => setActiveTab(value as '1' | '2')}>
        <Tabs.List className="flex gap-1 border-b border-gray-200 dark:border-gray-700 mb-4">
          <Tabs.Trigger
            value="1"
            className="px-6 py-3 font-medium text-gray-700 dark:text-gray-300 border-b-2 transition-colors
                       data-[state=active]:border-blue-600 dark:data-[state=active]:border-blue-400 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400
                       data-[state=inactive]:border-transparent hover:text-blue-500 dark:hover:text-blue-400"
          >
            Items
          </Tabs.Trigger>
          <Tabs.Trigger
            value="2"
            className="px-6 py-3 font-medium text-gray-700 dark:text-gray-300 border-b-2 transition-colors
                       data-[state=active]:border-blue-600 dark:data-[state=active]:border-blue-400 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400
                       data-[state=inactive]:border-transparent hover:text-blue-500 dark:hover:text-blue-400"
          >
            Buildings
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="1">
          <RecipeGrid
            recipes={filteredRecipes}
            tab={1}
            onRecipeSelect={onRecipeSelect}
            selectedRecipeId={selectedRecipeId}
          />
        </Tabs.Content>

        <Tabs.Content value="2">
          <RecipeGrid
            recipes={filteredRecipes}
            tab={2}
            onRecipeSelect={onRecipeSelect}
            selectedRecipeId={selectedRecipeId}
          />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}
