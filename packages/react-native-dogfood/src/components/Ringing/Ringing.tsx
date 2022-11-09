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
  const username = useAppGlobalStoreValue((store) => store.username);
  const localMediaStream = useAppGlobalStoreValue(
    (store) => store.localMediaStream,
  );
  const ringingCallID = useAppGlobalStoreValue((store) => store.ringingCallID);

  const users = [
    { id: 'steve', name: 'Steve Galilli' },
    { id: 'khushal', name: 'Khushal Agarwal' },
    { id: 'santhosh', name: 'Santhosh Vaiyapuri' },
  ];

  const setState = useAppGlobalStoreSetState();

  // const getRandomNumber = () => String(Math.floor(Math.random() * 100000));

  // const format = (uuid: string) => uuid.split('-')[0];

  // const log = (text: string) => {
  //   setLog(logText + '\n' + text);
  // };

  const { hangupCall, startCall } = useCallKeep(videoClient);

  const sessionId = useSessionId(ringingCallID, selectedParticipant);

  const startCallHandler = async () => {
    setLoading(true);
    if (videoClient) {
      try {
        const callID = uuidv4().toLowerCase();
        await setState({ ringingCallID: callID });
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
          callId: callID,
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
          const call = new Call(sfuClient, username, serverUrl, credentials);
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
              startCall({
                callCid: callID,
                createdByUserId: username,
              });
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
      <Button
        title="Leave Call"
        onPress={() => {
          hangupCall(ringingCallID);
        }}
      />
      {loading && <ActivityIndicator />}
    </SafeAreaView>
  );
};

export default Ringing;
