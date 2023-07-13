import React from 'react';
import {
  Call,
  StreamCall,
  useStreamVideoClient,
} from '@stream-io/video-react-native-sdk';
import { Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = {
  call: Call;
};

export default function Room(props: Props) {
  const { call } = props;
  const client = useStreamVideoClient();

  if (!client) {
    return null;
  }

  return (
    <SafeAreaView>
      <StreamCall call={call}>
        <Text>Room {call.cid}</Text>
        {/** We will introduce the <UILayout /> component later */}
        {/** <UILayout /> */}
      </StreamCall>
    </SafeAreaView>
  );
}
