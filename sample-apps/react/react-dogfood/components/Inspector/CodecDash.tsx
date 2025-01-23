import {
  Call,
  SubscriptionChanges,
  useCall,
  useCallStateHooks,
} from '@stream-io/video-react-sdk';
import { useEffect, useState } from 'react';

export function CodecDash() {
  const call = useCall();
  const { useCallStatsReport, useParticipantCount, useCameraState } =
    useCallStateHooks();
  const { camera, isEnabled: isCameraEnabled } = useCameraState();
  const stats = useCallStatsReport();
  const publisherCodec = stats?.publisherStats.codec;
  const subscriberCodecs = stats?.subscriberStats.codec;
  const participantCount = useParticipantCount();
  const [subscriptionCount, setSubscriptionCount] = useState(0);

  const forceSubscriptions = (_call: Call) => {
    const participants = _call.state.remoteParticipants;
    // Force subscribe to video from all known participants.
    // Without that reporting received codecs is not very useful.
    const changes: SubscriptionChanges = {};
    for (const participant of participants) {
      changes[participant.sessionId] = {
        dimension: { width: 800, height: 600 },
      };
    }
    _call.state.updateParticipantTracks('videoTrack', changes);
    _call.dynascaleManager.applyTrackSubscriptions();
    setSubscriptionCount(participants.length);
  };

  useEffect(() => {
    if (call) {
      forceSubscriptions(call);
    }
  }, [call]);

  return (
    <div className="rd__inspector-dash">
      <h3>Codecs in use</h3>
      <dl>
        <dt>
          Publishing
          <button
            className="rd__dash-action-button"
            type="button"
            onClick={() => camera.toggle()}
          >
            {isCameraEnabled ? 'Disable' : 'Enable'} camera
          </button>
        </dt>
        <dd>{publisherCodec || '-'}</dd>

        <dt>
          Subscriptions ({subscriptionCount}/{participantCount - 1})
          <button
            className="rd__dash-action-button"
            type="button"
            onClick={() => call && forceSubscriptions(call)}
          >
            Sub. to all
          </button>
        </dt>
        <dd>{subscriberCodecs || '-'}</dd>
      </dl>
    </div>
  );
}
