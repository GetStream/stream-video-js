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
import { ReactNode, useMemo, useState } from 'react';

type TestResult = {
  capturesAudio: boolean;
  tested: boolean;
};

export function DevicesDash() {
  const call = useCall();
  const videoProps = useVideoDevices();
  const audioProps = useAudioDevices();
  const [micTestResults, setMicTestResults] = useState<
    Record<string, TestResult>
  >({});
  const [testingDeviceId, setTestingDeviceId] = useState<string | null>(null);

  const handleTestMicrophone = async (
    deviceId: string,
    manager?: MicrophoneManager,
  ) => {
    if (!manager || testingDeviceId) return;
    setTestingDeviceId(deviceId);

    try {
      const capturesAudio = await manager.performTest(deviceId);
      setMicTestResults((prev) => ({
        ...prev,
        [deviceId]: { capturesAudio, tested: true },
      }));
    } catch (error) {
      console.error(`Failed to test microphone ${deviceId}:`, error);
      setMicTestResults((prev) => ({
        ...prev,
        [deviceId]: { capturesAudio: false, tested: true },
      }));
    } finally {
      setTestingDeviceId(null);
    }
  };

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
        {optionallyWrap(WithMicrophoneState, (wrappedProps) => (
          <SingleKindDevicesDash
            {...audioProps}
            {...wrappedProps}
            testResults={micTestResults}
            testingDeviceId={testingDeviceId}
            onTestDevice={
              wrappedProps?.manager instanceof MicrophoneManager
                ? (deviceId) =>
                    handleTestMicrophone(
                      deviceId,
                      wrappedProps.manager as MicrophoneManager,
                    )
                : undefined
            }
          />
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
  testResults?: Record<string, TestResult>;
  testingDeviceId?: string | null;
  onTestDevice?: (deviceId: string) => void;
}) {
  if (!props.devices) {
    return <section>Awaiting permission 🟡</section>;
  }

  const getTestResult = (deviceId: string) => props.testResults?.[deviceId];

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
        {props.devices.map((device) => {
          const testResult = getTestResult(device.deviceId);
          const isTesting = props.testingDeviceId === device.deviceId;

          return (
            <li
              key={device.deviceId}
              className={clsx({
                'rd__inspector-device': true,
                'rd__inspector-device_active': props.manager,
              })}
              data-copy={`${device.deviceId} ${device.label}${device.deviceId === props.selectedDevice ? ' (selected)' : ''}${testResult ? ` (${testResult.capturesAudio ? 'captures audio' : 'no audio detected'})` : ''}`}
            >
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  flex: 1,
                }}
              >
                {props.onTestDevice && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      props.onTestDevice?.(device.deviceId);
                    }}
                    disabled={isTesting || !!props.testingDeviceId}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor:
                        isTesting || props.testingDeviceId
                          ? 'not-allowed'
                          : 'pointer',
                      padding: '4px',
                      fontSize: '16px',
                      opacity: isTesting || props.testingDeviceId ? 0.5 : 1,
                    }}
                    title={isTesting ? 'Testing...' : 'Test microphone'}
                  >
                    {isTesting ? '⏳' : '🎤'}
                  </button>
                )}
                <span
                  onClick={() => props.manager?.select(device.deviceId)}
                  style={{
                    cursor: props.manager ? 'pointer' : 'default',
                    flex: 1,
                  }}
                >
                  {device.label}
                  {testResult && (
                    <span
                      style={{ marginLeft: '8px' }}
                      title={
                        testResult.capturesAudio
                          ? 'Audio detected'
                          : 'No audio detected'
                      }
                    >
                      {testResult.capturesAudio ? '✅' : '⚠️'}
                    </span>
                  )}
                </span>
              </span>
              {props.manager && (
                <span className="rd__dash-action-button">
                  {device.deviceId === props.selectedDevice ? (
                    <span className="rd__inspector-device-checkmark">
                      selected
                    </span>
                  ) : (
                    <span className="rd__inspector-device-select">select</span>
                  )}
                </span>
              )}
            </li>
          );
        })}
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
