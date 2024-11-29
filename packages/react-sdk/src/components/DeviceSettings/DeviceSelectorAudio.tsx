import { useCallStateHooks } from '@stream-io/video-react-bindings';
import { DeviceSelector } from './DeviceSelector';

export type DeviceSelectorAudioInputProps = {
  title?: string;
  visualType?: 'list' | 'dropdown';
};

export const DeviceSelectorAudioInput = ({
  title,
  visualType,
}: DeviceSelectorAudioInputProps) => {
  const { useMicrophoneState } = useCallStateHooks();
  const { microphone, selectedDevice, devices } = useMicrophoneState();

  return (
    <DeviceSelector
      devices={devices || []}
      selectedDeviceId={selectedDevice}
      type="audioinput"
      onChange={async (deviceId) => {
        await microphone.select(deviceId);
      }}
      title={title}
      visualType={visualType}
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
