import { Call, SfuModels } from '@stream-io/video-client';
import {
  useLocalParticipant,
  useParticipants,
} from '@stream-io/video-react-bindings';
import { ParticipantBox } from './ParticipantBox';
import { Video } from './Video';
import clsx from 'clsx';

export const CallParticipantsScreenView = (props: { call: Call }) => {
  const { call } = props;
  const localParticipant = useLocalParticipant();
  const allParticipants = useParticipants();
  const firstScreenSharingParticipant = allParticipants.find((p) =>
    p.publishedTracks.includes(SfuModels.TrackType.SCREEN_SHARE),
  );

  return (
    <div className="str-video__call-participants-screen-view">
      <div className="str-video__call-participants-screen-view__screen">
        {firstScreenSharingParticipant && (
          <>
            <Video
              participant={firstScreenSharingParticipant}
              call={call}
              kind="screen"
              className="str-video__screen-share"
              autoPlay
              muted
            />
            <span className="str-video__call-participants-screen-view__screen__presenter">
              {firstScreenSharingParticipant.userId} is presenting their screen
            </span>
          </>
        )}
      </div>
      <div
        className={clsx(
          `str-video__call-participants-screen-view__participants`,
          `columns-${Math.min(Math.ceil(allParticipants.length / 4), 3)}`,
        )}
      >
        {allParticipants.map((participant) => (
          <ParticipantBox
            key={participant.sessionId}
            participant={participant}
            call={call}
            isMuted={participant.isLoggedInUser}
            sinkId={localParticipant?.audioOutputDeviceId}
          />
        ))}
      </div>
    </div>
  );
};
