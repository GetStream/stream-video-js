import { CallEventListener, EventTypes } from '../coordinator/connection/types';
import type { SfuEvent } from '../gen/video/sfu/event/events';
import { videoLoggerSystem } from '../logger';

export type SfuEventKinds = NonNullable<SfuEvent['eventPayload']['oneofKind']>;
export type AllSfuEvents = {
  [K in SfuEventKinds]: K extends keyof Extract<
    SfuEvent['eventPayload'],
    { oneofKind: K }
  >
    ? Extract<SfuEvent['eventPayload'], { oneofKind: K }>[K]
    : never;
};

export type DispatchableMessage<K extends SfuEventKinds> = {
  eventPayload: {
    oneofKind: K;
  } & {
    [Key in K]: AllSfuEvents[Key];
  };
};

const sfuEventKinds: Record<SfuEventKinds, undefined> = {
  subscriberOffer: undefined,
  publisherAnswer: undefined,
  connectionQualityChanged: undefined,
  audioLevelChanged: undefined,
  iceTrickle: undefined,
  changePublishQuality: undefined,
  participantJoined: undefined,
  participantLeft: undefined,
  dominantSpeakerChanged: undefined,
  joinResponse: undefined,
  healthCheckResponse: undefined,
  trackPublished: undefined,
  trackUnpublished: undefined,
  error: undefined,
  callGrantsUpdated: undefined,
  goAway: undefined,
  iceRestart: undefined,
  pinsUpdated: undefined,
  callEnded: undefined,
  participantUpdated: undefined,
  participantMigrationComplete: undefined,
  changePublishOptions: undefined,
  inboundStateNotification: undefined,
};

/**
 * Determines if a given event name belongs to the category of SFU events.
 *
 * @param eventName the name of the event to check.
 * @returns true if the event name is an SFU event, otherwise false.
 */
export const isSfuEvent = (
  eventName: SfuEventKinds | EventTypes,
): eventName is SfuEventKinds => {
  return Object.prototype.hasOwnProperty.call(sfuEventKinds, eventName);
};

export type ListenerTag = string | (() => string);
type AnyListener = CallEventListener<keyof AllSfuEvents>;

type DynamicHandler = {
  tagSelector: () => string;
  listener: AnyListener;
};

type EventHandlers = {
  byTag: Map<string, AnyListener[]>;
  dynamic: DynamicHandler[];
};

export class Dispatcher {
  private readonly logger = videoLoggerSystem.getLogger('Dispatcher');
  private subscribers = new Map<SfuEventKinds, EventHandlers>();

  /**
   * Dispatch an event to all subscribers.
   *
   * @param message the event payload to dispatch.
   * @param tag for scoping events to a specific tag. Use `*` dispatch to every tag.
   */
  dispatch = <K extends SfuEventKinds>(
    message: DispatchableMessage<K>,
    tag: string = '*',
  ) => {
    const eventKind = message.eventPayload.oneofKind;
    if (!eventKind) return;
    const payload = message.eventPayload[eventKind];
    this.logger.debug(`Dispatching ${eventKind}, tag=${tag}`, payload);
    const handlers = this.subscribers.get(eventKind);
    if (!handlers) return;

    const { byTag, dynamic } = handlers;
    this.emit(payload, byTag.get(tag));
    if (tag !== '*') this.emit(payload, byTag.get('*'));
    this.emitDynamic(payload, tag, dynamic);
  };

  /**
   * Emit an event to a list of listeners.
   *
   * @param payload the event payload to emit.
   * @param listeners the list of listeners to emit the event to.
   */
  emit = (payload: any, listeners: AnyListener[] = []) => {
    for (const listener of listeners) {
      this.emitOne(payload, listener);
    }
  };

  /**
   * Emit an event to a list of listeners.
   *
   */
  emitDynamic = (payload: any, tag: string, dynamic: DynamicHandler[]) => {
    for (const { tagSelector, listener } of dynamic) {
      const dynamicTag = tagSelector();
      if (dynamicTag === tag || (tag !== '*' && dynamicTag === '*')) {
        this.emitOne(payload, listener);
      }
    }
  };

  /**
   * Emit an event to a single listener.
   * @param payload the event payload to emit.
   * @param listener the listener to emit the event to.
   */
  private emitOne = (payload: any, listener: AnyListener) => {
    try {
      listener(payload);
    } catch (e) {
      this.logger.warn('Listener failed with error', e);
    }
  };

  /**
   * Subscribe to an event.
   *
   * @param eventName the name of the event to subscribe to.
   * @param tag for scoping events to a specific tag. Can be a static tag
   * string or a function that resolves the tag dynamically.
   * @param fn the callback function to invoke when the event is emitted.
   * @returns a function that can be called to unsubscribe from the event.
   */
  on = <E extends keyof AllSfuEvents>(
    eventName: E,
    tag: ListenerTag,
    fn: CallEventListener<E>,
  ) => {
    const { byTag, dynamic } = this.getHandlers(eventName);
    const listener = fn as AnyListener;
    if (typeof tag === 'string') {
      const listeners = byTag.get(tag) ?? [];
      listeners.push(listener);
      byTag.set(tag, listeners);
    } else {
      dynamic.push({ tagSelector: tag, listener });
    }
    return () => {
      this.off(eventName, tag, fn);
    };
  };

  /**
   * Unsubscribe from an event.
   *
   * @param eventName the name of the event to unsubscribe from.
   * @param tag the original static/dynamic tag selector used during subscription.
   * @param fn the callback function to remove from the event listeners.
   */
  off = <E extends keyof AllSfuEvents>(
    eventName: E,
    tag: ListenerTag,
    fn: CallEventListener<E>,
  ) => {
    const bucket = this.subscribers.get(eventName);
    if (!bucket) return;

    const { byTag, dynamic } = bucket;
    if (typeof tag === 'string') {
      const listeners = byTag.get(tag) || [];
      const idx = listeners.indexOf(fn as AnyListener);
      if (idx >= 0) listeners.splice(idx, 1);
    } else {
      const idx = dynamic.findIndex(({ tagSelector, listener }) => {
        return tagSelector === tag && listener === fn;
      });
      if (idx >= 0) dynamic.splice(idx, 1);
    }
  };

  private getHandlers = (eventName: SfuEventKinds): EventHandlers => {
    const existing = this.subscribers.get(eventName);
    if (existing) return existing;
    const next: EventHandlers = { byTag: new Map(), dynamic: [] };
    this.subscribers.set(eventName, next);
    return next;
  };
}
