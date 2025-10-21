import { describe, it, expect } from 'vitest';
import { formatPower, formatNumber, formatRate } from '../format';

describe('formatPower', () => {
  it('should format power in kW when less than 1,000', () => {
    expect(formatPower(500)).toBe('500.0 kW');
    expect(formatPower(999.9)).toBe('999.9 kW');
    expect(formatPower(0)).toBe('0.0 kW');
  });

  it('should format power in MW when >= 1,000 and < 1,000,000', () => {
    expect(formatPower(1000)).toBe('1.0 MW');
    expect(formatPower(5500)).toBe('5.5 MW');
    expect(formatPower(999999)).toBe('1000.0 MW');
  });

  it('should format power in GW when >= 1,000,000', () => {
    expect(formatPower(1_000_000)).toBe('1.0 GW');
    expect(formatPower(5_500_000)).toBe('5.5 GW');
    expect(formatPower(123_456_789)).toBe('123.5 GW');
  });

  it('should round to 1 decimal place', () => {
    expect(formatPower(1234)).toBe('1.2 MW');
    expect(formatPower(1235)).toBe('1.2 MW');
    expect(formatPower(1236)).toBe('1.2 MW');
  });

  it('should handle negative values', () => {
    expect(formatPower(-500)).toBe('-500.0 kW');
    // Note: formatPower uses absolute value check, so negative values stay in kW
    expect(formatPower(-1500)).toBe('-1500.0 kW');
  });
});

describe('formatNumber', () => {
  it('should format numbers with 1 decimal place', () => {
    expect(formatNumber(123.456)).toBe('123.5');
    expect(formatNumber(0)).toBe('0.0');
    expect(formatNumber(1)).toBe('1.0');
  });

  it('should round correctly', () => {
    expect(formatNumber(1.14)).toBe('1.1');
    expect(formatNumber(1.16)).toBe('1.2');
    expect(formatNumber(1.25)).toBe('1.3'); // toFixed uses round-half-up in most cases
  });

  it('should handle large numbers', () => {
    expect(formatNumber(1234567.89)).toBe('1234567.9');
  });

  it('should handle negative numbers', () => {
    expect(formatNumber(-123.456)).toBe('-123.5');
  });
});

describe('formatRate', () => {
  it('should format rate with /s suffix', () => {
    expect(formatRate(10)).toBe('10.0/s');
    expect(formatRate(123.456)).toBe('123.5/s');
  });

  it('should round to 1 decimal place', () => {
    expect(formatRate(1.14)).toBe('1.1/s');
    expect(formatRate(1.16)).toBe('1.2/s');
  });

  it('should handle zero', () => {
    expect(formatRate(0)).toBe('0.0/s');
  });

  it('should handle small decimal values', () => {
    expect(formatRate(0.5)).toBe('0.5/s');
    expect(formatRate(0.123)).toBe('0.1/s');
  });
});
