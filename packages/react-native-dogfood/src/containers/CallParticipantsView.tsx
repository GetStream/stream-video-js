import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import CallParticipantView, {
  SizeType,
} from '../components/Participants/CallParticipantView';
import { useAppGlobalStoreValue } from '../contexts/AppContext';
import { useObservableValue } from '../hooks/useObservable';
import { LocalVideoView } from '@stream-io/video-react-native-sdk';
import { useStore } from '../hooks/useStore';

enum Modes {
  full = 'full',
  half = 'half',
  quarter = 'quarter',
  fifth = 'fifth',
}

const activeCallAllParticipantsLengthToMode: { [key: number]: Modes } = {
  1: Modes.full,
  2: Modes.half,
  3: Modes.half,
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
  const { activeCallAllParticipants$ } = useStore();
  const allParticipants = useObservableValue(activeCallAllParticipants$);
  const loopbackMyVideo = useAppGlobalStoreValue(
    (store) => store.loopbackMyVideo,
  );

  const mode = useMemo(
    () =>
      activeCallAllParticipantsLengthToMode[allParticipants.length] ||
      Modes.fifth,
    [allParticipants.length],
  );

  const isUserIsAloneInCall = allParticipants.length === 1;
  const isLocalVideoVisible = useMemo(
    () => localVideoVisibleModes.includes(mode) && !isUserIsAloneInCall,
    [mode, isUserIsAloneInCall],
  );

  const showUserInParticipantView = useMemo(
    () => loopbackMyVideo || !isLocalVideoVisible,
    [loopbackMyVideo, isLocalVideoVisible],
  );

  const filteredParticipants = useMemo(() => {
    return showUserInParticipantView
      ? allParticipants
      : allParticipants.filter((p) => !p.isLoggedInUser);
  }, [loopbackMyVideo, allParticipants]);

  if (allParticipants.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <LocalVideoView isVisible={isLocalVideoVisible} />
      {filteredParticipants.map((participant, index) => {
        const userId = participant.user!.id;
        const calculateFiveOrMoreParticipantsSize = (i: number) =>
          i > 1 ? 'small' : 'medium';
        const size =
          modeToSize[mode] || calculateFiveOrMoreParticipantsSize(index);
        return (
          <CallParticipantView
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
    marginBottom: -20,
  },
});
export default CallParticipantsView;
