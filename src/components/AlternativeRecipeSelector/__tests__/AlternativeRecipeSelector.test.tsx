import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { AlternativeRecipeSelector } from '../index';

// i18n をモック（キーをそのまま返す）
vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key: string) => key }),
}));

// createPortal を素通し
vi.mock('react-dom', () => ({
    createPortal: (node: unknown) => node,
}));

// RecipeComparisonModal を簡素化（onSelectRecipe を呼べるように）
vi.mock('../../RecipeComparisonModal', () => ({
    RecipeComparisonModal: (props: any) => (
        <div>
            <div>comparison:{props.itemName}</div>
            <button onClick={() => props.onSelectRecipe(props.recipes[0].SID)}>select-first</button>
            <button onClick={props.onClose}>close</button>
        </div>
    ),
}));

// 原料判定をモック（200 を採掘可能とする）
vi.mock('../../../constants/rawMaterials', () => ({
    isRawMaterial: (id: number) => id === 200,
}));

// ストアをモック
const setAlternativeRecipe = vi.fn();

vi.mock('../../../stores/settingsStore', () => ({
    useSettingsStore: () => ({
        settings: { alternativeRecipes: new Map<number, number>() },
        setAlternativeRecipe,
    }),
}));

let gameDataMock: any = null;
vi.mock('../../../stores/gameDataStore', () => ({
    useGameDataStore: () => ({ data: gameDataMock }),
}));

let selectionMock: any = null;
vi.mock('../../../stores/recipeSelectionStore', () => ({
    useRecipeSelectionStore: () => selectionMock,
}));

describe('AlternativeRecipeSelector', () => {
    beforeEach(() => {
        setAlternativeRecipe.mockReset();
        gameDataMock = null;
        selectionMock = { selectedRecipe: null, calculationResult: null };
    });
    afterEach(() => {
        cleanup();
        vi.restoreAllMocks();
    });

    it('data/selectedRecipe がない場合は描画しない(null)', () => {
        render(<AlternativeRecipeSelector />);
        expect(screen.queryByText('noAlternativeRecipesFound')).not.toBeInTheDocument();
    });

    it('対象アイテムが無い場合は noAlternativeRecipesFound を表示', () => {
        gameDataMock = {
            recipesByItemId: new Map<number, any[]>(),
            allItems: new Map<number, any>(),
        };
        selectionMock = {
            selectedRecipe: { SID: 1, Items: [], Results: [], TimeSpend: 60, Type: 'Smelt', name: 'R' },
            calculationResult: {
                rootNode: { recipe: { Items: [{ id: 999, name: 'X', count: 1 }], Results: [], TimeSpend: 60 }, children: [] },
            },
        };
        render(<AlternativeRecipeSelector />);
        expect(screen.getByText('noAlternativeRecipesFound')).toBeInTheDocument();
    });

    it('代替レシピがあるアイテムの展開と選択ができる', () => {
        // item 100 に2レシピを用意
        const recipeA = { SID: 10, name: 'RecipeA', Items: [], Results: [{ id: 100, name: 'Item100', count: 1 }], TimeSpend: 120, Type: 'Assemble' };
        const recipeB = { SID: 20, name: 'RecipeB', Items: [], Results: [{ id: 100, name: 'Item100', count: 1 }], TimeSpend: 60, Type: 'Assemble' };
        gameDataMock = {
            recipesByItemId: new Map<number, any[]>([[100, [recipeB, recipeA]]]),
            allItems: new Map<number, any>([[100, { name: 'Item100', miningFrom: '' }]]),
        };
        selectionMock = {
            selectedRecipe: { SID: 999, Items: [], Results: [], TimeSpend: 60, Type: 'Smelt', name: 'Root' },
            calculationResult: {
                rootNode: { recipe: { Items: [{ id: 100, name: 'Item100', count: 1 }], Results: [], TimeSpend: 60 }, children: [] },
            },
        };
        render(<AlternativeRecipeSelector />);
        // ヘッダークリックで展開
        fireEvent.click(screen.getByText('Item100'));
        // レシピ名クリックで選択（ヘッダーの選択表示と重複するため2件目をクリック）
        const recipeATexts = screen.getAllByText('RecipeA');
        fireEvent.click(recipeATexts[1]);
        expect(setAlternativeRecipe).toHaveBeenCalledWith(100, 10);
    });

    it('採掘可能アイテム(200)では mining オプションが表示され選択できる', () => {
        const recipeC = { SID: 30, name: 'RecipeC', Items: [], Results: [{ id: 200, name: 'Item200', count: 1 }], TimeSpend: 60, Type: 'Assemble' };
        gameDataMock = {
            recipesByItemId: new Map<number, any[]>([[200, [recipeC]]]),
            allItems: new Map<number, any>([[200, { name: 'Item200', miningFrom: 'Somewhere' }]]),
        };
        selectionMock = {
            selectedRecipe: { SID: 1, Items: [], Results: [], TimeSpend: 60, Type: 'Smelt', name: 'Root' },
            calculationResult: {
                rootNode: { recipe: { Items: [{ id: 200, name: 'Item200', count: 1 }], Results: [], TimeSpend: 60 }, children: [] },
            },
        };
        render(<AlternativeRecipeSelector />);
        fireEvent.click(screen.getByText('Item200'));
        fireEvent.click(screen.getByText('mining'));
        expect(setAlternativeRecipe).toHaveBeenCalledWith(200, -1);
    });

    it('比較ボタンで比較モーダルを開き、モーダルから選択できる', () => {
        const recipeA = { SID: 11, name: 'RecipeA', Items: [], Results: [{ id: 300, name: 'Item300', count: 1 }], TimeSpend: 60, Type: 'Assemble' };
        const recipeB = { SID: 12, name: 'RecipeB', Items: [], Results: [{ id: 300, name: 'Item300', count: 1 }], TimeSpend: 60, Type: 'Assemble' };
        gameDataMock = {
            recipesByItemId: new Map<number, any[]>([[300, [recipeA, recipeB]]]),
            allItems: new Map<number, any>([[300, { name: 'Item300', miningFrom: '' }]]),
        };
        selectionMock = {
            selectedRecipe: { SID: 2, Items: [], Results: [], TimeSpend: 60, Type: 'Smelt', name: 'Root' },
            calculationResult: {
                rootNode: { recipe: { Items: [{ id: 300, name: 'Item300', count: 1 }], Results: [], TimeSpend: 60 }, children: [] },
            },
        };
        render(<AlternativeRecipeSelector />);
        fireEvent.click(screen.getByText('Item300'));
        // 比較ボタン（タイトルキー compare）
        fireEvent.click(screen.getByTitle('compareRecipes'));
        expect(screen.getByText('comparison:Item300')).toBeInTheDocument();
        fireEvent.click(screen.getByText('select-first'));
        expect(setAlternativeRecipe).toHaveBeenCalledWith(300, 11);
    });
});


