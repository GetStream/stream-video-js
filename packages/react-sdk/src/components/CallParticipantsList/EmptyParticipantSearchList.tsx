import { useI18n } from '../../i18n';

export const EmptyParticipantSearchList = () => {
  const { t } = useI18n();
  return (
    <div className="str-video__participant-list--empty">
      {t('participantList.noParticipantsFound.text', 'No participants found')}
    </div>
  );
};
