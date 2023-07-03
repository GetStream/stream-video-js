import React from 'react';
import { CallParticipantsGridView } from './internal/CallParticipantsGridView';
import { CallParticipantsSpotlightView } from './internal/CallParticipantsSpotlightView';
import { useHasOngoingScreenShare } from '@stream-io/video-react-bindings';
import { StyleSheet, View } from 'react-native';

type CallContentViewProps = {
  /**
   * The mode of the call view. Defaults to 'grid'.
   * Note: when there is atleast one screen share, the mode is automatically set to 'spotlight'.
   */
  mode?: 'grid' | 'spotlight';
};

/**
 * The main view of an active call.
 * This view renders the participants in either grid or spotlight mode.
 * @param mode The mode of the call view. Defaults to 'grid'.
 */
export const CallContentView = ({ mode }: CallContentViewProps) => {
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
