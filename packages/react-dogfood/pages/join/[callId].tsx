import { useEffect } from 'react';
import Gleap from 'gleap';
import { useRouter } from 'next/router';
import {
  Call,
  MediaDevicesProvider,
  StreamVideo,
  useCreateStreamVideoClient,
} from '@stream-io/video-react-sdk';
import Head from 'next/head';

import { useCreateStreamChatClient } from '../../hooks';
import { LoadingScreen, MeetingUI } from '../../components';
import { getDeviceSettings } from '../../components/DeviceSettingsCaptor';
import {
  getServerSideCredentialsProps,
  ServerSideCredentialsProps,
} from '../../lib/getServerSideCredentialsProps';
import { useSettings } from '../../context/SettingsContext';
import translations from '../../translations';

const CallRoom = (props: ServerSideCredentialsProps) => {
  const router = useRouter();
  const {
    settings: { language },
  } = useSettings();
  const callId = router.query['callId'] as string;

  const { userToken, user, apiKey, gleapApiKey } = props;

  const client = useCreateStreamVideoClient({
    apiKey,
    tokenOrProvider: userToken,
    user,
  });

  const chatClient = useCreateStreamChatClient({
    apiKey,
    tokenOrProvider: userToken,
    userData: user,
  });

  useEffect(() => {
    if (gleapApiKey) {
      Gleap.initialize(gleapApiKey);
      Gleap.identify(user.name || user.id, {
        name: user.name,
      });
    }
  }, [gleapApiKey, user.name, user.id]);

  useEffect(() => {
    if (!gleapApiKey) return;

    Gleap.on('flow-started', () => {
      try {
        const { getCurrentValue, ...state } = client.readOnlyStateStore;
        const data = Object.entries(state).reduce<Record<string, any>>(
          (acc, [key, observable]) => {
            if (!!observable && typeof observable.subscribe === 'function') {
              const value = getCurrentValue<unknown>(observable);
              if (key === 'activeCall$' && value && value instanceof Call) {
                // special handling for the active call
                const call = value;
                const ignoredKeys = [
                  // these two are derived from participants$.
                  // we don't want to send the same data twice.
                  'localParticipant$',
                  'remoteParticipants$',
                ];
                Object.entries(call.state)
                  .filter(([k]) => k.endsWith('$') && !ignoredKeys.includes(k))
                  .forEach(([k, v]) => {
                    if (!!v && typeof v.subscribe === 'function') {
                      acc[`${key}.${k}`] = getCurrentValue(v);
                    } else {
                      acc[`${key}.${k}`] = v;
                    }
                  });
              } else {
                acc[key] = value;
              }
            }
            return acc;
          },
          {},
        );
        console.log('!!State Store', data);
        Gleap.attachCustomData(data);
      } catch (e) {
        console.error(e);
      }
    });
  }, [client.readOnlyStateStore, gleapApiKey]);

  const deviceSettings = getDeviceSettings();

  if (!client) {
    return <LoadingScreen />;
  }

  return (
    <>
      <Head>
        <title>Stream Calls: {callId}</title>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>
      <StreamVideo
        client={client}
        language={language}
        translationsOverrides={translations}
      >
        <MediaDevicesProvider
          enumerate
          initialAudioEnabled={!deviceSettings?.isAudioMute}
          initialVideoEnabled={!deviceSettings?.isVideoMute}
          initialVideoInputDeviceId={deviceSettings?.selectedVideoDeviceId}
          initialAudioInputDeviceId={deviceSettings?.selectedAudioInputDeviceId}
          initialAudioOutputDeviceId={
            deviceSettings?.selectedAudioOutputDeviceId
          }
        >
          <MeetingUI chatClient={chatClient} />
        </MediaDevicesProvider>
      </StreamVideo>
    </>
  );
};

export default CallRoom;

export const getServerSideProps = getServerSideCredentialsProps;
