import { Call } from '@stream-io/video-client';

const renderAudioButton = (call: Call) => {
  const audioButton = document.createElement('button');
  audioButton.innerText = call.state.metadata?.settings.video.camera_default_on
    ? 'Turn off mic'
    : 'Turn on mic';

  audioButton.addEventListener('click', async () => {
    await call.microphone.toggle();
    audioButton.innerText =
      call.microphone.state.status === 'enabled'
        ? 'Turn off mic'
        : 'Turn on mic';
  });

  return audioButton;
};

const renderVideoButton = (call: Call) => {
  const videoButton = document.createElement('button');
  videoButton.innerText = call.state.metadata?.settings.audio.mic_default_on
    ? 'Turn off camera'
    : 'Turn on camera';

  videoButton.addEventListener('click', async () => {
    await call.camera.toggle();
    videoButton.innerText =
      call.camera.state.status === 'enabled'
        ? 'Turn off canera'
        : 'Turn on canera';
  });

  return videoButton;
};

const renderFlipButton = (call: Call) => {
  const flipButton = document.createElement('button');
  flipButton.innerText =
    call.camera.state.direction === 'front' ? 'Back camera' : 'Front camera';

  flipButton.addEventListener('click', async () => {
    await call.camera.flip();
    flipButton.innerText =
      call.camera.state.direction === 'front' ? 'Back camera' : 'Front camera';
  });

  return flipButton;
};

export const renderControls = (call: Call) => {
  return {
    audioButton: renderAudioButton(call),
    videoButton: renderVideoButton(call),
    flipButton: renderFlipButton(call),
  };
};
