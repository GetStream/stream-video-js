import { useCallStateHooks, useI18n } from '@stream-io/video-react-bindings';
import { DeviceSelector } from './DeviceSelector';

export type DeviceSelectorAudioInputProps = {
  title?: string;
  visualType?: 'list' | 'dropdown';
};

export const DeviceSelectorAudioInput = ({
  title,
  visualType,
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
      visualType={visualType}
      icon={'mic'}
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
      icon="speaker"
      visualType={visualType}
    />
  );
};
