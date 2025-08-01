import { forwardRef } from 'react';
import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';

import { LanguageMenu } from './Settings/LanguageMenu';
import { useSettings } from '../context/SettingsContext';
import { useIsProntoEnvironment } from '../context/AppEnvironmentContext';

import { Icon, MenuToggle } from '@stream-io/video-react-sdk';

export const HomeButton = () => (
  <Link href="/" data-testid="home-button">
    <img
      src={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/stream-logo.png`}
      alt="Stream logo"
      width={36}
      height={36}
    />
  </Link>
);

export const UserMenu = () => {
  const {
    settings: { language, setLanguage },
  } = useSettings();
  const isProntoEnvironment = useIsProntoEnvironment();
  return (
    <div className="rd__user-session__menu">
      <ul className="rd__user-session__menu-list">
        {isProntoEnvironment && (
          <li className="rd__user-session__menu-item">
            <LanguageMenu language={language} setLanguage={setLanguage!} />
          </li>
        )}
        <li className="rd__user-session__menu-item">
          <button
            className="rd__button rd__user-session__menu-button"
            onClick={() => {
              const url = new URL(window.location.href);
              url.pathname = process.env.NEXT_PUBLIC_BASE_PATH || '';
              signOut({ callbackUrl: '/auth/signin' }).catch((err) => {
                console.error('Sign out error', err);
              });
            }}
          >
            <Icon
              className="rd__button__icon rd__user-session__menu-icon"
              icon="logout"
            />
            Logout
          </button>
        </li>
      </ul>
    </div>
  );
};

export const UserInfo = () => {
  return <ToggleLogoutButton />;
};

const ToggleMenuButton = forwardRef<HTMLDivElement>(
  function ToggleMenuButton(props, ref) {
    const { data: theSession } = useSession();
    if (!theSession || !theSession.user) return null;
    return (
      <div className="rd__user-session" ref={ref}>
        <div className="rd__user-session__container">
          <div className="rd__user-session__user">
            <p className="rd__user-session__name">
              {theSession.user.name ?? 'User'}
            </p>
            {theSession.user.email && (
              <p className="rd__user-session__email">{theSession.user.email}</p>
            )}
          </div>
          <Icon icon="chevron-down" />
        </div>
      </div>
    );
  },
);

const ToggleLogoutButton = () => {
  return (
    <MenuToggle placement="bottom-end" ToggleButton={ToggleMenuButton}>
      <UserMenu />
    </MenuToggle>
  );
};
