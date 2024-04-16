import {
  CallingState,
  StreamCall,
  ViewerLivestream,
  useCallStateHooks,
  useStreamVideoClient,
  ViewerLivestreamControlsProps,
} from '@stream-io/video-react-native-sdk';
import React, {
  PropsWithChildren,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LiveStreamParamList } from '../../../types';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { appTheme } from '../../theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ViewerLobby } from './ViewerLobby';
import { useSetCall } from '../../hooks/useSetCall';
import { Button } from '../../components/Button';
import { useAnonymousInitVideoClient } from '../../hooks/useAnonymousInitVideoClient';
import { ViewerLiveStreamControls } from '../../components/LiveStream/ViewerLivestreamControls';
import BottomSheetChatWrapper, {
  BottomSheetWrapperMethods,
} from './BottomSheetChatWrapper';

type ViewerLiveStreamScreenProps = NativeStackScreenProps<
  LiveStreamParamList,
  'ViewerLiveStream'
>;

export const ViewLiveStreamWrapper = ({
  route,
  navigation,
  children,
}: PropsWithChildren<ViewerLiveStreamScreenProps>) => {
  // The `StreamVideo` wrapper for this client is defined in `App.tsx` of the app.
  const client = useStreamVideoClient();
  const {
    params: { callId },
  } = route;
  /**
   * We create a call using the logged in client in the app since we need to get the call live status.
   */
  const call = useSetCall(callId, 'livestream', client);
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

export const ViewLiveStreamChildren = ({
  navigation,
  route,
}: ViewerLiveStreamScreenProps) => {
  const {
    params: { callId },
  } = route;
  const bottomSheetWrapperRef = useRef<BottomSheetWrapperMethods>(null);
  const [callJoined, setCallJoined] = useState<boolean>(false);
  const [headerFooterHidden, setHeaderFooterHidden] = useState(false);
  /**
   * The `useCallStateHooks` hooks would only work here in the children since we wrap the `StreamCall` component in the `ViewLiveStreamWrapper` above using the logged in client of the app.
   */
  const { useIsCallLive } = useCallStateHooks();
  const isCallLive = useIsCallLive();

  const onBottomSheetClose = useCallback(() => {
    setHeaderFooterHidden(false);
  }, []);

  const onBottomSheetOpen = useCallback(() => {
    setHeaderFooterHidden(true);
  }, []);

  /**
   * We create an anonymous client here to join the call anonymously.
   */
  const anonymousVideoClient = useAnonymousInitVideoClient();
  const call = useSetCall(callId, 'livestream', anonymousVideoClient);

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

  const CustomViewerLivestreamControls = useCallback(
    (props: ViewerLivestreamControlsProps) => {
      const handlePresentModalPress = () => {
        bottomSheetWrapperRef.current?.open();
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
          {...props}
        />
      );
    },
    [call, navigation],
  );

  if (!call) {
    return null;
  }

  /**
   * Note: Here we provide the `StreamCall` component again. This is done, so that the call used, is created by the anonymous user.
   */
  return (
    <StreamCall call={call}>
      {!(isCallLive && callJoined) ? (
        <ViewerLobby
          isLive={isCallLive}
          handleJoinCall={handleJoinCall}
          setCallJoined={setCallJoined}
        />
      ) : (
        <BottomSheetChatWrapper
          callId={callId}
          onBottomSheetClose={onBottomSheetClose}
          onBottomSheetOpen={onBottomSheetOpen}
          ref={bottomSheetWrapperRef}
        >
          <ViewerLivestream
            ViewerLivestreamTopView={headerFooterHidden ? null : undefined}
            ViewerLivestreamControls={CustomViewerLivestreamControls}
          />
        </BottomSheetChatWrapper>
      )}
    </StreamCall>
  );
};

export const ViewLiveStreamScreen = ({
  navigation,
  route,
}: ViewerLiveStreamScreenProps) => {
  return (
    <ViewLiveStreamWrapper navigation={navigation} route={route}>
      <ViewLiveStreamChildren navigation={navigation} route={route} />
    </ViewLiveStreamWrapper>
  );
};

const styles = StyleSheet.create({
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
});
