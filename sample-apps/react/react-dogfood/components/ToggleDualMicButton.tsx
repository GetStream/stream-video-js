import {
  DeviceSelectorAudioInput,
  DeviceSelectorAudioOutput,
  OwnCapability,
  Restricted,
  ToggleAudioPublishingButton,
  useI18n,
} from '@stream-io/video-react-sdk';

export const ToggleDualMicButton = () => {
  const { t } = useI18n();
  return (
    <Restricted requiredGrants={[OwnCapability.SEND_AUDIO]} hasPermissionsOnly>
      <div className="rd__dual-toggle">
        <ToggleAudioPublishingButton
          Menu={
            <>
              <DeviceSelectorAudioInput
                visualType="list"
                title={t('Microphone')}
              />
              <DeviceSelectorAudioOutput
                visualType="list"
                title={t('Speaker')}
              />
            </>
          }
          menuPlacement="top"
        />
      </div>
    </Restricted>
  );
};
