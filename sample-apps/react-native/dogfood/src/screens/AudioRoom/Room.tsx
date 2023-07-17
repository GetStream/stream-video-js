import React, { useEffect } from 'react';
import {
  CallingState,
  OwnCapability,
  SfuModels,
  useCall,
  useCallCallingState,
  useIncallManager,
} from '@stream-io/video-react-native-sdk';
import { Pressable, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ControlsPanel } from '../../components/AudioRoom/ControlsPanel';
import { PermissionRequestsPanel } from '../../components/AudioRoom/PermissionRequestsPanel';
import { ParticipantsPanel } from '../../components/AudioRoom/ParticipantsPanel';
import { DescriptionPanel } from '../../components/AudioRoom/DescriptionPanel';

export default function Room({ onClose }: { onClose: () => void }) {
  useIncallManager({ media: 'audio', auto: true });
  const callingState = useCallCallingState();
  const call = useCall();

  // when the call ends, close the room component
  useEffect(() => {
    if (callingState === CallingState.LEFT) {
      onClose();
    }
  }, [callingState, onClose]);

  useEffect(() => {
    if (!call) {
      return;
    }

    return call.on('error', (e) => {
      if (e.eventPayload.oneofKind !== 'error') {
        return;
      }
      if (e.eventPayload.error.error?.code !== SfuModels.ErrorCode.LIVE_ENDED) {
        return;
      }
      if (
        !call.permissionsContext.hasPermission(OwnCapability.JOIN_BACKSTAGE)
      ) {
        onClose();
      }
    });
  }, [call, onClose]);

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.container}>
      <DescriptionPanel />
      <ParticipantsPanel />
      <PermissionRequestsPanel />
      <ControlsPanel />
      <Pressable
        onPress={onClose}
        style={(state) =>
          state.pressed
            ? [styles.closeButton, { opacity: 0.2 }]
            : styles.closeButton
        }
      >
        <Text style={styles.closeText}>X</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 4,
  },
  closeButton: {
    position: 'absolute',
    top: 4,
    right: 16,
  },
  closeText: {
    fontSize: 24,
    color: 'black',
  },
});
