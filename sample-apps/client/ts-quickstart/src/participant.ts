import {
  StreamVideoParticipant,
  Call,
  SfuModels,
} from '@stream-io/video-client';

// The quickstart uses fixed video dimensions for simplification
const videoDimension = {
  width: 333,
  height: 250,
};

const renderVideo = (call: Call, participant: StreamVideoParticipant) => {
  let videoEl = document.getElementById(
    `video-${participant.sessionId}`,
  ) as HTMLVideoElement | null;

  if (!videoEl) {
    videoEl = document.createElement('video');
    videoEl.style.setProperty('object-fit', 'contain');
    videoEl.id = `video-${participant.sessionId}`;
    videoEl.width = videoDimension.width;
    videoEl.height = videoDimension.height;
    videoEl.playsInline = true;
    videoEl.autoplay = true;
  }
  if (videoEl.srcObject !== participant.videoStream) {
    videoEl.srcObject = participant.videoStream || null;
  }
  if (
    !participant.isLocalParticipant &&
    participant.publishedTracks.includes(SfuModels.TrackType.VIDEO) &&
    !participant.videoDimension
  ) {
    // We need to subscribe to video tracks
    // We provide the rendered video dimension to save bandwidth
    call.updateSubscriptionsPartial('video', {
      [participant.sessionId]: {
        dimension: {
          width: videoDimension.width,
          height: videoDimension.height,
        },
      },
    });
  }

  return videoEl;
};

const renderAudio = (participant: StreamVideoParticipant) => {
  // We don't render audio for local participant
  if (participant.isLocalParticipant) {
    return null;
  }

  let audioEl = document.getElementById(
    `audio-${participant.sessionId}`,
  ) as HTMLAudioElement | null;

  if (!audioEl) {
    audioEl = document.createElement('audio');
    audioEl.id = `audio-${participant.sessionId}`;
    audioEl.autoplay = true;
  }

  if (audioEl.srcObject !== participant.audioStream) {
    audioEl.srcObject = participant.audioStream || null;
  }

  return audioEl;
};

export const renderParticipant = (
  call: Call,
  participant: StreamVideoParticipant,
) => {
  return {
    audioEl: renderAudio(participant),
    videoEl: renderVideo(call, participant),
  };
};
