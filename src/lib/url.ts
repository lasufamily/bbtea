export function pathSegment(value: string): string {
  return encodeURIComponent(value);
}

/** Display label for shop categories (e.g. "water bottles" → "Water Bottles"). */
export function titleCaseWords(value: string): string {
  return value
    .replace(/[-_]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
