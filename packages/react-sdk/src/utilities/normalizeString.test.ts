import { describe, expect, it } from 'vitest';
import { normalizeString } from './normalizeString';

describe('normalizeString', () => {
  it('removes acute accents', () => {
    expect(normalizeString('Éva')).toBe('eva');
    expect(normalizeString('café')).toBe('cafe');
    expect(normalizeString('résumé')).toBe('resume');
  });

  it('removes grave accents', () => {
    expect(normalizeString('à')).toBe('a');
    expect(normalizeString('è')).toBe('e');
    expect(normalizeString('Père')).toBe('pere');
  });

  it('removes circumflex accents', () => {
    expect(normalizeString('château')).toBe('chateau');
    expect(normalizeString('forêt')).toBe('foret');
  });

  it('removes umlaut/diaeresis', () => {
    expect(normalizeString('Müller')).toBe('muller');
    expect(normalizeString('naïve')).toBe('naive');
    expect(normalizeString('Zoë')).toBe('zoe');
  });

  it('removes tilde', () => {
    expect(normalizeString('señor')).toBe('senor');
    expect(normalizeString('São Paulo')).toBe('sao paulo');
  });

  it('removes cedilla', () => {
    expect(normalizeString('François')).toBe('francois');
    expect(normalizeString('façade')).toBe('facade');
  });

  it('handles mixed diacritics', () => {
    expect(normalizeString('Éva Raposa')).toBe('eva raposa');
    expect(normalizeString('Jürgen Müller')).toBe('jurgen muller');
    expect(normalizeString('Crème brûlée')).toBe('creme brulee');
  });

  it('preserves non-accented characters', () => {
    expect(normalizeString('hello world')).toBe('hello world');
    expect(normalizeString('test123')).toBe('test123');
    expect(normalizeString('user@email.com')).toBe('user@email.com');
  });

  it('handles empty string', () => {
    expect(normalizeString('')).toBe('');
  });
});
