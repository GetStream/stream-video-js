import { MediaStream } from 'react-native-webrtc';
import { useEffect, useState } from 'react';
import { SfuEvent } from '@stream-io/video-client/dist/src/gen/video/sfu/event/events';
import { Call } from '@stream-io/video-client';

export const useMuteState = (
  userId: string | undefined,
  call: Call | undefined,
  mediaStream: MediaStream | undefined,
) => {
  const [isAudioMuted, setIsAudioMuted] = useState(
    () => mediaStream?.getAudioTracks().some((t) => !t.enabled) ?? false,
  );
  const [isVideoMuted, setIsVideoMuted] = useState(
    () => mediaStream?.getVideoTracks().some((t) => !t.enabled) ?? false,
  );

  useEffect(() => {
    if (call) {
      return call.on('muteStateChanged', (e: SfuEvent) => {
        if (e.eventPayload.oneofKind !== 'muteStateChanged') {
          return;
        }

        const muteState = e.eventPayload.muteStateChanged;
        if (userId === muteState.userId) {
          setIsAudioMuted(muteState.audioMuted);
          mediaStream?.getAudioTracks().forEach((t) => {
            t.enabled = !muteState.audioMuted;
          });
          setIsVideoMuted(muteState.videoMuted);
          mediaStream?.getVideoTracks().forEach((t) => {
            t.enabled = !muteState.videoMuted;
          });
        }
      });
    }
  }, [mediaStream, call, userId]);

  return { isAudioMuted, isVideoMuted };
};
