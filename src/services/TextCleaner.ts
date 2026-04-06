export function cleanText(raw: string): string {
  if (!raw) {
    return '';
  }

  let text = raw;

  // Remove null bytes
  text = text.replace(/\0/g, '');

  // Strip control characters (except newline, carriage return, tab)
  text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Normalize line breaks to \n
  text = text.replace(/\r\n/g, '\n');
  text = text.replace(/\r/g, '\n');

  // Replace tabs with a single space
  text = text.replace(/\t/g, ' ');

  // Collapse multiple spaces into one (per line)
  text = text.replace(/[^\S\n]+/g, ' ');

  // Trim whitespace from each line
  text = text
    .split('\n')
    .map((line) => line.trim())
    .join('\n');

  // Collapse three or more consecutive newlines into two (one blank line max)
  text = text.replace(/\n{3,}/g, '\n\n');

  // Trim leading and trailing whitespace
  text = text.trim();

  return text;
}