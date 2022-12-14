import {
  useActiveCall,
  useIncomingCalls,
  useLocalParticipant,
  usePendingCalls,
  useRemoteParticipants,
  useStreamVideoClient,
} from '@stream-io/video-react-bindings';

import {
  LocalPhone,
  Mic,
  MicOff,
  PhoneDisabled,
  Videocam,
  VideocamOff,
} from '@mui/icons-material';

import {
  DeviceSelector,
  ParticipantBox,
  useMediaDevices,
  useMediaPublisher,
} from '@stream-io/video-react-sdk';

import { CallCreated, SfuModels } from '@stream-io/video-client';
import { useChatContext } from 'stream-chat-react';
import { ComponentProps, useMemo } from 'react';

type ButtonControlsProps = {
  publishAudioStream: () => Promise<void>;
  publishVideoStream: () => Promise<void>;
  incomingCall?: CallCreated;
};

const ButtonControls = ({
  incomingCall,
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
      {incomingCall && !activeCall && (
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

export const CallPannelOuter = () => {
  const activeCall = useActiveCall();

  if (!activeCall) return <div>placeholder</div>;

  return <CallPanel />;
};

const CallPanel = () => {
  const activeCall = useActiveCall();
  const [remoteParticipant] = useRemoteParticipants();
  const localParticipant = useLocalParticipant();

  const pendingCalls = usePendingCalls();
  const incomingCalls = useIncomingCalls();

  const { selectedAudioDeviceId, selectedVideoDeviceId } = useMediaDevices();

  const { client } = useChatContext();

  const [unconnectedParticipant] = useMemo(() => {
    if (!activeCall?.data.users || !client.user.id) return [];

    return Object.values(activeCall?.data.users).filter(
      (u) => u.id !== client.user.id,
    );
  }, [activeCall?.data.users, client.user.id]);

  const { publishAudioStream, publishVideoStream } = useMediaPublisher({
    call: activeCall,
    audioDeviceId: selectedAudioDeviceId,
    videoDeviceId: selectedVideoDeviceId,
  });

  if (!(pendingCalls.length || activeCall)) return null;

  return (
    <div className="rmc__call-panel-backdrop">
      <div className="rmc__call-panel">
        <div className="rmc__secondary-participant-wrapper">
          {localParticipant && (
            <ParticipantBox
              isMuted={true}
              participant={localParticipant}
              call={activeCall}
            />
          )}
          {!localParticipant && (
            <Placeholder
              className="rmc__secondary-participant-placeholder"
              src={client.user.image}
            />
          )}
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
        />
      </div>
    </div>
  );
};
