import { useEffect, useState } from 'react';
import { v1 as uuid } from 'uuid';
import {
  StreamVideoParticipant,
  useRemoteParticipants,
} from '@stream-io/video-react-sdk';

import { People } from '../components/Icons';

import { useNotificationContext } from '../contexts/NotificationsContext';

export const useParticipantNotification = () => {
  const [oldParticipants, setOldParticpantList] = useState<
    StreamVideoParticipant[]
  >([]);

  const { addNotification } = useNotificationContext();

  const remoteParticipants = useRemoteParticipants();

  useEffect(() => {
    setOldParticpantList(remoteParticipants);
  }, []);

  useEffect(() => {
    const leftParticipants = oldParticipants.filter(
      (oldParticipant) =>
        !remoteParticipants.some(
          (newParticipant) =>
            newParticipant.sessionId === oldParticipant.sessionId,
        ),
    );

    if (leftParticipants.length > 0) {
      leftParticipants.forEach((participant) => {
        addNotification({
          id: uuid(),
          message: `${participant.name} has left the call`,
        });
      });
    }
  }, [remoteParticipants, oldParticipants]);

  useEffect(() => {
    const joinedParticipants = remoteParticipants.filter(
      (newParticipant) =>
        !oldParticipants.some(
          (oldParticipant) =>
            oldParticipant.sessionId === newParticipant.sessionId,
        ),
    );

    if (joinedParticipants.length > 0) {
      joinedParticipants.forEach((participant) => {
        addNotification({
          id: uuid(),
          message: `${participant.name} has joined the call`,
          icon: <People />,
        });
      });
    }
  }, [remoteParticipants, oldParticipants]);
};
