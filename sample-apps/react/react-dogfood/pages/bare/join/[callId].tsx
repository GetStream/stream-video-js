import {
  Call,
  CallControls,
  CallingState,
  Icon,
  PreferredCodec,
  SpeakerLayout,
  StreamCall,
  StreamVideo,
  StreamVideoClient,
  useCall,
  useCallStateHooks,
} from '@stream-io/video-react-sdk';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useAppEnvironment } from '../../../context/AppEnvironmentContext';
import { getClient } from '../../../helpers/client';
import {
  getServerSideCredentialsProps,
  ServerSideCredentialsProps,
} from '../../../lib/getServerSideCredentialsProps';

export default function BareCallRoom(props: ServerSideCredentialsProps) {
  const { apiKey, userToken, user } = props;
  const [client, setClient] = useState<StreamVideoClient>();
  const [call, setCall] = useState<Call>();
  const environment = useAppEnvironment();

  useEffect(() => {
    const _client = getClient({ apiKey, user, userToken }, environment);
    setClient(_client);
    window.client = _client;

    return () => {
      _client
        .disconnectUser()
        .catch((e) => console.error('Failed to disconnect user', e));
      setClient(undefined);

      window.client = undefined;
    };
  }, [apiKey, user, userToken, environment]);

  const router = useRouter();
  const callId = router.query['callId'] as string;
  const callType = (router.query['type'] as string) || 'default';
  useEffect(() => {
    if (!client) return;

    const _call = client.call(callType, callId);
    setCall(_call);

    const videoCodecOverride = (router.query['video_encoder'] ||
      router.query['video_codec']) as PreferredCodec | undefined;
    const fmtpOverride = router.query['fmtp'] as string | undefined;
    const bitrateOverride = router.query['bitrate'] as string | undefined;
    const videoDecoderOverride = router.query['video_decoder'] as
      | PreferredCodec
      | undefined;
    const videoDecoderFmtpOverride = router.query['video_decoder_fmtp'] as
      | string
      | undefined;
    const maxSimulcastLayers = router.query['max_simulcast_layers'] as
      | string
      | undefined;
    const forceCodec = router.query['force_codec'] as
      | PreferredCodec
      | undefined;

    const preferredBitrate = bitrateOverride
      ? parseInt(bitrateOverride, 10)
      : undefined;
    _call.updatePublishOptions({
      dangerouslyForceCodec: forceCodec,
      preferredCodec: videoCodecOverride,
      fmtpLine: fmtpOverride,
      preferredBitrate,
      subscriberCodec: videoDecoderOverride,
      subscriberFmtpLine: videoDecoderFmtpOverride,
      maxSimulcastLayers: maxSimulcastLayers
        ? parseInt(maxSimulcastLayers, 10)
        : undefined,
    });

    window.call = _call;
    return () => {
      _call.leave().catch((e) => console.error('Failed to leave call', e));
      setCall(undefined);
      window.call = undefined;
    };
  }, [callId, callType, client, router.query]);

  if (!client || !call) return null;

  return (
    <>
      <Head>
        <title>Stream Calls: {callId}</title>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>

      <StreamVideo client={client}>
        <StreamCall call={call}>
          <Stage />
        </StreamCall>
      </StreamVideo>
    </>
  );
}

const Stage = () => {
  const call = useCall();
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();
  const showLobby = [
    CallingState.IDLE,
    CallingState.LEFT,
    CallingState.UNKNOWN,
  ].includes(callingState);
  return (
    <>
      {showLobby && (
        <Lobby
          onJoin={async () => {
            if (!call) return;
            try {
              await call.join({ create: true });
              console.log('Joined call:', call.cid);

              const appId = process.env.NEXT_PUBLIC_STREAM_APP_ID || '';
              const path = encodeURIComponent(
                `app/${appId}/${call.cid}/${call.state.session?.id}/`,
              );
              console.log(
                'RTC stats:',
                `http://localhost:8081/?path=${path}`,
                `http://rtcstats.gtstrm.com:8081/?path=${path}`,
              );
            } catch (err) {
              console.error('Failed to join call', err);
            }
          }}
        />
      )}
      {!showLobby && (
        <>
          <SpeakerLayout participantsBarPosition="right" />
          <div className="rd__bare__call-controls">
            <CallControls />
          </div>
        </>
      )}
    </>
  );
};

const Lobby = (props: { onJoin: () => void }) => {
  const { onJoin } = props;
  const router = useRouter();
  const skipLobby =
    !!router.query['skip_lobby'] ||
    process.env.NEXT_PUBLIC_SKIP_LOBBY === 'true';

  useEffect(() => {
    if (!skipLobby) return;
    const id = setTimeout(() => onJoin(), 300);
    return () => clearTimeout(id);
  }, [onJoin, skipLobby]);

  return (
    <div className="rd__bare__call-lobby">
      <button
        className="rd__button rd__button--primary rd__button--large rd__lobby-join"
        type="button"
        data-testid="join-call-button"
        onClick={onJoin}
      >
        <Icon className="rd__button__icon" icon="login" />
        Join
      </button>
    </div>
  );
};

export const getServerSideProps = getServerSideCredentialsProps;
