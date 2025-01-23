import {
  getAudioBrowserPermission,
  getAudioDevices,
  getVideoBrowserPermission,
  getVideoDevices,
  useObservableValue,
} from '@stream-io/video-react-sdk';
import { useMemo } from 'react';

export function DevicesDash() {
  const videoProps = useVideoDevices();
  const audioProps = useAudioDevices();

  return (
    <>
      <div className="rd__inspector-dash">
        <h3>Video input devices</h3>
        <SingleKindDevicesDash {...videoProps} />
      </div>
      <div className="rd__inspector-dash">
        <h3>Audio input devices</h3>
        <SingleKindDevicesDash {...audioProps} />
      </div>
    </>
  );
}

function useVideoDevices() {
  const devices$ = useMemo(() => getVideoDevices(), []);
  const permission$ = useMemo(
    () => getVideoBrowserPermission().asObservable(),
    [],
  );

  return {
    devices: useObservableValue(devices$, []),
    hasBrowserPermission: useObservableValue(permission$),
  };
}

function useAudioDevices() {
  const devices$ = useMemo(() => getAudioDevices(), []);
  const permission$ = useMemo(
    () => getAudioBrowserPermission().asObservable(),
    [],
  );

  return {
    devices: useObservableValue(devices$, []),
    hasBrowserPermission: useObservableValue(permission$),
  };
}

function SingleKindDevicesDash(props: {
  devices: MediaDeviceInfo[] | undefined;
  hasBrowserPermission: boolean;
}) {
  if (!props.devices) {
    return (
      <div className="rd__inspector-permission">Awaiting permission 🟡</div>
    );
  }

  return (
    <>
      <div className="rd__inspector-permission">
        {props.hasBrowserPermission ? (
          <>Permission granted 🟢</>
        ) : (
          <>Permission denied 🔴</>
        )}
      </div>
      <ul>
        {props.devices.map((device) => (
          <li key={device.deviceId}>{device.label}</li>
        ))}
      </ul>
    </>
  );
}
