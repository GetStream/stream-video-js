import clsx from 'clsx';
import { HomeButton, UserInfo } from './LobbyHeader';

import { Icon } from '@stream-io/video-react-sdk';
import { useAppI18n } from '../hooks/useAppI18n';

export const DefaultAppHeader = (props: { transparent?: boolean }) => {
  const { transparent } = props;
  const { t } = useAppI18n();
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
          {t('common.tutorials.label', 'Tutorials')}
        </a>
        <a
          className="rd__button rd__button--align-left"
          href="https://getstream.io/video/docs/"
          target="_blank"
          rel="noreferrer"
        >
          <Icon className="rd__button__icon" icon="folder" />
          {t('common.documentation.label', 'Documentation')}
        </a>
      </div>
    </div>
  );
};
