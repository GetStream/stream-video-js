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

  flipButton.addEventListener('click', async () => {
    await call.camera.flip();
  });

  call.camera.state.direction$.subscribe((direction) => {
    flipButton.innerText =
      direction === 'front' ? 'Back camera' : 'Front camera';
  });

  return flipButton;
};

const renderCallLeaveButton = (call: Call) => {
  const leaveButton = document.createElement('button');

  leaveButton.addEventListener('click', async () => {
    try {
      await call.leave();
    } catch (err) {
      console.error(`Leave failed`, err);
    }
  });

  leaveButton.innerText = 'Leave call';

  return leaveButton;
};

const renderCallJoinButton = (call: Call) => {
  const joinButton = document.createElement('button');

  joinButton.addEventListener('click', async () => {
    await call.join();
  });

  joinButton.innerText = 'Join call';

  return joinButton;
};

export const renderControls = (call: Call) => {
  return {
    audioButton: renderAudioButton(call),
    videoButton: renderVideoButton(call),
    flipButton: renderFlipButton(call),
    leaveButton: renderCallLeaveButton(call),
    joinButton: renderCallJoinButton(call),
  };
};
