import {
  createCallControlHandler,
  PropsWithErrorHandler,
} from '../../utilities/callControlHandler';
import { DeviceSelector } from './DeviceSelector';
import { useCallStateHooks } from '@stream-io/video-react-bindings';

export type DeviceSelectorVideoProps = PropsWithErrorHandler<{
  title?: string;
  visualType?: 'list' | 'dropdown';
}>;

export const DeviceSelectorVideo = (props: DeviceSelectorVideoProps) => {
  const { useCameraState } = useCallStateHooks();
  const { camera, devices, selectedDevice } = useCameraState();
  const handleChange = createCallControlHandler(
    props,
    async (deviceId: string) => {
      await camera.select(deviceId);
    },
  );

  return (
    <DeviceSelector
      devices={devices || []}
      type="videoinput"
      selectedDeviceId={selectedDevice}
      onChange={handleChange}
      title={props.title}
      visualType={props.visualType}
      icon="camera"
    />
  );
};
