import { useCallStateHooks } from '@stream-io/video-react-bindings';
import { DeviceSelector } from './DeviceSelector';
import { AudioVolumeIndicator } from './AudioVolumeIndicator';

export type DeviceSelectorAudioInputProps = {
  title?: string;
  visualType?: 'list' | 'dropdown';
  volumeIndicatorVisible?: boolean;
};

export const DeviceSelectorAudioInput = ({
  title,
  visualType,
  volumeIndicatorVisible = true,
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
    >
      {volumeIndicatorVisible && (
        <>
          <hr className="str-video__device-settings__separator" />
          <AudioVolumeIndicator />
        </>
      )}
    </DeviceSelector>
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
