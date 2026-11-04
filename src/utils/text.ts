/** Strip leading list markers from a line of text. */
const stripListMarker = (line: string): string =>
  line.replace(/^[-•*]\s*/, '').trim();

/**
 * Split multiline text into display lines for list-style content (amenities, etc.).
 * Each non-empty line becomes one item. Does not split by commas.
 */
export const linesToArray = (text: string): string[] => {
  const trimmed = text?.trim();
  if (!trimmed) return [];

  return trimmed
    .split(/\r?\n/)
    .map(stripListMarker)
    .filter(Boolean);
};

/**
 * Join array items into multiline text for admin textarea editing.
 */
export const arrayToLines = (items?: string[]): string =>
  items?.join('\n') ?? '';

/**
 * Split stored property description into paragraphs, preserving empty lines as spacing.
 * Does not split by commas or sentences.
 */
export const descriptionToParagraphs = (description: string): string[] => {
  if (!description) return [];
  return description.split(/\r?\n/);
};

/**
 * Split payment plan content into paragraphs, preserving empty lines.
 */
export const contentToParagraphs = (content: string): string[] => {
  if (!content) return [];
  return content.split(/\r?\n/);
};

/**
 * @deprecated Use descriptionToParagraphs instead.
 */
export const descriptionToLines = (description: string): string[] => {
  const paragraphs = descriptionToParagraphs(description);
  return paragraphs.filter(Boolean);
};

/**
 * Convert string to a clean URL-friendly slug.
 */
export const slugify = (text: string): string => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w-]+/g, '') // Remove all non-word chars
    .replace(/--+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
};
