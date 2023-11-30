import { HomeButton, UserInfo } from './LobbyHeader';

import { Icon, useI18n } from '@stream-io/video-react-sdk';

export const DefaultAppHeader = () => {
  const { t } = useI18n();
  return (
    <div className="rd__call-header rd__call-header">
      <div className="rd__call-header__title-group">
        <HomeButton />
        <UserInfo />
      </div>
      <div className="rd__call-header__documentation">
        <a
          className="rd__button rd__button"
          href="https://getstream.io/video/get_started/"
          target="_blank"
        >
          <Icon className="rd__button__icon" icon="mediation" />
          {t('Tutorials')}
        </a>
        <a
          className="rd__button"
          href="https://getstream.io/video/docs/"
          target="_blank"
        >
          <Icon className="rd__button__icon" icon="folder" />
          {t('Documentation')}
        </a>
      </div>
    </div>
  );
};
