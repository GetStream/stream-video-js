import { useCallStateHooks } from '@stream-io/video-react-bindings';
import { DeviceSelector } from './DeviceSelector';
import {
  createCallControlHandler,
  PropsWithErrorHandler,
} from '../../utilities/callControlHandler';

export type DeviceSelectorAudioInputProps = PropsWithErrorHandler<{
  title?: string;
  visualType?: 'list' | 'dropdown';
}>;

export const DeviceSelectorAudioInput = (
  props: DeviceSelectorAudioInputProps,
) => {
  const { useMicrophoneState } = useCallStateHooks();
  const { microphone, selectedDevice, devices } = useMicrophoneState();
  const handleChange = createCallControlHandler(
    props,
    async (deviceId: string) => {
      await microphone.select(deviceId);
    },
  );

  return (
    <DeviceSelector
      devices={devices || []}
      selectedDeviceId={selectedDevice}
      type="audioinput"
      onChange={handleChange}
      title={props.title}
      visualType={props.visualType}
      icon="mic"
    />
  );
};

export type DeviceSelectorAudioOutputProps = {
  title?: string;
  visualType?: 'list' | 'dropdown';
};

export const DeviceSelectorAudioOutput = ({
  title,
  visualType,
}: DeviceSelectorAudioOutputProps) => {
  const { useSpeakerState } = useCallStateHooks();
  const { speaker, selectedDevice, devices, isDeviceSelectionSupported } =
    useSpeakerState();

  if (!isDeviceSelectionSupported) return null;

  return (
    <DeviceSelector
      devices={devices}
      type="audiooutput"
      selectedDeviceId={selectedDevice}
      onChange={(deviceId) => {
        speaker.select(deviceId);
      }}
      title={title}
      visualType={visualType}
      icon="speaker"
    />
  );
};
