import React from "react";

/**
 * Parse and render miningFrom text with color tags
 * Example: "Fire ice vein <color="#FFFFFFC1">(rare)</color>"
 */
export function parseColorTags(text: string): React.ReactNode {
  if (!text) return text;

  // Regular expression to match <color="#XXXXXX">content</color>
  const colorRegex = /<color="(#[0-9A-Fa-f]{6,8})">(.*?)<\/color>/g;

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = colorRegex.exec(text)) !== null) {
    // Add text before the color tag
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    // Add colored text
    const color = match[1];
    const content = match[2];
    parts.push(
      <span key={match.index} style={{ color }}>
        {content}
      </span>
    );

    lastIndex = colorRegex.lastIndex;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? <>{parts}</> : text;
}
