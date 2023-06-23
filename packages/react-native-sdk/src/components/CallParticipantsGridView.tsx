import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LocalVideoView } from './LocalVideoView';
import { useRemoteParticipants } from '@stream-io/video-react-bindings';
import { useDebouncedValue } from '../utils/hooks/useDebouncedValue';
import { CallParticipantsList } from './CallParticipantsList';

export const CallParticipantsGridView = () => {
  const _remoteParticipants = useRemoteParticipants();
  const remoteParticipants = useDebouncedValue(_remoteParticipants, 300); // we debounce the remote participants to avoid unnecessary rerenders that happen when participant tracks are all subscribed simultaneously

  const isUserAloneInCall = remoteParticipants?.length === 0;

  if (isUserAloneInCall) {
    return <LocalVideoView layout={'fullscreen'} />;
  }

  return (
    <View style={styles.container}>
      <LocalVideoView layout={'floating'} />
      <CallParticipantsList participants={remoteParticipants} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
