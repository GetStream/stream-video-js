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

type TaggedHandler = { [tag: string]: CallEventListener<any>[] | undefined };

export class Dispatcher {
  private readonly logger = videoLoggerSystem.getLogger('Dispatcher');
  private subscribers: Partial<Record<SfuEventKinds, TaggedHandler>> = {};

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
    const handlers = this.subscribers[eventKind];
    if (!handlers) return;
    this.emit(payload, handlers[tag]);
    if (tag !== '*') this.emit(payload, handlers['*']);
  };

  /**
   * Emit an event to a list of listeners.
   *
   * @param payload the event payload to emit.
   * @param listeners the list of listeners to emit the event to.
   */
  emit = (payload: any, listeners: CallEventListener<any>[] = []) => {
    for (const listener of listeners) {
      try {
        listener(payload);
      } catch (e) {
        this.logger.warn('Listener failed with error', e);
      }
    }
  };

  /**
   * Subscribe to an event.
   *
   * @param eventName the name of the event to subscribe to.
   * @param tag for scoping events to a specific tag. Use `*` dispatch to every tag.
   * @param fn the callback function to invoke when the event is emitted.
   * @returns a function that can be called to unsubscribe from the event.
   */
  on = <E extends keyof AllSfuEvents>(
    eventName: E,
    tag: string,
    fn: CallEventListener<E>,
  ) => {
    const bucket = (this.subscribers[eventName] ??= {} as TaggedHandler);
    (bucket[tag] ??= []).push(fn);
    return () => {
      this.off(eventName, tag, fn);
    };
  };

  /**
   * Unsubscribe from an event.
   *
   * @param eventName the name of the event to unsubscribe from.
   * @param tag for scoping events to a specific tag. Use `*` dispatch to every tag.
   * @param fn the callback function to remove from the event listeners.
   */
  off = <E extends keyof AllSfuEvents>(
    eventName: E,
    tag: string,
    fn: CallEventListener<E>,
  ) => {
    const bucket = this.subscribers[eventName];
    const listeners = bucket?.[tag];
    if (!listeners) return;
    bucket[tag] = listeners.filter((f) => f !== fn);
  };
}
