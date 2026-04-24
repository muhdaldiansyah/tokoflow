/**
 * Sanitize a search string for use in PostgREST .or() filter expressions.
 * Escapes characters that could break or manipulate the filter syntax.
 */
export function sanitizeSearch(input: string): string {
  return input
    .replace(/\\/g, "\\\\") // backslash first
    .replace(/,/g, "\\,")   // comma (or separator)
    .replace(/\(/g, "\\(")  // open paren
    .replace(/\)/g, "\\)")  // close paren
    .replace(/\./g, "\\.")  // dot (field separator)
    .trim();
}
