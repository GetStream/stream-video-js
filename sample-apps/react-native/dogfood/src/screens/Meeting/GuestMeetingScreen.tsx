import React, { useEffect, useMemo, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Call,
  StreamCall,
  StreamVideo,
  StreamVideoClient,
} from '@stream-io/video-react-native-sdk';
import { MeetingStackParamList } from '../../../types';
import { MeetingUI } from '../../components/MeetingUI';
import { createToken } from '../../modules/helpers/createToken';
import { useAppGlobalStoreValue } from '../../contexts/AppContext';
import { useCustomTheme } from '../../theme';
import {
  LobbyE2EEContext,
  type LobbyE2EEContextValue,
} from '../../contexts/LobbyE2EEContext';
import {
  E2EE_SETTINGS_OVERRIDE,
  isE2EEEnvironment,
  updateE2EESharedKeys,
} from '../../utils/e2ee';

type Props = NativeStackScreenProps<
  MeetingStackParamList,
  'GuestMeetingScreen'
>;

export const GuestMeetingScreen = (props: Props) => {
  const appEnvironment = useAppGlobalStoreValue(
    (store) => store.appEnvironment,
  );
  const themeMode = useAppGlobalStoreValue((store) => store.themeMode);
  const customTheme = useCustomTheme(themeMode);
  const [videoClient, setVideoClient] = useState<StreamVideoClient | undefined>(
    undefined,
  );
  const {
    params: { guestUserId, callId, mode, encryptionKey: routeEncryptionKey },
  } = props.route;
  const allowEncryption = isE2EEEnvironment(appEnvironment);
  const createEncrypted = allowEncryption && !!routeEncryptionKey;
  const [editedKey, setEditedKey] = useState<string>();
  const encryptionKey = allowEncryption
    ? (editedKey ?? routeEncryptionKey)
    : undefined;
  const callType = 'default';

  useEffect(() => {
    let _videoClient: StreamVideoClient | undefined;
    const run = async () => {
      const { apiKey, token } = await createToken(
        {
          user_id: mode === 'guest' ? guestUserId : '!anon',
          call_cids: mode === 'anonymous' ? `${callType}:${callId}` : undefined,
        },
        appEnvironment,
      );

      const options = { logLevel: 'warn', rejectCallWhenBusy: false } as const;
      if (mode === 'guest') {
        _videoClient = StreamVideoClient.getOrCreateInstance({
          apiKey,
          user: { id: guestUserId, type: 'guest' },
          options,
        });
      } else {
        _videoClient = StreamVideoClient.getOrCreateInstance({
          apiKey,
          user: { type: 'anonymous' },
          token,
          options,
        });
      }

      setVideoClient(_videoClient);
    };

    run();

    return () => {
      _videoClient?.disconnectUser();
      setVideoClient(undefined);
    };
  }, [mode, guestUserId, callId, appEnvironment]);

  const call = useMemo<Call | undefined>(() => {
    if (!videoClient) {
      return undefined;
    }
    return videoClient.call(callType, callId);
  }, [callId, callType, videoClient]);

  useEffect(() => {
    call
      ?.getOrCreate(
        createEncrypted
          ? { data: { settings_override: E2EE_SETTINGS_OVERRIDE } }
          : undefined,
      )
      .catch((err) => {
        console.error('Failed to get or create call', err);
      });
  }, [call, createEncrypted]);

  const e2eeControls = useMemo<LobbyE2EEContextValue>(
    () => ({
      encryptionKey,
      updateEncryptionKey: (key: string) => {
        setEditedKey(key);
        if (call && key.trim()) updateE2EESharedKeys(call, key);
      },
    }),
    [encryptionKey, call],
  );

  if (!videoClient || !call) {
    return null;
  }

  return (
    <StreamVideo client={videoClient} style={customTheme}>
      <LobbyE2EEContext.Provider value={allowEncryption ? e2eeControls : null}>
        <StreamCall call={call}>
          <MeetingUI callId={callId} {...props} />
        </StreamCall>
      </LobbyE2EEContext.Provider>
    </StreamVideo>
  );
};
