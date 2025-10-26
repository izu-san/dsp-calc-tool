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
 * If the rate rounds to 0.0/s, show as items per minute or per hour instead
 * Always shows 1 decimal place with rounding
 */
export function formatRate(rate: number): string {
  const perSecond = rate.toFixed(1);
  
  // If rounded to 0.0/s, try per minute or per hour for better readability
  if (perSecond === '0.0' && rate > 0) {
    const perMinute = (rate * 60).toFixed(1);
    
    // If still 0.0/min, show as items per hour
    if (perMinute === '0.0') {
      const perHour = (rate * 3600).toFixed(1);
      return `${perHour}/h`;
    }
    
    return `${perMinute}/min`;
  }
  
  return `${perSecond}/s`;
}
