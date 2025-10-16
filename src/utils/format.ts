/**
 * Format power consumption with appropriate unit (kW, MW, GW)
 * Always shows 1 decimal place with rounding
 */
export function formatPower(powerKW: number): string {
  if (powerKW >= 1_000_000) {
    return `${(powerKW / 1_000_000).toFixed(1)} GW`;
  } else if (powerKW >= 1_000) {
    return `${(powerKW / 1_000).toFixed(1)} MW`;
  } else {
    return `${powerKW.toFixed(1)} kW`;
  }
}

/**
 * Format number with 1 decimal place (rounded)
 */
export function formatNumber(num: number): string {
  return num.toFixed(1);
}

/**
 * Format rate (items per second)
 * Always shows 1 decimal place with rounding
 */
export function formatRate(rate: number): string {
  return `${rate.toFixed(1)}/s`;
}
