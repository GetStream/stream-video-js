import React, { useEffect, useRef } from 'react';
import {
  CallControlsView,
  CallControlsViewType,
  CallParticipantsBadge,
  CallParticipantsView,
  CallingState,
  useCall,
  useIncallManager,
} from '@stream-io/video-react-native-sdk';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { appTheme } from '../theme';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { Mode, ParticipantsLayoutButtons } from './ParticipantLayoutButton';

type ActiveCallProps = CallControlsViewType;

export const ActiveCall = ({
  chatButton,
  hangUpCallButton,
}: ActiveCallProps) => {
  const call = useCall();
  const activeCallRef = useRef(call);
  activeCallRef.current = call;
  const [selectedLayout, setSelectedLayout] = React.useState<Mode>('grid');

  useEffect(() => {
    return () => {
      if (activeCallRef.current?.state.callingState !== CallingState.LEFT) {
        activeCallRef.current?.leave();
      }
    };
  }, []);

  /**
   * This hook is used to handle IncallManager specs of the application.
   */
  useIncallManager({ media: 'video', auto: true });

  const { bottom, top } = useSafeAreaInsets();

  if (!call) {
    return <ActivityIndicator size={'large'} style={StyleSheet.absoluteFill} />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={[styles.icons, { top }]}>
        <ParticipantsLayoutButtons
          selectedLayout={selectedLayout}
          setSelectedLayout={setSelectedLayout}
        />
        <CallParticipantsBadge />
      </View>
      <CallParticipantsView mode={selectedLayout} />
      <CallControlsView
        chatButton={chatButton}
        hangUpCallButton={hangUpCallButton}
        style={[
          styles.callControlsWrapper,
          { paddingBottom: Math.max(bottom, appTheme.spacing.lg) },
        ]}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appTheme.colors.static_grey,
  },
  icons: {
    position: 'absolute',
    right: 0,
    marginTop: appTheme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: appTheme.zIndex.IN_FRONT,
  },
  callControlsWrapper: {
    paddingTop: appTheme.spacing.lg,
    paddingHorizontal: appTheme.spacing.sm,
  },
});
