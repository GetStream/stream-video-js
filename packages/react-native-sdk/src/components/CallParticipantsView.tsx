import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { ParticipantView } from './ParticipantView';
import { LocalVideoView } from './LocalVideoView';
import {
  useLocalParticipant,
  useRemoteParticipants,
} from '@stream-io/video-react-bindings';
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

const participantSwappingLogic = (
  remoteParticipants: StreamVideoParticipant[],
) => {
  const data = [...remoteParticipants];
  const isSpeakingParticipant = data.filter(
    (participant) => participant.isSpeaking && !participant.isDominantSpeaker,
  );
  const notIsSpeakingParticipants = data.filter(
    (participant) => !participant.isSpeaking,
  );

  if (isSpeakingParticipant)
    remoteParticipants = [
      ...isSpeakingParticipant,
      ...notIsSpeakingParticipants,
    ];

  return remoteParticipants;
};

/**
 * CallParticipantsView is a component that displays the participants in a call.
 * This component supports the rendering of up to 5 participants.
 */
export const CallParticipantsView = () => {
  const remoteParticipants = useRemoteParticipants();
  const localParticipant = useLocalParticipant();

  const mainRemoteParticipants = participantSwappingLogic(remoteParticipants);
  const mainParticipants = [localParticipant, ...mainRemoteParticipants];

  const mode =
    activeCallAllParticipantsLengthToMode[mainParticipants.length] ||
    Modes.fifth;

  const isUserIsAloneInCall = mainParticipants.length === 1;

  const isLocalVideoVisible = useMemo(
    () => localVideoVisibleModes.includes(mode) && !isUserIsAloneInCall,
    [mode, isUserIsAloneInCall],
  );
  const showUserInParticipantView = !isLocalVideoVisible;
  const filteredParticipants = showUserInParticipantView
    ? mainParticipants
    : mainRemoteParticipants;

  if (mainParticipants.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <LocalVideoView isVisible={isLocalVideoVisible} />
      {filteredParticipants.map((participant, index) => {
        if (participant) {
          const { userId } = participant;
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
              key={`${userId}/${participant.sessionId}`}
              participantId={userId}
              size={size}
            />
          );
        }
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
