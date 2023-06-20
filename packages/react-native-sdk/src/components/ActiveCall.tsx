import React, { useEffect, useRef } from 'react';
import {
  useCall,
  useHasOngoingScreenShare,
} from '@stream-io/video-react-bindings';
import { StyleSheet, View } from 'react-native';
import { CallControlsView, CallControlsViewType } from './CallControlsView';
import { CallParticipantsView } from './CallParticipantsView';
import { CallParticipantsSpotlightView } from './CallParticipantsSpotlightView';
import { theme } from '../theme';
import { useIncallManager } from '../hooks/useIncallManager';
import { usePublishMediaStreams } from '../hooks/usePublishMediaStreams';
import { usePermissionRequest } from '../hooks/usePermissionRequest';
import { CallParticipantsBadge } from './CallParticipantsBadge';
import { verifyAndroidBluetoothPermissions } from '../utils/verifyAndroidBluetoothPermissions';
import { CallingState } from '@stream-io/video-client';
import { Z_INDEX } from '../constants';

/**
 * Props to be passed for the ActiveCall component.
 */
export type ActiveCallProps = CallControlsViewType & {
  /**
   * The mode of the call view. Defaults to 'grid'.
   * Note: when there is atleast one screen share, the mode is automatically set to 'spotlight'.
   */
  mode?: 'grid' | 'spotlight';
};
/**
 * View for an active call, includes call controls and participant handling.
 *
 * | 2 Participants | 3 Participants | 4 Participants | 5 Participants |
 * | :--- | :--- | :--- | :----: |
 * |![active-call-2](https://user-images.githubusercontent.com/25864161/217351458-6cb4b0df-6071-45f5-89b6-fe650d950502.png) | ![active-call-3](https://user-images.githubusercontent.com/25864161/217351461-908a1887-7cf0-4945-bedd-d6598902be2d.png) | ![active-call-4](https://user-images.githubusercontent.com/25864161/217351465-b2a22178-7593-4639-96dd-6fb692af2dc5.png) | ![active-call-5](https://user-images.githubusercontent.com/25864161/217351453-6547b0a3-4ecc-435f-b2d9-7d511d5d0328.png) |
 */

export const ActiveCall = (props: ActiveCallProps) => {
  const activeCall = useCall();
  const activeCallRef = useRef(activeCall);
  activeCallRef.current = activeCall;

  useEffect(() => {
    // when the component mounts, we ask for necessary permissions.
    verifyAndroidBluetoothPermissions();

    return () => {
      if (activeCallRef.current?.state.callingState !== CallingState.LEFT) {
        activeCallRef.current?.leave();
      }
    };
  }, []);

  if (!activeCall) {
    return null;
  }
  return <InnerActiveCall {...props} />;
};

const InnerActiveCall = (props: ActiveCallProps) => {
  const { mode = 'grid', chatButton } = props;
  const hasScreenShare = useHasOngoingScreenShare();

  useIncallManager({ media: 'video', auto: true });
  usePublishMediaStreams();
  usePermissionRequest();

  const showSpotLightModeView = mode === 'spotlight' || hasScreenShare;

  return (
    <View style={styles.container}>
      <CallParticipantsBadge style={styles.iconGroup} />
      <View style={[styles.callParticipantsWrapper]}>
        {showSpotLightModeView ? (
          <CallParticipantsSpotlightView />
        ) : (
          <CallParticipantsView />
        )}
      </View>
      <CallControlsView
        style={styles.callControlsWrapper}
        chatButton={chatButton}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.light.static_grey,
  },
  callParticipantsWrapper: { flex: 1 },
  callControlsWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: theme.padding.md,
  },
  iconGroup: {
    position: 'absolute',
    top: theme.padding.md,
    right: theme.padding.sm,
    zIndex: Z_INDEX.IN_FRONT,
  },
});
