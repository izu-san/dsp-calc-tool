import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { RecipeGrid } from "../RecipeGrid";
import type { Recipe } from "../../../types";
import {
  createMockGameData,
  createSingleOutputRecipe,
} from "../../../test/factories/testDataFactory";

// Mock the ItemIcon component to test responsive behavior
vi.mock("../../ItemIcon", () => ({
  ItemIcon: ({ size, className, itemId, preferRecipes, ...props }: any) => (
    <div
      data-testid="item-icon"
      data-size={size}
      data-item-id={itemId}
      data-prefer-recipes={preferRecipes}
      className={className}
      {...props}
    />
  ),
}));

// Mock the favorites store
vi.mock("../../../stores/favoritesStore", () => ({
  useFavoritesStore: () => ({
    isFavorite: vi.fn(() => false),
    toggleFavorite: vi.fn(),
  }),
}));

// Mock i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe("RecipeGrid Responsive Design", () => {
  const mockRecipes: Recipe[] = [
    createSingleOutputRecipe({
      SID: 1,
      name: "Test Recipe 1",
      gridIndex: "1101",
      explicit: true,
      type: "Assemble",
      inputId: 1001,
      inputName: "Test Item",
      inputCount: 1,
      outputId: 1001,
      outputName: "Test Item",
      outputCount: 1,
    }),
    createSingleOutputRecipe({
      SID: 2,
      name: "Test Recipe 2",
      gridIndex: "1102",
      explicit: true,
      type: "Assemble",
      inputId: 1002,
      inputName: "Test Item 2",
      inputCount: 1,
      outputId: 1002,
      outputName: "Test Item 2",
      outputCount: 1,
    }),
  ];

  it("should render icons with responsive sizing", () => {
    render(
      <RecipeGrid
        recipes={mockRecipes}
        tab={1}
        onRecipeSelect={vi.fn()}
        selectedRecipeId={undefined}
      />
    );

    const icons = screen.getAllByTestId("item-icon");
    expect(icons).toHaveLength(2);

    // Check that icons have the expected size attribute (now 'auto' for responsive)
    icons.forEach(icon => {
      expect(icon).toHaveAttribute("data-size", "auto");
    });
  });

  it("should use recipe SID icons for implicit recipes", () => {
    const implicitRecipe = createSingleOutputRecipe({
      SID: 2410,
      name: "Holo Beacon",
      gridIndex: "1201",
      explicit: false,
      type: "Assemble",
      inputId: 1101,
      inputName: "Iron Ingot",
      inputCount: 1,
      outputId: 2401,
      outputName: "Holo Beacon",
      outputCount: 4,
    });

    render(
      <RecipeGrid
        recipes={[implicitRecipe]}
        tab={1}
        onRecipeSelect={vi.fn()}
        selectedRecipeId={undefined}
      />
    );

    const icon = screen.getByTestId("item-icon");
    expect(icon).toHaveAttribute("data-item-id", "2410");
    expect(icon).toHaveAttribute("data-prefer-recipes", "true");
  });

  it("should maintain aspect ratio for recipe cells", () => {
    const { container } = render(
      <RecipeGrid
        recipes={mockRecipes}
        tab={1}
        onRecipeSelect={vi.fn()}
        selectedRecipeId={undefined}
      />
    );

    // Check that the grid container has the correct CSS classes
    const gridContainer = container.querySelector(".grid");
    expect(gridContainer).toHaveClass("grid", "gap-1", "p-4");

    // Check that individual cells have aspect-square class
    const buttons = screen.getAllByRole("button");
    buttons.forEach(button => {
      const parent = button.closest(".aspect-square");
      expect(parent).toBeInTheDocument();
    });
  });

  it("should handle empty grid positions correctly", () => {
    const { container } = render(
      <RecipeGrid recipes={[]} tab={1} onRecipeSelect={vi.fn()} selectedRecipeId={undefined} />
    );

    // Should render empty cells for the grid
    const emptyCells = container.querySelectorAll(".aspect-square");
    expect(emptyCells.length).toBeGreaterThan(0);
  });

  it("should apply correct grid template columns", () => {
    const { container } = render(
      <RecipeGrid
        recipes={mockRecipes}
        tab={1}
        onRecipeSelect={vi.fn()}
        selectedRecipeId={undefined}
      />
    );

    const gridElement = container.querySelector(".grid");
    expect(gridElement).toHaveStyle({
      gridTemplateColumns: "repeat(14, minmax(0, 1fr))",
    });
  });
});
