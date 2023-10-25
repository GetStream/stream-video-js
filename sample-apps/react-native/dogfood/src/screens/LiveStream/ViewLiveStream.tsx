import {
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
  const { useIsCallBroadcastingInProgress, useIsCallLive } =
    useCallStateHooks();
  const isCallLive = useIsCallLive();
  const isCallBroadcasting = useIsCallBroadcastingInProgress();
  const liveOrBroadcasting = isCallLive || isCallBroadcasting;

  const client = useAnonymousInitVideoClient({
    callId,
    callType,
  });
  const [autoJoin, setAutoJoin] = useState(false);
  const call = useSetCall(callId, callType, client);

  useEffect(() => {
    const joinCall = async () => {
      try {
        if (!(call && autoJoin)) {
          return;
        }
        await call?.join();
      } catch (error) {
        console.error('Failed to join call', error);
      }
    };
    joinCall();
  }, [call, autoJoin]);

  if (!call) {
    return null;
  }

  return (
    <>
      {(!autoJoin || !liveOrBroadcasting) && (
        <ViewerLobby
          autoJoin={autoJoin}
          setAutoJoin={setAutoJoin}
          isLive={liveOrBroadcasting}
        />
      )}
      {liveOrBroadcasting && autoJoin && (
        <StreamCall call={call}>
          <SafeAreaView style={styles.livestream}>
            <ViewerLivestream
              onLeaveStreamHandler={() => {
                navigation.goBack();
              }}
            />
          </SafeAreaView>
        </StreamCall>
      )}
    </>
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
