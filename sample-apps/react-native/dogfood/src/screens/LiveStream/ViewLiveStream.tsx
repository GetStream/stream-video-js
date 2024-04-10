import {
  CallingState,
  StreamCall,
  ViewerLivestream,
  useCallStateHooks,
  useStreamVideoClient,
  ViewerLivestreamTopView,
  LiveIndicator,
  FollowerCount,
} from '@stream-io/video-react-native-sdk';
import React, {
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetModalProvider,
} from '@gorhom/bottom-sheet';
import { LiveStreamParamList } from '../../../types';
import {
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { appTheme } from '../../theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ViewerLobby } from './ViewerLobby';
import { useSetCall } from '../../hooks/useSetCall';
import { Button } from '../../components/Button';
import { useAnonymousInitVideoClient } from '../../hooks/useAnonymousInitVideoClient';
import { LivestreamChat } from '../../components/LiveStream/LivestreamChat';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { ViewerLiveStreamControls } from '../../components/LiveStream/ViewerLivestreamControls';

type ViewerLiveStreamScreenProps = NativeStackScreenProps<
  LiveStreamParamList,
  'ViewerLiveStream'
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

export const ViewLiveStreamWrapper = ({
  route,
  navigation,
  children,
}: PropsWithChildren<ViewerLiveStreamScreenProps>) => {
  // The `StreamVideo` wrapper for this client is defined in `App.tsx` of the app.
  const client = useStreamVideoClient();
  const callType = 'livestream';
  const {
    params: { callId },
  } = route;
  /**
   * We create a call using the logged in client in the app since we need to get the call live status.
   */
  const call = useSetCall(callId, callType, client);
  const [error, setError] = useState<Error | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  /**
   * Getting the call details is done through `call.get()`.
   * It is essential so that the call is watched and any changes in the call is intercepted.
   */
  useEffect(() => {
    const getCall = async () => {
      if (!call) {
        return;
      }
      try {
        await call.get();
        setLoading(false);
      } catch (err) {
        if (err instanceof Error) {
          setError(err);
        }
      }
    };
    getCall();
  }, [call]);

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>{error.message}</Text>
        <Button
          title="Go back"
          onPress={() => {
            navigation.goBack();
          }}
          buttonStyle={styles.errorButton}
        />
      </View>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size={'large'} style={StyleSheet.absoluteFill} />
      </SafeAreaView>
    );
  }

  if (!call) {
    return null;
  }

  return <StreamCall call={call}>{children}</StreamCall>;
};

export const ViewLiveStreamChilden = ({
  navigation,
  route,
}: ViewerLiveStreamScreenProps) => {
  const {
    params: { callId },
  } = route;
  const { height } = Dimensions.get('window');
  const [callJoined, setCallJoined] = useState<boolean>(false);
  const [headerFooterHidden, setHeaderFooterHidden] = useState(false);

  /**
   * The `useCallStateHooks` hooks would only work here in the children since we wrap the `StreamCall` component in the `ViewLiveStreamWrapper` above using the logged in client of the app.
   */
  const { useIsCallLive } = useCallStateHooks();
  const isCallLive = useIsCallLive();
  /**
   * We create an anonymous client here to join the call anonymously.
   */
  const client = useAnonymousInitVideoClient();
  const call = useSetCall(callId, 'livestream', client);
  const currentPosition = useSharedValue(height);

  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

  const snapPoints = useMemo(() => ['25%', '50%'], []);

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

  const animatedStyles = useAnimatedStyle(() => {
    return {
      height: currentPosition.value,
    };
  });

  /**
   * The call is joined using the anonymous user/client.
   */
  const handleJoinCall = async () => {
    try {
      if (!(call && isCallLive)) {
        return;
      }
      if (
        [CallingState.JOINED, CallingState.JOINING].includes(
          call.state.callingState,
        )
      ) {
        setCallJoined(true);
        return;
      }
      await call?.join();
      setCallJoined(true);
    } catch (error) {
      console.error('Failed to join call', error);
    }
  };

  const CustomViewerLivestreamControls = useCallback(() => {
    const handlePresentModalPress = () => {
      bottomSheetModalRef.current?.present();
    };

    const handleLeaveCall = async () => {
      try {
        if (!call) {
          return;
        }
        await call.leave();
        setCallJoined(false);
        navigation.goBack();
      } catch (error) {
        console.log('Failed to leave call', error);
      }
    };

    return (
      <ViewerLiveStreamControls
        onChatButtonPress={handlePresentModalPress}
        handleLeaveCall={handleLeaveCall}
      />
    );
  }, [call, navigation]);

  if (!call) {
    return null;
  }

  /**
   * Note: Here we provide the `StreamCall` component again. This is done, so that the call used, is created by the anonymous user.
   */
  return (
    <StreamCall call={call}>
      <BottomSheetModalProvider>
        {!(isCallLive && callJoined) ? (
          <ViewerLobby
            isLive={isCallLive}
            handleJoinCall={handleJoinCall}
            setCallJoined={setCallJoined}
          />
        ) : (
          <Animated.View style={[styles.animatedContainer, animatedStyles]}>
            <SafeAreaView edges={['top']} style={styles.livestream}>
              <ViewerLivestream
                ViewerLivestreamTopView={
                  !headerFooterHidden ? ViewerLivestreamTopView : null
                }
                ViewerLivestreamControls={CustomViewerLivestreamControls}
              />
            </SafeAreaView>
          </Animated.View>
        )}
        <BottomSheetModal
          enablePanDownToClose={true}
          handleComponent={HandleComponent}
          ref={bottomSheetModalRef}
          index={1}
          snapPoints={snapPoints}
          onChange={handleSheetChanges}
        >
          <BottomSheetView style={styles.contentContainer}>
            <LivestreamChat callId={callId} />
          </BottomSheetView>
        </BottomSheetModal>
      </BottomSheetModalProvider>
    </StreamCall>
  );
};

export const ViewLiveStreamScreen = ({
  navigation,
  route,
}: ViewerLiveStreamScreenProps) => {
  return (
    <ViewLiveStreamWrapper navigation={navigation} route={route}>
      <ViewLiveStreamChilden navigation={navigation} route={route} />
    </ViewLiveStreamWrapper>
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
  livestream: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: appTheme.colors.static_grey,
    padding: 16,
  },
  text: {
    color: 'white',
    fontSize: 32,
  },
  errorButton: {
    marginTop: 8,
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
