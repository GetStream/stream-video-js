import { HomeButton, UserInfo } from './LobbyHeader';

export const DefaultAppHeader = () => {
  return (
    <div className="rd__call-header rd__call-header--transparent">
      <div className="rd__call-header__title-group">
        <HomeButton />
      </div>
      <UserInfo />
    </div>
  );
};
