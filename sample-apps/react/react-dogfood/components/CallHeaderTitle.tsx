import {
  name,
  useCall,
  useCallStateHooks,
  useConnectedUser,
} from '@stream-io/video-react-sdk';
import { useMemo } from 'react';
import { HomeButton } from './LobbyHeader';

type CallTitleProps = {
  title?: string;
};

export const CallHeaderTitle = ({ title }: CallTitleProps) => {
  const activeCall = useCall();
  const connectedUser = useConnectedUser();
  const { useParticipants } = useCallStateHooks();
  const participants = useParticipants({ sortBy: name });

  const standInTitle = useMemo(() => {
    if (!connectedUser) return 'Connecting...';

    if (!participants.length) return connectedUser.name;
    return participants
      .slice(0, 3)
      .map((p) => p.name || p.userId)
      .join(', ');
  }, [connectedUser, participants]);

  if (!activeCall) return null;

  return (
    <div className="rd__call-header__title-group">
      <HomeButton />
      <h4 className="rd__call-header-title">{title || standInTitle}</h4>
    </div>
  );
};
