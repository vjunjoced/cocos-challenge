export function escapeLike(term: string): string {
  return term.replace(/[\\%_]/g, '\\$&');
}
