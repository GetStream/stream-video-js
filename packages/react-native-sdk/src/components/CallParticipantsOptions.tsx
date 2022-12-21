import { StreamVideoParticipant } from '@stream-io/video-client';
import { Cross, Pin, SpotLight } from '../icons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { generateParticipantTitle } from '../utils';

const options = [
  { title: 'Spotlight Video', icon: <SpotLight color="#72767E" /> },
  { title: 'Pin', icon: <Pin color="#72767E" /> },
];

type CallParticipantOptionsType = {
  participant: StreamVideoParticipant;
  setSelectedParticipant: React.Dispatch<
    React.SetStateAction<StreamVideoParticipant | undefined>
  >;
};

export const CallParticipantOptions = (props: CallParticipantOptionsType) => {
  const { participant, setSelectedParticipant } = props;
  return (
    <View style={styles.menu}>
      <View style={styles.participantInfo}>
        <View style={styles.userInfo}>
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
        </View>

        <Pressable
          style={styles.icon}
          onPress={() => setSelectedParticipant(undefined)}
        >
          <Cross color="#000000" />
        </Pressable>
      </View>
      <View style={styles.options}>
        {options.map((option, index) => {
          return (
            <Pressable
              style={[
                index < options.length - 1 ? styles.borderBottom : null,
                styles.option,
              ]}
              key={option.title}
            >
              <View style={styles.icon}>{option.icon}</View>
              <Text style={styles.title}>{option.title}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  name: {
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 10,
  },
  avatar: {
    height: 50,
    width: 50,
    borderRadius: 50,
  },
  icon: {
    height: 20,
    width: 20,
    marginLeft: 5,
  },
  menu: {
    backgroundColor: 'white',
    marginLeft: 'auto',
    marginRight: 'auto',
    marginTop: 'auto',
    marginBottom: 'auto',
    width: '80%',
    borderRadius: 15,
  },
  participantInfo: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  options: {},
  option: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    marginLeft: 20,
    color: '#000000',
    fontWeight: '400',
  },
  borderBottom: {
    borderBottomColor: '#DBDDE1',
    borderBottomWidth: 1,
  },
});
