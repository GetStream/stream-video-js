import { SfuModels, StreamVideoParticipant } from '@stream-io/video-client';
import {
  StreamCallProvider,
  useActiveCall,
  useParticipants,
} from '@stream-io/video-react-bindings';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { MicOff, ScreenShare, VideoSlash } from '../icons';
import React, { useState } from 'react';
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
  const {
    participant,
    //  setSelectedParticipant
  } = props;

  // const optionsOpenHandler = useCallback(() => {
  //   setSelectedParticipant(participant);
  // }, [participant, setSelectedParticipant]);

  if (!participant) return null;
  const { publishedTracks } = participant;
  const isAudioMuted = !publishedTracks.includes(SfuModels.TrackType.AUDIO);
  const isVideoMuted = !publishedTracks.includes(SfuModels.TrackType.VIDEO);
  const isScreenSharing = publishedTracks.includes(
    SfuModels.TrackType.SCREEN_SHARE,
  );
  const showYouLabel = participant.isLoggedInUser;

  return (
    <View style={styles.participant}>
      <Avatar radius={theme.avatar.xs} participant={participant} />

      <Text style={styles.name}>
        {participant.name ||
          generateParticipantTitle(participant.userId) +
            (showYouLabel ? ' (You)' : '')}
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
        {/* Disablling it until we support permissions */}
        {/* <Pressable style={[styles.svgContainerStyle, theme.icon.sm]} onPress={optionsOpenHandler}>
          <ArrowRight color={theme.light.text_high_emphasis} />
        </Pressable> */}
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
