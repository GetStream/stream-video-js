import { CallEventListener, EventTypes } from '../coordinator/connection/types';
import type {
  AudioLevelChanged,
  CallGrantsUpdated,
  ChangePublishQuality,
  ConnectionQualityChanged,
  DominantSpeakerChanged,
  Error as SfuError,
  GoAway,
  HealthCheckResponse,
  ICERestart,
  ICETrickle,
  JoinResponse,
  ParticipantJoined,
  ParticipantLeft,
  PinsChanged,
  PublisherAnswer,
  SfuEvent,
  SubscriberOffer,
  TrackPublished,
  TrackUnpublished,
} from '../gen/video/sfu/event/events';
import { getLogger } from '../logger';

export type SfuEventKinds = NonNullable<SfuEvent['eventPayload']['oneofKind']>;
export type AllSfuEvents = {
  // @ts-ignore - TS doesn't like this for some reason
  // had to type it out manually :)
  // [K in SfuEventKinds]: Extract<SfuEvent['eventPayload'], { oneofKind: K }>[K];
  subscriberOffer: SubscriberOffer;
  publisherAnswer: PublisherAnswer;
  connectionQualityChanged: ConnectionQualityChanged;
  audioLevelChanged: AudioLevelChanged;
  iceTrickle: ICETrickle;
  changePublishQuality: ChangePublishQuality;
  participantJoined: ParticipantJoined;
  participantLeft: ParticipantLeft;
  dominantSpeakerChanged: DominantSpeakerChanged;
  joinResponse: JoinResponse;
  healthCheckResponse: HealthCheckResponse;
  trackPublished: TrackPublished;
  trackUnpublished: TrackUnpublished;
  error: SfuError;
  callGrantsUpdated: CallGrantsUpdated;
  goAway: GoAway;
  iceRestart: ICERestart;
  pinsUpdated: PinsChanged;
};

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
  goAway: undefined,
  iceRestart: undefined,
  pinsUpdated: undefined,
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

  dispatch = (message: SfuEvent) => {
    const eventKind = message.eventPayload.oneofKind;
    if (eventKind) {
      const payload = (message.eventPayload as any)[eventKind];
      this.logger('debug', `Dispatching ${eventKind}`, payload);
      const listeners = this.subscribers[eventKind];
      if (!listeners) return;
      for (const fn of listeners) {
        try {
          fn(payload);
        } catch (e) {
          this.logger('warn', 'Listener failed with error', e);
        }
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

  offAll = (eventName?: SfuEventKinds) => {
    if (eventName) {
      this.subscribers[eventName] = [];
    } else {
      this.subscribers = {};
    }
  };
}
