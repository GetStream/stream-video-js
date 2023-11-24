import { HomeButton, UserInfo } from './LobbyHeader';

export const DefaultAppHeader = () => {
  return (
    <div className="rd__call-header">
      <div className="rd__call-header__title-group">
        <HomeButton />
      </div>
      <UserInfo />
    </div>
  );
};
