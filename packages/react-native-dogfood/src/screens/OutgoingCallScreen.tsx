import React, { useEffect } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import {
  useAppGlobalStoreSetState,
  useAppGlobalStoreValue,
} from '../contexts/AppContext';
import { useObservableValue } from '../hooks/useObservable';
import { useStore } from '../hooks/useStore';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';
import { Member } from '@stream-io/video-client/dist/src/gen/video/coordinator/member_v1/member';
import ButtonContainer from '../components/CallControls/ButtonContainer';
import PhoneDown from '../icons/PhoneDown';
import Video from '../icons/Video';
import VideoSlash from '../icons/VideoSlash';
import { useRingCall } from '../hooks/useRingCall';
import Mic from '../icons/Mic';
import MicOff from '../icons/MicOff';

const styles = StyleSheet.create({
  container: {
    height: '100%',
    backgroundColor: 'gray',
  },
  userInfo: {
    textAlign: 'center',
    alignItems: 'center',
    marginTop: 90,
    paddingHorizontal: 55,
  },
  avatarView: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    flexWrap: 'wrap',
    width: '90%',
  },
  avatar: {
    height: 200,
    width: 200,
    borderRadius: 100,
  },
  name: {
    marginTop: 45,
    fontSize: 30,
    color: 'white',
    fontWeight: '400',
    textAlign: 'center',
  },
  callingText: {
    marginTop: 16,
    fontSize: 20,
    textAlign: 'center',
    color: '#FFFFFF',
    fontWeight: '600',
    opacity: 0.6,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    marginTop: '40%',
    position: 'absolute',
    bottom: 90,
    left: 0,
    right: 0,
  },
});

type Props = NativeStackScreenProps<RootStackParamList, 'OutgoingCallScreen'>;

const sizes = [200, 110, 100];

const UserInfoView = (props: {
  members: { [key: string]: Member };
  memberUserIds: string[];
}) => {
  const { memberUserIds, members } = props;
  let name: string;
  if (memberUserIds.length <= 2) {
    name = memberUserIds.join(' and  ');
  } else {
    name = `${memberUserIds.slice(0, 2).join(', ')} and + ${
      memberUserIds.length - 2
    } more`;
  }
  return (
    <View style={styles.userInfo}>
      <View style={styles.avatarView}>
        {Object.values(members)
          .slice(0, 3)
          .map((member) => {
            return (
              <Image
                key={member.userId}
                style={[
                  styles.avatar,
                  {
                    height:
                      sizes[
                        memberUserIds.length > 2 ? 2 : memberUserIds.length - 1
                      ],
                    width:
                      sizes[
                        memberUserIds.length > 2 ? 2 : memberUserIds.length - 1
                      ],
                  },
                ]}
                source={{
                  uri: `https://getstream.io/random_png/?id=${member.userId}&name=${member.userId}`,
                }}
              />
            );
          })}
      </View>
      <Text style={styles.name}>{name}</Text>
    </View>
  );
};

const OutgoingCallScreen = ({ navigation }: Props) => {
  const loopbackMyVideo = useAppGlobalStoreValue(
    (store) => store.loopbackMyVideo,
  );
  const { activeCallRemoteParticipants$ } = useStore();
  const remoteParticipants = useObservableValue(activeCallRemoteParticipants$);
  const isVideoMuted = useAppGlobalStoreValue((store) => store.isVideoMuted);
  const isAudioMuted = useAppGlobalStoreValue((store) => store.isAudioMuted);
  const username = useAppGlobalStoreValue((store) => store.username);
  const setState = useAppGlobalStoreSetState();

  const filteredParticipants = loopbackMyVideo
    ? remoteParticipants
    : remoteParticipants.filter((p) => !p.isLoggedInUser);
  const { activeRingCallDetails$, activeRingCallMeta$, activeCall$ } =
    useStore();
  const activeRingCallDetails = useObservableValue(activeRingCallDetails$);
  const call = useObservableValue(activeCall$);
  const activeRingCallMeta = useObservableValue(activeRingCallMeta$);
  const members = activeRingCallDetails?.members || {};
  const memberUserIds = activeRingCallDetails?.memberUserIds || [];
  const { cancelCall } = useRingCall();

  const hangupHandler = () => {
    if (!call) {
      console.warn('failed to leave call: ', 'call is undefined');
      return;
    }
    try {
      call.leave();
      if (
        activeRingCallMeta &&
        activeRingCallMeta.createdByUserId === username
      ) {
        cancelCall();
      }
    } catch (err) {
      console.warn('failed to leave call', err);
    }
  };

  useEffect(() => {
    if (filteredParticipants.length > 0) {
      navigation.navigate('ActiveCall');
    }
  }, [filteredParticipants, navigation]);

  const videoToggle = () => {
    setState({ isVideoMuted: !isVideoMuted });
  };

  const audioToggle = () => {
    setState({ isAudioMuted: !isAudioMuted });
  };

  return (
    <View style={styles.container}>
      <UserInfoView memberUserIds={memberUserIds} members={members} />
      <Text style={styles.callingText}>Calling...</Text>
      <View style={styles.buttons}>
        <ButtonContainer
          onPress={audioToggle}
          colorKey={isAudioMuted ? 'activated' : 'deactivated'}
          size={70}
          svgContainer={{ height: 25, width: 30 }}
        >
          {isAudioMuted ? <Mic color="black" /> : <MicOff color="white" />}
        </ButtonContainer>
        <ButtonContainer
          onPress={videoToggle}
          colorKey={isVideoMuted ? 'activated' : 'deactivated'}
          size={70}
          svgContainer={{ height: 25, width: 30 }}
        >
          {isVideoMuted ? (
            <Video color="black" />
          ) : (
            <VideoSlash color="white" />
          )}
        </ButtonContainer>
        <ButtonContainer
          onPress={hangupHandler}
          colorKey={'cancel'}
          size={70}
          svgContainer={{ height: 30, width: 30 }}
        >
          <PhoneDown color="#fff" />
        </ButtonContainer>
      </View>
    </View>
  );
};

export default OutgoingCallScreen;
