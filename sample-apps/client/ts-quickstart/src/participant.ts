import { Call, StreamVideoParticipant } from '@stream-io/video-client';

// The quickstart uses fixed video dimensions for simplification
const videoDimension = {
  width: 333,
  height: 250,
};

const videoBindingsCache = new Map<string, Function | undefined>();
const videoTrackingCache = new Map<string, Function | undefined>();
const audioBindingsCache = new Map<string, Function | undefined>();

const renderVideo = (
  call: Call,
  participant: StreamVideoParticipant,
  parentContainer: HTMLElement,
) => {
  const id = `video-${participant.sessionId}`;
  let videoEl = document.getElementById(id) as HTMLVideoElement | null;
  if (!videoEl) {
    videoEl = document.createElement('video');
    videoEl.style.setProperty('object-fit', 'contain');
    videoEl.id = `video-${participant.sessionId}`;
    videoEl.muted = true;
    videoEl.width = videoDimension.width;
    videoEl.height = videoDimension.height;
    videoEl.dataset.sessionId = participant.sessionId;

    parentContainer.appendChild(videoEl);

    const untrack = call.trackElementVisibility(
      videoEl,
      participant.sessionId,
      'videoTrack',
    );

    // keep reference to untrack function to call it later
    videoTrackingCache.set(id, untrack);

    // registers subscription updates and stream changes
    const unbind = call.bindVideoElement(
      videoEl,
      participant.sessionId,
      'videoTrack',
    );

    // keep reference to unbind function to call it later
    videoBindingsCache.set(id, unbind);
  }
};

const renderAudio = (
  call: Call,
  participant: StreamVideoParticipant,
  parentContainer: HTMLElement,
) => {
  // We don't render audio for local participant
  if (participant.isLocalParticipant) return;

  const id = `audio-${participant.sessionId}`;
  let audioEl = document.getElementById(id) as HTMLAudioElement | null;
  if (!audioEl) {
    audioEl = document.createElement('audio');
    audioEl.id = id;
    audioEl.dataset.sessionId = participant.sessionId;

    parentContainer.appendChild(audioEl);

    // registers subscription updates and stream changes for audio
    const unbind = call.bindAudioElement(audioEl, participant.sessionId);

    // keep reference to unbind function to call it later
    audioBindingsCache.set(id, unbind);
  }
};

export const renderParticipant = (
  call: Call,
  participant: StreamVideoParticipant,
  parentContainer: HTMLElement,
) => {
  renderAudio(call, participant, parentContainer);
  renderVideo(call, participant, parentContainer);
};

export const cleanupParticipant = (sessionId: string) => {
  const unbindVideo = videoBindingsCache.get(`video-${sessionId}`);
  if (unbindVideo) {
    unbindVideo();
    videoBindingsCache.delete(`video-${sessionId}`);
  }

  const untrackVideo = videoTrackingCache.get(`video-${sessionId}`);
  if (untrackVideo) {
    untrackVideo();
    videoTrackingCache.delete(`video-${sessionId}`);
  }

  const unbindAudio = audioBindingsCache.get(`audio-${sessionId}`);
  if (unbindAudio) {
    unbindAudio();
    audioBindingsCache.delete(`audio-${sessionId}`);
  }
};
