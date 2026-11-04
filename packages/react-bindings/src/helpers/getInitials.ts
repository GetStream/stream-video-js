/** A letter or digit, with any combining marks (accents) that follow it. */
const LEADING_LETTER_OR_DIGIT = /^[\p{L}\p{N}]\p{M}*/u;
const LETTER_OR_DIGIT = /[\p{L}\p{N}]\p{M}*/u;

/**
 * The first user-perceived character of `text`. Falls back to the first code
 * point where `Intl.Segmenter` is missing (Hermes).
 */
const firstCharacter = (text: string) => {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const [first] = new Intl.Segmenter().segment(text);
    return first?.segment ?? '';
  }
  return Array.from(text)[0] ?? '';
};

/**
 * Picks the initials of a name for avatar placeholders: the first letters of
 * its first and last words, or of the first word only when `maxInitials` is
 * 1. Words that don't start with a letter or digit, such as `(Stream)` or
 * `@handle`, are skipped. Without such words, the first letter or digit
 * anywhere in the name is used, then its first character (for example an
 * emoji). Letter case is kept.
 *
 * @example getInitials('Oliver (Stream)') // 'O'
 * @example getInitials('Ana María López') // 'AL'
 *
 * @param name the name to take the initials from.
 * @param maxInitials the maximum number of initials, 2 by default.
 */
export const getInitials = (name: string, maxInitials = 2): string => {
  const words = name.split(/\s+/).filter(Boolean);
  const initials = words
    .map((word) => word.match(LEADING_LETTER_OR_DIGIT)?.[0])
    .filter((initial): initial is string => !!initial);
  if (initials.length > 0) {
    if (maxInitials <= 1 || initials.length <= maxInitials) {
      return initials.slice(0, Math.max(1, maxInitials)).join('');
    }
    return [...initials.slice(0, maxInitials - 1), initials.at(-1)].join('');
  }

  for (const word of words) {
    const initial = word.match(LETTER_OR_DIGIT)?.[0];
    if (initial) return initial;
  }
  return firstCharacter(name.trim());
};
