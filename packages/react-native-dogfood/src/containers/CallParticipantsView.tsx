import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import CallParticipantView, {
  SizeType,
} from '../components/Participants/CallParticipantView';
import LocalVideoView from '../components/Participants/LocalVideoView';

type CallParticipantsViewProps = {};

const PARTICIPANTS = [
  {
    id: 1,
  },
  {
    id: 2,
  },
  {
    id: 3,
  },
  {
    id: 4,
  },
  {
    id: 5,
  },
];

enum Modes {
  full = 'full',
  half = 'half',
  quarter = 'quarter',
  fifth = 'fifth',
}

const activeCallAllParticipantsLengthToMode: { [key: number]: Modes } = {
  1: Modes.full,
  2: Modes.half,
  4: Modes.quarter,
  5: Modes.fifth,
};

const modeToSize: { [key in Modes]: SizeType | undefined } = {
  [Modes.full]: 'xl',
  [Modes.half]: 'large',
  [Modes.quarter]: 'medium',
  [Modes.fifth]: undefined,
};

const localVideoVisibleModes = [Modes.full, Modes.half];

const CallParticipantsView = () => {
  const mode = useMemo(
    () =>
      activeCallAllParticipantsLengthToMode[PARTICIPANTS.length] || Modes.fifth,
    [PARTICIPANTS.length],
  );

  const isLocalVideoVisible = useMemo(
    () => localVideoVisibleModes.includes(mode),
    [localVideoVisibleModes, mode],
  );
  return (
    <View style={styles.container}>
      <LocalVideoView isVisible={isLocalVideoVisible} />
      {PARTICIPANTS.map((participant, index) => {
        const calculateFiveOrMoreParticipantsSize = (i: number) =>
          i > 1 ? 'small' : 'medium';
        const size =
          modeToSize[mode] || calculateFiveOrMoreParticipantsSize(index);
        return <CallParticipantView key={participant.id} size={size} />;
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#d333ff',
    flex: 1,
    flexWrap: 'wrap',
    paddingBottom: 16,
  },
});
export default CallParticipantsView;
