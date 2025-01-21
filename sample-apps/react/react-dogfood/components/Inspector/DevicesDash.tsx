import {
  Call,
  InputMediaDeviceManager,
  InputMediaDeviceManagerState,
  useObservableValue,
  useStreamVideoClient,
} from '@stream-io/video-react-sdk';
import { useMemo } from 'react';

export function DevicesDash() {
  const call = useFakeCall();

  return (
    <>
      <div className="rd__inspector-dash">
        Camera: <SingleKindDevicesDash manager={call.camera} />
      </div>
      <div className="rd__inspector-dash">
        Microphone: <SingleKindDevicesDash manager={call.microphone} />
      </div>
    </>
  );
}

function useFakeCall(): Call {
  const client = useStreamVideoClient();

  if (!client) {
    throw new Error('Cannot use fake call without video client');
  }

  // This fake call is only used as a way to access camera and microphone manager.
  // It's should never be fetched, created or joined.
  const call = useMemo(
    () => client.call('fake-call-type', 'fake-call-id'),
    [client],
  );

  return call;
}

function SingleKindDevicesDash(props: {
  manager: InputMediaDeviceManager<InputMediaDeviceManagerState>;
}) {
  const devices$ = useMemo(() => props.manager.listDevices(), [props.manager]);
  const devices = useObservableValue(devices$, []);
  const hasBrowserPermission = useObservableValue(
    props.manager.state.hasBrowserPermission$,
  );

  if (!devices) {
    return <>Awaiting permission</>;
  }

  return (
    <>
      {hasBrowserPermission ? <>Permission granted</> : <>Permission denied</>}
      <ul>
        {devices.map((device) => (
          <li key={device.deviceId}>{device.label}</li>
        ))}
      </ul>
    </>
  );
}
