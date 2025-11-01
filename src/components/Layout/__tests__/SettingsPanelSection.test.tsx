import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SettingsPanelSection } from "../SettingsPanelSection";
import type { Recipe } from "../../../types";

// i18nextをモック
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        settings: "Settings",
        target: "Target",
        itemsPerSecond: "items/s",
        loading: "Loading...",
      };
      return translations[key] || key;
    },
  }),
}));

// ItemIconをモック
vi.mock("../../ItemIcon", () => ({
  ItemIcon: ({ itemId, size }: { itemId: number; size: number }) => (
    <div data-testid="item-icon" data-item-id={itemId} data-size={size}>
      Icon {itemId}
    </div>
  ),
}));

describe("SettingsPanelSection", () => {
  const mockRecipe: Recipe = {
    SID: 1,
    name: "Iron Ingot",
    Type: "Smelt",
    Explicit: false,
    TimeSpend: 60,
    Items: [],
    Results: [{ id: 1101, name: "Iron Ingot", count: 1 }],
    GridIndex: "0101",
    iconPath: "/path/to/icon.png",
    productive: false,
  };

  const mockSetTargetQuantity = vi.fn();

  it("selectedRecipeがnullの場合、設定のみ表示される", () => {
    render(
      <SettingsPanelSection
        selectedRecipe={null}
        targetQuantity={10}
        setTargetQuantity={mockSetTargetQuantity}
      />
    );

    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(screen.queryByText("Target")).not.toBeInTheDocument();
  });

  it("selectedRecipeがある場合、目標数量入力が表示される", () => {
    render(
      <SettingsPanelSection
        selectedRecipe={mockRecipe}
        targetQuantity={10}
        setTargetQuantity={mockSetTargetQuantity}
      />
    );

    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(screen.getByText("Target")).toBeInTheDocument();
    expect(screen.getByText("Iron Ingot")).toBeInTheDocument();
  });

  it("ItemIconが正しいプロパティで表示される", () => {
    render(
      <SettingsPanelSection
        selectedRecipe={mockRecipe}
        targetQuantity={10}
        setTargetQuantity={mockSetTargetQuantity}
      />
    );

    const icon = screen.getByTestId("item-icon");
    expect(icon).toHaveAttribute("data-item-id", "1101");
    expect(icon).toHaveAttribute("data-size", "32");
  });

  it("目標数量の入力フィールドが正しい値を表示する", () => {
    render(
      <SettingsPanelSection
        selectedRecipe={mockRecipe}
        targetQuantity={15.5}
        setTargetQuantity={mockSetTargetQuantity}
      />
    );

    const input = screen.getByRole("spinbutton") as HTMLInputElement;
    expect(input.value).toBe("15.5");
  });

  it("目標数量を変更できる", () => {
    render(
      <SettingsPanelSection
        selectedRecipe={mockRecipe}
        targetQuantity={10}
        setTargetQuantity={mockSetTargetQuantity}
      />
    );

    const input = screen.getByRole("spinbutton");
    fireEvent.change(input, { target: { value: "20" } });

    expect(mockSetTargetQuantity).toHaveBeenCalledWith(20);
  });

  it("無効な数値入力時は0.1にフォールバックする", () => {
    render(
      <SettingsPanelSection
        selectedRecipe={mockRecipe}
        targetQuantity={10}
        setTargetQuantity={mockSetTargetQuantity}
      />
    );

    const input = screen.getByRole("spinbutton");
    fireEvent.change(input, { target: { value: "invalid" } });

    expect(mockSetTargetQuantity).toHaveBeenCalledWith(0.1);
  });

  it("入力フィールドが正しい属性を持つ", () => {
    render(
      <SettingsPanelSection
        selectedRecipe={mockRecipe}
        targetQuantity={10}
        setTargetQuantity={mockSetTargetQuantity}
      />
    );

    const input = screen.getByRole("spinbutton") as HTMLInputElement;
    expect(input).toHaveAttribute("type", "number");
    expect(input).toHaveAttribute("min", "0.1");
    expect(input).toHaveAttribute("step", "0.1");
  });

  it("itemsPerSecondラベルが表示される", () => {
    render(
      <SettingsPanelSection
        selectedRecipe={mockRecipe}
        targetQuantity={10}
        setTargetQuantity={mockSetTargetQuantity}
      />
    );

    expect(screen.getByText("items/s")).toBeInTheDocument();
  });

  it("hologram-panelクラスが適用されている", () => {
    const { container } = render(
      <SettingsPanelSection
        selectedRecipe={mockRecipe}
        targetQuantity={10}
        setTargetQuantity={mockSetTargetQuantity}
      />
    );

    const panel = container.querySelector(".hologram-panel");
    expect(panel).toBeInTheDocument();
  });

  it("stickyポジショニングが適用されている", () => {
    const { container } = render(
      <SettingsPanelSection
        selectedRecipe={mockRecipe}
        targetQuantity={10}
        setTargetQuantity={mockSetTargetQuantity}
      />
    );

    const panel = container.querySelector(".sticky");
    expect(panel).toBeInTheDocument();
  });
});
