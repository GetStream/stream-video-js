import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { ParticipantView, SizeType } from './ParticipantView';
import { LocalVideoView } from './LocalVideoView';
import { useParticipants } from '@stream-io/video-react-bindings';

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
  2: Modes.half,
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

export const CallParticipantsView: React.FC = () => {
  /**
   * CallParticipantsView is a component that displays the participants in a call.
   * This component supports the rendering of up to 5 participants.
   */

  const allParticipants = useParticipants();
  const mode = useMemo(
    () =>
      activeCallAllParticipantsLengthToMode[allParticipants.length] ||
      Modes.fifth,
    [allParticipants.length],
  );

  const isUserIsAloneInCall = allParticipants.length === 1;
  const isLocalVideoVisible = 
    () => (mode === Modes.full || mode === Modes.half)  && !isUserIsAloneInCall,
  );
  const showUserInParticipantView = !isLocalVideoVisible;
  const filteredParticipants = useMemo(() => {
    return showUserInParticipantView
      ? allParticipants
      : allParticipants.filter((p) => !p.isLoggedInUser);
  }, [showUserInParticipantView, allParticipants]);

  if (allParticipants.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <LocalVideoView isVisible={isLocalVideoVisible} />
      {filteredParticipants.map((participant, index) => {
        const userId = participant.user!.id;
        // The size of the participant video is determined by the mode/amount of participants.
        // When the mode is `fifth` the size is determined by the index of the participant.
        // The first 2 participants are shown in `medium` size and the last 3
        // participants are shown in `small` size.
        const calculateFiveOrMoreParticipantsSize = (i: number) =>
          i > 1 ? 'small' : 'medium';
        const size =
          modeToSize[mode] || calculateFiveOrMoreParticipantsSize(index);
        return (
          <ParticipantView
            index={index}
            key={`${userId}/${participant.sessionId}`}
            participant={participant}
            size={size}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000',
    flex: 1,
    flexWrap: 'wrap',
  },
});
