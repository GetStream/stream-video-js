import React, { useEffect, useMemo, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Call,
  StreamCall,
  useStreamVideoClient,
} from '@stream-io/video-react-native-sdk';
import { MeetingStackParamList } from '../../../types';
import { MeetingUI } from '../../components/MeetingUI';
import { useAppGlobalStoreValue } from '../../contexts/AppContext';
import {
  LobbyE2EEContext,
  type LobbyE2EEContextValue,
} from '../../contexts/LobbyE2EEContext';
import {
  E2EE_SETTINGS_OVERRIDE,
  isE2EEEnvironment,
  updateE2EESharedKeys,
} from '../../utils/e2ee';

type Props = NativeStackScreenProps<MeetingStackParamList, 'MeetingScreen'>;

export const MeetingScreen = (props: Props) => {
  const { route } = props;
  const client = useStreamVideoClient();
  const callType = 'default';
  const {
    params: { callId, encryptionKey: routeEncryptionKey },
  } = route;
  const appEnvironment = useAppGlobalStoreValue(
    (store) => store.appEnvironment,
  );
  const allowEncryption = isE2EEEnvironment(appEnvironment);
  // The key travels in the route, like the web app's URL: it belongs to this
  // one call, not to every call made afterwards. It is chosen before the lobby,
  // so a new call is created encrypted from the start.
  const createEncrypted = allowEncryption && !!routeEncryptionKey;
  // Edits to the key are local to the current call and never recreate it.
  const [editedKey, setEditedKey] = useState<string>();
  const encryptionKey = allowEncryption
    ? (editedKey ?? routeEncryptionKey)
    : undefined;

  const call = useMemo<Call | undefined>(() => {
    if (!client) {
      return undefined;
    }
    return client.call(callType, callId);
  }, [callId, callType, client]);
  // @ts-expect-error - Expose call to globalThis for debugging purposes
  globalThis.call = call;

  useEffect(() => {
    const getOrCreateCall = async () => {
      try {
        // A call's encryption setting is fixed at creation, and the backend
        // rejects an E2EE join against a call that was not created for it.
        await call?.getOrCreate(
          createEncrypted
            ? { data: { settings_override: E2EE_SETTINGS_OVERRIDE } }
            : undefined,
        );
      } catch (error) {
        console.error('Failed to get or create call', error);
      }
    };

    getOrCreateCall();
  }, [call, createEncrypted]);

  const e2eeControls = useMemo<LobbyE2EEContextValue>(
    () => ({
      encryptionKey,
      updateEncryptionKey: (key: string) => {
        setEditedKey(key);
        // Re-key a joined call in place; before the join there is no manager
        // yet and the new key is picked up by the join itself.
        if (call && key.trim()) updateE2EESharedKeys(call, key);
      },
    }),
    [encryptionKey, call],
  );

  if (!call) {
    return null;
  }

  const content = (
    <StreamCall call={call}>
      <MeetingUI callId={callId} {...props} />
    </StreamCall>
  );

  return allowEncryption ? (
    <LobbyE2EEContext.Provider value={e2eeControls}>
      {content}
    </LobbyE2EEContext.Provider>
  ) : (
    content
  );
};
