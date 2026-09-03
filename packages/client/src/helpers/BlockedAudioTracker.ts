import { StateStore } from '@stream-io/state-store';
import { select, type Subscribable } from '../store/subscribable';
import { videoLoggerSystem } from '../logger';
import { Tracer } from '../stats';
import { isShallowArrayEqual } from '../store/patch';
import { withoutConcurrency } from './concurrency';
import { timeboxed } from '../coordinator/connection/utils';

type BlockedAudioElement = {
  element: HTMLAudioElement;
  sessionId?: string;
};

/**
 * Tracks audio elements that the browser's autoplay policy has blocked.
 *
 * State is read directly everywhere inside the SDK ({@link isBlocked},
 * {@link markBlocked}); the two `$` members exist because React components
 * have to re-render when blocking starts or stops, and `select` memoises
 * their projections so `useSyncExternalStore` sees a stable snapshot.
 */
export class BlockedAudioTracker {
  private logger = videoLoggerSystem.getLogger('BlockedAudioTracker');
  private tracer: Tracer;

  private blockedElementsStore = new StateStore<{
    blockedElements: BlockedAudioElement[];
  }>({ blockedElements: [] });
  private readonly resumeConcurrencyTag = Symbol('resume-audio');

  /**
   * Whether the browser's autoplay policy is blocking audio playback.
   * Will be `true` when at least one audio element is currently blocked.
   * Use {@link resumeAudio} within a user gesture to unblock.
   */
  readonly autoplayBlocked$: Subscribable<boolean> = select(
    this.blockedElementsStore,
    (state) => state.blockedElements.length > 0,
  );

  /**
   * The list of participant `sessionId`s whose audio element is currently
   * blocked by the browser's autoplay policy. Only some participants may be
   * blocked (e.g. one joined while a gesture was active and a later one was
   * not), so use this to render a per-participant affordance rather than a
   * call-wide one. Call {@link resumeAudio} within a user gesture to unblock
   * all of them.
   *
   * Session ids are registered together with the audio element.
   */
  readonly blockedSessionIds$: Subscribable<string[]> = select(
    this.blockedElementsStore,
    (state) => {
      const ids: string[] = [];
      state.blockedElements.forEach(({ sessionId }) => {
        if (sessionId && !ids.includes(sessionId)) ids.push(sessionId);
      });
      return ids;
    },
    isShallowArrayEqual,
  );

  constructor(tracer: Tracer) {
    this.tracer = tracer;
  }

  /**
   * Registers an audio element as blocked by the browser's autoplay policy.
   */
  markBlocked = (
    audioElement: HTMLAudioElement,
    blocked: boolean,
    sessionId?: string,
  ) => {
    this.setBlockedElements((elements) => {
      if (!blocked) {
        return elements.filter(({ element }) => element !== audioElement);
      }

      const existing = elements.find(({ element }) => element === audioElement);
      if (existing) {
        return elements.map((entry) =>
          entry.element === audioElement
            ? { element: audioElement, sessionId: sessionId ?? entry.sessionId }
            : entry,
        );
      }

      return [...elements, { element: audioElement, sessionId }];
    });
  };

  private setBlockedElements = (
    patch: (elements: BlockedAudioElement[]) => BlockedAudioElement[],
  ) => {
    this.blockedElementsStore.next(({ blockedElements }) => ({
      blockedElements: patch(blockedElements),
    }));
  };

  /**
   * Clears all tracked elements. The tracker stays usable afterwards.
   */
  reset = () => {
    if (this.blockedElementsStore.getLatestValue().blockedElements.length > 0) {
      this.blockedElementsStore.partialNext({ blockedElements: [] });
    }
  };

  /**
   * Returns whether the given audio element is currently flagged as blocked
   * by the browser's autoplay policy.
   */
  isBlocked = (audioElement: HTMLAudioElement): boolean => {
    return this.blockedElementsStore
      .getLatestValue()
      .blockedElements.some(({ element }) => element === audioElement);
  };

  /**
   * Plays all audio elements blocked by the browser's autoplay policy.
   * Must be called from within a user gesture (e.g., click handler).
   */
  resumeAudio = async () => {
    this.tracer.trace('resumeAudio', null);
    // serialised so overlapping gestures cannot interleave their updates
    await withoutConcurrency(this.resumeConcurrencyTag, async () => {
      const { blockedElements } = this.blockedElementsStore.getLatestValue();
      const resumed = new Set<HTMLAudioElement>();

      await Promise.all(
        blockedElements.map(async ({ element }) => {
          try {
            if (element.srcObject) await timeboxed([element.play()], 2000);
            resumed.add(element);
          } catch (err) {
            this.logger.warn(`Can't resume audio for element`, element, err);
          }
        }),
      );

      // Remove the resumed elements from the list as it stands *now*, rather
      // than writing back the snapshot taken before the awaits: another
      // element can be blocked while `play()` is pending, and overwriting
      // would drop it from tracking entirely.
      this.setBlockedElements((current) =>
        current.filter(({ element }) => !resumed.has(element)),
      );
    });
  };
}
