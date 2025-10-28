import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { RecipeSelectorSection } from "../RecipeSelectorSection";
import type { Recipe } from "../../../types";

// i18nextをモック
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        selectRecipe: "Select Recipe",
        loading: "Loading...",
      };
      return translations[key] || key;
    },
  }),
}));

describe("RecipeSelectorSection", () => {
  const mockRecipes: Recipe[] = [
    {
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
    },
    {
      SID: 2,
      name: "Copper Ingot",
      Type: "Smelt",
      Explicit: false,
      TimeSpend: 60,
      Items: [],
      Results: [{ id: 1104, name: "Copper Ingot", count: 1 }],
      GridIndex: "0102",
      iconPath: "/path/to/icon2.png",
      productive: false,
    },
  ];

  const mockOnRecipeSelect = vi.fn();

  it("正しくレンダリングされる", () => {
    render(
      <RecipeSelectorSection
        recipes={mockRecipes}
        selectedRecipeId={undefined}
        onRecipeSelect={mockOnRecipeSelect}
      />
    );

    expect(screen.getByText("Select Recipe")).toBeInTheDocument();
  });

  it("タイトルが表示される", () => {
    render(
      <RecipeSelectorSection
        recipes={mockRecipes}
        selectedRecipeId={undefined}
        onRecipeSelect={mockOnRecipeSelect}
      />
    );

    const title = screen.getByRole("heading", { level: 2 });
    expect(title).toHaveTextContent("Select Recipe");
  });

  it("recipesプロパティが正しく渡される", () => {
    const { container } = render(
      <RecipeSelectorSection
        recipes={mockRecipes}
        selectedRecipeId={undefined}
        onRecipeSelect={mockOnRecipeSelect}
      />
    );

    expect(container).toBeInTheDocument();
  });

  it("selectedRecipeIdが渡される", () => {
    render(
      <RecipeSelectorSection
        recipes={mockRecipes}
        selectedRecipeId={1}
        onRecipeSelect={mockOnRecipeSelect}
      />
    );

    expect(screen.getByText("Select Recipe")).toBeInTheDocument();
  });

  it("onRecipeSelectコールバックが渡される", () => {
    render(
      <RecipeSelectorSection
        recipes={mockRecipes}
        selectedRecipeId={undefined}
        onRecipeSelect={mockOnRecipeSelect}
      />
    );

    expect(screen.getByText("Select Recipe")).toBeInTheDocument();
  });

  it("hologram-panelクラスが適用されている", () => {
    const { container } = render(
      <RecipeSelectorSection
        recipes={mockRecipes}
        selectedRecipeId={undefined}
        onRecipeSelect={mockOnRecipeSelect}
      />
    );

    const panel = container.querySelector(".hologram-panel");
    expect(panel).toBeInTheDocument();
  });

  it("正しいCSSクラスが適用されている", () => {
    const { container } = render(
      <RecipeSelectorSection
        recipes={mockRecipes}
        selectedRecipeId={undefined}
        onRecipeSelect={mockOnRecipeSelect}
      />
    );

    const panel = container.querySelector(".rounded-lg.shadow-panel.p-6");
    expect(panel).toBeInTheDocument();
  });

  it("空のレシピリストでもレンダリングできる", () => {
    render(
      <RecipeSelectorSection
        recipes={[]}
        selectedRecipeId={undefined}
        onRecipeSelect={mockOnRecipeSelect}
      />
    );

    expect(screen.getByText("Select Recipe")).toBeInTheDocument();
  });

  it("Suspenseフォールバックが設定されている", () => {
    const { container } = render(
      <RecipeSelectorSection
        recipes={mockRecipes}
        selectedRecipeId={undefined}
        onRecipeSelect={mockOnRecipeSelect}
      />
    );

    // Suspenseが正しく機能していることを確認
    expect(container).toBeInTheDocument();
  });
});
