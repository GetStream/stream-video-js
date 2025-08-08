import {
  StreamCall,
  useStreamVideoClient,
} from '@stream-io/video-react-native-sdk';
import React, { PropsWithChildren } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LiveStreamParamList } from '../../../types';
import { useSetCall } from '../../hooks/useSetCall';
import { LivestreamPlayer } from '@stream-io/video-react-native-sdk/src/components';

type ViewerLiveStreamScreenProps = NativeStackScreenProps<
  LiveStreamParamList,
  'ViewerLiveStream'
>;

export const ViewLiveStreamWrapper = ({
  route,
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

  if (!call) {
    return null;
  }

  return <StreamCall call={call}>{children}</StreamCall>;
};

export const ViewLiveStreamChildren = ({
  route,
}: ViewerLiveStreamScreenProps) => {
  const {
    params: { callId },
  } = route;

  /**
   * Note: Here we provide the `StreamCall` component again. This is done, so that the call used, is created by the anonymous user.
   */
  return <LivestreamPlayer callId={callId} callType="livestream" />;
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
