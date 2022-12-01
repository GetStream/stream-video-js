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
import { pairwise } from 'rxjs';

const intervalMs = 15000;

/**
 * Collects stat metrics and events from the state store and sends them to the Coordinator API
 * @param readOnlyStateStore
 * @param sendStat
 * @param sendStatEvent
 */
export const reportStats = (
  readOnlyStateStore: StreamVideoReadOnlyStateStore,
  sendStat: (stats: Object) => Promise<ReportCallStatsResponse>,
  sendStatEvent: (
    statEvent: ReportCallStatEventRequest['event'],
  ) => Promise<ReportCallStatEventResponse>,
) => {
  reportPeriodicStats(readOnlyStateStore, sendStat);
  reportStatEvents(readOnlyStateStore, sendStatEvent);
};

const reportPeriodicStats = (
  readOnlyStateStore: StreamVideoReadOnlyStateStore,
  sendStat: (stats: Object) => Promise<ReportCallStatsResponse>,
) => {
  let rawStatReportIntervalId: any;
  readOnlyStateStore.activeCall$.subscribe((call) => {
    if (call) {
      rawStatReportIntervalId = setInterval(async () => {
        const stats = await Promise.all([
          call.getStats('subscriber'),
          call.getStats('publisher'),
        ]);

        for (const s of stats) {
          if (!s) {
            continue;
          }
          sendStat(s);
        }
      }, intervalMs);
    } else {
      if (rawStatReportIntervalId) {
        clearInterval(rawStatReportIntervalId);
        rawStatReportIntervalId = undefined;
      }
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
