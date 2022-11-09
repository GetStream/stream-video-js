import { StreamSfuClient } from '@stream-io/video-client';
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
import RNCallKeep from 'react-native-callkeep';
import { v4 as uuidv4 } from 'uuid';
import {
  useAppGlobalStoreValue,
  useAppGlobalStoreSetState,
} from '../../contexts/AppContext';
import { useSessionId } from '../../hooks/useSessionId';
import { Call } from '../../modules/Call';
import InCallManager from 'react-native-incall-manager';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../types';
import { getOrCreateCall } from '../../utils/callUtils';

const styles = StyleSheet.create({
  container: {
    margin: 15,
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
  const [logText, setLog] = useState('');
  const [heldCalls, setHeldCalls] = useState({}); // callKeep uuid: held
  const [calls, setCalls] = useState({}); // callKeep uuid: number
  const [selectedParticipant, setSelectedParticipant] = useState('');
  const [loading, setLoading] = useState(false);
  const videoClient = useAppGlobalStoreValue((store) => store.videoClient);
  const localMediaStream = useAppGlobalStoreValue(
    (store) => store.localMediaStream,
  );
  const [callUUID, setCallUUID] = useState(uuidv4().toLowerCase());

  const users = [
    { id: 'steve', name: 'Steve Galilli' },
    { id: 'khushal', name: 'Khushal Agarwal' },
    { id: 'santhosh', name: 'Santhosh Vaiyapuri' },
  ];

  const setState = useAppGlobalStoreSetState();

  const getRandomNumber = () => String(Math.floor(Math.random() * 100000));

  const format = (uuid: string) => uuid.split('-')[0];

  const log = (text: string) => {
    setLog(logText + '\n' + text);
  };

  const addCall = (number: string) => {
    setHeldCalls({ ...heldCalls, [callUUID]: false });
    setCalls({ ...calls, [callUUID]: number });
  };

  const sessionId = useSessionId(callUUID, selectedParticipant);

  const startCall = (number: string) => {
    addCall(number);
    log(`[startCall] ${format(callUUID)}, number: ${number}`);
    try {
      RNCallKeep.startCall(callUUID, '282829292', 'Test user', 'generic');
    } catch (err) {
      console.log(err);
    }
  };

  const removeCall = () => {
    const { ...updated } = calls;
    const { ...updatedHeldCalls } = heldCalls;

    setCalls(updated);
    setCalls(updatedHeldCalls);
  };

  const hangup = () => {
    RNCallKeep.endCall(callUUID);
    removeCall();
  };

  const startCallHandler = async () => {
    setLoading(true);
    if (videoClient) {
      try {
        const response = await getOrCreateCall(videoClient, {
          autoJoin: true,
          ring: true,
          members: [
            {
              userId: selectedParticipant,
              role: 'member',
              customJson: new Uint8Array(),
            },
          ],
          callId: callUUID,
          callType: 'default',
        });
        if (response) {
          const { activeCall, credentials } = response;

          if (!credentials || !activeCall) {
            return;
          } else {
            setLoading(false);
          }

          setState({ activeCall: response?.activeCall });
          const serverUrl = 'http://192.168.1.41:3031/twirp';
          const sfuClient = new StreamSfuClient(
            serverUrl,
            credentials.token,
            sessionId,
          );
          const call = new Call(
            sfuClient,
            selectedParticipant,
            serverUrl,
            credentials,
          );
          try {
            const callState = await call.join(localMediaStream);
            if (callState && localMediaStream) {
              InCallManager.start({ media: 'video' });
              InCallManager.setForceSpeakerphoneOn(true);
              await call.publish(localMediaStream);
              setState({
                activeCall,
                callState,
                sfuClient,
                call,
              });
              setLoading(false);
              startCall(getRandomNumber());
              navigation.navigate('ActiveCall');
            }
          } catch (err) {
            setState({
              callState: undefined,
            });
            setLoading(false);
          }
        }
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
                console.log(user.id);
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
      <Button title="Leave Call" onPress={hangup} />
      {loading && <ActivityIndicator />}
    </SafeAreaView>
  );
};

export default Ringing;
