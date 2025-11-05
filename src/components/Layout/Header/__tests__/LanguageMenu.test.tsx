import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LanguageMenu } from "../LanguageMenu";
import { useGameDataStore } from "../../../../stores/gameDataStore";

// createPortal をテスト簡易化のため直描画にモック
vi.mock("react-dom", () => ({
  createPortal: (node: unknown) => node,
}));

// Mock react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock useGameDataStore
vi.mock("../../../../stores/gameDataStore", () => ({
  useGameDataStore: vi.fn(),
}));

describe("LanguageMenu", () => {
  const mockSetLocale = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useGameDataStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      locale: "ja",
      setLocale: mockSetLocale,
      isLoading: false,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should render language menu trigger with flag", () => {
    render(<LanguageMenu />);
    const trigger = screen.getByTestId("language-menu-trigger");
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveTextContent("🇯🇵");
    expect(trigger).toHaveTextContent("日本語");
  });

  it("should switch language when Ctrl+L is pressed", async () => {
    const user = userEvent.setup();
    render(<LanguageMenu />);

    // Simulate Ctrl+L
    await user.keyboard("{Control>}l{/Control}");

    expect(mockSetLocale).toHaveBeenCalledWith("en");
  });

  it("should not switch language when typing in input field", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <LanguageMenu />
        <input data-testid="test-input" />
      </div>
    );

    const input = screen.getByTestId("test-input");
    await user.click(input);
    await user.keyboard("{Control>}l{/Control}");

    expect(mockSetLocale).not.toHaveBeenCalled();
  });

  it("should display English flag when locale is en", () => {
    (useGameDataStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      locale: "en",
      setLocale: mockSetLocale,
      isLoading: false,
    });

    render(<LanguageMenu />);
    const trigger = screen.getByTestId("language-menu-trigger");
    expect(trigger).toHaveTextContent("🇺🇸");
    expect(trigger).toHaveTextContent("English");
  });

  it("should have aria-label attribute", () => {
    render(<LanguageMenu />);
    const trigger = screen.getByTestId("language-menu-trigger");
    expect(trigger).toHaveAttribute("aria-label");
  });
});
