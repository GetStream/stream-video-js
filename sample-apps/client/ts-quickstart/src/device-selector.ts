import { Call } from '@stream-io/video-client';

export const renderAudioDeviceSelector = (call: Call) => {
  const element = document.createElement('select');
  element.addEventListener('change', (e) => {
    const target = e.target as HTMLSelectElement;
    call.microphone.select(target.value);
  });

  call.microphone.listDevices().subscribe({
    next: (devices) => {
      element.innerHTML = '';
      devices.forEach((device) => {
        const option = document.createElement('option');
        option.value = device.deviceId;
        option.innerText = device.label;
        element.appendChild(option);
      });
    },
    error: (error) => alert(`Can't list devices ${error}`),
  });

  return element;
};

export const renderVideoDeviceSelector = (call: Call) => {
  const element = document.createElement('select');
  element.addEventListener('change', (e) => {
    const target = e.target as HTMLSelectElement;
    call.camera.select(target.value);
  });

  call.camera.listDevices().subscribe({
    next: (devices) => {
      element.innerHTML = '';
      devices.forEach((device) => {
        const option = document.createElement('option');
        option.value = device.deviceId;
        option.innerText = device.label;
        element.appendChild(option);
      });
    },
    error: (error) => alert(`Can't list devices ${error}`),
  });

  return element;
};

export const renderAudioOutputSelector = (call: Call) => {
  if (!call.speaker.state.isDeviceSelectionSupported) {
    return;
  }
  const element = document.createElement('select');
  element.addEventListener('change', (e) => {
    const target = e.target as HTMLSelectElement;
    call.speaker.select(target.value);
  });

  call.speaker.listDevices().subscribe({
    next: (devices) => {
      element.innerHTML = '';
      devices.forEach((device) => {
        const option = document.createElement('option');
        option.value = device.deviceId;
        option.innerText = device.label;
        element.appendChild(option);
      });
    },
    error: (error) => alert(`Can't list devices ${error}`),
  });

  return element;
};

export const renderVolumeControl = (call: Call) => {
  const element = document.createElement('input') as HTMLInputElement;
  element.type = 'range';
  element.min = 0;
  element.max = 1;
  element.step = 0.1;

  element.addEventListener('change', (event) => {
    call.speaker.setVolume((event.target as any).value);
  });

  call.speaker.state.volume$.subscribe((volume) => {
    element.value = volume || 0;
  });

  return element;
};
