import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ItemIcon } from "../ItemIcon";
import { getDataPath } from "../../utils/paths";

// useSpriteData フックをモック
vi.mock("../../hooks/useSpriteData", () => ({
  useSpriteData: vi.fn(() => null), // デフォルトではスプライトなし（フォールバック）
}));

describe("ItemIcon", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("フォールバック動作（スプライトなし）", () => {
    it("正しいitemIdでアイコンをレンダリングできる", () => {
      render(<ItemIcon itemId={1001} alt="Iron Ore" />);

      const img = screen.getByAltText("Iron Ore");
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute("width", "32");
      expect(img).toHaveAttribute("height", "32");
    });

    it("カスタムサイズでレンダリングできる", () => {
      render(<ItemIcon itemId={1001} size={64} alt="Iron Ore" />);

      const img = screen.getByAltText("Iron Ore");
      expect(img).toHaveAttribute("width", "64");
      expect(img).toHaveAttribute("height", "64");
    });

    it("カスタムclassNameを適用できる", () => {
      render(<ItemIcon itemId={1001} className="custom-class" alt="Iron Ore" />);

      const img = screen.getByAltText("Iron Ore");
      expect(img).toHaveClass("inline-block");
      expect(img).toHaveClass("custom-class");
    });

    it("正しいアイコンパスを設定する（Items folder）", () => {
      render(<ItemIcon itemId={1001} alt="Iron Ore" />);

      const picture = screen.getByAltText("Iron Ore").parentElement;
      const source = picture?.querySelector('source[type="image/webp"]');

      expect(source).toBeInTheDocument();
      expect(source).toHaveAttribute("srcset", getDataPath("data/Items/Icons/1001.webp"));
    });

    it("フォールバックパスを設定する（Machines folder）", () => {
      render(<ItemIcon itemId={2001} alt="Assembler" />);

      const img = screen.getByAltText("Assembler");
      // WebP対応により、imgのsrcはWebPになる
      expect(img).toHaveAttribute("src", getDataPath("data/Items/Icons/2001.webp"));
    });

    it("エラー時にフォールバック処理が動作する", () => {
      const { container } = render(<ItemIcon itemId={9999} alt="Unknown" />);
      const img = container.querySelector("img") as HTMLImageElement;

      // エラーハンドラが設定されていることを確認
      expect(img.onerror).toBeDefined();

      // onErrorイベントをシミュレート - ネイティブイベントを使用
      const event = new Event("error");
      img.dispatchEvent(event);

      // WebP対応により、機械フォルダのWebPパスが設定されている
      expect(img.src).toContain(getDataPath("data/Machines/Icons/9999.webp"));
    });

    it("altテキストが空の場合でもレンダリングできる", () => {
      const { container } = render(<ItemIcon itemId={1001} />);

      const img = container.querySelector("img");
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute("alt", "");
    });

    it("picture要素とsource要素を使用している", () => {
      const { container } = render(<ItemIcon itemId={1001} alt="Iron Ore" />);

      const picture = container.querySelector("picture");
      const source = picture?.querySelector("source");
      const img = picture?.querySelector("img");

      expect(picture).toBeInTheDocument();
      expect(source).toBeInTheDocument();
      expect(img).toBeInTheDocument();
    });
  });

  describe("スプライト使用時の動作", () => {
    it("スプライトデータがある場合、div要素でレンダリングする", async () => {
      const { useSpriteData } = await import("../../hooks/useSpriteData");
      vi.mocked(useSpriteData).mockReturnValue({
        spriteUrl: "/data/sprites/items-sprite.png",
        coords: { x: 0, y: 0, width: 80, height: 80 },
        spriteData: { width: 1146, height: 1064, coordinates: {} },
      });

      const { container } = render(<ItemIcon itemId={1001} size={32} alt="Iron Ore" />);

      // div要素でレンダリングされる
      const iconDiv = container.querySelector('div[role="img"]');
      expect(iconDiv).toBeInTheDocument();
      expect(iconDiv).toHaveAttribute("aria-label", "Iron Ore");
      expect(iconDiv).toHaveAttribute("title", "Iron Ore");
    });

    it("スプライトを使用する場合、backgroundImageが設定される", async () => {
      const { useSpriteData } = await import("../../hooks/useSpriteData");
      vi.mocked(useSpriteData).mockReturnValue({
        spriteUrl: "/data/sprites/items-sprite.png",
        coords: { x: 100, y: 200, width: 80, height: 80 },
        spriteData: { width: 1146, height: 1064, coordinates: {} },
      });

      const { container } = render(<ItemIcon itemId={1001} size={32} alt="Iron Ore" />);

      const iconDiv = container.querySelector('div[role="img"]') as HTMLElement;
      expect(iconDiv.style.backgroundImage).toContain("items-sprite.png");
    });

    it("preferRecipesがtrueの場合、recipes-spriteを優先する", async () => {
      const { useSpriteData } = await import("../../hooks/useSpriteData");
      const mockUseSpriteData = vi.mocked(useSpriteData);

      render(<ItemIcon itemId={1107} preferRecipes={true} alt="Plasma Refining" />);

      // preferRecipes=trueでuseSpriteDataが呼ばれることを確認
      expect(mockUseSpriteData).toHaveBeenCalledWith(1107, true);
    });

    it("preferRecipesがfalse（デフォルト）の場合、items-spriteを優先する", async () => {
      const { useSpriteData } = await import("../../hooks/useSpriteData");
      const mockUseSpriteData = vi.mocked(useSpriteData);

      render(<ItemIcon itemId={1001} alt="Iron Ore" />);

      // preferRecipes=falseでuseSpriteDataが呼ばれることを確認
      expect(mockUseSpriteData).toHaveBeenCalledWith(1001, false);
    });

    it("スプライト使用時、カスタムサイズに応じてスケーリングされる", async () => {
      const { useSpriteData } = await import("../../hooks/useSpriteData");
      vi.mocked(useSpriteData).mockReturnValue({
        spriteUrl: "/data/sprites/items-sprite.png",
        coords: { x: 0, y: 0, width: 80, height: 80 },
        spriteData: { width: 1146, height: 1064, coordinates: {} },
      });

      const { container } = render(<ItemIcon itemId={1001} size={40} alt="Iron Ore" />);

      const iconDiv = container.querySelector('div[role="img"]') as HTMLElement;
      expect(iconDiv.style.width).toBe("40px");
      expect(iconDiv.style.height).toBe("40px");
      // スケール: 40 / 80 = 0.5
      expect(iconDiv.style.backgroundSize).toContain("573px"); // 1146 * 0.5
    });
  });

  describe("ソーターアイコン（ID: -1）", () => {
    it("ソーターのアイコンを正しく表示する（ID: 2011に変換）", () => {
      render(<ItemIcon itemId={-1} alt="ソーター" />);

      const sorterIcon = screen.getByRole("img", { name: "ソーター" });
      expect(sorterIcon).toBeInTheDocument();
      // ID: -1 は ID: 2011 に変換されるので、スプライトアイコンが表示される
      expect(sorterIcon).toHaveStyle({ width: "32px", height: "32px" });
    });

    it("ソーターアイコンにカスタムサイズを適用できる", () => {
      render(<ItemIcon itemId={-1} size={64} alt="ソーター" />);

      const sorterIcon = screen.getByRole("img", { name: "ソーター" });
      expect(sorterIcon).toHaveStyle({ width: "64px", height: "64px" });
    });

    it("ソーターアイコンにカスタムclassNameを適用できる", () => {
      render(<ItemIcon itemId={-1} className="custom-class" alt="ソーター" />);

      const sorterIcon = screen.getByRole("img", { name: "ソーター" });
      const container = sorterIcon.parentElement;
      expect(container).toHaveClass("custom-class");
    });
  });
});
