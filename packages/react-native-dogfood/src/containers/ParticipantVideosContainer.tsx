import React, {useEffect, useState} from 'react';
import {Call} from '../modules/Call';
import {VideoDimension} from '../gen/video/sfu/models/models';
import {MediaStream, RTCView} from 'react-native-webrtc';
import {
  StyleSheet,
  View,
  Image,
  LayoutChangeEvent,
  LayoutRectangle,
  Text,
} from 'react-native';
import {useMuteState} from '../hooks/useMuteState';
import MicOff from '../icons/MicOff';
import Mic from '../icons/Mic';
import {useAppValueContext} from '../contexts/AppContext';

type UserStreamMap = {
  [userId: string]: MediaStream | undefined;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    flexDirection: 'column',
    justifyContent: 'center',
    marginBottom: -25,
  },
  stream: {
    flex: 1,
    borderColor: 'gray',
    justifyContent: 'center',
  },
  avatar: {
    backgroundColor: 'gray',
    borderRadius: 50,
    height: 100,
    width: 100,
    justifyContent: 'center',
    alignSelf: 'center',
  },
  status: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    marginLeft: 10,
    bottom: 10,
    backgroundColor: '#1C1E22',
    paddingHorizontal: 5,
    borderRadius: 5,
    paddingVertical: 5,
  },
  userName: {
    color: 'white',
    fontSize: 10,
  },
  svgContainer: {
    height: 15,
    width: 15,
    marginLeft: 5,
  },
  videoSpeakingState: {
    borderWidth: 2,
    borderColor: '#005FFF',
  },
  lastParticipant: {
    bottom: 35,
  },
});

const ParticipantVideosContainer = () => {
  const {
    call,
    sfuClient,
    participants,
    loopbackMyVideo,
    username: currentUserName,
  } = useAppValueContext();
  const [userAudioStreams, setUserAudioStreams] = useState<UserStreamMap>({});
  const [userVideoStreams, setUserVideoStreams] = useState<UserStreamMap>({});
  const [videoViewByUserId, setVideoViewByUserId] = useState<{
    [userId: string]: LayoutRectangle;
  }>({});
  const [speakers, setSpeakers] = useState<string[]>([]);

  const onLayoutHandler = (nativeEvent: LayoutChangeEvent, userId?: string) => {
    const {
      nativeEvent: {layout},
    } = nativeEvent;
    if (userId) {
      setVideoViewByUserId(videoViews => ({
        ...videoViews,
        [userId]: layout,
      }));
    }
  };

  useEffect(() => {
    if (!call) return;
    call.handleOnTrack = (e: any) => {
      const [primaryStream] = e.streams;
      const [name] = primaryStream.id.split(':');
      if (e.track.kind === 'video') {
        setUserVideoStreams(s => ({
          ...s,
          [name]: primaryStream,
        }));
      } else if (e.track.kind === 'audio') {
        setUserAudioStreams(s => ({
          ...s,
          [name]: primaryStream,
        }));
      }
    };

    return () => {
      call.handleOnTrack = undefined;
    };
  }, [call]);

  useEffect(() => {
    const updateSubscriptions = async () => {
      if (!sfuClient) {
        return;
      }
      const subscriptions: {[key: string]: VideoDimension} = {};
      Object.entries(videoViewByUserId).forEach(([userId, videoView]) => {
        if (!loopbackMyVideo && userId === currentUserName) {
          return;
        }
        if (userId) {
          subscriptions[userId] = {
            height: Math.round(videoView.height),
            width: Math.round(videoView.width),
          };
        }
      });
      if (Object.keys(subscriptions).length !== 0) {
        await sfuClient.updateSubscriptions(subscriptions);
      }
    };
    updateSubscriptions();
  }, [sfuClient, currentUserName, loopbackMyVideo, videoViewByUserId]);

  useEffect(() => {
    if (!call) return;
    call.on('audioLevelChanged', event => {
      if (event.eventPayload.oneofKind !== 'audioLevelChanged') {
        return;
      }
      const audioLevelChanged = event.eventPayload.audioLevelChanged;
      const currentSpeakers: string[] = audioLevelChanged.audioLevels.reduce(
        (acc, audio) => {
          if (audio.level > 0) {
            acc.push(audio.userId);
          }
          return acc;
        },
        [] as string[],
      );
      setSpeakers(currentSpeakers);
    });
  }, [call]);

  // TODO: SANTHOSH - remove this, its a temporary way to avoid duplicate streams
  const uniqueUsers = Array.from(
    new Set(
      participants
        .map(p => ({
          id: p.user!.id,
          avatar: p.user!.imageUrl,
          name: p.user!.name,
        }))
        .filter(
          // dont show user's own stream
          ({id}) => !!id && currentUserName !== id,
        ),
    ).values(),
  );

  if (!call || uniqueUsers.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {uniqueUsers.map((user, index) => {
        if (!user.id) {
          return null;
        }

        const audioStream = userAudioStreams[user.id];
        const videoStream = userVideoStreams[user.id];

        return (
          <ParticipantVideoContainer
            key={user.id}
            isSpeaking={speakers.includes(user.id)}
            user={user}
            call={call}
            videoStream={videoStream}
            audioStream={audioStream}
            onLayoutHandler={onLayoutHandler}
            lastParticipant={index === uniqueUsers.length - 1}
          />
        );
      })}
    </View>
  );
};

const ParticipantVideoContainer = ({
  call,
  isSpeaking,
  user,
  videoStream,
  audioStream,
  onLayoutHandler,
  lastParticipant,
}: {
  user: {id: string; avatar: string; name: string};
  call: Call;
  videoStream?: MediaStream;
  audioStream?: MediaStream;
  isSpeaking: boolean;
  onLayoutHandler: (nativeEvent: LayoutChangeEvent, userId?: string) => void;
  lastParticipant: boolean;
}) => {
  const mediaStream =
    audioStream &&
    videoStream &&
    new MediaStream([...audioStream?.getTracks(), ...videoStream?.getTracks()]);

  const {isAudioMuted} = useMuteState(user.id, call, mediaStream);
  return (
    <View
      style={[styles.stream, isSpeaking ? styles.videoSpeakingState : null]}
      onLayout={(nativeEvent: LayoutChangeEvent) =>
        onLayoutHandler(nativeEvent, user.id)
      }>
      {videoStream !== undefined ? (
        <RTCView
          mirror
          streamURL={videoStream.toURL()}
          style={styles.stream}
          objectFit="cover"
        />
      ) : (
        <Image source={{uri: user.avatar}} style={styles.avatar} />
      )}
      {audioStream && <RTCView streamURL={audioStream.toURL()} />}
      <View
        style={[
          styles.status,
          lastParticipant ? styles.lastParticipant : null,
        ]}>
        <Text style={styles.userName}>{user.name || user.id}</Text>
        <View style={styles.svgContainer}>
          {isAudioMuted ? <MicOff color="red" /> : <Mic color="red" />}
        </View>
      </View>
    </View>
  );
};
export default ParticipantVideosContainer;
