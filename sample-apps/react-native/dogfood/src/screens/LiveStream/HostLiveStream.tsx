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
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { appTheme } from '../../theme';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { LivestreamChat } from '../../components/LiveStream/LivestreamChat';
import { LivestreamMediaControls } from '../../components/LiveStream/LiveStreamMediaControls';

type HostLiveStreamScreenProps = NativeStackScreenProps<
  LiveStreamParamList,
  'HostLiveStream'
>;

const HandleComponent = () => {
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
    </View>
  );
};

export const HostLiveStreamScreen = ({ route }: HostLiveStreamScreenProps) => {
  const { height } = Dimensions.get('window');
  const [headerFooterHidden, setHeaderFooterHidden] = useState(false);
  const client = useStreamVideoClient();
  const connectedUser = useConnectedUser();
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

  const snapPoints = useMemo(() => ['10%', '50%'], []);
  const currentPosition = useSharedValue(height);

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
        currentPosition.value = withTiming(height);
      } else {
        // Sheet is open
        setHeaderFooterHidden(true);
        currentPosition.value = withTiming((height * 50) / 100);
      }
    },
    [currentPosition, height],
  );

  const callType = 'livestream';
  const {
    params: { callId },
  } = route;

  const call = useMemo<Call | undefined>(() => {
    if (!client) {
      return undefined;
    }
    return client.call(callType, callId);
  }, [callId, callType, client]);

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

  const CustomLiveStreamMediaControls = useCallback(() => {
    const handlePresentModalPress = () => {
      bottomSheetModalRef.current?.present();
    };
    return (
      <LivestreamMediaControls
        handlePresentModalPress={handlePresentModalPress}
      />
    );
  }, []);

  if (!connectedUser || !call) {
    return <Text>Loading...</Text>;
  }

  return (
    <StreamCall call={call}>
      <BottomSheetModalProvider>
        <Animated.View style={[styles.animatedContainer, animatedStyles]}>
          <SafeAreaView edges={['top']} style={styles.container}>
            <HostLivestream
              HostLivestreamTopView={
                !headerFooterHidden ? HostLivestreamTopView : null
              }
              LivestreamMediaControls={CustomLiveStreamMediaControls}
            />
          </SafeAreaView>
        </Animated.View>
        <BottomSheetModal
          enablePanDownToClose={true}
          handleComponent={HandleComponent}
          ref={bottomSheetModalRef}
          index={1}
          snapPoints={snapPoints}
          onChange={handleSheetChanges}
        >
          <BottomSheetView style={styles.contentContainer}>
            <LivestreamChat callId={callId} callType={callType} />
          </BottomSheetView>
        </BottomSheetModal>
      </BottomSheetModalProvider>
    </StreamCall>
  );
};

const styles = StyleSheet.create({
  animatedContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '100%', // Adjust the height according to your design
    elevation: 5,
  },
  container: {
    flex: 1,
  },
  mediaControlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
  },
  handleContainer: {
    flexDirection: 'row',
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  handleText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  liveContainer: {
    flexDirection: 'row',
  },
});
