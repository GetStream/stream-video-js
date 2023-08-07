import { Call } from '@stream-io/video-client';

export const renderAudioDeviceSelector = (call: Call) => {
  const element = document.createElement('select');
  element.addEventListener('change', (e) => {
    call.microphone.select(e?.target?.value);
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
    call.camera.select(e?.target?.value);
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
