import { describe, it, expect } from "vitest";
import { formatPower, formatNumber, formatRate, formatBuildingCount } from "../format";

describe("format utilities", () => {
  describe("formatPower", () => {
    it("should format power in kW for values less than 1000", () => {
      expect(formatPower(500)).toBe("500.0 kW");
      expect(formatPower(999.9)).toBe("999.9 kW");
    });

    it("should format power in MW for values between 1000 and 1000000", () => {
      expect(formatPower(1000)).toBe("1.0 MW");
      expect(formatPower(1500)).toBe("1.5 MW");
      expect(formatPower(999999.9)).toBe("1000.0 MW");
    });

    it("should format power in GW for values 1000000 and above", () => {
      expect(formatPower(1000000)).toBe("1.0 GW");
      expect(formatPower(2500000)).toBe("2.5 GW");
    });
  });

  describe("formatNumber", () => {
    it("should format numbers with 1 decimal place", () => {
      expect(formatNumber(1)).toBe("1.0");
      expect(formatNumber(1.5)).toBe("1.5");
      expect(formatNumber(1.55)).toBe("1.6"); // rounded
    });
  });

  describe("formatRate", () => {
    it("should format rates per second", () => {
      expect(formatRate(1)).toBe("1.0/s");
      expect(formatRate(1.5)).toBe("1.5/s");
    });

    it("should format very small rates as per minute", () => {
      expect(formatRate(0.01)).toBe("0.6/min");
    });

    it("should format extremely small rates as per hour", () => {
      expect(formatRate(0.001)).toBe("0.1/min");
    });
  });

  describe("formatBuildingCount", () => {
    it("should format integer counts as strings", () => {
      expect(formatBuildingCount(1)).toBe("1");
      expect(formatBuildingCount(5)).toBe("5");
      expect(formatBuildingCount(0)).toBe("0");
    });

    it("should ceiling fractional counts to integers", () => {
      expect(formatBuildingCount(1.1)).toBe("2");
      expect(formatBuildingCount(1.9)).toBe("2");
      expect(formatBuildingCount(0.1)).toBe("1");
      expect(formatBuildingCount(0.9)).toBe("1");
    });

    it("should handle edge cases", () => {
      expect(formatBuildingCount(1.0)).toBe("1");
      expect(formatBuildingCount(2.0)).toBe("2");
    });
  });
});
