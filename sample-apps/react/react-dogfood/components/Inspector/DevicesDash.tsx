import {
  Call,
  CameraManager,
  getAudioBrowserPermission,
  getAudioDevices,
  getVideoBrowserPermission,
  getVideoDevices,
  MicrophoneManager,
  useCall,
  useCallStateHooks,
  useObservableValue,
} from '@stream-io/video-react-sdk';
import clsx from 'clsx';
import { ReactNode, useMemo } from 'react';

export function DevicesDash() {
  const call = useCall();
  const videoProps = useVideoDevices();
  const audioProps = useAudioDevices();

  const optionallyWrap = (
    Wrapper: typeof WithCameraState | typeof WithMicrophoneState,
    children: (props?: {
      manager: CameraManager | MicrophoneManager;
      selectedDevice: string | undefined;
      isEnabled: boolean;
    }) => ReactNode,
  ) => (call ? <Wrapper call={call}>{children}</Wrapper> : children());

  return (
    <>
      <div className="rd__inspector-dash">
        <h3 data-copyable data-h>
          Video input devices
        </h3>
        {optionallyWrap(WithCameraState, (props) => (
          <SingleKindDevicesDash {...videoProps} {...props} />
        ))}
      </div>
      <div className="rd__inspector-dash">
        <h3 data-copyable data-h>
          Audio input devices
        </h3>
        {optionallyWrap(WithMicrophoneState, (props) => (
          <SingleKindDevicesDash {...audioProps} {...props} />
        ))}
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

function WithCameraState(props: {
  call: Call;
  children: (props: {
    manager: CameraManager;
    selectedDevice: string | undefined;
    isEnabled: boolean;
  }) => ReactNode;
}) {
  const { useCameraState } = useCallStateHooks();
  const { camera, selectedDevice, optimisticIsMute } = useCameraState();
  return props.children({
    manager: camera,
    selectedDevice,
    isEnabled: !optimisticIsMute,
  });
}

function WithMicrophoneState(props: {
  call: Call;
  children: (props: {
    manager: MicrophoneManager;
    selectedDevice: string | undefined;
    isEnabled: boolean;
  }) => ReactNode;
}) {
  const { useMicrophoneState } = useCallStateHooks();
  const { microphone, selectedDevice, optimisticIsMute } = useMicrophoneState();
  return props.children({
    manager: microphone,
    selectedDevice,
    isEnabled: !optimisticIsMute,
  });
}

function SingleKindDevicesDash(props: {
  devices: MediaDeviceInfo[] | undefined;
  hasBrowserPermission: boolean;
  manager?: CameraManager | MicrophoneManager;
  selectedDevice?: string | undefined;
  isEnabled?: boolean;
}) {
  if (!props.devices) {
    return <section>Awaiting permission 🟡</section>;
  }

  return (
    <>
      <section data-copyable>
        {props.hasBrowserPermission ? (
          <>Permission granted 🟢</>
        ) : (
          <>Permission denied 🔴</>
        )}
      </section>
      <section data-copyable hidden>
        {props.isEnabled ? 'Enabled' : 'Disabled'}
      </section>
      <ul>
        {props.devices.map((device) => (
          <li
            key={device.deviceId}
            className={clsx({
              'rd__inspector-device': true,
              'rd__inspector-device_active': props.manager,
            })}
            onClick={() => props.manager?.select(device.deviceId)}
            data-copy={`${device.deviceId} ${device.label}${device.deviceId === props.selectedDevice ? ' (selected)' : ''}`}
          >
            {device.label}
            {props.manager && (
              <div className="rd__dash-action-button">
                {device.deviceId === props.selectedDevice ? (
                  <span className="rd__inspector-device-checkmark">
                    selected
                  </span>
                ) : (
                  <span className="rd__inspector-device-select">select</span>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
      {props.manager && (
        <section>
          <button type="button" onClick={() => props.manager?.toggle()}>
            {props.isEnabled ? 'Disable' : 'Enable'}
          </button>
        </section>
      )}
    </>
  );
}
