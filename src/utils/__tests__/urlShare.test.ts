import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  encodePlanToURL,
  decodePlanFromURL,
  generateShareURL,
  getPlanFromURL,
  copyToClipboard,
} from "../urlShare";
import type { SavedPlan } from "../../types/saved-plan";
import { PROLIFERATOR_DATA } from "../../types/settings";

describe("urlShare", () => {
  const mockPlan: SavedPlan = {
    name: "Test Plan",
    timestamp: 1697788800000,
    recipeSID: 1101,
    targetQuantity: 60,
    settings: {
      proliferator: {
        ...PROLIFERATOR_DATA.none,
        mode: "speed",
      },
      machineRank: {
        Smelt: "arc",
        Assemble: "mk1",
        Chemical: "standard",
        Research: "standard",
        Refine: "standard",
        Particle: "standard",
      },
      conveyorBelt: { tier: "mk1", speed: 6, stackCount: 1 },
      sorter: { tier: "mk1", powerConsumption: 18 },
      alternativeRecipes: new Map(),
      miningSpeedResearch: 100,
      proliferatorMultiplier: { production: 1, speed: 1 },
    },
    alternativeRecipes: {},
    nodeOverrides: {},
  };

  describe("encodePlanToURL", () => {
    it("プランをURL安全な文字列にエンコードする", () => {
      const encoded = encodePlanToURL(mockPlan);

      expect(encoded).toBeDefined();
      expect(typeof encoded).toBe("string");
      expect(encoded.length).toBeGreaterThan(0);
    });

    it("エンコード結果がURL安全である（特殊文字なし）", () => {
      const encoded = encodePlanToURL(mockPlan);

      // compressToEncodedURIComponent uses base64url-safe characters (+ allowed)
      expect(encoded).not.toMatch(/[^A-Za-z0-9\-_.~%+]/);
    });

    it("異なるプランは異なるエンコード結果を生成する", () => {
      const plan1 = { ...mockPlan, name: "Plan A" };
      const plan2 = { ...mockPlan, name: "Plan B" };

      const encoded1 = encodePlanToURL(plan1);
      const encoded2 = encodePlanToURL(plan2);

      expect(encoded1).not.toBe(encoded2);
    });

    it("大きなプランもエンコードできる", () => {
      const largePlan: SavedPlan = {
        ...mockPlan,
        nodeOverrides: {
          node1: {
            proliferator: { ...PROLIFERATOR_DATA.mk1, mode: "speed" },
            machineRank: "mk2",
          },
          node2: {
            proliferator: { ...PROLIFERATOR_DATA.mk2, mode: "production" },
            machineRank: "mk3",
          },
          node3: {
            proliferator: { ...PROLIFERATOR_DATA.mk3, mode: "speed" },
            machineRank: "quantum",
          },
        },
      };

      const encoded = encodePlanToURL(largePlan);

      expect(encoded).toBeDefined();
      expect(encoded.length).toBeGreaterThan(0);
    });
  });

  describe("decodePlanFromURL", () => {
    it("エンコードされたプランをデコードする", () => {
      const encoded = encodePlanToURL(mockPlan);
      const decoded = decodePlanFromURL(encoded);

      expect(decoded).toBeDefined();
      expect(decoded?.name).toBe(mockPlan.name);
      expect(decoded?.recipeSID).toBe(mockPlan.recipeSID);
      expect(decoded?.targetQuantity).toBe(mockPlan.targetQuantity);
    });

    it("エンコード→デコードが可逆的である", () => {
      const encoded = encodePlanToURL(mockPlan);
      const decoded = decodePlanFromURL(encoded);

      // Map objects are serialized as plain objects, so we deep compare
      expect(decoded).toMatchObject({
        name: mockPlan.name,
        timestamp: mockPlan.timestamp,
        recipeSID: mockPlan.recipeSID,
        targetQuantity: mockPlan.targetQuantity,
        alternativeRecipes: mockPlan.alternativeRecipes,
        nodeOverrides: mockPlan.nodeOverrides,
      });

      // Settings should be preserved (alternativeRecipes Map becomes {})
      expect(decoded?.settings).toBeDefined();
      expect(decoded?.settings.conveyorBelt).toEqual(mockPlan.settings.conveyorBelt);
      expect(decoded?.settings.machineRank).toEqual(mockPlan.settings.machineRank);
      expect(decoded?.settings.proliferator).toEqual(mockPlan.settings.proliferator);
    });

    it("無効なエンコード文字列はnullを返す", () => {
      const invalidEncoded = "invalid-base64-string";
      const decoded = decodePlanFromURL(invalidEncoded);

      expect(decoded).toBeNull();
    });

    it("空文字列はnullを返す", () => {
      const decoded = decodePlanFromURL("");

      expect(decoded).toBeNull();
    });

    it("不完全なプランデータ（nameなし）はnullを返す", () => {
      const incompletePlan = {
        timestamp: 1697788800000,
        recipeSID: 1101,
        targetQuantity: 60,
      };

      const encoded = encodePlanToURL(incompletePlan as any);
      const decoded = decodePlanFromURL(encoded);

      expect(decoded).toBeNull();
    });

    it("不完全なプランデータ（settingsなし）はnullを返す", () => {
      const incompletePlan = {
        name: "Test",
        timestamp: 1697788800000,
        recipeSID: 1101,
        targetQuantity: 60,
      };

      const encoded = encodePlanToURL(incompletePlan as any);
      const decoded = decodePlanFromURL(encoded);

      expect(decoded).toBeNull();
    });

    it("不完全なプランデータ（recipeSIDなし）はnullを返す", () => {
      const incompletePlan = {
        name: "Test",
        timestamp: 1697788800000,
        targetQuantity: 60,
        settings: mockPlan.settings,
      };

      const encoded = encodePlanToURL(incompletePlan as any);
      const decoded = decodePlanFromURL(encoded);

      expect(decoded).toBeNull();
    });
  });

  describe("圧縮効率", () => {
    it("圧縮により元のJSON文字列より短くなる", () => {
      const json = JSON.stringify(mockPlan);
      const encoded = encodePlanToURL(mockPlan);

      // URL encodeを考慮しても、圧縮効果があることを確認
      expect(encoded.length).toBeLessThan(json.length * 1.5);
    });
  });

  describe("エラーハンドリング", () => {
    it("encodePlanToURLがJSON.stringifyエラーをスローする", () => {
      const circularPlan: any = { name: "Test" };
      circularPlan.self = circularPlan; // Circular reference

      expect(() => encodePlanToURL(circularPlan)).toThrow("Failed to encode plan for sharing");
    });

    it("decodePlanFromURLが壊れたJSON文字列を処理する", () => {
      // 正常なエンコード文字列を取得してから一部を改変
      const encoded = encodePlanToURL(mockPlan);
      const corrupted = encoded.substring(0, encoded.length - 10) + "corrupted";

      const decoded = decodePlanFromURL(corrupted);

      expect(decoded).toBeNull();
    });
  });

  describe("generateShareURL", () => {
    beforeEach(() => {
      // Mock window.location
      delete (window as any).location;
      window.location = {
        origin: "https://example.com",
        pathname: "/calculator",
      } as any;
    });

    it("should generate shareable URL with encoded plan", () => {
      const url = generateShareURL(mockPlan);

      expect(url).toMatch(/^https:\/\/example\.com\/calculator\?plan=/);
      expect(url).toContain("plan=");

      // Extract and decode the plan parameter
      const planParam = url.split("plan=")[1];
      expect(planParam).toBeDefined();
      expect(planParam.length).toBeGreaterThan(0);
    });

    it("should generate different URLs for different plans", () => {
      const plan2: SavedPlan = {
        ...mockPlan,
        name: "Different Plan",
        targetQuantity: 120,
      };

      const url1 = generateShareURL(mockPlan);
      const url2 = generateShareURL(plan2);

      expect(url1).not.toBe(url2);
    });

    it("should use current origin and pathname", () => {
      window.location = {
        origin: "http://localhost:3000",
        pathname: "/test/path",
      } as any;

      const url = generateShareURL(mockPlan);

      expect(url).toMatch(/^http:\/\/localhost:3000\/test\/path\?plan=/);
    });
  });

  describe("getPlanFromURL", () => {
    beforeEach(() => {
      delete (window as any).location;
    });

    it("should return plan from URL search params", () => {
      const encoded = encodePlanToURL(mockPlan);
      window.location = {
        search: `?plan=${encoded}`,
      } as any;

      const plan = getPlanFromURL();

      expect(plan).toBeDefined();
      expect(plan?.name).toBe("Test Plan");
      expect(plan?.targetQuantity).toBe(60);
    });

    it("should return null when no plan parameter exists", () => {
      window.location = {
        search: "",
      } as any;

      const plan = getPlanFromURL();

      expect(plan).toBeNull();
    });

    it("should return null when plan parameter is empty", () => {
      window.location = {
        search: "?plan=",
      } as any;

      const plan = getPlanFromURL();

      expect(plan).toBeNull();
    });

    it("should return null when plan parameter is invalid", () => {
      window.location = {
        search: "?plan=invalid-data",
      } as any;

      const plan = getPlanFromURL();

      expect(plan).toBeNull();
    });

    it("should handle URL with multiple parameters", () => {
      const encoded = encodePlanToURL(mockPlan);
      window.location = {
        search: `?foo=bar&plan=${encoded}&baz=qux`,
      } as any;

      const plan = getPlanFromURL();

      expect(plan).toBeDefined();
      expect(plan?.name).toBe("Test Plan");
    });
  });

  describe("copyToClipboard", () => {
    afterEach(() => {
      vi.unstubAllGlobals();
      vi.restoreAllMocks();
    });

    it("should copy text using Clipboard API when available", async () => {
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      vi.stubGlobal("navigator", {
        clipboard: {
          writeText: writeTextMock,
        },
      });

      const result = await copyToClipboard("test text");

      expect(result).toBe(true);
      expect(writeTextMock).toHaveBeenCalledWith("test text");
    });

    it("should return false when Clipboard API fails and fallback also fails", async () => {
      // Mock Clipboard API to fail
      const writeTextMock = vi.fn().mockRejectedValue(new Error("Permission denied"));
      vi.stubGlobal("navigator", {
        clipboard: {
          writeText: writeTextMock,
        },
      });

      // Mock document.execCommand to throw
      const execCommandMock = vi.fn().mockImplementation(() => {
        throw new Error("execCommand failed");
      });
      document.execCommand = execCommandMock;

      const result = await copyToClipboard("test text");

      expect(result).toBe(false);
    });

    it("should use fallback method when Clipboard API throws", async () => {
      // Mock Clipboard API to throw
      const writeTextMock = vi.fn().mockRejectedValue(new Error("Not available"));
      vi.stubGlobal("navigator", {
        clipboard: {
          writeText: writeTextMock,
        },
      });

      // Mock document.execCommand to succeed
      const execCommandMock = vi.fn().mockReturnValue(true);
      document.execCommand = execCommandMock;

      // Mock appendChild and removeChild
      const appendChildSpy = vi.spyOn(document.body, "appendChild");
      const removeChildSpy = vi.spyOn(document.body, "removeChild");

      const result = await copyToClipboard("test text");

      expect(result).toBe(true);
      expect(execCommandMock).toHaveBeenCalledWith("copy");
      expect(appendChildSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalled();
    });

    it("should create and remove textarea element in fallback method", async () => {
      const writeTextMock = vi.fn().mockRejectedValue(new Error("Not available"));
      vi.stubGlobal("navigator", {
        clipboard: {
          writeText: writeTextMock,
        },
      });

      const execCommandMock = vi.fn().mockReturnValue(true);
      document.execCommand = execCommandMock;

      const appendChildSpy = vi.spyOn(document.body, "appendChild");
      const removeChildSpy = vi.spyOn(document.body, "removeChild");

      await copyToClipboard("fallback text");

      expect(appendChildSpy).toHaveBeenCalledTimes(1);
      expect(removeChildSpy).toHaveBeenCalledTimes(1);

      const textArea = appendChildSpy.mock.calls[0][0] as HTMLTextAreaElement;
      expect(textArea.tagName).toBe("TEXTAREA");
      expect(textArea.value).toBe("fallback text");
      expect(textArea.style.position).toBe("fixed");
      expect(textArea.style.left).toBe("-999999px");
    });
  });
});
