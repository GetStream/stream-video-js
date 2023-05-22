import {
  OwnCapability,
  SfuModels,
  StreamVideoParticipant,
} from '@stream-io/video-client';
import {
  Restricted,
  useCall,
  useConnectedUser,
  useParticipants,
} from '@stream-io/video-react-bindings';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ArrowRight, MicOff, ScreenShare, VideoSlash } from '../icons';
import React, { useCallback, useState } from 'react';
import { generateParticipantTitle } from '../utils';
import { CallParticipantOptions } from './CallParticipantsOptions';
import { Avatar } from './Avatar';
import { theme } from '../theme';

type CallParticipantInfoViewType = {
  participant: StreamVideoParticipant;
  setSelectedParticipant: React.Dispatch<
    React.SetStateAction<StreamVideoParticipant | undefined>
  >;
};

const CallParticipantInfoItem = (props: CallParticipantInfoViewType) => {
  const { participant, setSelectedParticipant } = props;
  const connectedUser = useConnectedUser();
  const participantIsLoggedInUser = participant.userId === connectedUser?.id;

  const optionsOpenHandler = useCallback(() => {
    if (!participantIsLoggedInUser) setSelectedParticipant(participant);
  }, [participant, setSelectedParticipant, participantIsLoggedInUser]);

  if (!participant) return null;
  const { publishedTracks } = participant;
  const isAudioMuted = !publishedTracks.includes(SfuModels.TrackType.AUDIO);
  const isVideoMuted = !publishedTracks.includes(SfuModels.TrackType.VIDEO);
  const isScreenSharing = publishedTracks.includes(
    SfuModels.TrackType.SCREEN_SHARE,
  );

  return (
    <Pressable style={styles.participant} onPress={optionsOpenHandler}>
      <Avatar radius={theme.avatar.xs} participant={participant} />

      <Text style={styles.name}>
        {(participant.name || generateParticipantTitle(participant.userId)) +
          (participantIsLoggedInUser ? ' (You)' : '')}
      </Text>
      <View style={styles.icons}>
        {isScreenSharing && (
          <View style={[styles.svgContainerStyle, theme.icon.md]}>
            <ScreenShare color={theme.light.info} />
          </View>
        )}
        {isAudioMuted && (
          <View style={[styles.svgContainerStyle, theme.icon.sm]}>
            <MicOff color={theme.light.error} />
          </View>
        )}
        {isVideoMuted && (
          <View style={[styles.svgContainerStyle, theme.icon.sm]}>
            <VideoSlash color={theme.light.error} />
          </View>
        )}
        {!participantIsLoggedInUser && (
          <View style={[styles.svgContainerStyle, theme.icon.sm]}>
            <ArrowRight color={theme.light.text_high_emphasis} />
          </View>
        )}
      </View>
    </Pressable>
  );
};

export const CallParticipantsInfoView = () => {
  return <InnerCallParticipantsInfoView />;
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
  const call = useCall();

  const muteAllParticipantsHandler = async () => {
    try {
      await call?.muteAllUsers('audio');
      Alert.alert('Users Muted Successfully');
    } catch (error) {
      console.log('Error muting users', error);
    }
  };

  return (
    <>
      <View style={styles.buttonGroup}>
        <Restricted requiredGrants={[OwnCapability.MUTE_USERS]}>
          <Pressable style={styles.button} onPress={muteAllParticipantsHandler}>
            <Text style={styles.buttonText}>Mute All</Text>
          </Pressable>
        </Restricted>
      </View>
      <FlatList
        data={participants}
        keyExtractor={(item) => `participant-info-${item.sessionId}`}
        renderItem={({ item: participant }) => (
          <CallParticipantInfoItem
            participant={participant}
            setSelectedParticipant={setSelectedParticipant}
          />
        )}
      />
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
  buttonGroup: {},
  button: {
    backgroundColor: theme.light.primary,
    borderRadius: theme.rounded.lg,
    padding: theme.padding.md,
    margin: theme.margin.lg,
  },
  buttonText: {
    textAlign: 'center',
    color: theme.light.static_white,
    ...theme.fonts.subtitleBold,
  },
  participant: {
    paddingHorizontal: theme.padding.sm,
    paddingVertical: theme.padding.xs,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomColor: theme.light.borders,
    borderBottomWidth: 1,
  },
  name: {
    marginLeft: theme.margin.sm,
    color: theme.light.text_high_emphasis,
    ...theme.fonts.subtitleBold,
  },
  icons: {
    position: 'absolute',
    right: theme.spacing.lg,
    display: 'flex',
    flexDirection: 'row',
  },
  svgContainerStyle: {
    marginLeft: theme.margin.sm,
  },
  modal: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.light.overlay,
  },
});
