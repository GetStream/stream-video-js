import { useEffect, useState } from 'react';
import { useStreamVideoClient } from '../StreamVideo';
import { CallMeta } from '@stream-io/video-client';
import { WebsocketHealthcheck } from '@stream-io/video-client/dist/src/gen/video/coordinator/client_v1_rpc/websocket';

export const Ping = (props: {
  currentUser: string;
  activeCall: CallMeta.Call;
}) => {
  const { currentUser, activeCall } = props;
  const client = useStreamVideoClient();

  // FIXME: OL should be initialized with value coming from user default preferences
  // const [hasAudio, setHasAudio] = useState(true);
  // const [hasVideo, setHasVideo] = useState(true);

  const [healthcheck, setHealthcheck] = useState<WebsocketHealthcheck>();
  // keep track of server-side updates
  useEffect(() => {
    const onHealthCheck = (message: WebsocketHealthcheck) => {
      console.log(`Healthcheck received`, message);
      setHealthcheck(message);
    };

    return client?.on('healthcheck', onHealthCheck);
  }, [client]);

  // keep track on calls created in meantime
  // FIXME: ideally, this event should fire on 'JoinCall'
  // useEffect(() => {
  //   const onCallCreated = (e: CallCreated) => {
  //     setCurrentCall(e.call);
  //   };
  //   return client?.on('callCreated', onCallCreated);
  // }, [client, currentUser]);
  //
  // // keep track on audio/video mute/unmute events
  // useEffect(() => {
  //   const handleMute = (e: AudioMuted) => {
  //     const isCurrentUserMute =
  //       e.target.oneofKind === 'allUsers'
  //         ? e.target.allUsers
  //         : e.target.oneofKind === 'userId'
  //         ? e.target.userId === currentUser
  //         : false;
  //     if (isCurrentUserMute) {
  //       setHasAudio(false);
  //     }
  //   };
  //   const handleUnmute = (e: AudioUnmuted) => {
  //     if (e.userId === currentUser) {
  //       setHasAudio(true);
  //     }
  //   };
  //
  //   const handleVideoStopped = (e: VideoStarted) => {
  //     if (e.userId === currentUser) {
  //       setHasVideo(false);
  //     }
  //   };
  //   const handleVideoStarted = (e: VideoStopped) => {
  //     if (e.userId === currentUser) {
  //       setHasVideo(true);
  //     }
  //   };
  //
  //   client?.on('audioMuted', handleMute);
  //   client?.on('audioUnmuted', handleUnmute);
  //   client?.on('videoStopped', handleVideoStopped);
  //   client?.on('videoStarted', handleVideoStarted);
  //   return () => {
  //     client?.off('audioMuted', handleMute);
  //     client?.off('audioUnmuted', handleUnmute);
  //     client?.off('videoStopped', handleVideoStopped);
  //     client?.off('videoStarted', handleVideoStarted);
  //   };
  // }, [client, currentUser]);

  useEffect(() => {
    if (!healthcheck || !currentUser) return;
    const payload: WebsocketHealthcheck = {
      ...healthcheck,
      // FIXME OL: workaround around missing optionality
      callId: activeCall.id,
      callType: activeCall.type,
      audio: true,
      video: true,
    };

    client?.setHealthcheckPayload(payload);
    return () => {
      // FIXME OL: we need better way to handle HealthCheck modes
      const plainHealthcheck: WebsocketHealthcheck = {
        ...healthcheck,
        callId: '',
        callType: '',
        video: false,
        audio: false,
      };
      client?.setHealthcheckPayload(plainHealthcheck);
    };
  }, [client, activeCall.id, activeCall.type, currentUser, healthcheck]);

  return null;
};
