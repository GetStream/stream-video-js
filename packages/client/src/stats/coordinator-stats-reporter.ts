import { StreamVideoReadOnlyStateStore } from '../stateStore';
import {
  ReportCallStatEventRequest,
  ReportCallStatEventResponse,
  ReportCallStatsResponse,
} from '../gen/video/coordinator/client_v1_rpc/client_rpc';
import {
  MediaStateChange,
  MediaStateChangeReason,
  MediaType,
  MediaDirection,
} from '../gen/video/coordinator/stat_v1/stat';
import { pairwise, throttleTime } from 'rxjs';
import { StreamVideoParticipant } from '../rtc/types';
import { TrackType } from '../gen/video/sfu/models/models';

/**
 * Collects stat metrics and events from the state store and sends them to the Coordinator API
 * @param readOnlyStateStore
 * @param sendStatMetrics
 * @param sendStatEvent
 */
export const reportStats = (
  readOnlyStateStore: StreamVideoReadOnlyStateStore,
  sendStatMetrics: (stats: Object) => Promise<ReportCallStatsResponse>,
  sendStatEvent: (
    statEvent: ReportCallStatEventRequest['event'],
  ) => Promise<ReportCallStatEventResponse>,
) => {
  reportStatMetrics(readOnlyStateStore, sendStatMetrics);
  reportStatEvents(readOnlyStateStore, sendStatEvent);
};

const reportStatMetrics = (
  readOnlyStateStore: StreamVideoReadOnlyStateStore,
  sendStatMetrics: (stats: Object) => Promise<ReportCallStatsResponse>,
) => {
  readOnlyStateStore.callStatsReport$
    .pipe(throttleTime(15000))
    .subscribe((report) => {
      if (report?.publisherRawStats) {
        const s: Record<string, any> = {};
        report.publisherRawStats.forEach((v) => {
          s[v.id] = v;
        });
        sendStatMetrics(s);
      }
      if (report?.subscriberRawStats) {
        const s: Record<string, any> = {};
        report.subscriberRawStats.forEach((v) => {
          s[v.id] = v;
        });
        sendStatMetrics(s);
      }
    });
};

export const reportStatEvents = (
  store: StreamVideoReadOnlyStateStore,
  sendStatEvent: (
    statEvent: ReportCallStatEventRequest['event'],
  ) => Promise<ReportCallStatEventResponse>,
) => {
  store.activeCallLocalParticipant$
    .pipe(pairwise())
    .subscribe(([prevLocalParticipant, currentLocalParticipant]) => {
      if (!prevLocalParticipant && currentLocalParticipant) {
        const event: ReportCallStatEventRequest['event'] = {
          oneofKind: 'participantConnected',
          participantConnected: {},
        };
        sendStatEvent(event);
      }
      if (prevLocalParticipant && !currentLocalParticipant) {
        const event: ReportCallStatEventRequest['event'] = {
          oneofKind: 'participantDisconnected',
          participantDisconnected: {},
        };
        sendStatEvent(event);
      }
      if (
        (!prevLocalParticipant?.audioStream &&
          currentLocalParticipant?.audioStream) ||
        (prevLocalParticipant?.audioStream &&
          !currentLocalParticipant?.audioStream)
      ) {
        const event: ReportCallStatEventRequest['event'] = {
          oneofKind: 'mediaStateChanged',
          mediaStateChanged: {
            mediaType: MediaType.AUDIO,
            change: currentLocalParticipant?.audioStream
              ? MediaStateChange.STARTED
              : MediaStateChange.ENDED,
            reason: MediaStateChangeReason.CONNECTION,
            direction: MediaDirection.SEND,
          },
        };
        sendStatEvent(event);
      }
      if (
        (!prevLocalParticipant?.videoStream &&
          currentLocalParticipant?.videoStream) ||
        (prevLocalParticipant?.videoStream &&
          !currentLocalParticipant?.videoStream)
      ) {
        const event: ReportCallStatEventRequest['event'] = {
          oneofKind: 'mediaStateChanged',
          mediaStateChanged: {
            mediaType: MediaType.VIDEO,
            change: currentLocalParticipant?.videoStream
              ? MediaStateChange.STARTED
              : MediaStateChange.ENDED,
            reason: MediaStateChangeReason.CONNECTION,
            direction: MediaDirection.SEND,
          },
        };
        sendStatEvent(event);
      }
      if (prevLocalParticipant && currentLocalParticipant) {
        if (
          isPublishingTrackOfType(prevLocalParticipant, TrackType.AUDIO) !==
          isPublishingTrackOfType(currentLocalParticipant, TrackType.AUDIO)
        ) {
          const event: ReportCallStatEventRequest['event'] = {
            oneofKind: 'mediaStateChanged',
            mediaStateChanged: {
              mediaType: MediaType.AUDIO,
              change: isPublishingTrackOfType(
                currentLocalParticipant,
                TrackType.AUDIO,
              )
                ? MediaStateChange.ENDED
                : MediaStateChange.STARTED,
              reason: MediaStateChangeReason.MUTE,
              direction: MediaDirection.SEND,
            },
          };
          sendStatEvent(event);
        }
        if (
          isPublishingTrackOfType(prevLocalParticipant, TrackType.VIDEO) !==
          isPublishingTrackOfType(currentLocalParticipant, TrackType.VIDEO)
        ) {
          const event: ReportCallStatEventRequest['event'] = {
            oneofKind: 'mediaStateChanged',
            mediaStateChanged: {
              mediaType: MediaType.VIDEO,
              change: isPublishingTrackOfType(
                currentLocalParticipant,
                TrackType.VIDEO,
              )
                ? MediaStateChange.ENDED
                : MediaStateChange.STARTED,
              reason: MediaStateChangeReason.MUTE,
              direction: MediaDirection.SEND,
            },
          };
          sendStatEvent(event);
        }
      }
    });
};

const isPublishingTrackOfType = (
  participant: StreamVideoParticipant,
  type: TrackType,
) => participant.publishedTracks.includes(type);
