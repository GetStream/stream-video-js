import { forwardRef } from 'react';
import { signOut, useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';

import { LanguageMenu } from './Settings/LanguageMenu';
import { useLanguage } from '../hooks/useLanguage';

import { Icon, MenuToggle } from '@stream-io/video-react-sdk';

export const HomeButton = () => (
  <Link href="/" data-testid="home-button">
    <Image
      src={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/stream-logo.svg`}
      alt="Stream logo"
      priority={false}
      width={36}
      height={36}
    />
  </Link>
);

export const UserMenu = () => {
  const { setLanguage } = useLanguage();
  return (
    <div className="rd__user-session__menu">
      <ul className="rd__user-session__menu-list">
        <li className="rd__user-session__menu-item">
          <LanguageMenu setLanguage={setLanguage} />
        </li>
        <li className="rd__user-session__menu-item">
          <button
            className="rd__button rd__user-session__menu-button"
            onClick={() => {
              const url = new URL(window.location.href);
              url.pathname = process.env.NEXT_PUBLIC_BASE_PATH || '';
              signOut({ callbackUrl: url.toString() }).catch((err) => {
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

export const ToggleMenuButton = forwardRef<HTMLDivElement>((props, ref) => {
  const { data: theSession } = useSession();

  if (!theSession || !theSession.user) {
    return null;
  }
  return (
    <div className="rd__user-session" ref={ref}>
      <div className="rd__user-session__container">
        <div className="rd__user-session__user">
          <p className="rd__user-session__name">{theSession.user.name}</p>

          <p className="rd__user-session__email">{theSession.user.email}</p>
        </div>
      </div>
    </div>
  );
});

export const ToggleLogoutButton = () => {
  return (
    <MenuToggle placement="bottom-end" ToggleButton={ToggleMenuButton}>
      <UserMenu />
    </MenuToggle>
  );
};
