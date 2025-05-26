import { CallEventListener, EventTypes } from '../coordinator/connection/types';
import type { SfuEvent } from '../gen/video/sfu/event/events';
import { getLogger } from '../logger';

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
};

export const isSfuEvent = (
  eventName: SfuEventKinds | EventTypes,
): eventName is SfuEventKinds => {
  return Object.prototype.hasOwnProperty.call(sfuEventKinds, eventName);
};

export class Dispatcher {
  private readonly logger = getLogger(['Dispatcher']);
  private subscribers: Partial<
    Record<SfuEventKinds, CallEventListener<any>[] | undefined>
  > = {};

  dispatch = <K extends SfuEventKinds>(
    message: DispatchableMessage<K>,
    logTag: string = '0',
  ) => {
    const eventKind = message.eventPayload.oneofKind;
    if (!eventKind) return;
    const payload = message.eventPayload[eventKind];
    this.logger('debug', `Dispatching ${eventKind}, tag=${logTag}`, payload);
    const listeners = this.subscribers[eventKind];
    if (!listeners) return;
    for (const fn of listeners) {
      try {
        fn(payload);
      } catch (e) {
        this.logger('warn', 'Listener failed with error', e);
      }
    }
  };

  on = <E extends keyof AllSfuEvents>(
    eventName: E,
    fn: CallEventListener<E>,
  ) => {
    (this.subscribers[eventName] ??= []).push(fn as never);
    return () => {
      this.off(eventName, fn);
    };
  };

  off = <E extends keyof AllSfuEvents>(
    eventName: E,
    fn: CallEventListener<E>,
  ) => {
    this.subscribers[eventName] = (this.subscribers[eventName] || []).filter(
      (f) => f !== fn,
    );
  };
}
