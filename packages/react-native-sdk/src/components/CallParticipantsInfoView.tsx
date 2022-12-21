import { SfuModels, StreamVideoParticipant } from '@stream-io/video-client';
import { useParticipants } from '@stream-io/video-react-bindings';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { MicOff, ThreeDots, VideoSlash } from '../icons';
import { useState } from 'react';
import { generateParticipantTitle } from '../utils';
import { CallParticipantOptions } from './CallParticipantsOptions';

type CallParticipantInfoViewType = {
  participant: StreamVideoParticipant;
  setSelectedParticipant: React.Dispatch<
    React.SetStateAction<StreamVideoParticipant | undefined>
  >;
};

const CallParticipantInfoView = (props: CallParticipantInfoViewType) => {
  const { participant, setSelectedParticipant } = props;
  const isAudioMuted = !participant?.publishedTracks.includes(
    SfuModels.TrackType.AUDIO,
  );
  const isVideoMuted = !participant?.publishedTracks.includes(
    SfuModels.TrackType.VIDEO,
  );

  const optionsOpenHandler = () => {
    setSelectedParticipant(participant);
  };

  return (
    <View style={styles.participant}>
      <Image
        style={[styles.avatar]}
        // FIXME: use real avatar from coordinator this is temporary
        source={{
          uri: `https://getstream.io/random_png/?id=${participant.userId}&name=${participant.userId}`,
        }}
      />
      <Text style={styles.name}>
        {generateParticipantTitle(participant.userId) +
          (participant.isLoggedInUser ? ' (You)' : '')}
      </Text>
      <View style={styles.icons}>
        {isAudioMuted && (
          <View style={styles.icon}>
            <MicOff color="#FF3742" />
          </View>
        )}
        {isVideoMuted && (
          <View style={styles.icon}>
            <VideoSlash color="#FF3742" />
          </View>
        )}
        <Pressable style={styles.icon} onPress={optionsOpenHandler}>
          <ThreeDots color="#0e1621" />
        </Pressable>
      </View>
    </View>
  );
};

export const CallParticipantsInfoView = () => {
  const participants = useParticipants();
  const [selectedParticipant, setSelectedParticipant] = useState<
    StreamVideoParticipant | undefined
  >(undefined);

  return (
    <>
      {participants.map((participant) => {
        return (
          <CallParticipantInfoView
            key={participant.userId}
            participant={participant}
            setSelectedParticipant={setSelectedParticipant}
          />
        );
      })}
      {selectedParticipant && (
        <View style={[StyleSheet.absoluteFill, styles.modal]}>
          <CallParticipantOptions
            participant={selectedParticipant}
            setSelectedParticipant={setSelectedParticipant}
          />
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  participant: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomColor: '#DBDDE1',
    borderBottomWidth: 1,
  },
  name: {
    fontWeight: 'bold',
    fontSize: 15,
    marginLeft: 10,
  },
  avatar: {
    height: 50,
    width: 50,
    borderRadius: 50,
  },
  icons: {
    position: 'absolute',
    right: 10,
    display: 'flex',
    flexDirection: 'row',
  },
  icon: {
    height: 20,
    width: 20,
    marginLeft: 5,
  },
  modal: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e2e2e2aa',
  },
});
