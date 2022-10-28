import {
  Call,
  CallMeta,
  MediaDirection,
  MediaType,
  ReportCallStatEventRequest,
  StatEvent,
  StatEventListener,
  StreamVideoClient,
  Timestamp,
} from '@stream-io/video-client';
import { useEffect } from 'react';

export interface StatsProps {
  client: StreamVideoClient;
  call: Call;
  activeCall: CallMeta.Call;
}

const intervalMs = 15000;

const getStats = (stats: RTCStatsReport) => {
  const s: Record<string, any> = {};
  stats.forEach((v) => {
    s[v.id] = v;
  });

  return new TextEncoder().encode(JSON.stringify(s));
};

const makeStatEvent = (
  e: StatEvent,
): ReportCallStatEventRequest['event'] | undefined => {
  switch (e.type) {
    case 'track_changed': {
      const { change, reason, track } = e;
      const mediaTypes: Record<MediaStreamTrack['kind'], MediaType> = {
        audio: MediaType.AUDIO,
        video: MediaType.VIDEO,
      };
      return {
        oneofKind: 'mediaStateChanged',
        mediaStateChanged: {
          change,
          reason,
          mediaType: mediaTypes[track.kind],
          direction: MediaDirection.SEND,
        },
      };
    }
    case 'participant_joined':
      return {
        oneofKind: 'participantConnected',
        participantConnected: {},
      };
    case 'participant_left':
      return {
        oneofKind: 'participantDisconnected',
        participantDisconnected: {},
      };
    default:
      return undefined;
  }
};

export const Stats = ({ client, call, activeCall }: StatsProps) => {
  useEffect(() => {
    const intervalId = setInterval(async () => {
      const stats = await Promise.all([
        call.getStats('subscriber'),
        call.getStats('publisher'),
      ]);

      for (const s of stats) {
        if (!s) continue;
        await client.reportCallStats({
          callCid: activeCall.callCid,
          statsJson: getStats(s),
        });
      }
    }, intervalMs);

    return () => {
      clearInterval(intervalId);
    };
  }, [activeCall.callCid, call, client]);

  useEffect(() => {
    const handleStatEvent: StatEventListener = (e) => {
      const event = makeStatEvent(e);
      if (event) {
        client.reportCallStatEvent({
          callCid: activeCall.callCid,
          timestamp: Timestamp.fromDate(new Date()),
          event,
        });
      }
    };

    call.onStatEvent(handleStatEvent);
    return () => call.offStatEvent(handleStatEvent);
  }, [activeCall.callCid, call, client]);

  return null;
};
