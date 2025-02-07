import './style.css';
import { CallingState, StreamVideoClient } from '@stream-io/video-client';
import { cleanupParticipant, renderParticipant } from './participant';
import { renderControls } from './controls';
import {
  renderAudioDeviceSelector,
  renderAudioOutputSelector,
  renderVideoDeviceSelector,
  renderVolumeControl,
} from './device-selector';
import { isMobile } from './mobile';
import { ClosedCaptionManager } from './closed-captions';

const ENVIRONMENT = 'demo';
const userId = 'luke';
const credentials = (await fetch(
  `https://pronto.getstream.io/api/auth/create-token?environment=${ENVIRONMENT}&user_id=${userId}`,
).then((res) => res.json())) as { apiKey: string; token: string };

const searchParams = new URLSearchParams(window.location.search);
const callId =
  searchParams.get('call_id') ||
  import.meta.env.VITE_STREAM_CALL_ID ||
  (new Date().getTime() + Math.round(Math.random() * 100)).toString();

const client = new StreamVideoClient({
  apiKey: credentials.apiKey,
  token: credentials.token,
  user: { id: userId, name: 'Luke' },
  options: { logLevel: 'debug' },
});

const call = client.call('default', callId);
await call.camera.enable();
await call.microphone.disableSpeakingWhileMutedNotification();
await call.microphone.enable();

// @ts-ignore
window.call = call;
// @ts-ignore
window.client = client;

call.screenShare.enableScreenShareAudio();
call.screenShare.setSettings({
  maxFramerate: 10,
  maxBitrate: 1500000,
});

const container = document.getElementById('call-controls')!;

// render mic and camera controls
const controls = renderControls(call);
container.appendChild(controls.leaveJoinCallButton);
container.appendChild(controls.audioButton);
container.appendChild(controls.videoButton);
container.appendChild(controls.screenShareButton);

container.appendChild(renderAudioDeviceSelector(call));

// render device selectors
if (isMobile.any()) {
  container.appendChild(controls.flipButton);
} else {
  container.appendChild(renderVideoDeviceSelector(call));
}

const audioOutputSelector = renderAudioOutputSelector(call);
if (audioOutputSelector) {
  container.appendChild(audioOutputSelector);
}

container.appendChild(renderVolumeControl(call));

// Closed caption controls
const closedCaptionManager = new ClosedCaptionManager(call);
container.appendChild(closedCaptionManager.renderToggleElement());

const captionContainer = document.getElementById('closed-captions');
captionContainer?.appendChild(closedCaptionManager.renderCaptionContainer());

call.join({ create: true });

window.addEventListener('beforeunload', () => {
  // Make sure to remove your event listeners when you leave a call
  closedCaptionManager?.cleanup();
  call.leave();
});

const screenShareContainer = document.getElementById('screenshare')!;
const parentContainer = document.getElementById('participants')!;
call.setViewport(parentContainer);

call.state.participants$.subscribe((participants) => {
  if (call.state.callingState === CallingState.LEFT) return;

  // render / update existing participants
  participants.forEach((participant) => {
    renderParticipant(call, participant, parentContainer, screenShareContainer);
  });

  // Remove stale elements for stale participants
  parentContainer
    .querySelectorAll<HTMLMediaElement>('video, audio')
    .forEach((el) => {
      const sessionId = el.dataset.sessionId!;
      const participant = participants.find((p) => p.sessionId === sessionId);
      if (!participant) {
        cleanupParticipant(sessionId);
        el.remove();
      }
    });
});
