import { useEffect, useState } from 'react';
import { createSoundDetector, SfuModels } from '@stream-io/video-client';
import { useLocalParticipant } from '@stream-io/video-react-bindings';

import { useMediaDevices } from '../../core';
import { Notification } from './Notification';
import { ChildrenOnly } from '../../types';

export const SpeakingWhileMutedNotification = ({ children }: ChildrenOnly) => {
  const localParticipant = useLocalParticipant();
  const { getAudioStream } = useMediaDevices();

  const isAudioMute = !localParticipant?.publishedTracks.includes(
    SfuModels.TrackType.AUDIO,
  );
  const audioDeviceId = localParticipant?.audioDeviceId;
  const [isSpeakingWhileMuted, setIsSpeakingWhileMuted] = useState(false);
  useEffect(() => {
    // do nothing when not muted
    if (!isAudioMute) return;
    const disposeSoundDetector = getAudioStream({
      deviceId: audioDeviceId,
    }).then((audioStream) =>
      createSoundDetector(audioStream, ({ isSoundDetected }) => {
        setIsSpeakingWhileMuted((isNotified) =>
          isNotified ? isNotified : isSoundDetected,
        );
      }),
    );
    disposeSoundDetector.catch((err) => {
      console.error('Error while creating sound detector', err);
    });
    return () => {
      disposeSoundDetector
        .then((dispose) => dispose())
        .catch((err) => {
          console.error('Error while disposing sound detector', err);
        });
      setIsSpeakingWhileMuted(false);
    };
  }, [audioDeviceId, getAudioStream, isAudioMute]);

  useEffect(() => {
    if (!isSpeakingWhileMuted) return;
    const timeout = setTimeout(() => {
      setIsSpeakingWhileMuted(false);
    }, 3500);
    return () => {
      clearTimeout(timeout);
      setIsSpeakingWhileMuted(false);
    };
  }, [isSpeakingWhileMuted]);
  return (
    <Notification
      message="You are muted. Unmute to speak."
      isVisible={isSpeakingWhileMuted}
    >
      {children}
    </Notification>
  );
};
