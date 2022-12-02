import { StreamVideoReadOnlyStateStore2 } from '../store';
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

/**
 * Collects stat metrics and events from the state store and sends them to the Coordinator API
 * @param readOnlyStateStore
 * @param sendStatMetrics
 * @param sendStatEvent
 */
export const reportStats = (
  readOnlyStateStore: StreamVideoReadOnlyStateStore2,
  sendStatMetrics: (stats: Object) => Promise<ReportCallStatsResponse>,
  sendStatEvent: (
    statEvent: ReportCallStatEventRequest['event'],
  ) => Promise<ReportCallStatEventResponse>,
) => {
  reportStatMetrics(readOnlyStateStore, sendStatMetrics);
  reportStatEvents(readOnlyStateStore, sendStatEvent);
};

const reportStatMetrics = (
  readOnlyStateStore: StreamVideoReadOnlyStateStore2,
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
  store: StreamVideoReadOnlyStateStore2,
  sendStatEvent: (
    statEvent: ReportCallStatEventRequest['event'],
  ) => Promise<ReportCallStatEventResponse>,
) => {
  store.localParticipant$
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
        if (prevLocalParticipant.audio !== currentLocalParticipant.audio) {
          const event: ReportCallStatEventRequest['event'] = {
            oneofKind: 'mediaStateChanged',
            mediaStateChanged: {
              mediaType: MediaType.AUDIO,
              change: currentLocalParticipant.audio
                ? MediaStateChange.ENDED
                : MediaStateChange.STARTED,
              reason: MediaStateChangeReason.MUTE,
              direction: MediaDirection.SEND,
            },
          };
          sendStatEvent(event);
        }
        if (prevLocalParticipant.video !== currentLocalParticipant.video) {
          const event: ReportCallStatEventRequest['event'] = {
            oneofKind: 'mediaStateChanged',
            mediaStateChanged: {
              mediaType: MediaType.VIDEO,
              change: currentLocalParticipant?.video
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
