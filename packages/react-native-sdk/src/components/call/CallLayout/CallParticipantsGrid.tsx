import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LocalParticipantView } from '../../participants/LocalParticipantView';
import { useCallStateHooks } from '@stream-io/video-react-bindings';
import { useDebouncedValue } from '../../../utils/hooks/useDebouncedValue';
import { CallParticipantsList } from '../CallParticipantsList';
import { ComponentTestIds } from '../../../constants/TestIds';

export const CallParticipantsGrid = () => {
  const { useRemoteParticipants, useParticipants } = useCallStateHooks();
  const _remoteParticipants = useRemoteParticipants();
  const allParticipants = useParticipants();
  const remoteParticipants = useDebouncedValue(_remoteParticipants, 300); // we debounce the remote participants to avoid unnecessary rerenders that happen when participant tracks are all subscribed simultaneously

  const showFloatingView = remoteParticipants.length < 3;
  const isUserAloneInCall = remoteParticipants?.length === 0;
  const participants = showFloatingView ? remoteParticipants : allParticipants;

  if (showFloatingView && isUserAloneInCall) {
    return <LocalParticipantView layout={'fullscreen'} />;
  }

  return (
    <View
      style={styles.container}
      testID={ComponentTestIds.CALL_PARTICIPANTS_GRID}
    >
      {showFloatingView && <LocalParticipantView layout={'floating'} />}
      <CallParticipantsList participants={participants} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
