import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { PlanDiffView } from "../index";
import type { PlanDiffEntry } from "../../utils/planDiff";

// Mock react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        noChanges: "noChanges",
        proliferator: "proliferator",
        targetQuantity: "targetQuantity",
        recipeSID: "recipeSID",
        name: "name",
      };
      return translations[key] || key;
    },
  }),
  initReactI18next: {
    type: "3rdParty",
    init: vi.fn(),
  },
}));

// Mock gameDataStore
const mockGameData = {
  items: new Map([[1101, { id: 1101, name: "Iron Ingot" }]]),
  recipes: new Map(),
  machines: new Map(),
};

vi.mock("../../stores/gameDataStore", () => ({
  useGameDataStore: () => ({ data: mockGameData }),
}));

// Mock planDiff utils - 簡略化版
vi.mock("../../utils/planDiff", () => ({
  formatDiffValue: (value: unknown) => String(value),
  getPathDisplayName: (path: string) => path,
}));

describe("PlanDiffView", () => {
  describe("空の差分", () => {
    it("差分が空の場合はnoChangesメッセージを表示", () => {
      render(<PlanDiffView diffs={[]} />);
      expect(screen.getByText("noChanges")).toBeInTheDocument();
    });
  });

  describe("addタイプの差分", () => {
    it("addタイプの差分を正しく表示", () => {
      const diffs: PlanDiffEntry[] = [
        {
          path: "settings.proliferator.type",
          type: "add",
          after: "mk1",
        },
      ];

      const { container } = render(<PlanDiffView diffs={diffs} />);

      // アイコンが表示される
      const icon = container.querySelector(".text-green-300.text-sm");
      expect(icon).toBeInTheDocument();
      expect(icon?.textContent).toBe("+");
    });

    it("removeタイプの値は取り消し線が表示される", () => {
      const diffs: PlanDiffEntry[] = [
        {
          path: "settings.proliferator.type",
          type: "remove",
          before: "mk2",
        },
      ];

      const { container } = render(<PlanDiffView diffs={diffs} />);
      const lineThrough = container.querySelector(".line-through");
      expect(lineThrough).toBeInTheDocument();
    });
  });

  describe("changeタイプの差分", () => {
    it("changeタイプの差分を正しく表示", () => {
      const diffs: PlanDiffEntry[] = [
        {
          path: "targetQuantity",
          type: "change",
          before: 60,
          after: 120,
        },
      ];

      render(<PlanDiffView diffs={diffs} />);

      // アイコンが表示される
      const icon = screen.getByText("~");
      expect(icon).toBeInTheDocument();
      expect(icon.className).toContain("text-yellow-300");
    });

    it("changeタイプのbefore値は取り消し線が表示され、after値は通常表示", () => {
      const diffs: PlanDiffEntry[] = [
        {
          path: "targetQuantity",
          type: "change",
          before: 60,
          after: 120,
        },
      ];

      const { container } = render(<PlanDiffView diffs={diffs} />);
      const lineThrough = container.querySelector(".line-through");
      expect(lineThrough).toBeInTheDocument();

      // after値は取り消し線がない
      const values = container.querySelectorAll(".font-mono");
      expect(values.length).toBe(2);
    });
  });

  describe("複数の差分", () => {
    it("複数の差分をすべて表示", () => {
      const diffs: PlanDiffEntry[] = [
        {
          path: "settings.proliferator.type",
          type: "add",
          after: "mk1",
        },
        {
          path: "targetQuantity",
          type: "change",
          before: 60,
          after: 120,
        },
        {
          path: "name",
          type: "remove",
          before: "Old Plan",
        },
      ];

      const { container } = render(<PlanDiffView diffs={diffs} />);

      // 各タイプのスタイルが表示されることを確認
      expect(container.querySelector(".bg-green-500\\/10")).toBeInTheDocument();
      expect(container.querySelector(".bg-yellow-500\\/10")).toBeInTheDocument();
      expect(container.querySelector(".bg-red-500\\/10")).toBeInTheDocument();
    });
  });
});
