import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import {
  Call,
  CallControls,
  PreferredCodec,
  SpeakerLayout,
  StreamCall,
  StreamVideo,
  StreamVideoClient,
} from '@stream-io/video-react-sdk';
import {
  getServerSideCredentialsProps,
  ServerSideCredentialsProps,
} from '../../../lib/getServerSideCredentialsProps';
import {
  defaultRequestTransformers,
  defaultResponseTransformers,
} from '../../../helpers/axiosApiTransformers';

export default function BareCallRoom(props: ServerSideCredentialsProps) {
  const { apiKey, userToken, user } = props;
  const [client, setClient] = useState<StreamVideoClient>();
  const [call, setCall] = useState<Call>();

  useEffect(() => {
    const _client = new StreamVideoClient({
      apiKey,
      user,
      token: userToken,
      options: {
        baseURL: process.env.NEXT_PUBLIC_STREAM_API_URL,
        logLevel: 'debug',
        transformRequest: defaultRequestTransformers,
        transformResponse: defaultResponseTransformers,
      },
    });
    setClient(_client);
    window.client = _client;

    return () => {
      _client
        .disconnectUser()
        .catch((e) => console.error('Failed to disconnect user', e));
      setClient(undefined);

      window.client = undefined;
    };
  }, [apiKey, user, userToken]);

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

    const preferredBitrate = bitrateOverride
      ? parseInt(bitrateOverride, 10)
      : undefined;
    _call.updatePublishOptions({
      preferredCodec: videoCodecOverride,
      fmtpLine: fmtpOverride,
      preferredBitrate,
      subscriberCodec: videoDecoderOverride,
      subscriberFmtpLine: videoDecoderFmtpOverride,
      maxSimulcastLayers: maxSimulcastLayers
        ? parseInt(maxSimulcastLayers, 10)
        : undefined,
    });

    _call.join({ create: true }).catch((e) => {
      console.error('Failed to join call', e);
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
          <SpeakerLayout participantsBarPosition="right" />
          <div className="rd__bare__call-controls">
            <CallControls />
          </div>
        </StreamCall>
      </StreamVideo>
    </>
  );
}

export const getServerSideProps = getServerSideCredentialsProps;
