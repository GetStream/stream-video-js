import React from 'react';
import { CallParticipantsGridView } from './CallParticipantsGridView';
import { CallParticipantsSpotlightView } from './CallParticipantsSpotlightView';
import { useHasOngoingScreenShare } from '@stream-io/video-react-bindings';
import { StyleSheet, View } from 'react-native';

type CallParticipantsViewProps = {
  /**
   * The mode of the call view. Defaults to 'grid'.
   * Note: when there is atleast one screen share, the mode is automatically set to 'spotlight'.
   */
  mode?: 'grid' | 'spotlight';
};

export const CallParticipantsView = ({ mode }: CallParticipantsViewProps) => {
  const hasScreenShare = useHasOngoingScreenShare();

  const showSpotLightModeView = mode === 'spotlight' || hasScreenShare;

  return (
    <View style={styles.container}>
      {showSpotLightModeView ? (
        <CallParticipantsSpotlightView />
      ) : (
        <CallParticipantsGridView />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
