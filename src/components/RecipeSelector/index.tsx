import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import * as Tabs from '@radix-ui/react-tabs';
import type { Recipe } from '../../types';
import { RecipeGrid } from './RecipeGrid';
import { useFavoritesStore } from '../../stores/favoritesStore';
import { ItemIcon } from '../ItemIcon';
import { useDebounce } from '../../hooks/useDebounce';
import { cn } from '../../utils/classNames';

interface RecipeSelectorProps {
  recipes: Recipe[];
  onRecipeSelect: (recipe: Recipe) => void;
  selectedRecipeId?: number;
}

export function RecipeSelector({ recipes, onRecipeSelect, selectedRecipeId }: RecipeSelectorProps) {
  // 同じレシピが選択された場合は何もしない
  const handleRecipeSelect = (recipe: Recipe) => {
    if (recipe.SID === selectedRecipeId) {
      return;
    }
    onRecipeSelect(recipe);
  };
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'1' | '2'>('1');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // 検索クエリをデバウンス（300ms）してパフォーマンスを向上
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  const { favoriteRecipes } = useFavoritesStore();

  // Get unique categories from recipes
  const categories = useMemo(() => {
    const types = new Set<string>();
    recipes.forEach(recipe => {
      // PhotonGenerationは専用カテゴリーを表示しない（検索で見つけられるため）
      if (recipe.Type && recipe.Type !== 'PhotonGeneration') {
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
  // デバウンスされた検索クエリを使用してパフォーマンスを向上
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
      if (debouncedSearchQuery) {
        const query = debouncedSearchQuery.toLowerCase();
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
  }, [recipes, debouncedSearchQuery, selectedCategory, showOnlyFavorites, favoriteRecipes]);

  // Get category icon ID and label (memoized to update when language changes)
  const getCategoryInfo = useMemo(() => (category: string): { iconId?: number; label: string } => {
    if (category === 'all') return { label: t('categoryAll') };
    
    const categoryIconMap: Record<string, { iconId: number; label: string }> = {
      'Smelt': { iconId: 2302, label: t('categorySmelt') },
      'Assemble': { iconId: 2303, label: t('categoryAssemble') },
      'Chemical': { iconId: 2309, label: t('categoryChemical') },
      'Research': { iconId: 2901, label: t('categoryResearch') },
      'Refine': { iconId: 2308, label: t('categoryRefine') },
      'Particle': { iconId: 2310, label: t('categoryParticle') },
      'Fractionate': { iconId: 2314, label: t('categoryFractionate') },
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
          className="w-full px-4 py-2 pl-10 border border-neon-blue/30 bg-dark-700/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-neon-blue focus:border-neon-blue transition-all placeholder-space-400"
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
          <div 
            className="absolute z-10 w-full mt-1 border-2 border-neon-cyan/50 rounded-lg shadow-[0_0_20px_rgba(0,217,255,0.3)] max-h-60 overflow-y-auto"
            style={{ backgroundColor: '#0F172A' }}
          >
            <div className="p-2">
              <div className="text-xs text-neon-cyan font-semibold mb-2 px-2 flex items-center gap-1">
                <span>💡</span>
                {t('suggestions')}
              </div>
              {searchSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setSearchQuery(suggestion);
                    setShowSuggestions(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-md text-sm text-space-200 hover:text-white transition-all hover:bg-neon-cyan/30 hover:border-neon-cyan border-2 border-transparent hover:scale-[1.02] hover:shadow-[0_0_10px_rgba(0,217,255,0.4)] ripple-effect"
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-space-400 group-hover:text-neon-cyan transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      {debouncedSearchQuery && filteredRecipes.length === 0 && (
        <div className="bg-neon-blue/10 border border-neon-blue/40 rounded-lg p-4 backdrop-blur-sm">
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
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-all border-2 ripple-effect',
            {
              'bg-neon-yellow/40 border-neon-yellow text-white shadow-[0_0_20px_rgba(255,215,0,0.6)] scale-110 font-bold': showOnlyFavorites,
              'bg-dark-700/50 border-neon-yellow/20 text-space-300 hover:border-neon-yellow/40 hover:bg-neon-yellow/10 hover:text-neon-yellow hover:scale-105': !showOnlyFavorites,
            }
          )}
        >
          ⭐ {t('favorites')} {favoriteRecipes.size > 0 && `(${favoriteRecipes.size})`}
        </button>
        
        {/* Category Buttons */}
        {categories.map((category) => {
          const categoryInfo = getCategoryInfo(category);
          return (
            <button
              key={category}
              onClick={() => {
                setSelectedCategory(category);
                // カテゴリー変更時にお気に入りフィルターを解除
                if (showOnlyFavorites) {
                  setShowOnlyFavorites(false);
                }
              }}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all border-2 flex items-center gap-2 ripple-effect',
                {
                  'bg-neon-blue/40 border-neon-blue text-white shadow-[0_0_20px_rgba(0,136,255,0.6)] scale-110 font-bold': selectedCategory === category,
                  'bg-dark-700/50 border-neon-blue/20 text-space-300 hover:border-neon-blue/40 hover:bg-neon-blue/10 hover:text-neon-blue hover:scale-105': selectedCategory !== category,
                }
              )}
            >
              {categoryInfo.iconId && (
                <ItemIcon 
                  itemId={categoryInfo.iconId} 
                  alt={categoryInfo.label}
                  size={20}
                />
              )}
              {categoryInfo.label}
            </button>
          );
        })}
      </div>

      {/* Results Count */}
      <div className="text-sm text-space-200">
        <span className="text-neon-cyan font-semibold">{filteredRecipes.length}</span> {filteredRecipes.length !== 1 ? t('recipes') : t('recipe')} {t('found')}
        {debouncedSearchQuery && (
          <span>
            {' '}{t('for')}{' '}
            <span className="font-semibold text-neon-cyan">"{debouncedSearchQuery}"</span>
            <span className="text-xs ml-2 text-space-400">
              ({t('searchingInNamesIDsInputsOutputs')})
            </span>
          </span>
        )}
      </div>

      <Tabs.Root value={activeTab} onValueChange={(value) => setActiveTab(value as '1' | '2')}>
        <Tabs.List className="flex gap-1 border-b border-neon-blue/20 mb-4">
          <Tabs.Trigger
            value="1"
            className="px-6 py-3 font-medium text-space-200 border-b-2 transition-all ripple-effect
                       data-[state=active]:border-neon-cyan data-[state=active]:text-neon-cyan data-[state=active]:shadow-[0_0_10px_rgba(0,217,255,0.3)]
                       data-[state=inactive]:border-transparent hover:text-neon-cyan hover:border-neon-cyan/50"
          >
            Items
          </Tabs.Trigger>
          <Tabs.Trigger
            value="2"
            className="px-6 py-3 font-medium text-space-200 border-b-2 transition-all ripple-effect
                       data-[state=active]:border-neon-cyan data-[state=active]:text-neon-cyan data-[state=active]:shadow-[0_0_10px_rgba(0,217,255,0.3)]
                       data-[state=inactive]:border-transparent hover:text-neon-cyan hover:border-neon-cyan/50"
          >
            Buildings
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="1">
          <RecipeGrid
            recipes={filteredRecipes}
            tab={1}
            onRecipeSelect={handleRecipeSelect}
            selectedRecipeId={selectedRecipeId}
          />
        </Tabs.Content>

        <Tabs.Content value="2">
          <RecipeGrid
            recipes={filteredRecipes}
            tab={2}
            onRecipeSelect={handleRecipeSelect}
            selectedRecipeId={selectedRecipeId}
          />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}
