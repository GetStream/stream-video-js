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
  useParticipants,
} from '@stream-io/video-react-bindings';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  Share,
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
import { A11yButtons, A11yComponents } from '../constants/A11yLabels';
import { Z_INDEX } from '../constants';
import { palette } from '../theme/constants';

type CallParticipantInfoViewType = {
  participant: StreamVideoParticipant;
  setSelectedParticipant: React.Dispatch<
    React.SetStateAction<StreamVideoParticipant | undefined>
  >;
};

const CallParticipantInfoItem = (props: CallParticipantInfoViewType) => {
  const { participant, setSelectedParticipant } = props;
  const connectedUser = useConnectedUser();
  const participantIsLocalParticipant =
    participant.userId === connectedUser?.id;
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
    if (!participantIsLocalParticipant) {
      setSelectedParticipant(participant);
    }
  }, [participant, setSelectedParticipant, participantIsLocalParticipant]);

  if (!participant) {
    return null;
  }
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
          (participantIsLocalParticipant ? ' (You)' : '')}
      </Text>
      <View style={styles.icons}>
        {isScreenSharing && (
          <View style={[styles.svgContainerStyle, theme.icon.md]}>
            <ScreenShare color={theme.dark.info} />
          </View>
        )}
        {isAudioMuted && (
          <View style={[styles.svgContainerStyle, theme.icon.sm]}>
            <MicOff color={theme.dark.error} />
          </View>
        )}
        {isVideoMuted && (
          <View style={[styles.svgContainerStyle, theme.icon.sm]}>
            <VideoSlash color={theme.dark.error} />
          </View>
        )}
        {!participantIsLocalParticipant && (
          <Restricted
            requiredGrants={[
              OwnCapability.MUTE_USERS,
              OwnCapability.UPDATE_CALL_PERMISSIONS,
              OwnCapability.BLOCK_USERS,
            ]}
          >
            <View style={[styles.svgContainerStyle, theme.icon.sm]}>
              <ArrowRight color={theme.dark.text_high_emphasis} />
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
  const [selectedParticipant, setSelectedParticipant] = useState<
    StreamVideoParticipant | undefined
  >(undefined);
  const call = useCall();
  const inviteHandler = async () => {
    try {
      await Share.share({
        url: `https://stream-calls-dogfood.vercel.app/join/${call?.id}`,
        title: 'Stream Calls | Join Call',
        message: `Join me on the call using this link https://stream-calls-dogfood.vercel.app/join/${call?.id}`,
      });
    } catch (error: any) {
      console.log(error.message);
    }
  };

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

  const renderItem = useCallback(
    ({ item }: { item: StreamVideoParticipant }) => {
      return (
        <CallParticipantInfoItem
          key={item.sessionId}
          participant={item}
          setSelectedParticipant={setSelectedParticipant}
        />
      );
    },
    [],
  );

  return (
    <Modal
      accessibilityLabel={A11yComponents.PARTICIPANTS_INFO_VIEW}
      animationType="fade"
      transparent
      visible={isCallParticipantsViewVisible}
      onRequestClose={onCloseCallParticipantsViewVisible}
    >
      <>
        {/*independent background, needed due to desired opacity only
         on background, exc. modal content*/}
        <View style={styles.backDropBackground} />
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.leftHeaderElement} />
            <Text style={styles.headerText}>
              Participants ({participants.length})
            </Text>
            <Pressable
              onPress={onCloseCallParticipantsViewVisible}
              accessibilityLabel={A11yButtons.EXIT_PARTICIPANTS_INFO}
              style={styles.closePressable}
            >
              <Cross color={theme.dark.primary} style={theme.icon.xs} />
            </Pressable>
          </View>
          <FlatList data={participants} renderItem={renderItem} />
          <View style={styles.buttonGroup}>
            <Pressable style={styles.button} onPress={inviteHandler}>
              <Text style={styles.buttonText}>Invite</Text>
            </Pressable>
            <Restricted requiredGrants={[OwnCapability.MUTE_USERS]}>
              <Pressable
                style={styles.button}
                onPress={muteAllParticipantsHandler}
              >
                <Text style={styles.buttonText}>Mute All</Text>
              </Pressable>
            </Restricted>
          </View>
        </View>
        <Modal
          animationType="fade"
          transparent
          visible={!!selectedParticipant}
          onRequestClose={() => setSelectedParticipant(undefined)}
        >
          <>
            {/*independent background, needed due to desired opacity only
         on background, exc. modal content*/}
            <View style={styles.backDropBackground} />
            <CallParticipantOptions
              participant={selectedParticipant}
              setSelectedParticipant={setSelectedParticipant}
            />
          </>
        </Modal>
      </>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backDropBackground: {
    opacity: 0.75,
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.dark.static_white,
    zIndex: Z_INDEX.IN_BACK,
  },
  content: {
    zIndex: Z_INDEX.IN_FRONT,
    backgroundColor: theme.dark.bars,
    borderRadius: theme.rounded.md,
    marginVertical: theme.margin.lg,
    marginHorizontal: theme.margin.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.padding.md,
  },
  leftHeaderElement: {
    marginLeft: theme.margin.md,
  },
  headerText: {
    ...theme.fonts.bodyBold,
    color: theme.dark.text_high_emphasis,
  },
  closePressable: {
    padding: theme.padding.sm,
    borderRadius: theme.rounded.xs,
    marginRight: theme.margin.md,
    backgroundColor: palette.grey800,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.padding.md,
    paddingHorizontal: theme.padding.xs,
  },
  button: {
    flex: 1,
    backgroundColor: theme.dark.primary,
    borderRadius: theme.rounded.lg,
    padding: theme.padding.sm,
    marginHorizontal: theme.margin.sm,
  },
  buttonText: {
    textAlign: 'center',
    color: theme.dark.static_white,
    ...theme.fonts.subtitleBold,
  },
  participant: {
    paddingHorizontal: theme.padding.sm,
    paddingVertical: theme.padding.xs,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomColor: theme.dark.borders,
    borderBottomWidth: 1,
  },
  name: {
    marginLeft: theme.margin.sm,
    color: theme.dark.text_high_emphasis,
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
    backgroundColor: theme.dark.overlay,
  },
});
