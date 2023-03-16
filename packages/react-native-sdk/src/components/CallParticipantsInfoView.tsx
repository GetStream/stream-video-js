import { SfuModels, StreamVideoParticipant } from '@stream-io/video-client';
import {
  StreamCallProvider,
  useActiveCall,
  useParticipants,
} from '@stream-io/video-react-bindings';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { MicOff, ScreenShare, ThreeDots, VideoSlash } from '../icons';
import React, { useCallback, useState } from 'react';
import { generateParticipantTitle } from '../utils';
import { CallParticipantOptions } from './CallParticipantsOptions';

type CallParticipantInfoViewType = {
  participant: StreamVideoParticipant;
  setSelectedParticipant: React.Dispatch<
    React.SetStateAction<StreamVideoParticipant | undefined>
  >;
};

const CallParticipantInfoItem = (props: CallParticipantInfoViewType) => {
  const { participant, setSelectedParticipant } = props;

  const optionsOpenHandler = useCallback(() => {
    setSelectedParticipant(participant);
  }, [participant, setSelectedParticipant]);

  if (!participant) return null;
  const { publishedTracks } = participant;
  const isAudioMuted = !publishedTracks.includes(SfuModels.TrackType.AUDIO);
  const isVideoMuted = !publishedTracks.includes(SfuModels.TrackType.VIDEO);
  const isScreenSharing = publishedTracks.includes(
    SfuModels.TrackType.SCREEN_SHARE,
  );

  return (
    <View style={styles.participant}>
      <Image
        style={[styles.avatar]}
        // FIXME: use real avatar from coordinator this is temporary
        source={{
          uri:
            participant.image ||
            `https://getstream.io/random_png/?id=${participant.userId}&name=${participant.userId}`,
        }}
      />
      <Text style={styles.name}>
        {participant.name ||
          generateParticipantTitle(participant.userId) +
            (participant.isLoggedInUser ? ' (You)' : '')}
      </Text>
      <View style={styles.icons}>
        {isScreenSharing && (
          <View style={styles.screenShareIcon}>
            <ScreenShare color="#20E070" />
          </View>
        )}
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
  const activeCall = useActiveCall();
  if (!activeCall) return null;

  return (
    <StreamCallProvider call={activeCall}>
      <InnerCallParticipantsInfoView />
    </StreamCallProvider>
  );
};
/**
 * Shows information about the call, it's participants in the call and
 * their mute states, handler to trigger options (TBD, permissions not impl)
 * and options to invite more people to the call.
 *
 * | Participants List | Options Modal is Open |
 * | :--- | :----: |
 * |![call-participants-info-view-1](https://user-images.githubusercontent.com/25864161/217341952-1e875bc3-e31f-42eb-918b-307eace116b1.png) | ![call-participants-info-view-2](https://user-images.githubusercontent.com/25864161/217341960-5016b678-d1a5-4ecf-bb4b-e463987b9cae.png)|
 **/
const InnerCallParticipantsInfoView = () => {
  const participants = useParticipants();
  const [selectedParticipant, setSelectedParticipant] = useState<
    StreamVideoParticipant | undefined
  >(undefined);

  return (
    <>
      {participants.map((participant) => {
        return (
          <CallParticipantInfoItem
            key={`${participant.userId}${participant.sessionId}`}
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
    marginLeft: 10,
  },
  screenShareIcon: {
    height: 24,
    width: 24,
    marginLeft: 10,
  },
  modal: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e2e2e2aa',
  },
});
