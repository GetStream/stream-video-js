import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LocalParticipantView } from '../../participants/LocalParticipantView';
import {
  useParticipants,
  useRemoteParticipants,
} from '@stream-io/video-react-bindings';
import { useDebouncedValue } from '../../../utils/hooks/useDebouncedValue';
import { CallParticipantsListView } from '../../call/CallParticipantsListView';
import { A11yComponents } from '../../../constants/A11yLabels';

export const CallParticipantsGridView = () => {
  const _remoteParticipants = useRemoteParticipants();
  const allParticipants = useParticipants();
  const remoteParticipants = useDebouncedValue(_remoteParticipants, 300); // we debounce the remote participants to avoid unnecessary rerenders that happen when participant tracks are all subscribed simultaneously

  const isUserAloneInCall = remoteParticipants?.length === 0;

  if (isUserAloneInCall) {
    return <LocalParticipantView layout={'fullscreen'} />;
  }

  const showFloatingView = remoteParticipants.length < 3;
  const participants = showFloatingView ? remoteParticipants : allParticipants;

  return (
    <View
      style={styles.container}
      accessibilityLabel={A11yComponents.CALL_PARTICIPANTS_GRID_VIEW}
    >
      {showFloatingView && <LocalParticipantView layout={'floating'} />}
      <CallParticipantsListView participants={participants} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
