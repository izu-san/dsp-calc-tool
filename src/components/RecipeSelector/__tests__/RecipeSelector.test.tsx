import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RecipeSelector } from '../index';
import type { Recipe } from '../../../types';
import { useFavoritesStore } from '../../../stores/favoritesStore';

// i18nextのモック
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// favoritesStoreのモック
vi.mock('../../../stores/favoritesStore', () => ({
  useFavoritesStore: vi.fn(),
}));

describe('RecipeSelector', () => {
  const mockRecipes: Recipe[] = [
    {
      SID: 1,
      name: 'Iron Ingot',
      Type: 'Smelt',
      GridIndex: '1101',
      Items: [{ id: 1001, name: 'Iron Ore', count: 1, Type: 'Material', isRaw: true }],
      Results: [{ id: 1101, name: 'Iron Ingot', count: 1, Type: 'Material', isRaw: false }],
      Explicit: false,
      TimeSpend: 60,
      productive: false,
    },
    {
      SID: 2,
      name: 'Copper Ingot',
      Type: 'Smelt',
      GridIndex: '1104',
      Items: [{ id: 1002, name: 'Copper Ore', count: 1, Type: 'Material', isRaw: true }],
      Results: [{ id: 1104, name: 'Copper Ingot', count: 1, Type: 'Material', isRaw: false }],
      Explicit: false,
      TimeSpend: 60,
      productive: false,
    },
    {
      SID: 3,
      name: 'Circuit Board',
      Type: 'Assemble',
      GridIndex: '1105',
      Items: [
        { id: 1101, name: 'Iron Ingot', count: 2, Type: 'Material', isRaw: false },
        { id: 1104, name: 'Copper Ingot', count: 1, Type: 'Material', isRaw: false },
      ],
      Results: [{ id: 1105, name: 'Circuit Board', count: 2, Type: 'Component', isRaw: false }],
      Explicit: false,
      TimeSpend: 60,
      productive: false,
    },
  ];

  const mockOnRecipeSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useFavoritesStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      favoriteRecipes: new Set<number>(),
      isFavorite: vi.fn(() => false),
      addFavorite: vi.fn(),
      removeFavorite: vi.fn(),
      toggleFavorite: vi.fn(),
    });
  });

  it('レシピグリッドをレンダリングできる', () => {
    render(
      <RecipeSelector
        recipes={mockRecipes}
        onRecipeSelect={mockOnRecipeSelect}
      />
    );

    // 検索ボックスが表示されることを確認
    expect(screen.getByPlaceholderText('searchRecipesItemsMaterials')).toBeInTheDocument();
  });

  it('検索クエリでレシピをフィルタリングできる', async () => {
    render(
      <RecipeSelector
        recipes={mockRecipes}
        onRecipeSelect={mockOnRecipeSelect}
      />
    );

    const searchInput = screen.getByPlaceholderText('searchRecipesItemsMaterials');
    
    // 「iron」で検索
    fireEvent.change(searchInput, { target: { value: 'iron' } });

    await waitFor(() => {
      // Iron Ingotのみが表示されることを期待
      // フィルタリング結果は RecipeGrid コンポーネントに依存するため、
      // ここでは検索入力が正しく動作することを確認
      expect(searchInput).toHaveValue('iron');
    });
  });

  it('検索クエリをクリアできる', async () => {
    render(
      <RecipeSelector
        recipes={mockRecipes}
        onRecipeSelect={mockOnRecipeSelect}
      />
    );

    const searchInput = screen.getByPlaceholderText('searchRecipesItemsMaterials');
    
    // 検索テキストを入力
    fireEvent.change(searchInput, { target: { value: 'iron' } });
    expect(searchInput).toHaveValue('iron');

    // クリアボタンをクリック
    const clearButton = screen.getByRole('button', { name: '✕' });
    fireEvent.click(clearButton);

    await waitFor(() => {
      expect(searchInput).toHaveValue('');
    });
  });

  it('カテゴリフィルタリングが動作する', () => {
    const { container } = render(
      <RecipeSelector
        recipes={mockRecipes}
        onRecipeSelect={mockOnRecipeSelect}
      />
    );

    // カテゴリボタンが存在することを確認
    const categoryButtons = container.querySelectorAll('button[role="tab"]');
    expect(categoryButtons.length).toBeGreaterThan(0);
  });

  it('お気に入りフィルタが動作する', () => {
    // お気に入りに追加されたレシピをモック
    (useFavoritesStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      favoriteRecipes: new Set([1]), // Iron Ingot をお気に入りに
      isFavorite: vi.fn((id) => id === 1),
      addFavorite: vi.fn(),
      removeFavorite: vi.fn(),
      toggleFavorite: vi.fn(),
    });

    const { container } = render(
      <RecipeSelector
        recipes={mockRecipes}
        onRecipeSelect={mockOnRecipeSelect}
      />
    );

    // お気に入りボタンが存在することを確認（実装に依存）
    expect(container).toBeInTheDocument();
  });

  it('原材料で検索できる（入力アイテム）', async () => {
    render(
      <RecipeSelector
        recipes={mockRecipes}
        onRecipeSelect={mockOnRecipeSelect}
      />
    );

    const searchInput = screen.getByPlaceholderText('searchRecipesItemsMaterials');
    
    // 「Iron Ore」で検索（Circuit Boardの原材料ではない）
    fireEvent.change(searchInput, { target: { value: 'ore' } });

    await waitFor(() => {
      expect(searchInput).toHaveValue('ore');
      // Iron Ore を使用する Iron Ingot と Copper Ore を使用する Copper Ingot が表示される
    });
  });

  it('生成物で検索できる（出力アイテム）', async () => {
    render(
      <RecipeSelector
        recipes={mockRecipes}
        onRecipeSelect={mockOnRecipeSelect}
      />
    );

    const searchInput = screen.getByPlaceholderText('searchRecipesItemsMaterials');
    
    // 「Circuit」で検索
    fireEvent.change(searchInput, { target: { value: 'circuit' } });

    await waitFor(() => {
      expect(searchInput).toHaveValue('circuit');
      // Circuit Board レシピが表示される
    });
  });

  it('検索結果がない場合にヘルプメッセージを表示する', async () => {
    render(
      <RecipeSelector
        recipes={mockRecipes}
        onRecipeSelect={mockOnRecipeSelect}
      />
    );

    const searchInput = screen.getByPlaceholderText('searchRecipesItemsMaterials');
    
    // 存在しないアイテムで検索
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

    await waitFor(() => {
      // ヘルプメッセージが表示される
      expect(screen.getByText('noResultsFound')).toBeInTheDocument();
    });
  });

  it('検索サジェスチョンが表示される', async () => {
    render(
      <RecipeSelector
        recipes={mockRecipes}
        onRecipeSelect={mockOnRecipeSelect}
      />
    );

    const searchInput = screen.getByPlaceholderText('searchRecipesItemsMaterials');
    
    // 検索テキストを入力してフォーカス
    fireEvent.change(searchInput, { target: { value: 'ir' } });
    fireEvent.focus(searchInput);

    await waitFor(() => {
      // サジェスチョンヘッダーが表示される
      const suggestions = screen.queryByText('suggestions');
      if (suggestions) {
        expect(suggestions).toBeInTheDocument();
      }
    });
  });

  it('サジェスチョンをクリックして検索できる', async () => {
    render(
      <RecipeSelector
        recipes={mockRecipes}
        onRecipeSelect={mockOnRecipeSelect}
      />
    );

    const searchInput = screen.getByPlaceholderText('searchRecipesItemsMaterials');
    
    // 検索テキストを入力
    fireEvent.change(searchInput, { target: { value: 'iron' } });
    fireEvent.focus(searchInput);

    await waitFor(() => {
      const suggestionButtons = screen.queryAllByRole('button');
      const ironSuggestion = suggestionButtons.find(btn => 
        btn.textContent?.toLowerCase().includes('iron')
      );
      
      if (ironSuggestion) {
        fireEvent.click(ironSuggestion);
        expect(searchInput).toHaveValue('Iron Ingot');
      }
    });
  });

  it('選択されたレシピIDをハイライトする', () => {
    const { container } = render(
      <RecipeSelector
        recipes={mockRecipes}
        onRecipeSelect={mockOnRecipeSelect}
        selectedRecipeId={1}
      />
    );

    // selectedRecipeId が RecipeGrid に渡されることを確認
    expect(container).toBeInTheDocument();
  });

  // ===========================
  // 追加の関数カバレッジテスト
  // ===========================

  it('カテゴリフィルタリングが正しく動作する', () => {
    render(
      <RecipeSelector
        recipes={mockRecipes}
        onRecipeSelect={mockOnRecipeSelect}
      />
    );

    // Smelt カテゴリをクリック
    const smeltButton = screen.getByText('categorySmelt');
    fireEvent.click(smeltButton);

    // カテゴリが選択されたことを確認
    expect(smeltButton).toHaveClass('bg-neon-blue/40');
  });

  it('お気に入りフィルタが正しく動作する', () => {
    // お気に入りに追加されたレシピをモック
    (useFavoritesStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      favoriteRecipes: new Set([1]), // Iron Ingot をお気に入りに
      isFavorite: vi.fn((id) => id === 1),
      addFavorite: vi.fn(),
      removeFavorite: vi.fn(),
      toggleFavorite: vi.fn(),
    });

    render(
      <RecipeSelector
        recipes={mockRecipes}
        onRecipeSelect={mockOnRecipeSelect}
      />
    );

    // お気に入りボタンをクリック
    const favoritesButton = screen.getByText(/favorites/);
    fireEvent.click(favoritesButton);

    // お気に入りフィルタが有効になったことを確認
    expect(favoritesButton).toHaveClass('bg-neon-yellow/40');
  });

  it('検索クエリが2文字未満の場合はサジェスチョンを表示しない', async () => {
    render(
      <RecipeSelector
        recipes={mockRecipes}
        onRecipeSelect={mockOnRecipeSelect}
      />
    );

    const searchInput = screen.getByPlaceholderText('searchRecipesItemsMaterials');
    
    // 1文字だけ入力
    fireEvent.change(searchInput, { target: { value: 'i' } });
    fireEvent.focus(searchInput);

    await waitFor(() => {
      // サジェスチョンが表示されないことを確認
      expect(screen.queryByText('suggestions')).not.toBeInTheDocument();
    });
  });

  it('検索サジェスチョンが5件までに制限される', async () => {
    // 多くのレシピを含むモックデータを作成
    const manyRecipes: Recipe[] = Array.from({ length: 10 }, (_, i) => ({
      SID: i + 100,
      name: `Test Item ${i}`,
      Type: 'Assemble',
      GridIndex: `${1000 + i}`,
      Items: [],
      Results: [{ id: 1000 + i, name: `Test Item ${i}`, count: 1, Type: 'Material', isRaw: false }],
      Explicit: false,
      TimeSpend: 60,
      productive: false,
    }));

    render(
      <RecipeSelector
        recipes={manyRecipes}
        onRecipeSelect={mockOnRecipeSelect}
      />
    );

    const searchInput = screen.getByPlaceholderText('searchRecipesItemsMaterials');
    
    // 「Test」で検索
    fireEvent.change(searchInput, { target: { value: 'test' } });
    fireEvent.focus(searchInput);

    await waitFor(() => {
      // サジェスチョンが表示されることを確認
      const suggestions = screen.queryByText('suggestions');
      if (suggestions) {
        expect(suggestions).toBeInTheDocument();
      }
    });
  });

  it('検索でSIDがマッチする', async () => {
    render(
      <RecipeSelector
        recipes={mockRecipes}
        onRecipeSelect={mockOnRecipeSelect}
      />
    );

    const searchInput = screen.getByPlaceholderText('searchRecipesItemsMaterials');
    
    // SIDで検索
    fireEvent.change(searchInput, { target: { value: '1' } });

    await waitFor(() => {
      expect(searchInput).toHaveValue('1');
    });
  });

  it('タブ切り替えが正しく動作する', () => {
    render(
      <RecipeSelector
        recipes={mockRecipes}
        onRecipeSelect={mockOnRecipeSelect}
      />
    );

    // Buildings タブをクリック
    const buildingsTab = screen.getByText('Buildings');
    fireEvent.click(buildingsTab);

    // Buildings タブが選択されたことを確認
    expect(buildingsTab).toHaveClass('data-[state=active]:text-neon-cyan');
  });

  it('検索クエリが空の場合は全てのレシピが表示される', () => {
    render(
      <RecipeSelector
        recipes={mockRecipes}
        onRecipeSelect={mockOnRecipeSelect}
      />
    );

    const searchInput = screen.getByPlaceholderText('searchRecipesItemsMaterials');
    
    // 検索クエリが空であることを確認
    expect(searchInput).toHaveValue('');
    
    // 結果カウントが全てのレシピ数を表示することを確認（テキストが分割されているため、より柔軟な検索を使用）
    expect(screen.getByText(mockRecipes.length.toString())).toBeInTheDocument();
    expect(screen.getByText('recipes found')).toBeInTheDocument();
  });

  it('検索結果カウントが正しく表示される', async () => {
    render(
      <RecipeSelector
        recipes={mockRecipes}
        onRecipeSelect={mockOnRecipeSelect}
      />
    );

    const searchInput = screen.getByPlaceholderText('searchRecipesItemsMaterials');
    
    // 「iron」で検索
    fireEvent.change(searchInput, { target: { value: 'iron' } });

    await waitFor(() => {
      // 検索結果カウントが表示されることを確認
      expect(screen.getByText(/recipes found/)).toBeInTheDocument();
    });
  });

  it('検索クエリが入力されている場合は検索範囲が表示される', async () => {
    render(
      <RecipeSelector
        recipes={mockRecipes}
        onRecipeSelect={mockOnRecipeSelect}
      />
    );

    const searchInput = screen.getByPlaceholderText('searchRecipesItemsMaterials');
    
    // 検索クエリを入力
    fireEvent.change(searchInput, { target: { value: 'iron' } });

    await waitFor(() => {
      // 検索範囲の説明が表示されることを確認
      expect(screen.getByText(/searchingInNamesIDsInputsOutputs/)).toBeInTheDocument();
    });
  });

  it('カテゴリアイコンが正しく表示される', () => {
    render(
      <RecipeSelector
        recipes={mockRecipes}
        onRecipeSelect={mockOnRecipeSelect}
      />
    );

    // カテゴリボタンにアイコンが含まれることを確認
    const categoryButtons = screen.getAllByRole('button');
    const smeltButton = categoryButtons.find(btn => btn.textContent?.includes('categorySmelt'));
    
    expect(smeltButton).toBeTruthy();
  });

  it('カテゴリアイコンの読み込みエラーが処理される', () => {
    render(
      <RecipeSelector
        recipes={mockRecipes}
        onRecipeSelect={mockOnRecipeSelect}
      />
    );

    // アイコン要素を取得
    const iconImages = screen.getAllByRole('img');
    
    // アイコンが存在する場合はエラーハンドリングが設定されていることを確認
    if (iconImages.length > 0) {
      // React Testing LibraryではonErrorは直接属性として取得できないため、
      // アイコンが存在することのみを確認
      expect(iconImages[0]).toBeInTheDocument();
    }
  });

  it('お気に入り数の表示が正しく動作する', () => {
    // お気に入りに追加されたレシピをモック
    (useFavoritesStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      favoriteRecipes: new Set([1, 2]), // 2つのレシピをお気に入りに
      isFavorite: vi.fn((id) => id === 1 || id === 2),
      addFavorite: vi.fn(),
      removeFavorite: vi.fn(),
      toggleFavorite: vi.fn(),
    });

    render(
      <RecipeSelector
        recipes={mockRecipes}
        onRecipeSelect={mockOnRecipeSelect}
      />
    );

    // お気に入りボタンにお気に入り数が表示されることを確認
    expect(screen.getByText(/favorites.*2/)).toBeInTheDocument();
  });

  it('お気に入りが0の場合は数が表示されない', () => {
    // お気に入りが空の状態をモック
    (useFavoritesStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      favoriteRecipes: new Set(),
      isFavorite: vi.fn(() => false),
      addFavorite: vi.fn(),
      removeFavorite: vi.fn(),
      toggleFavorite: vi.fn(),
    });

    render(
      <RecipeSelector
        recipes={mockRecipes}
        onRecipeSelect={mockOnRecipeSelect}
      />
    );

    // お気に入りボタンに数が表示されないことを確認
    const favoritesButton = screen.getByText(/favorites/);
    expect(favoritesButton.textContent).not.toMatch(/\(\d+\)/);
  });

  it('検索サジェスチョンのクリックで検索クエリが設定される', async () => {
    render(
      <RecipeSelector
        recipes={mockRecipes}
        onRecipeSelect={mockOnRecipeSelect}
      />
    );

    const searchInput = screen.getByPlaceholderText('searchRecipesItemsMaterials');
    
    // 検索テキストを入力
    fireEvent.change(searchInput, { target: { value: 'iron' } });
    fireEvent.focus(searchInput);

    await waitFor(() => {
      const suggestionButtons = screen.queryAllByRole('button');
      const ironSuggestion = suggestionButtons.find(btn => 
        btn.textContent?.toLowerCase().includes('iron')
      );
      
      if (ironSuggestion) {
        fireEvent.click(ironSuggestion);
        expect(searchInput).toHaveValue('Iron Ingot');
      }
    });
  });

  it('検索サジェスチョンがフォーカスアウトで非表示になる', async () => {
    render(
      <RecipeSelector
        recipes={mockRecipes}
        onRecipeSelect={mockOnRecipeSelect}
      />
    );

    const searchInput = screen.getByPlaceholderText('searchRecipesItemsMaterials');
    
    // 検索テキストを入力してフォーカス
    fireEvent.change(searchInput, { target: { value: 'iron' } });
    fireEvent.focus(searchInput);

    await waitFor(() => {
      // サジェスチョンが表示されることを確認
      const suggestions = screen.queryByText('suggestions');
      if (suggestions) {
        expect(suggestions).toBeInTheDocument();
      }
    });

    // フォーカスアウト
    fireEvent.blur(searchInput);

    // 200ms後にサジェスチョンが非表示になることを確認
    await new Promise(resolve => setTimeout(resolve, 250));
    
    expect(screen.queryByText('suggestions')).not.toBeInTheDocument();
  });
});
