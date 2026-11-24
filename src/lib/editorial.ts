// Until nutrition evidence is recorded, don't republish claims embedded in descriptions.
export function cleanDrinkDescription(value?: string): string | undefined {
  if (!value) return undefined;
  const text = value.split(/(?<=[.!?])\s+/)
    .filter(sentence => !/\bkcal\b|calori|nutri[ -]?grade|healthier choice|low(?:er)? (?:in )?sugar|sugar.free/i.test(sentence))
    .join(' ').trim();
  return text || undefined;
}
