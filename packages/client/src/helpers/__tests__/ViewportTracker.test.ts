/**
 * @vitest-environment happy-dom
 */

import '../../rtc/__tests__/mocks/webrtc.mocks';

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Call } from '../../Call';
import { StreamClient } from '../../coordinator/connection/client';
import { ClientEventReporter } from '../../reporting';
import { StreamVideoWriteableStateStore } from '../../store';
import { noopComparator } from '../../sorting';
import { VisibilityState } from '../../types';
import { ViewportTracker } from '../ViewportTracker';

describe('ViewportTracker', () => {
  let call: Call;
  let viewportTracker: ViewportTracker;

  beforeEach(() => {
    const streamClient = new StreamClient('api-key', {
      devicePersistence: { enabled: false },
    });
    call = new Call({
      id: 'id',
      type: 'default',
      streamClient,
      clientEventReporter: new ClientEventReporter({ streamClient }),
      clientStore: new StreamVideoWriteableStateStore(),
    });
    call.setSortParticipantsBy(noopComparator());
    viewportTracker = call.viewportTracker!;
  });

  it('is constructed by Call and exposed as call.viewportTracker', () => {
    expect(viewportTracker).toBeInstanceOf(ViewportTracker);
  });

  it('updates participant viewportVisibilityState as visibility changes', () => {
    let visibilityHandler:
      | ((entry: IntersectionObserverEntry) => void)
      | undefined;
    vi.spyOn(viewportTracker, 'observe').mockImplementation((_el, handler) => {
      visibilityHandler = handler;
      return vi.fn();
    });

    // @ts-expect-error incomplete data
    call.state.updateOrAddParticipant('session-id', {
      userId: 'user-id',
      sessionId: 'session-id',
      publishedTracks: [],
    });

    const element = document.createElement('div');
    const untrack = viewportTracker.trackElementVisibility(
      element,
      'session-id',
      'videoTrack',
    );

    expect(visibilityHandler).toBeDefined();
    expect(viewportTracker.observe).toHaveBeenCalledWith(
      element,
      expect.any(Function),
    );

    visibilityHandler!({ isIntersecting: true } as IntersectionObserverEntry);
    expect(
      call.state.findParticipantBySessionId('session-id')
        ?.viewportVisibilityState?.videoTrack,
    ).toBe(VisibilityState.VISIBLE);

    visibilityHandler!({ isIntersecting: false } as IntersectionObserverEntry);
    expect(
      call.state.findParticipantBySessionId('session-id')
        ?.viewportVisibilityState?.videoTrack,
    ).toBe(VisibilityState.INVISIBLE);

    untrack();
    expect(
      call.state.findParticipantBySessionId('session-id')
        ?.viewportVisibilityState?.videoTrack,
    ).toBe(VisibilityState.UNKNOWN);
  });
});
