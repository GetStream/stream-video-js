import clsx from 'clsx';
import { HomeButton, UserInfo } from './LobbyHeader';

import { Icon, useI18n } from '@stream-io/video-react-sdk';

export const DefaultAppHeader = (props: { transparent?: boolean }) => {
  const { transparent } = props;
  const { t } = useI18n();
  return (
    <div
      className={clsx(
        'rd__call-header',
        transparent && 'rd__call-header--transparent',
      )}
    >
      <div className="rd__call-header__title-group">
        <HomeButton />
        <UserInfo />
      </div>
      <div className="rd__call-header__documentation">
        <a
          className="rd__button rd__button--align-left"
          href="https://getstream.io/video/sdk/react/"
          target="_blank"
          rel="noreferrer"
        >
          <Icon className="rd__button__icon" icon="mediation" />
          {t('Tutorials')}
        </a>
        <a
          className="rd__button rd__button--align-left"
          href="https://getstream.io/video/docs/"
          target="_blank"
          rel="noreferrer"
        >
          <Icon className="rd__button__icon" icon="folder" />
          {t('Documentation')}
        </a>
      </div>
    </div>
  );
};
