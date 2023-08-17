import { StreamVideoParticipant, Call } from '@stream-io/video-client';

// The quickstart uses fixed video dimensions for simplification
const videoDimension = {
  width: 333,
  height: 250,
};

const map = new Map<string, HTMLVideoElement>();

const renderVideo = (call: Call, participant: StreamVideoParticipant) => {
  const id = `video-${participant.sessionId}`;

  let videoEl = (document.getElementById(id) ??
    map.get(id)) as HTMLVideoElement | null;

  if (!videoEl) {
    videoEl = document.createElement('video');
    videoEl.style.setProperty('object-fit', 'contain');
    videoEl.id = `video-${participant.sessionId}`;
    videoEl.width = videoDimension.width;
    videoEl.height = videoDimension.height;

    // simple memoization map to reuse video elements later
    map.set(id, videoEl);

    // registers subscription updates and stream changes
    call.registerVideoElement(videoEl, 'video', participant.sessionId);
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
