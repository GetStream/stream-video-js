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

const renderScreenShareButton = (call: Call) => {
  const screenShareButton = document.createElement('button');

  screenShareButton.addEventListener('click', async () => {
    await call.screenShare.toggle();
  });

  call.screenShare.state.status$.subscribe((status) => {
    screenShareButton.innerText =
      status === 'enabled' ? 'Turn off screen share' : 'Turn on screen share';
  });

  return screenShareButton;
};

const renderFlipButton = (call: Call) => {
  const flipButton = document.createElement('button');

  flipButton.addEventListener('click', async () => {
    await call.camera.flip();
  });

  call.camera.state.direction$.subscribe((direction) => {
    flipButton.innerText =
      direction === 'front' ? 'Back camera' : 'Front camera';
  });

  return flipButton;
};

export const renderControls = (call: Call) => {
  return {
    audioButton: renderAudioButton(call),
    videoButton: renderVideoButton(call),
    screenShareButton: renderScreenShareButton(call),
    flipButton: renderFlipButton(call),
  };
};
