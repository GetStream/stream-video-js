import { describe, expect, it } from 'vitest';
import { CallState } from '../../store';
import { watchCallLiveStarted } from '../backstage';

describe('backstage events', () => {
  it('handles call.live_started events', () => {
    const state = new CallState();
    const handler = watchCallLiveStarted(state);
    // @ts-ignore
    handler({
      type: 'call.live_started',
    });
    expect(state.metadata?.backstage).toBe(false);
  });
});
