import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  Lobby,
  useCall,
  useCallStateHooks,
} from '@stream-io/video-react-native-sdk';

import { TestIds } from '../testIds';
import { styles as common } from './styles';

type Props = {
  onClose: () => void;
  onJoined: () => void;
};

/** The SDK's `Lobby`, under a header with a close button and the number of people on the call. */
export const LobbyScreen = ({ onClose, onJoined }: Props) => {
  const call = useCall();
  const { useParticipantCount } = useCallStateHooks();
  const participantCount = useParticipantCount();
  const [error, setError] = useState<string>();

  useEffect(() => {
    // Loads the call (and watches it), so the lobby can show who is already there.
    call?.getOrCreate().catch((e) => setError(String(e)));
  }, [call]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          hitSlop={12}
          testID={TestIds.lobby.closeButton}
          onPress={onClose}
        >
          <Text style={common.text}>✕</Text>
        </Pressable>
        <Text
          style={common.text}
          testID={TestIds.lobby.participantsCount(participantCount)}
        >
          {`On call: ${participantCount}`}
        </Text>
      </View>
      {error && <Text style={common.error}>{error}</Text>}
      <Lobby onJoinCallHandler={onJoined} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
});
