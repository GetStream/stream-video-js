import React, { useState } from 'react';
import {
  ActivityIndicator,
  Button,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import {
  useAppGlobalStoreValue,
  useAppGlobalStoreSetState,
} from '../../contexts/AppContext';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../types';
import { getOrCreateCall } from '../../utils/callUtils';
import { useCallKeep } from '../../hooks/useCallKeep';

const styles = StyleSheet.create({
  container: {
    margin: 15,
  },
  headerText: {
    color: 'black',
    fontSize: 20,
    marginVertical: 8,
  },
  textInput: {
    color: '#000',
    height: 40,
    width: '100%',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'gray',
    paddingLeft: 10,
    marginVertical: 8,
  },
  participantsContainer: {
    marginVertical: 20,
  },
  text: {
    color: 'black',
  },
  label: {
    fontSize: 20,
  },
  participant: {
    paddingVertical: 10,
    borderBottomColor: 'gray',
    borderBottomWidth: 1,
  },
  selectedParticipant: {
    color: 'red',
    fontWeight: 'bold',
  },
});

type Props = NativeStackScreenProps<RootStackParamList, 'HomeScreen'>;

const Ringing = ({ navigation }: Props) => {
  // const [logText, setLog] = useState('');
  const [selectedParticipant, setSelectedParticipant] = useState('');
  const [loading, setLoading] = useState(false);
  const videoClient = useAppGlobalStoreValue((store) => store.videoClient);
  const localMediaStream = useAppGlobalStoreValue(
    (store) => store.localMediaStream,
  );

  const users = [
    { id: 'steve', name: 'Steve Galilli' },
    { id: 'khushal', name: 'Khushal Agarwal' },
    { id: 'santhosh', name: 'Santhosh Vaiyapuri' },
  ];

  const setState = useAppGlobalStoreSetState();

  const { startCall } = useCallKeep();

  const startCallHandler = async () => {
    setLoading(true);
    if (videoClient && localMediaStream) {
      try {
        const callID = uuidv4().toLowerCase();
        await setState({ ringingCallID: callID });
        await getOrCreateCall(videoClient, localMediaStream, {
          autoJoin: true,
          ring: true,
          members: [
            {
              userId: selectedParticipant,
              role: 'member',
              customJson: new Uint8Array(),
            },
          ],
          callId: callID,
          callType: 'default',
        }).then((response) => {
          if (response) {
            const { activeCall, call: callResponse } = response;
            if (!callResponse || !activeCall) {
              setLoading(false);
              return;
            }
            setState({
              activeCall: response?.activeCall,
              call: callResponse,
              ringing: true,
              callAccepted: false,
            });
            setLoading(false);
            startCall({
              callID: activeCall.id,
              createdByUserId: activeCall.createdByUserId,
            });
            navigation.navigate('ActiveCall');
          } else {
            setLoading(false);
          }
        });
      } catch (err) {
        console.log(err);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.participantsContainer}>
        <Text style={[styles.text, styles.label]}>Select Participants</Text>
        {users.map((user) => {
          return (
            <Pressable
              style={styles.participant}
              key={user.id}
              onPress={() => {
                setSelectedParticipant(user.id);
              }}
            >
              <Text
                style={[
                  styles.text,
                  selectedParticipant === user.id
                    ? styles.selectedParticipant
                    : null,
                ]}
              >
                {user.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Button
        disabled={selectedParticipant === ''}
        title="Start a Call"
        onPress={startCallHandler}
      />
      {loading && <ActivityIndicator />}
    </SafeAreaView>
  );
};

export default Ringing;
