import { useRouter } from 'next/router';
import {
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
import { useGleap } from '../../hooks/useGleap';

const CallRoom = (props: ServerSideCredentialsProps) => {
  const router = useRouter();
  const callId = router.query['callId'] as string;
  const callType = (router.query['type'] as string) || 'default';

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

  useGleap(gleapApiKey, client, user);
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
      <StreamVideo client={client}>
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
          <MeetingUI
            chatClient={chatClient}
            callId={callId}
            callType={callType}
          />
        </MediaDevicesProvider>
      </StreamVideo>
    </>
  );
};

export default CallRoom;

export const getServerSideProps = getServerSideCredentialsProps;
