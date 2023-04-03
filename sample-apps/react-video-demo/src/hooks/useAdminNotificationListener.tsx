// call?.on('user-mute', (event: SfuModels.UserMuteEvent) => {

// });

import { useEffect, useState } from 'react';
import { v1 as uuid } from 'uuid';
import { useRemoteParticipants } from '@stream-io/video-react-bindings';
import {
  SfuModels,
  SfuEvents,
  StreamVideoParticipant,
} from '@stream-io/video-client';
import {
  useConnectedUser,
  useActiveCall,
  useLocalParticipant,
} from '@stream-io/video-react-bindings';

import { People } from '../components/Icons';

import { useNotificationContext } from '../contexts/NotificationsContext';

export const useScreenRecordingNotification = () => {
  const call = useActiveCall();

  call?.on('participantJoined', (event) => {
    console.log(event);
  });
};
