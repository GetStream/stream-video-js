import { SfuModels, StreamVideoParticipant } from '@stream-io/video-client';
import React from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { useMediaStreamManagement } from '../../providers';
import { Z_INDEX } from '../../constants';
import { ParticipantVideoType, ParticipantViewProps } from './ParticipantView';
import { VideoRenderer } from '../utility/internal/VideoRenderer';
import { ParticipantVideoPlaceholder as DefaultParticipantVideoPlaceholder } from './ParticipantVideoPlaceholder';

/**
 * Props to be passed for the Participant component.
 */
export type ParticipantVideoProps = Pick<
  ParticipantViewProps,
  'ParticipantVideoPlaceholder'
> & {
  /**
   * The participant whose info will be displayed.
   */
  participant: StreamVideoParticipant;
  /**
   * When set to false, the video stream will not be displayed even if it is available.
   */
  isVideoVisible?: boolean;
  /**
   * The video kind that will be displayed.
   * @types `screen` or `video`
   */
  videoMode: ParticipantVideoType;
  /**
   * Any custom style to be merged with the VideoRenderer
   */
  videoRendererStyle?: StyleProp<ViewStyle>;
};

/**
 * A component that renders the participants' video track or screenShare track
 * and additional info. By an absence of a video track or when muteVideo is truthy,
 * only an avatar and audio track will be rendered.
 */
export const ParticipantVideo = ({
  isVideoVisible = true,
  participant,
  videoMode,
  videoRendererStyle,
  ParticipantVideoPlaceholder = DefaultParticipantVideoPlaceholder,
}: ParticipantVideoProps) => {
  const {
    isLocalParticipant,
    videoStream,
    screenShareStream,
    publishedTracks,
  } = participant;
  const { isCameraOnFrontFacingMode } = useMediaStreamManagement();
  const isScreenSharing = videoMode === 'screen';
  const videoStreamToRender = isScreenSharing ? screenShareStream : videoStream;
  const hasScreenShareTrack = publishedTracks.includes(
    SfuModels.TrackType.SCREEN_SHARE,
  );
  const isParticipantVideoMuted = !publishedTracks.includes(
    SfuModels.TrackType.VIDEO,
  );

  const hasVideoTrack = isScreenSharing
    ? hasScreenShareTrack
    : !isParticipantVideoMuted;
  const canShowVideo = !!videoStream && isVideoVisible && hasVideoTrack;
  const mirror = isLocalParticipant && isCameraOnFrontFacingMode;

  if (canShowVideo) {
    return (
      <VideoRenderer
        // zOrder should lower than the zOrder used in the floating LocalParticipantView
        zOrder={Z_INDEX.IN_BACK}
        mirror={mirror}
        mediaStream={videoStreamToRender}
        objectFit={isScreenSharing ? 'contain' : 'cover'}
        style={[StyleSheet.absoluteFill, videoRendererStyle]}
      />
    );
  }

  return <ParticipantVideoPlaceholder participant={participant} />;
};
