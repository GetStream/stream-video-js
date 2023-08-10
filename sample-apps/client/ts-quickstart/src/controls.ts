import { Call } from '@stream-io/video-client';

const renderAudioButton = (call: Call) => {
  const audioButton = document.createElement('button');

  audioButton.addEventListener('click', async () => {
    await call.microphone.toggle();
  });

  call.microphone.state.status$.subscribe((status) => {
    audioButton.innerText =
      status === 'enabled' ? 'Turn off mic' : 'Turn on mic';
  });

  return audioButton;
};

const renderVideoButton = (call: Call) => {
  const videoButton = document.createElement('button');

  videoButton.addEventListener('click', async () => {
    await call.camera.toggle();
  });

  call.camera.state.status$.subscribe((status) => {
    videoButton.innerText =
      status === 'enabled' ? 'Turn off camera' : 'Turn on camera';
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
