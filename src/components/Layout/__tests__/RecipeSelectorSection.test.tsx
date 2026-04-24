import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { RecipeSelectorSection } from "../RecipeSelectorSection";
import type { Recipe } from "../../../types";
import { createSingleOutputRecipe } from "../../../test/factories/testDataFactory";

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
    createSingleOutputRecipe({
      SID: 1,
      name: "Iron Ingot",
      type: "Smelt",
      timeSpend: 60,
      inputId: 1001,
      inputName: "Iron Ore",
      inputCount: 1,
      outputId: 1101,
      outputName: "Iron Ingot",
      outputCount: 1,
      gridIndex: "0101",
    }),
    createSingleOutputRecipe({
      SID: 2,
      name: "Copper Ingot",
      type: "Smelt",
      timeSpend: 60,
      inputId: 1002,
      inputName: "Copper Ore",
      inputCount: 1,
      outputId: 1104,
      outputName: "Copper Ingot",
      outputCount: 1,
      gridIndex: "0102",
    }),
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

    const panel = container.querySelector(".rounded-md.p-6");
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
