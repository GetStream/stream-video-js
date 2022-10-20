import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { useEffect, useState } from 'react';

export const useSessionId = (callId: string, currentUser: string) => {
  const [sessionId, setSessionId] = useState<string>(uuidv4());

  useEffect(() => {
    const getSessionId = async () => {
      const callKey = callId + '|' + currentUser;
      let sessions: { [callKey: string]: string } = {};
      try {
        const storedSessionIdsString = await AsyncStorage.getItem(
          '@stream.io/sessions',
        );
        if (storedSessionIdsString) {
          sessions = JSON.parse(storedSessionIdsString);
        }
      } catch (e) {
        console.error('Failed to get session id', e);
      }
      if (!sessions[callKey]) {
        setSessionId((prevSessionId) => {
          sessions[callKey] = prevSessionId;
          AsyncStorage.setItem('@stream.io/sessions', JSON.stringify(sessions));
          return prevSessionId;
        });
      } else {
        setSessionId(sessions[callKey]);
      }
    };
    getSessionId();
  }, [callId, currentUser]);
  return sessionId;
};
