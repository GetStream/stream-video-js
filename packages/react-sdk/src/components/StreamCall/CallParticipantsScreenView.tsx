import { Call, SfuModels } from '@stream-io/video-client';
import { useParticipants } from '@stream-io/video-react-bindings';
import { ParticipantBox } from './ParticipantBox';
import { Video } from './Video';

export const CallParticipantsScreenView = (props: { call: Call }) => {
  const { call } = props;
  const allParticipants = useParticipants();
  const firstScreenSharingParticipant = allParticipants.find((p) =>
    p.publishedTracks.includes(SfuModels.TrackType.SCREEN_SHARE),
  );
  return (
    <div className="str-video__call-participants-screen-view">
      <div className="str-video__call-participants-screen-view__screen">
        <Video
          stream={firstScreenSharingParticipant?.screenShareStream}
          className="str-video__screen-share"
          autoPlay
          muted
        />
      </div>
      <div className="str-video__call-participants-screen-view__participants">
        {allParticipants.map((participant) => (
          <ParticipantBox
            key={participant.sessionId}
            participant={participant}
            call={call}
          />
        ))}
      </div>
    </div>
  );
};
