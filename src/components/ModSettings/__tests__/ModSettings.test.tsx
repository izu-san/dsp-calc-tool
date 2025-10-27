import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { act } from 'react';
import { ModSettings } from '../index';
import { actAsync, actAndWaitFor } from '../../../test/helpers/actHelpers';

// i18n モック
vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key: string) => key }),
}));

// ポータル簡略化
vi.mock('react-dom', () => ({
    createPortal: (node: unknown) => node,
}));

// parser モック
const loadGameData = vi.fn();
vi.mock('../../../lib/parser', () => ({
    loadGameData: (...args: any[]) => loadGameData(...args),
}));

// stores モック
const updateData = vi.fn();
vi.mock('../../../stores/gameDataStore', () => ({
    useGameDataStore: () => ({ updateData }),
}));

const settingsMock = {
    proliferatorMultiplier: { production: 1, speed: 1 },
};
const setProliferatorMultiplier = vi.fn();
vi.mock('../../../stores/settingsStore', () => ({
    useSettingsStore: () => ({ settings: settingsMock as any, setProliferatorMultiplier }),
}));

describe('ModSettings', () => {
    let confirmMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        vi.clearAllMocks();
        updateData.mockReset();
        setProliferatorMultiplier.mockReset();
        loadGameData.mockReset();
        
        // vitest 4.0 での window.confirm モック
        confirmMock = vi.fn(() => true);
        Object.defineProperty(window, 'confirm', {
            value: confirmMock,
            writable: true,
        });
    });
    afterEach(() => {
        cleanup();
        vi.restoreAllMocks();
    });

    function openModal() {
        render(<ModSettings />);
        const trigger = document.getElementById('mod-settings-trigger') as HTMLButtonElement;
        act(() => {
            fireEvent.click(trigger);
        });
    }

    it('トリガーボタンでモーダルが開く', () => {
        openModal();
        expect(screen.getByText('modSettings')).toBeInTheDocument();
    });

    it('XML以外のファイルで invalidFileType を表示', async () => {
        openModal();
        const input = document.getElementById('recipes-upload') as HTMLInputElement;
        const file = new File(['{}'], 'not-xml.txt', { type: 'text/plain' });
        await fireEvent.change(input, { target: { files: [file] } });
        await waitFor(() => expect(screen.getByText(/invalidFileType/)).toBeInTheDocument());
    });

    it('10MB 超で fileTooLarge を表示', async () => {
        openModal();
        const input = document.getElementById('recipes-upload') as HTMLInputElement;
        const big = new File(['x'], 'big.xml', { type: 'text/xml' });
        Object.defineProperty(big, 'size', { value: 10 * 1024 * 1024 + 1 });
        await fireEvent.change(input, { target: { files: [big] } });
        await waitFor(() => expect(screen.getByText(/fileTooLarge/)).toBeInTheDocument());
    });

    it('不正なXML構造で invalidRecipesXML を表示', async () => {
        openModal();
        const input = document.getElementById('recipes-upload') as HTMLInputElement;
        const badXml = new File(['<?xml version="1.0"?><Root></Root>'], 'recipes.xml', { type: 'text/xml' });
        await fireEvent.change(input, { target: { files: [badXml] } });
        await waitFor(() => expect(screen.getByText(/invalidRecipesXML/)).toBeInTheDocument());
    });

    it('正しいXMLで loadGameData -> updateData が呼ばれ成功表示', async () => {
        openModal();
        loadGameData.mockResolvedValueOnce({ some: 'data' });
        const input = document.getElementById('recipes-upload') as HTMLInputElement;
        const okXmlText = '<?xml version="1.0"?><RecipeArray><Recipe id="1"/></RecipeArray>';
        const okXml = new File([okXmlText], 'recipes.xml', { type: 'text/xml' });
        await fireEvent.change(input, { target: { files: [okXml] } });
        await waitFor(() => expect(loadGameData).toHaveBeenCalled());
        await waitFor(() => expect(updateData).toHaveBeenCalledWith({ some: 'data' }));
        await waitFor(() => expect(screen.getByText(/recipesUpdatedSuccessfully/)).toBeInTheDocument());
    });

        it('applyCustomMultipliers で setProliferatorMultiplier が呼ばれる', async () => {
            openModal();
            const [prodInput, speedInput] = screen.getAllByRole('spinbutton') as HTMLInputElement[];
            
            await actAsync(() => {
                fireEvent.change(prodInput, { target: { value: '2' } });
                fireEvent.change(speedInput, { target: { value: '3' } });
                fireEvent.click(screen.getByText('applyCustomMultipliers'));
            });
            
            await waitFor(() => {
                expect(setProliferatorMultiplier).toHaveBeenCalledWith(2, 3);
                expect(screen.getByText(/recipesUpdatedSuccessfully/)).toBeInTheDocument();
            });
        });

        it('resetToDefault で loadGameData() -> updateData が呼ばれる（confirm OK）', async () => {
            openModal();
            confirmMock.mockReturnValueOnce(true);
            loadGameData.mockResolvedValueOnce({ base: 'data' });
            
            await actAsync(() => {
                fireEvent.click(screen.getByText('resetToDefault'));
            });
            
            await waitFor(() => {
                expect(loadGameData).toHaveBeenCalled();
                expect(updateData).toHaveBeenCalledWith({ base: 'data' });
                expect(screen.getByText(/recipesUpdatedSuccessfully/)).toBeInTheDocument();
            });
        });

    it('resetToDefault で confirm がキャンセルされた場合は何もしない', () => {
        openModal();
        confirmMock.mockReturnValueOnce(false);
        fireEvent.click(screen.getByText('resetToDefault'));
        expect(loadGameData).not.toHaveBeenCalled();
        expect(updateData).not.toHaveBeenCalled();
    });

    it('ファイルが選択されていない場合は何もしない', () => {
        openModal();
        const input = document.getElementById('recipes-upload') as HTMLInputElement;
        fireEvent.change(input, { target: { files: null } });
        expect(screen.queryByText(/invalidFileType/)).not.toBeInTheDocument();
        expect(screen.queryByText(/fileTooLarge/)).not.toBeInTheDocument();
    });

        it('セキュリティチェックで危険なパターンが検出された場合はエラー表示', async () => {
            openModal();
            const input = document.getElementById('recipes-upload') as HTMLInputElement;
            const dangerousXml = new File(['<?xml version="1.0"?><RecipeArray><script>alert("test")</script><Recipe id="1"/></RecipeArray>'], 'dangerous.xml', { type: 'text/xml' });
            
            await actAsync(() => {
                fireEvent.change(input, { target: { files: [dangerousXml] } });
            });
            
            await waitFor(() => {
                expect(screen.getByText(/securityError/)).toBeInTheDocument();
            });
        });

        it('XMLパースエラーが発生した場合はエラー表示', async () => {
            openModal();
            const input = document.getElementById('recipes-upload') as HTMLInputElement;
            const badXml = new File(['<?xml version="1.0"?><RecipeArray><Recipe id="1"'], 'bad.xml', { type: 'text/xml' });
            
            await actAsync(() => {
                fireEvent.change(input, { target: { files: [badXml] } });
            });
            
            await waitFor(() => {
                expect(screen.getByText(/xmlParsingError/)).toBeInTheDocument();
            });
        });

        it('レシピが見つからない場合はエラー表示', async () => {
            openModal();
            const input = document.getElementById('recipes-upload') as HTMLInputElement;
            const noRecipesXml = new File(['<?xml version="1.0"?><RecipeArray></RecipeArray>'], 'norecipes.xml', { type: 'text/xml' });
            
            await actAsync(() => {
                fireEvent.change(input, { target: { files: [noRecipesXml] } });
            });
            
            await waitFor(() => {
                expect(screen.getByText(/noRecipesFound/)).toBeInTheDocument();
            });
        });

        it('loadGameData でエラーが発生した場合はエラー表示', async () => {
            openModal();
            const input = document.getElementById('recipes-upload') as HTMLInputElement;
            const okXmlText = '<?xml version="1.0"?><RecipeArray><Recipe id="1"/></RecipeArray>';
            const okXml = new File([okXmlText], 'recipes.xml', { type: 'text/xml' });
            loadGameData.mockRejectedValueOnce(new Error('Parse error'));
            
            await actAsync(() => {
                fireEvent.change(input, { target: { files: [okXml] } });
            });
            
            await waitFor(() => {
                expect(screen.getByText(/failedToParseCustomRecipes/)).toBeInTheDocument();
            });
        });

        it('ファイル読み込みエラーが発生した場合はエラー表示', async () => {
            openModal();
            const input = document.getElementById('recipes-upload') as HTMLInputElement;
            // Fileオブジェクトをモックしてtext()メソッドでエラーを投げる
            const errorFile = new File(['content'], 'error.xml', { type: 'text/xml' });
            Object.defineProperty(errorFile, 'text', {
                value: vi.fn().mockRejectedValue(new Error('Read error'))
            });
            
            await actAsync(() => {
                fireEvent.change(input, { target: { files: [errorFile] } });
            });
            
            await waitFor(() => {
                expect(screen.getByText(/failedToReadFile/)).toBeInTheDocument();
            });
        });

        it('resetToDefault で loadGameData エラーが発生した場合はエラー表示', async () => {
            openModal();
            confirmMock.mockReturnValueOnce(true);
            loadGameData.mockRejectedValueOnce(new Error('Load error'));
            
            await actAsync(() => {
                fireEvent.click(screen.getByText('resetToDefault'));
            });
            
            await waitFor(() => {
                expect(screen.getByText(/failedToReset/)).toBeInTheDocument();
            });
        });

    it('キーボードショートカット以外のキーではモーダルが開かない', () => {
        render(<ModSettings />);
        const event = new KeyboardEvent('keydown', {
            key: 'M',
            ctrlKey: true,
            shiftKey: false,
        });
        document.dispatchEvent(event);
        expect(screen.queryByText('modSettings')).not.toBeInTheDocument();
    });

    it('モーダルを閉じるボタンが動作する', () => {
        openModal();
        const closeButton = screen.getByRole('button', { name: '' }); // 閉じるボタン（X）
        fireEvent.click(closeButton);
        expect(screen.queryByText('modSettings')).not.toBeInTheDocument();
    });

    it('増産剤乗数の入力値が正しく反映される', () => {
        openModal();
        const [prodInput, speedInput] = screen.getAllByRole('spinbutton') as HTMLInputElement[];
        
        fireEvent.change(prodInput, { target: { value: '2.5' } });
        fireEvent.change(speedInput, { target: { value: '1.5' } });
        
        expect(prodInput.value).toBe('2.5');
        expect(speedInput.value).toBe('1.5');
    });

    it('増産剤乗数の計算表示が正しく表示される', () => {
        openModal();
        const [prodInput, speedInput] = screen.getAllByRole('spinbutton') as HTMLInputElement[];
        
        fireEvent.change(prodInput, { target: { value: '2' } });
        fireEvent.change(speedInput, { target: { value: '3' } });
        
        // 生産乗数の計算表示を確認
        expect(screen.getByText(/Mk\.I 25\.0%, Mk\.II 40\.0%, Mk\.III 50\.0%/)).toBeInTheDocument();
        // 速度乗数の計算表示を確認
        expect(screen.getByText(/Mk\.I 75\.0%, Mk\.II 150\.0%, Mk\.III 300\.0%/)).toBeInTheDocument();
    });

});


