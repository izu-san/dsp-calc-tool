import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LanguageSwitcher } from '../index';

// Mock the store
const mockSetLocale = vi.fn();
const mockUseGameDataStore = vi.fn();

vi.mock('../../../stores/gameDataStore', () => ({
  useGameDataStore: () => mockUseGameDataStore(),
}));

describe('LanguageSwitcher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseGameDataStore.mockReturnValue({
      locale: 'ja',
      setLocale: mockSetLocale,
      isLoading: false,
    });
  });

  it('renders language options with current locale selected', () => {
    render(<LanguageSwitcher />);

    const select = screen.getByRole('combobox');
    expect(select).toHaveValue('ja');
    expect(screen.getByText('🇯🇵 日本語')).toBeInTheDocument();
    expect(screen.getByText('🇺🇸 English')).toBeInTheDocument();
  });

  it('calls setLocale when language is changed', () => {
    render(<LanguageSwitcher />);

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'en' } });

    expect(mockSetLocale).toHaveBeenCalledWith('en');
  });

  it('shows loading spinner when isLoading is true', () => {
    mockUseGameDataStore.mockReturnValue({
      locale: 'ja',
      setLocale: mockSetLocale,
      isLoading: true,
    });

    const { container } = render(<LanguageSwitcher />);

    expect(screen.getByRole('combobox')).toBeDisabled();
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('does not show loading spinner when isLoading is false', () => {
    const { container } = render(<LanguageSwitcher />);

    expect(screen.getByRole('combobox')).not.toBeDisabled();
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).not.toBeInTheDocument();
  });
});
