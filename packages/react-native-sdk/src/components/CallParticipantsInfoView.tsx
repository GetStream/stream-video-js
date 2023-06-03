import {
  OwnCapability,
  SfuModels,
  StreamVideoParticipant,
} from '@stream-io/video-client';
import {
  Restricted,
  useCall,
  useConnectedUser,
  useHasPermissions,
  useParticipantCount,
  useParticipants,
} from '@stream-io/video-react-bindings';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ArrowRight, Cross, MicOff, ScreenShare, VideoSlash } from '../icons';
import React, { useCallback, useState } from 'react';
import { generateParticipantTitle } from '../utils';
import { CallParticipantOptions } from './CallParticipantsOptions';
import { Avatar } from './Avatar';
import { theme } from '../theme';
import { Participant } from '@stream-io/video-client/dist/src/gen/video/sfu/models/models';

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
  const userHasMuteUsersCapability = useHasPermissions(
    OwnCapability.MUTE_USERS,
  );
  const userHasUpdateCallPermissionsCapability = useHasPermissions(
    OwnCapability.UPDATE_CALL_PERMISSIONS,
  );
  const userHasBlockUserCapability = useHasPermissions(
    OwnCapability.BLOCK_USERS,
  );
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
  const isParticipantItemPressable =
    userHasBlockUserCapability ||
    userHasMuteUsersCapability ||
    userHasUpdateCallPermissionsCapability;

  return (
    <Pressable
      style={styles.participant}
      onPress={optionsOpenHandler}
      disabled={!isParticipantItemPressable}
    >
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
          <Restricted
            requiredGrants={[
              OwnCapability.MUTE_USERS,
              OwnCapability.UPDATE_CALL_PERMISSIONS,
              OwnCapability.BLOCK_USERS,
            ]}
          >
            <View style={[styles.svgContainerStyle, theme.icon.sm]}>
              <ArrowRight color={theme.light.text_high_emphasis} />
            </View>
          </Restricted>
        )}
      </View>
    </Pressable>
  );
};

export interface CallParticipantsInfoViewType {
  /**
   * Boolean that decided whether the CallPartcipantsInfoView modal should be open or not.
   */
  isCallParticipantsViewVisible: boolean;
  /**
   * SetState function to set the value of the boolean field `isCallParticipantsViewVisible` depending upon whether the CallPartcipantsInfoView modal should be open or not.
   */
  setIsCallParticipantsViewVisible: React.Dispatch<
    React.SetStateAction<boolean>
  >;
}

/**
 * Shows information about the call, it's participants in the call and
 * their mute states, handler to trigger options (TBD, permissions not impl)
 * and options to invite more people to the call.
 *
 * | Participants List | Options Modal is Open |
 * | :--- | :----: |
 * |![call-participants-info-view-1](https://user-images.githubusercontent.com/25864161/217341952-1e875bc3-e31f-42eb-918b-307eace116b1.png) | ![call-participants-info-view-2](https://user-images.githubusercontent.com/25864161/217341960-5016b678-d1a5-4ecf-bb4b-e463987b9cae.png)|
 **/
export const CallParticipantsInfoView = ({
  isCallParticipantsViewVisible,
  setIsCallParticipantsViewVisible,
}: CallParticipantsInfoViewType) => {
  const participants = useParticipants();
  const participantCount = useParticipantCount();
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

  const onCloseCallParticipantsViewVisible = () => {
    setIsCallParticipantsViewVisible(false);
  };

  const renderItem = useCallback(({ item }: { item: Participant }) => {
    return (
      <CallParticipantInfoItem
        key={item.sessionId}
        participant={item}
        setSelectedParticipant={setSelectedParticipant}
      />
    );
  }, []);

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isCallParticipantsViewVisible}
      onRequestClose={onCloseCallParticipantsViewVisible}
    >
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.leftHeaderElement} />
            <Text style={styles.headerText}>
              Participants ({participantCount})
            </Text>
            <Pressable
              style={[styles.closeIcon, theme.icon.sm]}
              onPress={onCloseCallParticipantsViewVisible}
            >
              <Cross color={theme.light.primary} />
            </Pressable>
          </View>
          <View style={styles.buttonGroup}>
            <Restricted requiredGrants={[OwnCapability.MUTE_USERS]}>
              <Pressable
                style={styles.button}
                onPress={muteAllParticipantsHandler}
              >
                <Text style={styles.buttonText}>Mute All</Text>
              </Pressable>
            </Restricted>
          </View>
          <FlatList data={participants} renderItem={renderItem} />
          {selectedParticipant && (
            <View style={[StyleSheet.absoluteFill, styles.modal]}>
              <CallParticipantOptions
                participant={selectedParticipant}
                setSelectedParticipant={setSelectedParticipant}
              />
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    backgroundColor: theme.light.bars,
    borderRadius: theme.rounded.md,
    marginVertical: theme.margin.lg,
    marginHorizontal: theme.margin.md,
  },
  header: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.padding.md,
    width: '100%',
  },
  leftHeaderElement: {
    marginLeft: theme.margin.md,
  },
  headerText: {
    ...theme.fonts.bodyBold,
    color: theme.light.text_high_emphasis,
  },
  closeIcon: {
    marginRight: theme.margin.md,
  },
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
