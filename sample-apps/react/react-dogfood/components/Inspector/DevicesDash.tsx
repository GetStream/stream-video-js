import { useCallStateHooks } from '@stream-io/video-react-sdk';

export function DevicesDash() {
  const { useCameraState, useMicrophoneState } = useCallStateHooks();
  const { hasBrowserPermission: hasCameraPermission, devices: videoDevices } =
    useCameraState();
  const {
    hasBrowserPermission: hasMicrophonePermission,
    devices: audioDevices,
  } = useMicrophoneState();

  return (
    <>
      Camera:
      <SingleKindDevicesDash
        hasPermission={hasCameraPermission}
        devices={videoDevices}
      />
      Microphone:
      <SingleKindDevicesDash
        hasPermission={hasMicrophonePermission}
        devices={audioDevices}
      />
    </>
  );
}

function SingleKindDevicesDash(props: {
  hasPermission: boolean;
  devices: MediaDeviceInfo[];
}) {
  if (!props.devices) {
    return;
  }

  return (
    <>
      {props.hasPermission ? <>Permission granted</> : <>Permission denied</>}
      <ul>
        {props.devices.map((device) => (
          <li key={device.deviceId}>{device.label}</li>
        ))}
      </ul>
    </>
  );
}
