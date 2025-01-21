import {
  SubscriptionChanges,
  useCall,
  useCallStateHooks,
} from '@stream-io/video-react-sdk';
import { useEffect } from 'react';

export function CodecDash() {
  const call = useCall();
  const { useCallStatsReport } = useCallStateHooks();
  const stats = useCallStatsReport();
  const publisherCodec = stats?.publisherStats.codec;
  const subscriberCodecs = stats?.subscriberStats.codecPerTrackType;

  useEffect(() => {
    if (call) {
      const participants = call.state.participants;
      // Force subscribe to video from all known participants.
      // Without that reporting received codecs is not very useful.
      const forceSubscriptions: SubscriptionChanges = {};
      for (const participant of participants) {
        forceSubscriptions[participant.sessionId] = {
          dimension: { width: 800, height: 600 },
        };
      }
      call.state.updateParticipantTracks('videoTrack', forceSubscriptions);
      call.dynascaleManager.applyTrackSubscriptions();
    }
  }, [call]);

  return (
    <div className="rd__inspector-dash">
      Codecs used:
      <ul>
        <li>Sending: {publisherCodec ?? '-'}</li>
        <li>
          Receiving:{' '}
          {subscriberCodecs && Object.keys(subscriberCodecs).length > 0
            ? Object.values(subscriberCodecs).join(', ')
            : '-'}
        </li>
      </ul>
    </div>
  );
}
