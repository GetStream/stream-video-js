import * as React from 'react';
import { Button } from './Button';
import { AudioPublisherInit, useAudioPublisher } from '../../hooks';
import { useLocalParticipant } from '@stream-io/video-react-bindings';
import { SfuModels } from '@stream-io/video-client';

export type ToggleAudioButtonProps = AudioPublisherInit;

export const ToggleAudioButton = (props: ToggleAudioButtonProps) => {
  const publishAudioStream = useAudioPublisher(props);
  const localParticipant = useLocalParticipant();
  const isAudioMute = !localParticipant?.publishedTracks.includes(
    SfuModels.TrackType.AUDIO,
  );
  return (
    <Button
      icon={isAudioMute ? 'mic-off' : 'mic'}
      onClick={() => {
        if (isAudioMute) {
          void publishAudioStream();
        } else {
          void props.call.stopPublish(SfuModels.TrackType.AUDIO);
        }
      }}
    />
  );
};
