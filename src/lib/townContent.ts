export interface TownListItem {
  title?: string;
  description?: string;
}

const DASH_SPLIT = /\s+[–-]\s+/;

function cleanItem(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function splitMultiline(value: string): string[] {
  return value
    .split(/\n+/)
    .map(cleanItem)
    .filter(Boolean);
}

function splitCommaList(value: string): string[] {
  return value
    .split(',')
    .map(cleanItem)
    .filter(Boolean);
}

function shouldUseCommaList(value: string): boolean {
  if (/[.!?]/.test(value)) return false;
  return splitCommaList(value).length > 1;
}

export function parseTownList(value?: string): TownListItem[] {
  if (!value?.trim()) return [];

  const trimmed = value.trim();
  const lineItems = splitMultiline(trimmed);
  const sourceItems = lineItems.length > 1
    ? lineItems
    : shouldUseCommaList(trimmed)
      ? splitCommaList(trimmed)
      : [trimmed];

  if (sourceItems.length > 1) {
    return sourceItems.map(item => {
      const [title, ...descriptionParts] = item.split(DASH_SPLIT);
      const description = descriptionParts.join(' - ').trim();
      return description
        ? { title: cleanItem(title), description: cleanItem(description) }
        : { title: cleanItem(title) };
    });
  }

  const [title, ...descriptionParts] = trimmed.split(DASH_SPLIT);
  const description = descriptionParts.join(' - ').trim();

  if (description) {
    return [{ title: cleanItem(title), description: cleanItem(description) }];
  }

  return [{ description: cleanItem(trimmed) }];
}

export function formatNumber(value?: number): string | undefined {
  return typeof value === 'number' ? new Intl.NumberFormat('en-SG').format(value) : undefined;
}
