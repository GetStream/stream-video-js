import {
  CallingState,
  StreamCall,
  ViewerLivestream,
  useCallStateHooks,
  useStreamVideoClient,
} from '@stream-io/video-react-native-sdk';
import React, { PropsWithChildren, useEffect, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LiveStreamParamList } from '../../../types';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { appTheme } from '../../theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ViewerLobby } from './ViewerLobby';
import { useSetCall } from '../../hooks/useSetCall';
import { Button } from '../../components/Button';
import { useAnonymousInitVideoClient } from '../../hooks/useAnonymousInitVideoClient';

type ViewerLiveStreamScreenProps = NativeStackScreenProps<
  LiveStreamParamList,
  'ViewerLiveStream'
>;

export const ViewLiveStreamWrapper = ({
  route,
  navigation,
  children,
}: PropsWithChildren<ViewerLiveStreamScreenProps>) => {
  const client = useStreamVideoClient();
  const callType = 'livestream';
  const {
    params: { callId },
  } = route;
  const call = useSetCall(callId, callType, client);
  const [error, setError] = useState<Error | undefined>(undefined);
  const [loading, setLoading] = useState(true);

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
  const callType = 'livestream';
  const {
    params: { callId },
  } = route;
  const [callJoined, setCallJoined] = useState<boolean>(false);
  const { useIsCallLive } = useCallStateHooks();
  const isCallLive = useIsCallLive();
  const client = useAnonymousInitVideoClient({
    callId,
    callType,
  });
  const call = useSetCall(callId, callType, client);

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

  if (!call) {
    return null;
  }

  return !(isCallLive && callJoined) ? (
    <ViewerLobby
      isLive={isCallLive}
      handleJoinCall={handleJoinCall}
      setCallJoined={setCallJoined}
    />
  ) : (
    <StreamCall
      call={call}
      mediaDeviceInitialState={{
        initialAudioEnabled: false,
        initialVideoEnabled: false,
      }}
    >
      <SafeAreaView style={styles.livestream}>
        <ViewerLivestream onLeaveStreamHandler={handleLeaveCall} />
      </SafeAreaView>
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
});
