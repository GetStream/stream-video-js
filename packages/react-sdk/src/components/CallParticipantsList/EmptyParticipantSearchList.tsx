import { useI18n } from '@stream-io/video-react-bindings';

export const EmptyParticipantSearchList = () => {
  const { t } = useI18n();
  return (
    <div className="str-video__participant-list--empty">
      {t('No participants found')}
    </div>
  );
};
