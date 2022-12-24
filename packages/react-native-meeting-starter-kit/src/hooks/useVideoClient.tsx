import {StreamVideoClient, User} from '@stream-io/video-client';
import {useEffect, useState} from 'react';

const APIParams = {
  apiKey: '5mxvmc2t4qys', // see <video>/data/fixtures/apps.yaml for API key/secret
  apiSecret: 'u54nds9v328s4b6g56juvsmj5j9nevetdqjszwdt2qr5ubfkswh5rjhmzuw9rvd4',
};
type VideoProps = {
  user: User;
  token: string;
};

export const useVideoClient = ({user, token}: VideoProps) => {
  const [videoClient, setVideoClient] = useState<StreamVideoClient>();
  const [authenticationInProgress, setAuthenticationInProgress] =
    useState(true);

  useEffect(() => {
    const run = async () => {
      setAuthenticationInProgress(true);

      const clientParams = {
        coordinatorRpcUrl:
          'https://rpc-video-coordinator.oregon-v1.stream-io-video.com/rpc',
        coordinatorWsUrl:
          'wss://wss-video-coordinator.oregon-v1.stream-io-video.com/rpc/stream.video.coordinator.client_v1_rpc.Websocket/Connect',
      };

      try {
        const _videoClient = new StreamVideoClient(APIParams.apiKey, {
          coordinatorWsUrl: clientParams.coordinatorWsUrl,
          coordinatorRpcUrl: clientParams.coordinatorRpcUrl,
          sendJson: true,
          token,
        });
        await _videoClient.connect(APIParams.apiKey, token, user);
        setVideoClient(_videoClient);
      } catch (err) {
        console.error('Failed to establish connection', err);
      }

      setAuthenticationInProgress(false);
    };

    run();
  }, [token, user]);

  return {authenticationInProgress, videoClient};
};
