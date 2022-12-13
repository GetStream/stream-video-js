import {
  useActiveCall,
  useIncomingCalls,
  useLocalParticipant,
  useOutgoingCalls,
  usePendingCalls,
  useRemoteParticipants,
  useStreamVideoClient,
} from '@stream-io/video-react-bindings';

import {
  PhoneDisabled,
  LocalPhone,
  MicOff,
  Mic,
  Videocam,
  VideocamOff,
} from '@mui/icons-material';

import {
  ParticipantBox,
  useMediaPublisher,
  DeviceSelector,
  useMediaDevices,
  useLocalMediaStreamsContext,
} from '@stream-io/video-react-sdk';

import { CallCreated, SfuModels } from '@stream-io/video-client';
import { useChatContext } from 'stream-chat-react';
import { ComponentProps, useMemo } from 'react';
import { CallEnvelope } from '@stream-io/video-client/dist/src/gen/video/coordinator/client_v1_rpc/envelopes';

type ButtonControlsProps = {
  publishAudioStream: () => Promise<void>;
  publishVideoStream: () => Promise<void>;
  incomingCall?: CallCreated;
  outgoingCall?: CallEnvelope;
};

const ButtonControls = ({
  incomingCall,
  outgoingCall,
  publishAudioStream,
  publishVideoStream,
}: ButtonControlsProps) => {
  const videoClient = useStreamVideoClient();
  const activeCall = useActiveCall();

  const {
    audioDevices,
    videoDevices,
    switchDevice,
    selectedAudioDeviceId,
    selectedVideoDeviceId,
  } = useMediaDevices();

  const localParticipant = useLocalParticipant();

  const isAudioMute = !localParticipant?.publishedTracks.includes(
    SfuModels.TrackType.AUDIO,
  );
  const isVideoMute = !localParticipant?.publishedTracks.includes(
    SfuModels.TrackType.VIDEO,
  );

  return (
    <div className="rmc__button-controls">
      <DeviceSelector
        devices={audioDevices}
        label="Select a Mic"
        selectedDeviceId={selectedAudioDeviceId}
        onChange={(deviceId) => {
          switchDevice('audioinput', deviceId);
        }}
      />
      <DeviceSelector
        devices={videoDevices}
        label="Select a Camera"
        selectedDeviceId={selectedVideoDeviceId}
        onChange={(deviceId) => {
          switchDevice('videoinput', deviceId);
        }}
      />
      {incomingCall && !activeCall && !outgoingCall && (
        <>
          <button
            className="rmc__button rmc__button--green"
            onClick={() => videoClient.acceptCall(incomingCall.call.callCid)}
          >
            <LocalPhone />
          </button>
          <button
            className="rmc__button rmc__button--red"
            onClick={() => videoClient.rejectCall(incomingCall.call.callCid)}
          >
            <PhoneDisabled />
          </button>
        </>
      )}
      {outgoingCall && !activeCall && (
        <button
          className="rmc__button rmc__button--red"
          onClick={() => videoClient.cancelCall(outgoingCall.call.callCid)}
        >
          <PhoneDisabled />
        </button>
      )}
      {activeCall && (
        <>
          <button
            className="rmc__button rmc__button--transparent"
            onClick={() => {
              if (isAudioMute) {
                void publishAudioStream();
              } else {
                void activeCall?.stopPublish(SfuModels.TrackType.AUDIO);
              }
            }}
          >
            {isAudioMute ? <MicOff /> : <Mic />}
          </button>
          <button
            className="rmc__button rmc__button--transparent"
            onClick={() => {
              if (isVideoMute) {
                void publishVideoStream();
              } else {
                void activeCall?.stopPublish(SfuModels.TrackType.VIDEO);
              }
            }}
          >
            {isVideoMute ? <VideocamOff /> : <Videocam />}
          </button>
          <button
            className="rmc__button rmc__button--red"
            onClick={() => {
              videoClient.cancelCall(activeCall.data.call.callCid);
            }}
          >
            <PhoneDisabled />
          </button>
        </>
      )}
    </div>
  );
};

const Placeholder = ({
  className,
  src,
}: Pick<ComponentProps<'div'>, 'className'> & {
  src?: string;
}) => {
  return (
    <div className={className}>
      {src && (
        <>
          <img
            alt="participant-placeholder"
            className="rmc__participant-placeholder--avatar"
            src={src}
          />
          <div className="rmc__participant-placeholder--backdrop" />
          <img
            alt="participant-placeholder-background"
            className="rmc__participant-placeholder--avatar-background"
            src={src}
          />
        </>
      )}
    </div>
  );
};

export const CallPanel = () => {
  const activeCall = useActiveCall();
  const [remoteParticipant] = useRemoteParticipants();
  const localParticipant = useLocalParticipant();

  const pendingCalls = usePendingCalls();
  const incomingCalls = useIncomingCalls();
  const [outgoingCall] = useOutgoingCalls();

  const { localAudioStream, localVideoStream } = useLocalMediaStreamsContext();

  const { client } = useChatContext();

  const [unconnectedParticipant] = useMemo(() => {
    if (!activeCall?.data.users || !client.user.id) return [];

    return Object.values(activeCall?.data.users).filter(
      (u) => u.id !== client.user.id,
    );
  }, [activeCall?.data.users, client.user.id]);

  const { publishAudioStream, publishVideoStream } = useMediaPublisher({
    call: activeCall,
  });

  if (!(pendingCalls.length || activeCall)) return null;

  return (
    <div className="rmc__call-panel-backdrop">
      <div className="rmc__call-panel">
        <div className="rmc__secondary-participant-wrapper">
          <ParticipantBox
            isMuted={true}
            // @ts-ignore
            participant={
              localParticipant ?? {
                audioStream: localAudioStream,
                videoStream: localVideoStream,
                userId: client.user.id,
              }
            }
            call={activeCall}
          />
        </div>

        <div className="rmc__primary-participant-wrapper">
          {remoteParticipant && (
            <ParticipantBox participant={remoteParticipant} call={activeCall} />
          )}
          {!remoteParticipant && (
            <Placeholder
              className="rmc__primary-participant-placeholder"
              src={unconnectedParticipant?.imageUrl}
            />
          )}
        </div>

        <ButtonControls
          publishAudioStream={publishAudioStream}
          publishVideoStream={publishVideoStream}
          incomingCall={incomingCalls[0]}
          outgoingCall={outgoingCall}
        />
      </div>
    </div>
  );
};
