import { getInitialsOfName } from '../src/utils';

describe('getInitialsOfName', () => {
  it('takes the uppercased first letters of the first and last words', () => {
    expect(getInitialsOfName('oliver lazoroski')).toBe('OL');
    expect(getInitialsOfName('ana maría lópez')).toBe('AL');
  });

  it('skips words that start with a symbol', () => {
    expect(getInitialsOfName('Oliver (Stream)')).toBe('O');
    expect(getInitialsOfName('@oliver')).toBe('O');
  });

  it('keeps emoji whole', () => {
    expect(getInitialsOfName('🎉')).toBe('🎉');
  });
});
