import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Linking, Pressable, StyleSheet, View} from 'react-native';
import {mediaDevices, MediaStream} from 'react-native-webrtc';
import Clipboard from '@react-native-clipboard/clipboard';
import {Colors} from 'react-native/Libraries/NewAppScreen';
import {CallState, Participant} from './gen/sfu_models/models';
import {generateToken, User} from './src/modules/User';
import {Client} from './src/modules/Client';
import {Call} from './src/modules/Call';
import {useMuteState} from './src/hooks/useMuteState';
import SettingsModal from './src/components/SettingsModal';
import CallControls from './src/components/CallControls';
import {SafeAreaView} from 'react-native-safe-area-context';
import VideoRenderer from './src/containers/VideoRenderer';
import {Settings} from './src/icons/Settings';
import {useStoredState} from './src/hooks/useStoredState';

// export const SFU_HOSTNAME = "192.168.2.24";
// const SFU_URL = `http://${SFU_HOSTNAME}:3031/twirp`;
export const SFU_HOSTNAME = 'sfu2.fra1.gtstrm.com';
const SFU_URL = 'https://sfu2.fra1.gtstrm.com/rpc/twirp';
const DEFAULT_USER_NAME = 'steve';
const DEFAULT_CALL_ID = '123';
const APP_ID = 'streamrnvideosample';

export default () => {
  const [isSettingsModalVisible, setIsSettingsModalVisible] =
    useState<boolean>(true);
  const [callID, setCallID] = useStoredState('callID', DEFAULT_CALL_ID);
  const [username, setUsername] = useStoredState('username', DEFAULT_USER_NAME);
  const [localMediaStream, setLocalMediaStream] = useState<
    MediaStream | undefined
  >();

  const [loopbackMyVideo, setLoopbackMyVideo] = useState<boolean>(false);
  const [callState, setCallState] = useState<CallState>();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const client = useMemo(() => {
    const user = new User(username, generateToken(username, callID));
    return new Client(SFU_URL, user);
  }, [callID, username]);
  const call = useMemo(
    () => new Call(client, 'simple', callID),
    [callID, client],
  );

  const {isAudioMuted, isVideoMuted, resetAudioAndVideoMuted} = useMuteState(
    client.user.name,
    call,
    localMediaStream,
  );

  const handleCopyInviteLink = useCallback(
    () => Clipboard.setString(`${APP_ID}://callID/${callID}/`),
    [callID],
  );

  const parseAndSetCallID = (url: string | null) => {
    const matchResponse = url?.match(/.*callID\/(.*)\//);
    if (!matchResponse || matchResponse.length < 1) {
      return null;
    }

    setCallID(matchResponse[1]);
  };

  useEffect(() => {
    const configure = async () => {
      const mediaStream = await mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });

      setLocalMediaStream(mediaStream);

      Linking.addEventListener('url', ({url}) => {
        parseAndSetCallID(url);
        setIsSettingsModalVisible(true);
      });
      const url = await Linking.getInitialURL();
      parseAndSetCallID(url);
    };

    configure();
  }, []);

  useEffect(() => {
    setParticipants(callState?.participants ?? []);
  }, [callState]);

  useEffect(() => {
    return call.on('participantJoined', async e => {
      if (e.eventPayload.oneofKind !== 'participantJoined') {
        return;
      }

      const {participant} = e.eventPayload.participantJoined;
      if (participant) {
        setParticipants(prevParticipants => [...prevParticipants, participant]);
      }
    }).unsubscribe;
  }, [call]);

  useEffect(() => {
    return call.on('participantLeft', e => {
      if (e.eventPayload.oneofKind !== 'participantLeft') {
        return;
      }

      const {participant} = e.eventPayload.participantLeft;
      if (participant) {
        setParticipants(ps =>
          ps.filter(p => p.user!.id !== participant.user!.id),
        );
      }
    }).unsubscribe;
  }, [call]);

  return (
    <SafeAreaView style={styles.body} edges={['right', 'left']}>
      <View style={styles.icons}>
        <Pressable onPress={() => setIsSettingsModalVisible(true)}>
          <Settings />
        </Pressable>
      </View>

      <VideoRenderer
        localMediaStream={localMediaStream}
        isVideoMuted={isVideoMuted}
        call={call}
        callState={callState}
        client={client}
        participants={participants}
        loopbackMyVideo={loopbackMyVideo}
      />
      <SettingsModal
        isVisible={isSettingsModalVisible}
        setIsVisible={setIsSettingsModalVisible}
        callID={callID}
        setCallID={setCallID}
        username={username}
        setUsername={setUsername}
        loopbackMyVideo={loopbackMyVideo}
        setLoopbackMyVideo={setLoopbackMyVideo}
        handleCopyInviteLink={handleCopyInviteLink}
      />
      <CallControls
        client={client}
        call={call}
        callState={callState}
        setCallState={setCallState}
        localMediaStream={localMediaStream}
        isAudioMuted={isAudioMuted}
        isVideoMuted={isVideoMuted}
        resetAudioAndVideoMuted={resetAudioAndVideoMuted}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  body: {
    backgroundColor: Colors.white,
    flex: 1,
  },
  stream: {
    backgroundColor: Colors.black,
    flex: 1,
  },
  header: {
    backgroundColor: '#1486b5',
  },
  container: {
    justifyContent: 'center',
    backgroundColor: 'black',
    flexDirection: 'row',
    alignItems: 'center',
    display: 'flex',
    flex: 1,
  },
  icons: {
    display: 'flex',
    flexDirection: 'row',
    position: 'absolute',
    right: 20,
    top: 50,
    zIndex: 1,
  },
});
