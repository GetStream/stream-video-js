import {
  OwnCapability,
  SfuModels,
  StreamVideoParticipant,
} from '@stream-io/video-client';
import {
  Restricted,
  useCall,
  useConnectedUser,
  useI18n,
  useParticipants,
} from '@stream-io/video-react-bindings';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  SafeAreaView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  ArrowRight,
  Cross,
  MicOff,
  ScreenShare,
  VideoSlash,
} from '../../icons';
import React, { useCallback, useState } from 'react';
import { generateParticipantTitle } from '../../utils';
import { ParticipantActions } from './internal/ParticipantActions';
import { Avatar } from '../utility/Avatar';
import { theme } from '../../theme';
import { A11yButtons, A11yComponents } from '../../constants/A11yLabels';
import { Z_INDEX } from '../../constants';
import { palette } from '../../theme/constants';

export interface ParticipantsInfoListProps {
  /**
   * Boolean that decides whether the CallParticipantsInfo modal should be open or not.
   */
  isCallParticipantsInfoVisible: boolean;
  /**
   * SetState function to set the value of the boolean field `isCallParticipantsVisible` depending upon whether the CallParticipantsInfo modal should be open or not.
   */
  setIsCallParticipantsInfoVisible: React.Dispatch<
    React.SetStateAction<boolean>
  >;
}

/**
 * A component that shows a list of participants in the call and their information.
 * their mute states, video states, screen share states, etc.
 * Mute all participants, invite participants, etc.
 **/
export const ParticipantsInfoList = ({
  isCallParticipantsInfoVisible,
  setIsCallParticipantsInfoVisible,
}: ParticipantsInfoListProps) => {
  const participants = useParticipants();
  const { t } = useI18n();
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

  const onCloseCallParticipantsVisible = () => {
    setIsCallParticipantsInfoVisible(false);
  };

  const renderItem = useCallback(
    ({ item }: { item: StreamVideoParticipant }) => {
      return (
        <ParticipantInfoItem
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
      accessibilityLabel={A11yComponents.PARTICIPANTS_INFO}
      animationType="fade"
      transparent
      visible={isCallParticipantsInfoVisible}
      onRequestClose={onCloseCallParticipantsVisible}
    >
      <>
        {/*independent background, needed due to desired opacity only
         on background, exc. modal content*/}
        <SafeAreaView style={styles.backDropBackground}>
          <View style={styles.content}>
            <View style={styles.header}>
              <View style={styles.leftHeaderElement} />
              <Text style={styles.headerText}>
                {t('Participants ({{ numberOfParticipants }})', {
                  numberOfParticipants: participants.length,
                })}
              </Text>
              <Pressable
                onPress={onCloseCallParticipantsVisible}
                accessibilityLabel={A11yButtons.EXIT_PARTICIPANTS_INFO}
                style={styles.closePressable}
              >
                <Cross color={theme.dark.primary} style={theme.icon.xs} />
              </Pressable>
            </View>
            <FlatList data={participants} renderItem={renderItem} />
            <View style={styles.buttonGroup}>
              <Pressable style={styles.button} onPress={inviteHandler}>
                <Text style={styles.buttonText}>{t('Invite')}</Text>
              </Pressable>
              <Restricted requiredGrants={[OwnCapability.MUTE_USERS]}>
                <Pressable
                  style={styles.button}
                  onPress={muteAllParticipantsHandler}
                >
                  <Text style={styles.buttonText}>{t('Mute All')}</Text>
                </Pressable>
              </Restricted>
            </View>
          </View>
        </SafeAreaView>

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
            <ParticipantActions
              participant={selectedParticipant}
              setSelectedParticipant={setSelectedParticipant}
            />
          </>
        </Modal>
      </>
    </Modal>
  );
};

type ParticipantInfoType = {
  participant: StreamVideoParticipant;
  setSelectedParticipant: React.Dispatch<
    React.SetStateAction<StreamVideoParticipant | undefined>
  >;
};

const ParticipantInfoItem = (props: ParticipantInfoType) => {
  const { participant, setSelectedParticipant } = props;
  const connectedUser = useConnectedUser();
  const participantIsLocalParticipant =
    participant.userId === connectedUser?.id;

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

  return (
    <Pressable style={styles.participant} onPress={optionsOpenHandler}>
      <View style={styles.participantInfo}>
        <Avatar size={theme.avatar.xs} participant={participant} />

        <Text style={styles.name} numberOfLines={1}>
          {(participant.name || generateParticipantTitle(participant.userId)) +
            (participantIsLocalParticipant ? ' (You)' : '')}
        </Text>
      </View>

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
          <View style={[styles.svgContainerStyle, theme.icon.sm]}>
            <ArrowRight color={theme.dark.text_high_emphasis} />
          </View>
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  backDropBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.dark.overlay,
    zIndex: Z_INDEX.IN_BACK,
  },
  content: {
    zIndex: Z_INDEX.IN_FRONT,
    backgroundColor: theme.dark.bars,
    borderRadius: theme.rounded.md,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomColor: theme.dark.borders,
    borderBottomWidth: 1,
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  name: {
    marginLeft: theme.margin.sm,
    color: theme.dark.text_high_emphasis,
    flexShrink: 1,
    ...theme.fonts.subtitleBold,
  },
  icons: {
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
