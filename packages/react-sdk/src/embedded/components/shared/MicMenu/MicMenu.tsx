import { useI18n } from '@stream-io/video-react-bindings';
import {
  DeviceSelectorAudioInput,
  DeviceSelectorAudioOutput,
} from '../../../../components';

export const MicMenu = () => {
  const { t } = useI18n();
  return (
    <>
      <DeviceSelectorAudioOutput visualType="list" title={t('Speaker')} />
      <DeviceSelectorAudioInput visualType="list" title={t('Microphone')} />
    </>
  );
};
