import {MediaStream} from 'react-native-webrtc';
import {useCallback, useEffect, useState} from 'react';
import {Call} from '../modules/Call';
import {SfuEvent} from '../gen/video/sfu/event/events';

export const useMuteState = (
  userId: string,
  call: Call | undefined,
  mediaStream: MediaStream | undefined,
) => {
  const [isAudioMuted, setIsAudioMuted] = useState(
    () => mediaStream?.getAudioTracks().some(t => !t.enabled) ?? false,
  );
  const [isVideoMuted, setIsVideoMuted] = useState(
    () => mediaStream?.getVideoTracks().some(t => !t.enabled) ?? false,
  );

  const resetAudioAndVideoMuted = useCallback(() => {
    setIsAudioMuted(false);
    setIsVideoMuted(false);
  }, []);

  useEffect(() => {
    if (call) {
      const {unsubscribe} = call.on('muteStateChanged', (e: SfuEvent) => {
        if (e.eventPayload.oneofKind !== 'muteStateChanged') {
          return;
        }

        const muteState = e.eventPayload.muteStateChanged;
        if (userId === muteState.userId) {
          setIsAudioMuted(muteState.audioMuted);
          mediaStream?.getAudioTracks().forEach(t => {
            t.enabled = !muteState.audioMuted;
          });
          setIsVideoMuted(muteState.videoMuted);
          mediaStream?.getVideoTracks().forEach(t => {
            t.enabled = !muteState.videoMuted;
          });
        }
      });
      return unsubscribe;
    }
  }, [mediaStream, call, userId]);

  return {isAudioMuted, isVideoMuted, resetAudioAndVideoMuted};
};
