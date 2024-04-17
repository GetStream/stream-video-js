import {
  Call,
  StreamCall,
  HostLivestream,
  useConnectedUser,
  useStreamVideoClient,
} from '@stream-io/video-react-native-sdk';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LiveStreamParamList } from '../../../types';
import { Text } from 'react-native';
import { HostLivestreamMediaControls } from '../../components/LiveStream/HostLivestreamMediaControls';
import BottomSheetChatWrapper, {
  BottomSheetWrapperMethods,
} from './BottomSheetChatWrapper';

type HostLiveStreamScreenProps = NativeStackScreenProps<
  LiveStreamParamList,
  'HostLiveStream'
>;

export const HostLiveStreamScreen = ({
  navigation,
  route,
}: HostLiveStreamScreenProps) => {
  const [headerFooterHidden, setHeaderFooterHidden] = useState(false);
  const videoClient = useStreamVideoClient();

  const bottomSheetWrapperRef = useRef<BottomSheetWrapperMethods>(null);

  const {
    params: { callId },
  } = route;
  const connectedUser = useConnectedUser();

  const call = useMemo<Call | undefined>(() => {
    if (!videoClient) {
      return undefined;
    }
    return videoClient.call('livestream', callId);
  }, [callId, videoClient]);

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
        const rtmp = call?.state.ingress?.rtmp;
        const streamKey = call?.streamClient?._getToken();
        console.log(
          `For RTMP, Open OBS and go to settings -> stream
        Select "custom" service, Fill the following values,
        * Server: ${rtmp?.address},
        * Stream key: ${streamKey}`,
        );
      } catch (error) {
        console.error('Failed to get or create call', error);
      }
    };

    getOrCreateCall();
  }, [call, connectedUser, navigation]);

  const CustomHostLivestreamMediaControls = useCallback(() => {
    return (
      <HostLivestreamMediaControls
        onChatButtonPress={() => {
          // open the bottom sheet
          bottomSheetWrapperRef.current?.open();
        }}
      />
    );
  }, []);

  const onBottomSheetClose = useCallback(() => {
    setHeaderFooterHidden(false);
  }, []);

  const onBottomSheetOpen = useCallback(() => {
    setHeaderFooterHidden(true);
  }, []);

  if (!connectedUser || !call) {
    return <Text>Loading...</Text>;
  }

  return (
    <StreamCall call={call}>
      <BottomSheetChatWrapper
        callId={callId}
        onBottomSheetClose={onBottomSheetClose}
        onBottomSheetOpen={onBottomSheetOpen}
        ref={bottomSheetWrapperRef}
      >
        <HostLivestream
          HostLivestreamTopView={headerFooterHidden ? null : undefined}
          LivestreamMediaControls={CustomHostLivestreamMediaControls}
          onEndStreamHandler={() => {
            call.leave();
            navigation.goBack();
          }}
        />
      </BottomSheetChatWrapper>
    </StreamCall>
  );
};
