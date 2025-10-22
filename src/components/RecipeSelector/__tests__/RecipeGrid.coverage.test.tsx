import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { RecipeSelector } from '../index';

// i18n モック
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

// ItemIcon モック（スプライトシート対応）
vi.mock('../../ItemIcon', () => ({
  ItemIcon: ({ itemId, alt, size }: any) => (
    <div data-testid={`item-icon-${itemId}`} data-alt={alt} data-size={size}>
      {`Icon ${itemId}`}
    </div>
  ),
}));

// お気に入りストアをモック
const toggleFavorite = vi.fn();
const isFavorite = vi.fn(() => false);
let favoriteRecipesSize = 0;
vi.mock('../../../stores/favoritesStore', () => ({
  useFavoritesStore: () => ({
    favoriteRecipes: new Set<number>(Array.from({ length: favoriteRecipesSize }, (_, i) => i + 1)),
    toggleFavorite,
    isFavorite,
  }),
}));

describe('RecipeSelector/RecipeGrid coverage additions', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    favoriteRecipesSize = 0;
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const baseRecipes = [
    {
      SID: 1001,
      name: 'Iron Ingot',
      Type: 'Smelt',
      GridIndex: '1101', // z=1, y=1, x=01
      Items: [{ id: 110, name: 'Iron Ore', quantity: 1 }],
      Results: [{ id: 120, name: 'Iron Ingot', quantity: 1 }],
      Explicit: false,
    },
    {
      SID: 2001,
      name: 'Circuit',
      Type: 'Assemble',
      GridIndex: '2202', // z=2, y=2, x=02（Buildings タブ）
      Items: [{ id: 210, name: 'Iron Ingot', quantity: 1 }],
      Results: [{ id: 220, name: 'Circuit', quantity: 1 }],
      Explicit: false,
    },
  ] as any[];

  it('空データ時、検索後の noResultsFound が表示される', () => {
    render(<RecipeSelector recipes={[]} onRecipeSelect={vi.fn()} />);
    const input = screen.getByPlaceholderText('searchRecipesItemsMaterials') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'iron' } });
    expect(screen.getByText('noResultsFound')).toBeInTheDocument();
  });

  it('カテゴリ/タブ切替で該当レシピが表示され選択できる（Many/Filter）', async () => {
    const onSelect = vi.fn();
    render(<RecipeSelector recipes={baseRecipes} onRecipeSelect={onSelect} />);

    // まずItemsタブでIron Ingotを確認
    fireEvent.click(screen.getByRole('tab', { name: 'Items' }));
    fireEvent.click(screen.getByText('categorySmelt'));
    
    // Iron Ingotボタンを探す
    const ironButton = screen.queryByTitle('Iron Ingot');
    expect(ironButton).toBeTruthy();
    
    if (ironButton) {
      fireEvent.click(ironButton);
      expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({
        SID: 1001,
        name: 'Iron Ingot'
      }));
    }
  });

  it('検索サジェストとお気に入りトグルが動作する', () => {
    favoriteRecipesSize = 1; // バッジ表記を出す
    const onSelect = vi.fn();
    render(<RecipeSelector recipes={baseRecipes} onRecipeSelect={onSelect} />);

    const input = screen.getByPlaceholderText('searchRecipesItemsMaterials') as HTMLInputElement;
    // focus → 2文字以上でサジェスト生成（Results/Items 名にもマッチ）
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'Ir' } });
    // サジェスト表示（Iron Ingot など）
    expect(screen.getByText((c) => c === 'suggestions')).toBeInTheDocument();

    // お気に入りトグルをクリック（スターはグリッドセル内右上）
    // Smelt カテゴリにしてタブ1に Iron Ingot を表示
    fireEvent.click(screen.getByText('Items'));
    fireEvent.click(screen.getByText('categorySmelt'));
    const star = screen.getAllByTitle('addToFavorites')[0];
    fireEvent.click(star);
    expect(toggleFavorite).toHaveBeenCalled();
  });
});


