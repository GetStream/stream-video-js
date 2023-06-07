import { useCallback } from 'react';
import { useRouter } from 'next/router';
import {
  StreamCall,
  StreamVideo,
  useCreateStreamVideoClient,
} from '@stream-io/video-react-sdk';
import Head from 'next/head';
import { useCreateStreamChatClient } from '../../hooks';
import { MeetingUI } from '../../components';
import {
  getServerSideCredentialsProps,
  ServerSideCredentialsProps,
} from '../../lib/getServerSideCredentialsProps';
import { useGleap } from '../../hooks/useGleap';
import { useSettings } from '../../context/SettingsContext';
import translations from '../../translations';
import {
  DeviceSettingsCaptor,
  getDeviceSettings,
} from '../../components/DeviceSettingsCaptor';

const CallRoom = (props: ServerSideCredentialsProps) => {
  const router = useRouter();
  const {
    settings: { language },
  } = useSettings();
  const callId = router.query['callId'] as string;
  const callType = (router.query['type'] as string) || 'default';
  const { userToken, user, apiKey, gleapApiKey } = props;

  const tokenProvider = useCallback(async () => {
    const { token } = await fetch(
      '/api/auth/create-token?' +
        new URLSearchParams({
          api_key: apiKey,
          user_id: user.id,
        }),
      {},
    ).then((res) => res.json());
    return token as string;
  }, [apiKey, user.id]);

  const client = useCreateStreamVideoClient({
    apiKey,
    tokenOrProvider: tokenProvider,
    user,
  });

  const chatClient = useCreateStreamChatClient({
    apiKey,
    tokenOrProvider: userToken,
    userData: user,
  });

  useGleap(gleapApiKey, client, user);

  const settings = getDeviceSettings();
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
        <StreamCall
          callId={callId}
          callType={callType}
          autoJoin={false}
          mediaDevicesProviderProps={{
            initialAudioEnabled: !settings?.isAudioMute,
            initialVideoEnabled: !settings?.isVideoMute,
            initialVideoInputDeviceId: settings?.selectedVideoDeviceId,
            initialAudioInputDeviceId: settings?.selectedAudioInputDeviceId,
            initialAudioOutputDeviceId: settings?.selectedAudioOutputDeviceId,
          }}
        >
          <MeetingUI chatClient={chatClient} />
          <DeviceSettingsCaptor />
        </StreamCall>
      </StreamVideo>
    </>
  );
};

export default CallRoom;

export const getServerSideProps = getServerSideCredentialsProps;
