// import { useEffect, useState } from 'react';
// import { useStreamVideoClient } from '../StreamVideo';
import { Call } from '@stream-io/video-client';

export const Ping = (props: { currentUser?: string; currentCall?: Call }) => {
  // const { currentUser } = props;
  // const client = useStreamVideoClient();
  //
  // // FIXME: OL should be initialized with value coming from user default preferences
  // const [hasAudio, setHasAudio] = useState(true);
  // const [hasVideo, setHasVideo] = useState(true);
  //
  // const [healthcheck, setHealthcheck] = useState<Healthcheck>();
  // const [currentCall, setCurrentCall] = useState<Call | undefined>(
  //   props.currentCall,
  // );
  //
  // // keep track of server-side updates
  // useEffect(() => {
  //   const onHealthCheck = (message: Healthcheck) => {
  //     console.log(`Healthcheck received`, message);
  //     setHealthcheck(message);
  //   };
  //
  //   return client?.on('healthCheck', onHealthCheck);
  // }, [client]);
  //
  // // keep track on calls created in meantime
  // // FIXME: ideally, this event should fire on 'JoinCall'
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
  //
  // useEffect(() => {
  //   if (!healthcheck || !currentUser) return;
  //   const payload: Healthcheck = {
  //     ...healthcheck,
  //     // FIXME OL: workaround around missing optionality
  //     callId: currentCall?.id ?? '',
  //     callType: currentCall?.type ?? 'video',
  //     audio: hasAudio,
  //     video: hasVideo,
  //   };
  //
  //   client?.setHealthcheckPayload(Healthcheck.toBinary(payload));
  //   return () => {
  //     // FIXME OL: we need better way to handle HealthCheck modes
  //     const plainHealthcheck: Healthcheck = {
  //       ...healthcheck,
  //       callId: '',
  //       callType: '',
  //       video: false,
  //       audio: false,
  //     };
  //     client?.setHealthcheckPayload(Healthcheck.toBinary(plainHealthcheck));
  //   };
  // }, [
  //   client,
  //   currentCall?.id,
  //   currentCall?.type,
  //   currentUser,
  //   hasAudio,
  //   hasVideo,
  //   healthcheck,
  // ]);

  return null;
};
