import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExportDialog } from '../ExportDialog';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('ExportDialog', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSaveToLocalStorage: vi.fn(),
    onExportToFile: vi.fn(),
    defaultPlanName: 'Default Plan',
    includeOverridesDefault: true,
  };

  it('ダイアログが開いているときにレンダリングされる', () => {
    render(<ExportDialog {...defaultProps} />);
    expect(screen.getByRole('heading', { name: /save/i })).toBeInTheDocument();
  });

  it('ダイアログが閉じているときにレンダリングされない', () => {
    render(<ExportDialog {...defaultProps} isOpen={false} />);
    expect(screen.queryByRole('heading', { name: /save/i })).not.toBeInTheDocument();
  });

  it('プラン名の入力フィールドが表示される', () => {
    render(<ExportDialog {...defaultProps} />);
    const input = screen.getByPlaceholderText('Default Plan');
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue('Default Plan');
  });

  it('プラン名を変更できる', () => {
    render(<ExportDialog {...defaultProps} />);
    const input = screen.getByPlaceholderText('Default Plan') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'My Custom Plan' } });
    expect(input.value).toBe('My Custom Plan');
  });

  it('Save to LocalStorageボタンをクリックするとonSaveToLocalStorageが呼ばれる', () => {
    const onSaveToLocalStorage = vi.fn();
    render(<ExportDialog {...defaultProps} onSaveToLocalStorage={onSaveToLocalStorage} />);

    const saveButton = screen.getByRole('button', { name: /saveToLocalStorage/i });
    fireEvent.click(saveButton);

    expect(onSaveToLocalStorage).toHaveBeenCalledWith('Default Plan', true);
  });

  it('カスタムプラン名でSave to LocalStorageボタンをクリック', () => {
    const onSaveToLocalStorage = vi.fn();
    render(<ExportDialog {...defaultProps} onSaveToLocalStorage={onSaveToLocalStorage} />);

    const input = screen.getByPlaceholderText('Default Plan');
    fireEvent.change(input, { target: { value: 'Custom Plan' } });

    const saveButton = screen.getByRole('button', { name: /saveToLocalStorage/i });
    fireEvent.click(saveButton);

    expect(onSaveToLocalStorage).toHaveBeenCalledWith('Custom Plan', true);
  });

  it('JSONエクスポートボタンをクリックするとonExportToFileが呼ばれる', () => {
    const onExportToFile = vi.fn();
    render(<ExportDialog {...defaultProps} onExportToFile={onExportToFile} />);

    const jsonButton = screen.getByRole('button', { name: /^JSON$/i });
    fireEvent.click(jsonButton);

    expect(onExportToFile).toHaveBeenCalledWith('json', 'Default Plan', true);
  });

  it('MarkdownエクスポートボタンをクリックするとonExportToFileが呼ばれる', () => {
    const onExportToFile = vi.fn();
    render(<ExportDialog {...defaultProps} onExportToFile={onExportToFile} />);

    const markdownButton = screen.getByRole('button', { name: /^Markdown$/i });
    fireEvent.click(markdownButton);

    expect(onExportToFile).toHaveBeenCalledWith('markdown', 'Default Plan', true);
  });

  it('includeOverridesチェックボックスが表示される', () => {
    render(<ExportDialog {...defaultProps} />);
    const checkbox = screen.getByRole('checkbox', { name: /includeNodeOverrides/i });
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).toBeChecked();
  });

  it('includeOverridesチェックボックスのトグル', () => {
    render(<ExportDialog {...defaultProps} />);
    const checkbox = screen.getByRole('checkbox', { name: /includeNodeOverrides/i }) as HTMLInputElement;

    expect(checkbox.checked).toBe(true);

    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(false);

    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(true);
  });

  it('includeOverridesがfalseの状態でエクスポート', () => {
    const onExportToFile = vi.fn();
    render(<ExportDialog {...defaultProps} onExportToFile={onExportToFile} />);

    const checkbox = screen.getByRole('checkbox', { name: /includeNodeOverrides/i });
    fireEvent.click(checkbox); // Uncheck

    const jsonButton = screen.getByRole('button', { name: /^JSON$/i });
    fireEvent.click(jsonButton);

    expect(onExportToFile).toHaveBeenCalledWith('json', 'Default Plan', false);
  });

  it('CancelボタンをクリックするとonCloseが呼ばれる', () => {
    const onClose = vi.fn();
    render(<ExportDialog {...defaultProps} onClose={onClose} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('エクスポート後にダイアログが閉じる（onCloseが呼ばれる）', () => {
    const onClose = vi.fn();
    const onExportToFile = vi.fn();
    render(<ExportDialog {...defaultProps} onClose={onClose} onExportToFile={onExportToFile} />);

    const jsonButton = screen.getByRole('button', { name: /^JSON$/i });
    fireEvent.click(jsonButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('Save to LocalStorage後にダイアログが閉じる（onCloseが呼ばれる）', () => {
    const onClose = vi.fn();
    const onSaveToLocalStorage = vi.fn();
    render(<ExportDialog {...defaultProps} onClose={onClose} onSaveToLocalStorage={onSaveToLocalStorage} />);

    const saveButton = screen.getByRole('button', { name: /saveToLocalStorage/i });
    fireEvent.click(saveButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('プラン名が空の場合はデフォルト名を使用', () => {
    const onExportToFile = vi.fn();
    render(<ExportDialog {...defaultProps} onExportToFile={onExportToFile} />);

    const input = screen.getByPlaceholderText('Default Plan');
    fireEvent.change(input, { target: { value: '' } });

    const jsonButton = screen.getByRole('button', { name: /^JSON$/i });
    fireEvent.click(jsonButton);

    expect(onExportToFile).toHaveBeenCalledWith('json', 'Default Plan', true);
  });

  it('includeOverridesDefaultがfalseの場合、チェックボックスがunchecked', () => {
    render(<ExportDialog {...defaultProps} includeOverridesDefault={false} />);
    const checkbox = screen.getByRole('checkbox', { name: /includeNodeOverrides/i }) as HTMLInputElement;
    expect(checkbox.checked).toBe(false);
  });
});

