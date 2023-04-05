import React, { useEffect, useState } from 'react';
import {
  StreamCallProvider,
  useActiveCall,
  useHasOngoingScreenShare,
} from '@stream-io/video-react-bindings';
import { StyleSheet, View } from 'react-native';
import { CallControlsView } from './CallControlsView';
import { CallParticipantsView } from './CallParticipantsView';
import { useMediaDevices } from '../contexts/MediaDevicesContext';
import { getAudioStream, getVideoStream } from '@stream-io/video-client';
import { useCallCycleContext, useStreamVideoStoreValue } from '../contexts';
import { CallParticipantsBadge } from './CallParticipantsBadge';
import { CallParticipantsScreenView } from './CallParticipantsScreenView';
import { theme } from '../theme';
import { useIncallManager } from '../hooks';

/**
 * Props to be passed for the ActiveCall component.
 */
export interface ActiveCallProps {
  /**
   * Handler called when the participants info button is pressed in the active call screen.
   */
  onOpenCallParticipantsInfoView: () => void;
}
/**
 * View for an active call, includes call controls and participant handling.
 *
 * | 2 Participants | 3 Participants | 4 Participants | 5 Participants |
 * | :--- | :--- | :--- | :----: |
 * |![active-call-2](https://user-images.githubusercontent.com/25864161/217351458-6cb4b0df-6071-45f5-89b6-fe650d950502.png) | ![active-call-3](https://user-images.githubusercontent.com/25864161/217351461-908a1887-7cf0-4945-bedd-d6598902be2d.png) | ![active-call-4](https://user-images.githubusercontent.com/25864161/217351465-b2a22178-7593-4639-96dd-6fb692af2dc5.png) | ![active-call-5](https://user-images.githubusercontent.com/25864161/217351453-6547b0a3-4ecc-435f-b2d9-7d511d5d0328.png) |
 */

export const ActiveCall = (props: ActiveCallProps) => {
  const activeCall = useActiveCall();
  if (!activeCall) return null;

  return (
    <StreamCallProvider call={activeCall}>
      <InnerActiveCall {...props} />
    </StreamCallProvider>
  );
};

const InnerActiveCall = (props: ActiveCallProps) => {
  const [height, setHeight] = useState(0);
  const activeCall = useActiveCall();
  const { audioDevice, currentVideoDevice } = useMediaDevices();
  const { onOpenCallParticipantsInfoView } = props;
  const isVideoMuted = useStreamVideoStoreValue((store) => store.isVideoMuted);
  const isAudioMuted = useStreamVideoStoreValue((store) => store.isAudioMuted);
  const hasScreenShare = useHasOngoingScreenShare();
  const { callCycleHandlers } = useCallCycleContext();
  const { onHangupCall } = callCycleHandlers;

  useIncallManager({ media: 'video', auto: true });

  useEffect(() => {
    if (audioDevice && !isAudioMuted) {
      getAudioStream(audioDevice.deviceId)
        .then((stream) => activeCall?.publishAudioStream(stream))
        .catch((error) => {
          console.log(error);
        });
    }
  }, [activeCall, audioDevice, isAudioMuted]);

  useEffect(() => {
    if (currentVideoDevice && !isVideoMuted) {
      getVideoStream(currentVideoDevice.deviceId)
        .then((stream) => {
          activeCall?.publishVideoStream(stream);
        })
        .catch((error) => {
          console.log(error);
        });
    }
  }, [activeCall, currentVideoDevice, isVideoMuted]);

  const onLayout: React.ComponentProps<typeof View>['onLayout'] = (event) => {
    setHeight(
      // we're saving the CallControlsView height and subtracting an amount of padding.
      // this is done to get the CallParticipants(Screen)View neatly underneath the
      // rounded corners of the CallControlsView.
      Math.trunc(event.nativeEvent.layout.height - theme.spacing.lg * 2),
    );
  };

  return (
    <View style={styles.container}>
      <CallParticipantsBadge
        onOpenCallParticipantsInfoView={onOpenCallParticipantsInfoView}
      />
      <View style={[styles.callParticipantsWrapper, { paddingBottom: height }]}>
        {hasScreenShare ? (
          <CallParticipantsScreenView />
        ) : (
          <CallParticipantsView />
        )}
      </View>
      <View onLayout={onLayout} style={styles.callControlsWrapper}>
        <CallControlsView onHangupCall={onHangupCall} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.light.static_grey,
  },
  callParticipantsWrapper: { flex: 1 },
  callControlsWrapper: { position: 'absolute', bottom: 0, left: 0, right: 0 },
});
