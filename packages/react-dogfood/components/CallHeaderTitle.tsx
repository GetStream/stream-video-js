import {
  useActiveCall,
  useConnectedUser,
  useRemoteParticipants,
} from '@stream-io/video-react-bindings';
import * as React from 'react';
import { useMemo } from 'react';
import { HomeButton } from './LobbyHeader';

type CallTitleProps = {
  title?: string;
};
export const CallHeaderTitle = ({ title }: CallTitleProps) => {
  const activeCall = useActiveCall();
  const connectedUser = useConnectedUser();
  const remoteParticipants = useRemoteParticipants();

  const standInTitle = useMemo(() => {
    if (!connectedUser) return 'Connecting...';

    if (!remoteParticipants.length) return connectedUser.name;
    return (
      'Call with: ' +
      remoteParticipants
        .slice(0, 3)
        .map((p) => p.user?.name)
        .join(', ')
    );
  }, [connectedUser, remoteParticipants]);

  if (!activeCall) return null;

  return (
    <div className="str-video__call-header__title-group">
      <HomeButton />
      <h4
        title={'This is not a good design'}
        className="str-video__call-header-title"
      >
        {title || standInTitle}
      </h4>
    </div>
  );
};
