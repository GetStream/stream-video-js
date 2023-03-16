import { describe, expect, it } from 'vitest';
import { StreamVideoClient } from '../StreamVideoClient';

describe('StreamVideoClient', () => {
  it('can be instantiated', () => {
    const client = new StreamVideoClient('api-key-123');
    expect(client).toBeTruthy();
  });
});
