import { SfuModels, StreamVideoParticipant } from '@stream-io/video-client';
import React from 'react';
import { RTCView } from 'react-native-webrtc';

export type ParticipantAudioProps = {
  /**
   * When set to true, the audio stream will not be played even if it is available.
   */
  muteAudio?: boolean;
  /**
   * The participant whose info will be displayed.
   */
  participant: StreamVideoParticipant;
};

export const ParticipantAudio = ({
  muteAudio = false,
  participant,
}: ParticipantAudioProps) => {
  const { audioStream, publishedTracks } = participant;
  const isAudioMuted = !publishedTracks.includes(SfuModels.TrackType.AUDIO);

  const isAudioAvailable = !!audioStream && !isAudioMuted && !muteAudio;
  if (isAudioAvailable) {
    return <RTCView streamURL={audioStream.toURL()} />;
  }
  return null;
};
