import type { SavedPlan } from '../types/saved-plan';
import { compress, decompress } from 'lz-string';

/**
 * Encode a plan to URL-safe base64 string
 */
export function encodePlanToURL(plan: SavedPlan): string {
  try {
    const json = JSON.stringify(plan);
    // Compress and encode to base64
    const compressed = compress(json);
    return encodeURIComponent(compressed);
  } catch (error) {
    console.error('Failed to encode plan:', error);
    throw new Error('Failed to encode plan for sharing');
  }
}

/**
 * Decode a plan from URL parameter
 */
export function decodePlanFromURL(encoded: string): SavedPlan | null {
  try {
    const decoded = decodeURIComponent(encoded);
    const decompressed = decompress(decoded);
    
    if (!decompressed) {
      throw new Error('Failed to decompress plan data');
    }
    
    const plan = JSON.parse(decompressed) as SavedPlan;
    
    // Basic validation
    if (!plan.name || !plan.settings || !plan.recipeSID) {
      throw new Error('Invalid plan data structure');
    }
    
    return plan;
  } catch (error) {
    console.error('Failed to decode plan:', error);
    return null;
  }
}

/**
 * Generate shareable URL for a plan
 */
export function generateShareURL(plan: SavedPlan): string {
  const encoded = encodePlanToURL(plan);
  const baseURL = window.location.origin + window.location.pathname;
  return `${baseURL}?plan=${encoded}`;
}

/**
 * Get plan from current URL if exists
 */
export function getPlanFromURL(): SavedPlan | null {
  const params = new URLSearchParams(window.location.search);
  const planParam = params.get('plan');
  
  if (!planParam) {
    return null;
  }
  
  return decodePlanFromURL(planParam);
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback method
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.select();
    
    try {
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch {
      document.body.removeChild(textArea);
      return false;
    }
  }
}
