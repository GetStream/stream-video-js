import {
  Call,
  StreamCall,
  HostLivestream,
  useConnectedUser,
  useStreamVideoClient,
  HostLivestreamTopView,
  LiveIndicator,
  FollowerCount,
} from '@stream-io/video-react-native-sdk';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetModalProvider,
} from '@gorhom/bottom-sheet';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LiveStreamParamList } from '../../../types';
import {
  Dimensions,
  LogBox,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { appTheme } from '../../theme';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { LivestreamChat } from '../../components/LiveStream/LivestreamChat';
import { HostLivestreamMediaControls } from '../../components/LiveStream/HostLivestreamMediaControls';
import { Cross } from '../../assets/Cross';

type HostLiveStreamScreenProps = NativeStackScreenProps<
  LiveStreamParamList,
  'HostLiveStream'
>;

LogBox.ignoreAllLogs();

const BottomSheetHandleComponent = ({ onClose }: { onClose: () => void }) => {
  return (
    <View
      style={[
        styles.handleContainer,
        { backgroundColor: appTheme.colors.static_grey },
      ]}
    >
      <Text
        style={[styles.handleText, { color: appTheme.colors.static_white }]}
      >
        Live Chat
      </Text>
      <View style={styles.liveContainer}>
        <LiveIndicator />
        <FollowerCount />
      </View>
      <TouchableOpacity onPress={onClose}>
        <Cross
          color={appTheme.colors.static_white}
          style={styles.handleCloseButton}
        />
      </TouchableOpacity>
    </View>
  );
};

/**
 * Patch the safe area insets to have a default bottom value if the bottom insets are not provided.
 */
const patchSafeAreaInsets = (insets: { top: number; bottom: number }) => {
  return {
    top: insets.top,
    bottom: insets.bottom ? insets.bottom : 16,
  };
};

export const HostLiveStreamScreen = ({ route }: HostLiveStreamScreenProps) => {
  const { height: windowHeight } = Dimensions.get('window');
  const safeAreaInsets = patchSafeAreaInsets(useSafeAreaInsets());
  const [headerFooterHidden, setHeaderFooterHidden] = useState(false);
  const client = useStreamVideoClient();
  const connectedUser = useConnectedUser();
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

  const snapPoints = useMemo(() => ['50%'], []);
  const sheetHeight = windowHeight - safeAreaInsets.top - safeAreaInsets.bottom;
  const currentPosition = useSharedValue(sheetHeight);

  const animatedStyles = useAnimatedStyle(() => {
    return {
      height: currentPosition.value,
    };
  });

  const handleSheetChanges = useCallback(
    (index: number) => {
      if (index === -1) {
        // Sheet is closed
        setHeaderFooterHidden(false);
        currentPosition.value = withTiming(sheetHeight);
      } else {
        // Sheet is open
        setHeaderFooterHidden(true);
        currentPosition.value = withTiming(sheetHeight * 0.5);
      }
    },
    [currentPosition, sheetHeight],
  );

  const {
    params: { callId },
  } = route;

  const call = useMemo<Call | undefined>(() => {
    if (!client) {
      return undefined;
    }
    return client.call('livestream', callId);
  }, [callId, client]);

  useEffect(() => {
    const getOrCreateCall = async () => {
      try {
        if (!(call && connectedUser)) {
          return;
        }
        await call?.join({
          create: true,
          data: {
            members: [{ user_id: connectedUser.id, role: 'host' }],
          },
        });
        await call?.getOrCreate();
      } catch (error) {
        console.error('Failed to get or create call', error);
      }
    };

    getOrCreateCall();
  }, [call, connectedUser]);

  const CustomHostLivestreamMediaControls = useCallback(() => {
    return (
      <HostLivestreamMediaControls
        onChatButtonPress={() => {
          // open the bottom sheet
          bottomSheetModalRef.current?.present();
        }}
      />
    );
  }, []);

  const CustomBottomSheetHandleComponent = useCallback(() => {
    return (
      <BottomSheetHandleComponent
        onClose={() => {
          // close the bottom sheet
          bottomSheetModalRef.current?.close();
        }}
      />
    );
  }, []);

  if (!connectedUser || !call) {
    return <Text>Loading...</Text>;
  }

  return (
    <StreamCall call={call}>
      <BottomSheetModalProvider>
        <View
          style={[
            styles.container,
            {
              paddingTop: safeAreaInsets.top,
              paddingBottom: safeAreaInsets.bottom,
            },
          ]}
        >
          <Animated.View style={animatedStyles}>
            <HostLivestream
              HostLivestreamTopView={
                !headerFooterHidden ? HostLivestreamTopView : null
              }
              LivestreamMediaControls={CustomHostLivestreamMediaControls}
            />
          </Animated.View>
        </View>
        <BottomSheetModal
          enablePanDownToClose={true}
          handleComponent={CustomBottomSheetHandleComponent}
          ref={bottomSheetModalRef}
          snapPoints={snapPoints}
          onChange={handleSheetChanges}
        >
          <BottomSheetView
            style={[
              styles.chatContainer,
              { paddingBottom: safeAreaInsets.bottom },
            ]}
          >
            <LivestreamChat callId={callId} />
          </BottomSheetView>
        </BottomSheetModal>
      </BottomSheetModalProvider>
    </StreamCall>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appTheme.colors.static_grey,
  },
  mediaControlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatContainer: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: appTheme.colors.static_grey,
  },
  handleContainer: {
    flexDirection: 'row',
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  handleCloseButton: {
    height: 16,
    width: 16,
  },
  handleText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  liveContainer: {
    flexDirection: 'row',
  },
});
