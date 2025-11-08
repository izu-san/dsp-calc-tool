import { describe, it, expect, vi, beforeEach } from "vitest";

describe("i18n.ts", () => {
  it("i18nモジュールが正しくエクスポートされる", async () => {
    const i18nModule = await import("../i18n");
    expect(i18nModule.default).toBeDefined();
  });

  it("i18n/index.tsが正しくエクスポートされる", async () => {
    const i18nIndexModule = await import("../i18n/index");
    expect(i18nIndexModule.default).toBeDefined();
  });

  it("i18n.tsはi18n/index.tsをre-exportしている", async () => {
    const i18nModule = await import("../i18n");
    const i18nIndexModule = await import("../i18n/index");

    // 同じインスタンスを参照していることを確認
    expect(i18nModule.default).toBe(i18nIndexModule.default);
  });
});
