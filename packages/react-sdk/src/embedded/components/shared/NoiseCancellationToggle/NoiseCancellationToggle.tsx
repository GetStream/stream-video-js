import { useCallStateHooks, useI18n } from '@stream-io/video-react-bindings';
import {
  DeviceSelectorAudioInput,
  DeviceSelectorAudioOutput,
  Icon,
  useNoiseCancellation,
} from '../../../../components';

export const NoiseCancellationToggle = () => {
  const { t } = useI18n();
  const { useMicrophoneState } = useCallStateHooks();
  const { isMute } = useMicrophoneState();

  const { isSupported, isEnabled, setEnabled } = useNoiseCancellation();

  if (!isSupported) return null;

  const handleClick = () => {
    if (isMute) return;
    setEnabled((v: boolean) => !v);
  };

  return (
    <button
      type="button"
      className={`str-video__embedded-nc-toggle ${isEnabled ? 'str-video__embedded-nc-toggle--active' : ''}`}
      disabled={isMute}
      onClick={handleClick}
    >
      <Icon icon={isEnabled ? 'anc' : 'anc-off'} />
      <span>
        {isEnabled ? t('Disable noise cancellation') : t('Noise cancellation')}
      </span>
    </button>
  );
};

export const MicMenuWithNoiseCancellation = () => {
  const { t } = useI18n();
  return (
    <>
      <DeviceSelectorAudioOutput visualType="list" title={t('Speaker')} />
      <DeviceSelectorAudioInput visualType="list" title={t('Microphone')} />
      <div className="str-video__embedded-nc-toggle-container">
        <NoiseCancellationToggle />
      </div>
    </>
  );
};
