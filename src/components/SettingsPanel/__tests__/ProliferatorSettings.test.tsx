import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ProliferatorSettings } from "../ProliferatorSettings";
import { useSettingsStore } from "../../../stores/settingsStore";
import { useRecipeSelectionStore } from "../../../stores/recipeSelectionStore";

// i18nextのモック
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
  initReactI18next: {
    type: "3rdParty",
    init: vi.fn(),
  },
}));

// ストアのモック
vi.mock("../../../stores/settingsStore");
vi.mock("../../../stores/recipeSelectionStore");

describe("ProliferatorSettings", () => {
  const mockSetProliferator = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    (useSettingsStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      settings: {
        proliferator: {
          type: "none",
          mode: "speed",
          productionBonus: 0,
          speedBonus: 0,
          powerIncrease: 0,
        },
      },
      setProliferator: mockSetProliferator,
    });

    (useRecipeSelectionStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      selectedRecipe: { productive: true },
    });
  });

  it("増産剤タイプの選択ボタンを表示する", () => {
    render(<ProliferatorSettings />);

    expect(screen.getByText("none")).toBeInTheDocument();
    expect(screen.getByText("proliferatorMK1")).toBeInTheDocument();
    expect(screen.getByText("proliferatorMK2")).toBeInTheDocument();
    expect(screen.getByText("proliferatorMK3")).toBeInTheDocument();
  });

  it("増産剤タイプを選択できる", () => {
    render(<ProliferatorSettings />);

    const mk3Button = screen.getByText("proliferatorMK3");
    fireEvent.click(mk3Button);

    expect(mockSetProliferator).toHaveBeenCalledWith("mk3", "speed");
  });

  it("増産剤が選択されている場合にモード選択を表示する", () => {
    (useSettingsStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      settings: {
        proliferator: {
          type: "mk3",
          mode: "speed",
          productionBonus: 0.25,
          speedBonus: 1.0,
          powerIncrease: 0.3,
        },
      },
      setProliferator: mockSetProliferator,
    });

    render(<ProliferatorSettings />);

    expect(screen.getByText(/productionMode/)).toBeInTheDocument();
    expect(screen.getByText(/speedMode/)).toBeInTheDocument();
  });

  it("生産モードを選択できる", () => {
    (useSettingsStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      settings: {
        proliferator: {
          type: "mk3",
          mode: "speed",
          productionBonus: 0.25,
          speedBonus: 1.0,
          powerIncrease: 0.3,
        },
      },
      setProliferator: mockSetProliferator,
    });

    render(<ProliferatorSettings />);

    const productionButton = screen.getByText(/productionMode/);
    fireEvent.click(productionButton);

    expect(mockSetProliferator).toHaveBeenCalledWith("mk3", "production");
  });

  it("速度モードを選択できる", () => {
    (useSettingsStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      settings: {
        proliferator: {
          type: "mk3",
          mode: "production",
          productionBonus: 0.25,
          speedBonus: 1.0,
          powerIncrease: 0.3,
        },
      },
      setProliferator: mockSetProliferator,
    });

    render(<ProliferatorSettings />);

    const speedButton = screen.getByText(/speedMode/);
    fireEvent.click(speedButton);

    expect(mockSetProliferator).toHaveBeenCalledWith("mk3", "speed");
  });

  it("生産モードが許可されていない場合に警告を表示する", () => {
    (useSettingsStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      settings: {
        proliferator: {
          type: "mk3",
          mode: "speed",
          productionBonus: 0.25,
          speedBonus: 1.0,
          powerIncrease: 0.3,
        },
      },
      setProliferator: mockSetProliferator,
    });

    (useRecipeSelectionStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      selectedRecipe: { productive: false },
    });

    render(<ProliferatorSettings />);

    // Check for warning message in the warning box
    const warningBox = screen.getByRole("alert");
    expect(warningBox).toBeInTheDocument();
    expect(screen.getByText(/productionModeDisabledDescription/)).toBeInTheDocument();
  });

  it("生産モードが許可されていない場合にボタンを無効化する", () => {
    (useSettingsStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      settings: {
        proliferator: {
          type: "mk3",
          mode: "speed",
          productionBonus: 0.25,
          speedBonus: 1.0,
          powerIncrease: 0.3,
        },
      },
      setProliferator: mockSetProliferator,
    });

    (useRecipeSelectionStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      selectedRecipe: { productive: false },
    });

    render(<ProliferatorSettings />);

    const productionButton = screen.getByTestId("proliferator-mode-button-production");
    expect(productionButton).toBeDisabled();
  });

  it("アクティブな効果を表示する", () => {
    (useSettingsStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      settings: {
        proliferator: {
          type: "mk3",
          mode: "production",
          productionBonus: 0.25,
          speedBonus: 1.0,
          powerIncrease: 0.3,
        },
      },
      setProliferator: mockSetProliferator,
    });

    render(<ProliferatorSettings />);

    expect(screen.getByText("activeEffects")).toBeInTheDocument();
    expect(screen.getByText("+25.0%")).toBeInTheDocument(); // 生産ボーナス
    expect(screen.getByText("+30.0%")).toBeInTheDocument(); // 電力増加
  });

  it("速度モードで速度ボーナスを表示する", () => {
    (useSettingsStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      settings: {
        proliferator: {
          type: "mk3",
          mode: "speed",
          productionBonus: 0.25,
          speedBonus: 1.0,
          powerIncrease: 0.3,
        },
      },
      setProliferator: mockSetProliferator,
    });

    render(<ProliferatorSettings />);

    expect(screen.getByText("+100.0%")).toBeInTheDocument(); // 速度ボーナス
  });

  it("増産剤なしの場合はモード選択を表示しない", () => {
    render(<ProliferatorSettings />);

    expect(screen.queryByText("productionMode")).not.toBeInTheDocument();
    expect(screen.queryByText("speedMode")).not.toBeInTheDocument();
  });
});
