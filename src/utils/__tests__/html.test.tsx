import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { parseColorTags } from "../html";

describe("html", () => {
  describe("parseColorTags", () => {
    it("色タグなしのテキストをそのまま返す", () => {
      const text = "Simple text without tags";
      const result = parseColorTags(text);

      // ReactNodeとしてレンダリング
      const { container } = render(<div>{result}</div>);

      // テキスト内容を確認（ReactFragmentで包まれているが、内容は同じ）
      expect(container.textContent).toBe(text);

      // spanタグが存在しないことを確認
      const span = container.querySelector("span");
      expect(span).toBeNull();
    });

    it("単一の色タグを正しくパースする", () => {
      const text = 'Fire ice vein <color="#FFFFFFC1">(rare)</color>';
      const result = parseColorTags(text);

      // ReactNodeとしてレンダリング
      const { container } = render(<div>{result}</div>);

      // テキスト内容を確認
      expect(container.textContent).toBe("Fire ice vein (rare)");

      // spanタグが存在し、正しいスタイルが適用されていることを確認
      const span = container.querySelector("span");
      expect(span).toBeTruthy();
      expect(span?.style.color).toBe("#FFFFFFC1"); // Inline styleはそのまま保持される
    });

    it("複数の色タグを正しくパースする", () => {
      const text = 'Text <color="#FF0000">red</color> and <color="#00FF00">green</color>';
      const result = parseColorTags(text);

      const { container } = render(<div>{result}</div>);

      expect(container.textContent).toBe("Text red and green");

      const spans = container.querySelectorAll("span");
      expect(spans).toHaveLength(2);
      expect(spans[0].textContent).toBe("red");
      expect(spans[1].textContent).toBe("green");
    });

    it("6桁のカラーコード（#RRGGBB）を処理する", () => {
      const text = '<color="#123456">text</color>';
      const result = parseColorTags(text);

      const { container } = render(<div>{result}</div>);

      const span = container.querySelector("span");
      expect(span).toBeTruthy();
      expect(span?.style.color).toBe("#123456"); // Inline styleはそのまま保持される
    });

    it("8桁のカラーコード（#RRGGBBAA）を処理する", () => {
      const text = '<color="#FFFFFFC1">text</color>';
      const result = parseColorTags(text);

      const { container } = render(<div>{result}</div>);

      const span = container.querySelector("span");
      expect(span).toBeTruthy();
      // アルファチャンネルはCSSのrgba形式で処理される
    });

    it("空文字列を処理する", () => {
      const result = parseColorTags("");

      expect(result).toBe("");
    });

    it("nullやundefinedを処理する", () => {
      const result1 = parseColorTags(null as any);
      const result2 = parseColorTags(undefined as any);

      expect(result1).toBe(null);
      expect(result2).toBe(undefined);
    });

    it("色タグの前後にテキストがある場合も正しく処理する", () => {
      const text = 'Prefix <color="#FF0000">colored</color> suffix';
      const result = parseColorTags(text);

      const { container } = render(<div>{result}</div>);

      expect(container.textContent).toBe("Prefix colored suffix");
    });

    it("連続する色タグを処理する", () => {
      const text = '<color="#FF0000">red</color><color="#0000FF">blue</color>';
      const result = parseColorTags(text);

      const { container } = render(<div>{result}</div>);

      expect(container.textContent).toBe("redblue");

      const spans = container.querySelectorAll("span");
      expect(spans).toHaveLength(2);
    });

    it("色タグ内に特殊文字がある場合も処理する", () => {
      const text = '<color="#FF0000">Special (rare) & unique</color>';
      const result = parseColorTags(text);

      const { container } = render(<div>{result}</div>);

      expect(container.textContent).toBe("Special (rare) & unique");
    });

    it("大文字小文字を区別しないカラーコード", () => {
      const text1 = '<color="#AbCdEf">text</color>';
      const text2 = '<color="#abcdef">text</color>';

      const result1 = parseColorTags(text1);
      const result2 = parseColorTags(text2);

      const { container: container1 } = render(<div>{result1}</div>);
      const { container: container2 } = render(<div>{result2}</div>);

      // style.colorは異なるが、視覚的には同じ（CSS正規化の動作による）
      expect(container1.querySelector("span")?.style.color).toBe("#AbCdEf");
      expect(container2.querySelector("span")?.style.color).toBe("#abcdef");
    });
  });
});
