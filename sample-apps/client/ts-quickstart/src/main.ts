import './style.css';
import { StreamVideoClient, User } from '@stream-io/video-client';
import { renderParticipant } from './participant';
import { renderControls } from './controls';
import {
  renderAudioDeviceSelector,
  renderVideoDeviceSelector,
} from './device-selector';

const apiKey = import.meta.env.VITE_STREAM_API_KEY;
const token = import.meta.env.VITE_STREAM_USER_TOKEN;
const user: User = { id: import.meta.env.VITE_STREAM_USER_ID };

const client = new StreamVideoClient({
  apiKey,
  token,
  user,
});

const callId = (
  new Date().getTime() + Math.round(Math.random() * 100)
).toString();
const call = client.call('default', callId);

call.join({ create: true }).then(async () => {
  // publish audio and video based on backend settings
  if (call.state.metadata?.settings.video.camera_default_on) {
    call.camera.enable();
  }
  if (call.state.metadata?.settings.audio.mic_default_on) {
    call.microphone.enable();
  }

  // render mic and camera controls
  const controls = renderControls(call);
  const container = document.getElementById('call-controls')!;
  container.appendChild(controls.audioButton);
  container.appendChild(controls.videoButton);

  // render device selectors
  container.appendChild(renderAudioDeviceSelector(call));
  container.appendChild(renderVideoDeviceSelector(call));
  // TODO: render camera flip on mobile devices
  // container.appendChild(controls.flipButton);
});

window.addEventListener('beforeunload', () => {
  call.leave();
});

const parentContainer = document.getElementById('participants')!;

call.state.participants$.subscribe((participants) => {
  const participantElements = participants.map((participant) =>
    renderParticipant(call, participant),
  );

  // Update UI
  parentContainer.innerHTML = '';
  participantElements
    .flatMap((e) => [e.audioEl, e.videoEl])
    .filter((el) => !!el)
    .forEach((el) => {
      parentContainer.appendChild(el!);
    });
});
