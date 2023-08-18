import { useEffect, useState } from 'react';
import { v1 as uuid } from 'uuid';
import {
  StreamVideoParticipant,
  useCallStateHooks,
} from '@stream-io/video-react-sdk';

import { People } from '../components/Icons';

import { useNotificationContext } from '../contexts/NotificationsContext';

export const useParticipantNotification = () => {
  const [oldParticipants, setOldParticpantList] = useState<
    StreamVideoParticipant[]
  >([]);

  const { addNotification } = useNotificationContext();

  const {
    useHasPermissions,
    useConnectedUser,
    useLocalParticipant,
    useRemoteParticipants,
  } = useCallStateHooks();
  const remoteParticipants = useRemoteParticipants();

  useEffect(() => {
    if (remoteParticipants.length > oldParticipants.length) {
      const newParticipant = remoteParticipants.filter(
        (participant) =>
          !oldParticipants
            .map((p) => p.sessionId)
            .includes(participant.sessionId),
      )[0];

      addNotification({
        id: uuid(),
        message: `${newParticipant.name} has joined the call`,
        icon: <People />,
      });
    }

    if (remoteParticipants.length < oldParticipants.length) {
      const leavingParticipant = oldParticipants.filter(
        (participant) =>
          !remoteParticipants
            .map((p) => p.sessionId)
            .includes(participant.sessionId),
      )[0];

      addNotification({
        id: uuid(),
        message: `${leavingParticipant.name} has left the call`,
        icon: <People />,
      });
    }

    setOldParticpantList(remoteParticipants);
  }, [remoteParticipants, oldParticipants, addNotification]);
};
