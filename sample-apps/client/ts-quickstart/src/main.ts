import './style.css';
import { StreamVideoClient, User } from '@stream-io/video-client';
import { decode } from 'js-base64';
import { cleanupParticipant, renderParticipant } from './participant';
import { renderControls } from './controls';
import {
  renderAudioDeviceSelector,
  renderAudioOutputSelector,
  renderVideoDeviceSelector,
  renderVolumeControl,
} from './device-selector';
import { isMobile } from './mobile';

const searchParams = new URLSearchParams(window.location.search);
const extractPayloadFromToken = (token: string) => {
  const [, payload] = token.split('.');

  if (!payload) throw new Error('Malformed token, missing payload');

  return (JSON.parse(decode(payload)) ?? {}) as Record<string, unknown>;
};

const apiKey = import.meta.env.VITE_STREAM_API_KEY;
const token = searchParams.get('ut') ?? import.meta.env.VITE_STREAM_USER_TOKEN;
const user: User = {
  id: extractPayloadFromToken(token)['user_id'] as string,
};

const callId =
  searchParams.get('call_id') ||
  import.meta.env.VITE_STREAM_CALL_ID ||
  (new Date().getTime() + Math.round(Math.random() * 100)).toString();

const client = new StreamVideoClient({
  apiKey,
  token,
  user,
  options: { logLevel: import.meta.env.VITE_STREAM_LOG_LEVEL },
});
const call = client.call('default', callId);
call.join({ create: true }).then(async () => {
  // render mic and camera controls
  const controls = renderControls(call);
  const container = document.getElementById('call-controls')!;
  container.appendChild(controls.audioButton);
  container.appendChild(controls.videoButton);

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
});

window.addEventListener('beforeunload', () => {
  call.leave();
});

const parentContainer = document.getElementById('participants')!;
call.setViewport(parentContainer);

call.state.participants$.subscribe((participants) => {
  // render / update existing participants
  participants.forEach((participant) => {
    renderParticipant(call, participant, parentContainer);
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
