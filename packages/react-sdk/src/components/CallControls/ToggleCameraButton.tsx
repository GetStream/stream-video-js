import * as React from 'react';
import { useLocalParticipant } from '@stream-io/video-react-bindings';
import { SfuModels } from '@stream-io/video-client';
import { CallControlsButton } from './CallControlsButton';
import { useVideoPublisher, VideoPublisherInit } from '../../hooks';

export type ToggleCameraButtonProps = VideoPublisherInit;

export const ToggleCameraButton = (props: ToggleCameraButtonProps) => {
  const localParticipant = useLocalParticipant();
  const isVideoMute = !localParticipant?.publishedTracks.includes(
    SfuModels.TrackType.VIDEO,
  );
  const publishVideoStream = useVideoPublisher(props);
  return (
    <CallControlsButton
      icon={isVideoMute ? 'camera-off' : 'camera'}
      onClick={() => {
        if (isVideoMute) {
          void publishVideoStream();
        } else {
          void props.call.stopPublish(SfuModels.TrackType.VIDEO);
        }
      }}
    />
  );
};
