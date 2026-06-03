export function splitArticleParagraphs(article: string): string[] {
  return article
    .trim()
    .split(/\n\s*\n/)
    .map(paragraph => paragraph.trim())
    .filter(Boolean);
}
