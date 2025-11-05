import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FilterPanel } from "../FilterPanel";

// i18n モック（キーをそのまま返す）
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe("FilterPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  const defaultVisibility = {
    "raw-material": true,
    intermediate: true,
    "final-product": true,
  };

  it("全てのフィルタオプションが表示される", () => {
    const onMaterialVisibilityChange = vi.fn();
    const onReset = vi.fn();

    render(
      <FilterPanel
        materialVisibility={defaultVisibility}
        onMaterialVisibilityChange={onMaterialVisibilityChange}
        onReset={onReset}
      />
    );

    expect(screen.getByText("visualization.filters.materialTypes")).toBeInTheDocument();
    expect(screen.getByText("visualization.filters.rawMaterials")).toBeInTheDocument();
    expect(screen.getByText("visualization.filters.intermediates")).toBeInTheDocument();
    expect(screen.getByText("visualization.filters.finalProducts")).toBeInTheDocument();
    expect(screen.getByText("visualization.filters.reset")).toBeInTheDocument();
  });

  it("チェックボックスの状態が正しく反映される", () => {
    const visibility = {
      "raw-material": true,
      intermediate: false,
      "final-product": true,
    };

    render(
      <FilterPanel
        materialVisibility={visibility}
        onMaterialVisibilityChange={vi.fn()}
        onReset={vi.fn()}
      />
    );

    const rawMaterialCheckbox = screen.getByLabelText("visualization.filters.rawMaterials");
    const intermediateCheckbox = screen.getByLabelText("visualization.filters.intermediates");
    const finalProductCheckbox = screen.getByLabelText("visualization.filters.finalProducts");

    expect(rawMaterialCheckbox).toBeChecked();
    expect(intermediateCheckbox).not.toBeChecked();
    expect(finalProductCheckbox).toBeChecked();
  });

  it("チェックボックスをクリックすると、onMaterialVisibilityChangeが呼ばれる", () => {
    const onMaterialVisibilityChange = vi.fn();

    render(
      <FilterPanel
        materialVisibility={defaultVisibility}
        onMaterialVisibilityChange={onMaterialVisibilityChange}
        onReset={vi.fn()}
      />
    );

    const intermediateCheckbox = screen.getByLabelText("visualization.filters.intermediates");
    fireEvent.click(intermediateCheckbox);

    expect(onMaterialVisibilityChange).toHaveBeenCalledWith("intermediate", false);
  });

  it("リセットボタンをクリックすると、onResetが呼ばれる", () => {
    const onReset = vi.fn();

    render(
      <FilterPanel
        materialVisibility={defaultVisibility}
        onMaterialVisibilityChange={vi.fn()}
        onReset={onReset}
      />
    );

    const resetButton = screen.getByText("visualization.filters.reset");
    fireEvent.click(resetButton);

    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it("全てのチェックボックスがオフの場合でも正しく表示される", () => {
    const visibility = {
      "raw-material": false,
      intermediate: false,
      "final-product": false,
    };

    render(
      <FilterPanel
        materialVisibility={visibility}
        onMaterialVisibilityChange={vi.fn()}
        onReset={vi.fn()}
      />
    );

    const rawMaterialCheckbox = screen.getByLabelText("visualization.filters.rawMaterials");
    const intermediateCheckbox = screen.getByLabelText("visualization.filters.intermediates");
    const finalProductCheckbox = screen.getByLabelText("visualization.filters.finalProducts");

    expect(rawMaterialCheckbox).not.toBeChecked();
    expect(intermediateCheckbox).not.toBeChecked();
    expect(finalProductCheckbox).not.toBeChecked();
  });
});
