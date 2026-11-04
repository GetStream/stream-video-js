import { describe, expect, it } from 'vitest';
import { getInitials } from './getInitials';

describe('getInitials', () => {
  it('takes the first letters of the first and last words', () => {
    expect(getInitials('Oliver Lazoroski')).toBe('OL');
    expect(getInitials('Ana María López')).toBe('AL');
    expect(getInitials('Testy van der Test')).toBe('TT');
    expect(getInitials('Oliver')).toBe('O');
    expect(getInitials('  Oliver   Lazoroski  ')).toBe('OL');
  });

  it('takes the first word only for a single initial', () => {
    expect(getInitials('Oliver Lazoroski', 1)).toBe('O');
    expect(getInitials('Ana María López', 1)).toBe('A');
  });

  it('skips words that start with a symbol', () => {
    expect(getInitials('Oliver (Stream)')).toBe('O');
    expect(getInitials('Oliver Lazoroski (Stream)')).toBe('OL');
    expect(getInitials('[Guest] Oliver')).toBe('O');
    expect(getInitials('Oliver Lazoroski [Guest]')).toBe('OL');
    expect(getInitials('🎉 Party Host')).toBe('PH');
  });

  it('falls back to the first letter or digit anywhere in the name', () => {
    expect(getInitials('@oliver')).toBe('o');
    expect(getInitials('(Stream)')).toBe('S');
  });

  it('falls back to the first character when the name has no letters', () => {
    expect(getInitials('🎉')).toBe('🎉');
    expect(getInitials('👍🏽 :)')).toBe('👍🏽');
    expect(getInitials('')).toBe('');
  });

  it('keeps digits, non-Latin letters and accents', () => {
    expect(getInitials('2Pac Shakur')).toBe('2S');
    expect(getInitials('김 민수')).toBe('김민');
    expect(getInitials('Émile Zola')).toBe('ÉZ');
    expect(getInitials('Émile Zola')).toBe('ÉZ');
  });
});
