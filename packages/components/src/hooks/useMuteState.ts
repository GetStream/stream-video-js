import { useEffect, useState } from 'react';
import { Call } from '@stream-io/video-client-sfu';

// TODO OL: move into the shared state module
export const useMuteState = (call: Call, track?: MediaStreamTrack) => {
  const [isMute, setIsMute] = useState(false);
  useEffect(() => {
    if (!track) return;
    setIsMute(track.enabled && track.muted);

    const handleMute = () => setIsMute(true);
    const handleUnmute = () => setIsMute(false);
    track.addEventListener('mute', handleMute);
    track.addEventListener('unmute', handleUnmute);

    const offMuteStateChanged = call.on('muteStateChanged', (e) => {
      if (e.eventPayload.oneofKind !== 'muteStateChanged') return;
      const muteState = e.eventPayload.muteStateChanged;
      if (muteState.userId === call.currentUserId) {
        if (track.kind === 'audio') {
          setIsMute(muteState.audioMuted);
        } else if (track.kind === 'video') {
          setIsMute(muteState.videoMuted);
        }
      }
    });
    return () => {
      track.removeEventListener('mute', handleMute);
      track.removeEventListener('unmute', handleUnmute);
      offMuteStateChanged();
    };
  }, [track, call]);

  return isMute;
};
