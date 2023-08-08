import React from 'react';
import { CallParticipantsGrid } from './internal/CallParticipantsGrid';
import { CallParticipantsSpotlight } from './internal/CallParticipantsSpotlight';
import {
  useCall,
  useHasOngoingScreenShare,
} from '@stream-io/video-react-bindings';
import { StyleSheet, View } from 'react-native';

export type CallContentProps = {
  /**
   * The mode of the call view. Defaults to 'grid'.
   * Note: when there is atleast one screen share, the mode is automatically set to 'spotlight'.
   */
  mode?: 'grid' | 'spotlight';
};

/**
 * The main view of an active call which lists the participants.
 * This view renders the participants in either grid or spotlight mode.
 * @param mode The mode of the call view. Defaults to 'grid'.
 */
export const CallContent = ({ mode }: CallContentProps) => {
  const hasScreenShare = useHasOngoingScreenShare();
  const callType = useCall()?.type;

  const showSpotLightMode =
    callType !== 'audio_room' && (mode === 'spotlight' || hasScreenShare);

  return (
    <View style={styles.container}>
      {showSpotLightMode ? (
        <CallParticipantsSpotlight />
      ) : (
        <CallParticipantsGrid />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
