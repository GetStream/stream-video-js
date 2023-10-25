import { useCallStateHooks, useI18n } from '@stream-io/video-react-bindings';
import { DeviceSelector } from './DeviceSelector';

export type DeviceSelectorAudioInputProps = {
  title?: string;
};

export const DeviceSelectorAudioInput = ({
  title,
}: DeviceSelectorAudioInputProps) => {
  const { t } = useI18n();
  const { useMicrophoneState } = useCallStateHooks();
  const { microphone, selectedDevice, devices } = useMicrophoneState();

  return (
    <DeviceSelector
      devices={devices || []}
      selectedDeviceId={selectedDevice}
      onChange={async (deviceId) => {
        await microphone.select(deviceId);
      }}
      title={title || t('Select a Mic')}
    />
  );
};

export type DeviceSelectorAudioOutputProps = {
  title?: string;
};

export const DeviceSelectorAudioOutput = ({
  title,
}: DeviceSelectorAudioOutputProps) => {
  const { t } = useI18n();
  const { useSpeakerState } = useCallStateHooks();
  const { speaker, selectedDevice, devices, isDeviceSelectionSupported } =
    useSpeakerState();

  if (!isDeviceSelectionSupported) return null;

  return (
    <DeviceSelector
      devices={devices}
      selectedDeviceId={selectedDevice}
      onChange={(deviceId) => {
        speaker.select(deviceId);
      }}
      title={title || t('Select Speakers')}
    />
  );
};
