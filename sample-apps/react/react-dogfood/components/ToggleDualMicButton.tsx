import {
  DeviceSelectorAudioInput,
  DeviceSelectorAudioOutput,
  OwnCapability,
  Restricted,
  ToggleAudioPublishingButton,
  useI18n,
} from '@stream-io/video-react-sdk';
import { useSettings } from '../context/SettingsContext';

export const ToggleDualMicButton = () => {
  const { t } = useI18n();
  const {
    settings: { speakingDetectionEnabled },
  } = useSettings();
  return (
    <Restricted requiredGrants={[OwnCapability.SEND_AUDIO]} hasPermissionsOnly>
      <div>
        <ToggleAudioPublishingButton
          Menu={
            <>
              <DeviceSelectorAudioInput
                visualType="list"
                volumeIndicatorVisible={speakingDetectionEnabled}
                title={t('common.microphone.label', 'Microphone')}
              />
              <DeviceSelectorAudioOutput
                visualType="list"
                title={t('common.speaker.label', 'Speaker')}
              />
            </>
          }
          menuPlacement="top"
        />
      </div>
    </Restricted>
  );
};
