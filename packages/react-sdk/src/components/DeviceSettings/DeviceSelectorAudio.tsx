import { useCallStateHooks } from '@stream-io/video-react-bindings';
import type { DeviceListItem } from '../../hooks';
import { DeviceSelector } from './DeviceSelector';
import { AudioVolumeIndicator } from './AudioVolumeIndicator';
import { DeviceLevelIndicator } from './DeviceLevelIndicator';
import { SpeakerTest } from './SpeakerTest';

export type DeviceSelectorAudioInputProps = {
  title?: string;
  visualType?: 'list' | 'dropdown';
  volumeIndicatorVisible?: boolean;
  showDeviceLevelIndicator?: boolean;
};

const renderDeviceLevelIndicator = ({ deviceId }: DeviceListItem) => {
  if (deviceId === 'default') return null;
  return <DeviceLevelIndicator deviceId={deviceId} />;
};

export const DeviceSelectorAudioInput = ({
  title,
  visualType,
  volumeIndicatorVisible = true,
  showDeviceLevelIndicator = false,
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
      renderOptionTrailing={
        showDeviceLevelIndicator ? renderDeviceLevelIndicator : undefined
      }
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
  speakerTestVisible?: boolean;
  speakerTestAudioUrl?: string;
};

export const DeviceSelectorAudioOutput = ({
  title,
  visualType,
  speakerTestVisible = true,
  speakerTestAudioUrl,
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
    >
      {speakerTestVisible && (
        <>
          <hr className="str-video__device-settings__separator" />
          <SpeakerTest audioUrl={speakerTestAudioUrl} />
        </>
      )}
    </DeviceSelector>
  );
};
