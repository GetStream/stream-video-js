import React, { useCallback, useEffect } from 'react';
import {
  Call,
  CallContentView,
  ParticipantView,
  StreamCall,
  StreamVideoParticipant,
  useCall,
  useCallMetadata,
  useIsCallLive,
  useParticipants,
  useStreamVideoClient,
} from '@stream-io/video-react-native-sdk';
import {
  FlatList,
  FlatListProps,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type ParticipantFlatList = FlatListProps<StreamVideoParticipant>;

export default function Room() {
  const client = useStreamVideoClient();
  const call = useCall();
  const isLive = useIsCallLive();

  // useEffect(() => {
  //   call?.join().catch((e) => {
  //     console.log('Error while joining the call', e);
  //   });
  // }, [call]);

  const callMetadata = useCallMetadata();
  const participantsMeta = callMetadata?.session?.participants.length;

  const participants = useParticipants();

  const renderItem: NonNullable<ParticipantFlatList['renderItem']> =
    useCallback(({ item: participantItem }) => {
      return (
        <ParticipantView
          key={participantItem.sessionId}
          participant={participantItem}
          kind="video"
        />
      );
    }, []);

  if (!client || !call) {
    return null;
  }

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1 }}>
      <Text>In Room {call.data?.custom?.title || call.cid}</Text>
      <Text>{participants.map((p) => p.name).join(',')}</Text>
      <Text>{`isLive: ${isLive}`}</Text>
      <Text>{`isBackStage: ${call.data?.backstage}`}</Text>
      <CallContentView />
      {/* <FlatList numColumns={2} data={participants} renderItem={renderItem} /> */}
      {/** We will introduce the <UILayout /> component later */}
      {/** <UILayout /> */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  avatar: {
    height: 80,
    width: 80,
    borderRadius: 20,
  },
});
