import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { ParticipantView } from './ParticipantView';
import { LocalVideoView } from './LocalVideoView';
import { useRemoteParticipants } from '@stream-io/video-react-bindings';
import { StreamVideoParticipant } from '@stream-io/video-client';

type SizeType = React.ComponentProps<typeof ParticipantView>['size'];

enum Modes {
  /**
   * The modes represent the different layouts that can be used to display the participant videos.
   * The modes are:
   * - `full`: Full screen mode. Only one participant is shown at a time.
   * - `half`: Half screen mode. Two participants are shown at a time.
   * - `quarter`: Quarter screen mode. Four participants ""
   * - `fifth`: Fifth screen mode. Five participants ""
   */
  full = 'full',
  half = 'half',
  quarter = 'quarter',
  fifth = 'fifth',
}

const activeCallAllParticipantsLengthToMode: { [key: number]: Modes } = {
  /**
   * A lookup table that maps the number of all participants (inc. user)
   * in a call to the mode that should be used to display the participants.
   */
  1: Modes.full,
  2: Modes.full,
  3: Modes.half,
  4: Modes.quarter,
  5: Modes.fifth,
};

const modeToSize: { [key in Modes]: SizeType | undefined } = {
  /**
   * A look-up table to map the mode to the size of the participant video.
   * The size is used to determine the size of the participant video.
   * The sizes are:
   *  - `xl`: Full screen size.
   *  - `large`: Half screen size.
   *  - `medium`: Quarter screen size.
   *  - `small`: Sixth screen size.
   *
   *  **Note:** The size small is only used in the `fifth` mode.
   *  In the other modes the size is determined by the mode/number of participants.
   */
  [Modes.full]: 'xl',
  [Modes.half]: 'large',
  [Modes.quarter]: 'medium',
  [Modes.fifth]: undefined,
};

const localVideoVisibleModes = [Modes.full, Modes.half];

const putRemoteParticipantsInView = (
  remoteParticipants: StreamVideoParticipant[],
) => {
  const speakingParticipants = remoteParticipants.filter(
    (participant) => participant.isDominantSpeaker || participant.isSpeaking,
  );

  const notSpeakingParticipants = remoteParticipants.filter(
    (participant) => !participant.isSpeaking && !participant.isDominantSpeaker,
  );

  return [...speakingParticipants, ...notSpeakingParticipants];
};

/**
 * CallParticipantsView is a component that displays the participants in a call.
 * This component supports the rendering of up to 5 participants.
 *
 * | 2 Participants | 3 Participants | 4 Participants | 5 Participants |
 * | :--- | :--- | :--- | :----: |
 * |![call-participants-view-1](https://user-images.githubusercontent.com/25864161/217495022-b1964df9-fd4a-4ed9-924a-33fc9d2040fd.png) | ![call-participants-view-2](https://user-images.githubusercontent.com/25864161/217495029-e2e44d11-64c0-4eb2-9efa-d86c1875be55.png) | ![call-participants-view-3](https://user-images.githubusercontent.com/25864161/217495037-835c3b9b-3380-4f09-8776-14e2989a76db.png) | ![call-participants-view-4](https://user-images.githubusercontent.com/25864161/217495043-17081d48-c92c-4f4f-937c-c0696172e1d3.png) |
 */
export const CallParticipantsView = () => {
  let remoteParticipants = useRemoteParticipants();
  //todo: SG add dominantSpeakerOnlyVisible mode
  // const remoteParticipantsInView = useMemo(
  //   () => putRemoteParticipantsInView(remoteParticipants),
  //   [remoteParticipants],
  // );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <LocalVideoView />
      {remoteParticipants.map((participant) => {
        const { userId } = participant;
        return (
          <ParticipantView
            key={`${userId}/${participant.sessionId}`}
            participant={participant}
            containerStyle={{
              flex: 1,
              height: 200,
              flexBasis: '50%',
              flexGrow: 1,
            }}
            kind="video"
          />
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000',
    flexWrap: 'wrap',
    flexDirection: 'row',
  },
});
