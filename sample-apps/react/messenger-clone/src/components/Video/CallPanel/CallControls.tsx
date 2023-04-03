import {
  Call,
  SfuModels,
  StreamVideoLocalParticipant,
} from '@stream-io/video-react-sdk';
import {
  LocalPhone,
  Mic,
  MicOff,
  PhoneDisabled,
  Videocam,
  VideocamOff,
} from '@mui/icons-material';

type OutgoingCallControlsProps = {
  call: Call;
};

export const OutgoingCallControls = ({ call }: OutgoingCallControlsProps) => {
  return (
    <div className="rmc__button-controls">
      <button
        className="rmc__button rmc__button--red"
        onClick={() => call.cancel()}
      >
        <PhoneDisabled />
      </button>
    </div>
  );
};

type IncomingCallControlsProps = {
  call: Call;
};
export const IncomingCallControls = ({ call }: IncomingCallControlsProps) => {
  return (
    <div className="rmc__button-controls">
      <button
        className="rmc__button rmc__button--green"
        onClick={() => call.accept()}
      >
        <LocalPhone />
      </button>
      <button
        className="rmc__button rmc__button--red"
        onClick={() => call.reject()}
      >
        <PhoneDisabled />
      </button>
    </div>
  );
};

type ActiveCallControlsProps = {
  activeCall?: Call;
  localParticipant?: StreamVideoLocalParticipant;
  publishAudioStream: () => Promise<void>;
  publishVideoStream: () => Promise<void>;
};
export const ActiveCallControls = ({
  activeCall,
  localParticipant,
  publishAudioStream,
  publishVideoStream,
}: ActiveCallControlsProps) => {
  const isAudioMute = !localParticipant?.publishedTracks.includes(
    SfuModels.TrackType.AUDIO,
  );
  const isVideoMute = !localParticipant?.publishedTracks.includes(
    SfuModels.TrackType.VIDEO,
  );
  return (
    <div className="rmc__button-controls">
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
          if (activeCall) {
            activeCall.cancel();
          }
        }}
      >
        <PhoneDisabled />
      </button>
    </div>
  );
};
