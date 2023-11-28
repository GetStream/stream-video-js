import { forwardRef } from 'react';
import { signOut, useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';

import { LanguageMenu } from './Settings/LanguageMenu';
import { useLanguage } from '../hooks/useLanguage';

import {
  Avatar,
  CompositeButton,
  Icon,
  IconButton,
  MenuToggle,
} from '@stream-io/video-react-sdk';

export const HomeButton = () => (
  <Link href="/" data-testid="home-button">
    <Image src="/stream-logo.svg" alt="Stream logo" width={36} height={36} />
  </Link>
);

export const Menu = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="rd__user-session__menu">
      <ul className="rd__user-session__menu-list">
        <li className="rd__user-session__menu-item">
          <LanguageMenu language={language} setLanguage={setLanguage} />
        </li>

        <li className="rd__user-session__menu-item">
          <button
            className="rd__button rd__user-session__menu-button"
            onClick={() => {
              void signOut();
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
  const { data: theSession } = useSession();

  if (!theSession || !theSession.user) {
    return null;
  }

  return (
    <div className="rd__user-session">
      <div className="rd__user-session__container">
        <Avatar
          name={theSession?.user?.name || undefined}
          imageSrc={theSession.user.image || undefined}
        />
        <div className="rd__user-session__user">
          <p className="rd__user-session__name">{theSession.user.name}</p>

          <p className="rd__user-session__email">{theSession.user.email}</p>
        </div>
      </div>
      <ToggleLogoutButton />
    </div>
  );
};

export const ToggleMenuButton = forwardRef<HTMLButtonElement>((props, ref) => {
  return (
    <CompositeButton>
      <IconButton ref={ref} icon="chevron-down" />
    </CompositeButton>
  );
});

export const ToggleLogoutButton = () => {
  return (
    <MenuToggle placement="top-start" ToggleButton={ToggleMenuButton}>
      <Menu />
    </MenuToggle>
  );
};
