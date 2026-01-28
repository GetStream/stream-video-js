/**
 * Normalizes a string for diacritic-insensitive comparison.
 * E.g., "Éva" becomes "eva", allowing "eva" to match "Éva".
 */
export const normalizeString = (value: string) =>
  value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
