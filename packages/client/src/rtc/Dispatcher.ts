import { CallEventTypes } from '../coordinator/connection/types';
import type { SfuEvent } from '../gen/video/sfu/event/events';

export type SfuEventKinds = NonNullable<SfuEvent['eventPayload']['oneofKind']>;

const sfuEventKinds: { [key in SfuEventKinds]: undefined } = {
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
};

export const isSfuEvent = (
  eventName: SfuEventKinds | CallEventTypes,
): eventName is SfuEventKinds => {
  return Object.prototype.hasOwnProperty.call(sfuEventKinds, eventName);
};

export type SfuEventListener = (event: SfuEvent) => void;

export class Dispatcher {
  private subscribers: {
    [eventName: string]: SfuEventListener[] | undefined;
  } = {};

  dispatch = (message: SfuEvent) => {
    const eventKind = message.eventPayload.oneofKind;
    if (eventKind) {
      // @ts-ignore
      console.log(`Dispatching`, eventKind, message.eventPayload[eventKind]);
      const listeners = this.subscribers[eventKind];
      listeners?.forEach((fn) => {
        try {
          fn(message);
        } catch (e) {
          console.warn(`Listener failed with error`, e);
        }
      });
    }
  };

  on = (eventName: SfuEventKinds, fn: SfuEventListener) => {
    (this.subscribers[eventName] ??= []).push(fn);
    return () => {
      this.off(eventName, fn);
    };
  };

  off = (eventName: SfuEventKinds, fn: SfuEventListener) => {
    this.subscribers[eventName] = (this.subscribers[eventName] || []).filter(
      (f) => f !== fn,
    );
  };

  offAll = (eventName?: SfuEventKinds) => {
    if (eventName) {
      this.subscribers[eventName] = [];
    } else {
      this.subscribers = {};
    }
  };
}
