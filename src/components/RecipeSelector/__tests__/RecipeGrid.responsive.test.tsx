import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { RecipeGrid } from "../RecipeGrid";
import type { Recipe } from "../../../types";
import { createMockGameData } from "../../../test/factories/testDataFactory";

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
    {
      SID: 1,
      name: "Test Recipe 1",
      GridIndex: "1101", // tab 1, row 1, column 01
      Explicit: true,
      Type: "Assemble",
      Items: [],
      Results: [{ id: 1001, name: "Test Item", count: 1 }],
    },
    {
      SID: 2,
      name: "Test Recipe 2",
      GridIndex: "1102", // tab 1, row 1, column 02
      Explicit: true,
      Type: "Assemble",
      Items: [],
      Results: [{ id: 1002, name: "Test Item 2", count: 1 }],
    },
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
