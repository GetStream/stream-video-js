import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  CallContent,
  useCallStateHooks,
} from '@stream-io/video-react-native-sdk';

import { TestIds } from '../testIds';
import { styles as common } from './styles';

type Props = {
  onCallEnded: () => void;
};

/** The SDK's `CallContent`, under a badge with the number of people on the call. */
export const CallScreen = ({ onCallEnded }: Props) => {
  const { useParticipantCount } = useCallStateHooks();
  const participantCount = useParticipantCount();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={common.text} testID={TestIds.call.participantsCountBadge}>
          {String(participantCount)}
        </Text>
      </View>
      <CallContent onHangupCallHandler={onCallEnded} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
});
