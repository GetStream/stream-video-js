import React, { useCallback, useMemo, useState } from 'react';
import {
  Avatar,
  hasAudio,
  hasScreenShare,
  hasVideo,
  OwnCapability,
  Restricted,
  StreamVideoParticipant,
  useCall,
  useCallStateHooks,
  useConnectedUser,
  useI18n,
  useTheme,
} from '@stream-io/video-react-native-sdk';
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
import { Cross } from '../assets/Cross';
import { MicOff } from '../assets/MicOff';
import { ScreenShare } from '../assets/ScreenShare';
import { VideoSlash } from '../assets/VideoSlash';
import { ArrowRight } from '../assets/ArrowRight';
import { ParticipantActions } from './ParticipantActions';
import { generateParticipantTitle } from '../utils';
import { Z_INDEX } from '../constants';
import { ButtonTestIds } from '../constants/TestIds';
import { useAppGlobalStoreValue } from '../contexts/AppContext';

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
  const styles = useStyles();
  const { theme } = useTheme();
  const { useParticipants } = useCallStateHooks();
  const participants = useParticipants();
  const { t } = useI18n();
  const [selectedParticipant, setSelectedParticipant] = useState<
    StreamVideoParticipant | undefined
  >(undefined);
  const call = useCall();

  const environment = useAppGlobalStoreValue((store) => store.appEnvironment);

  const inviteHandler = async () => {
    if (!call) {
      throw new Error('Call not found');
    }
    try {
      const url =
        environment === 'pronto'
          ? `https://pronto.getstream.io/join/${call.id}`
          : environment === 'pronto-staging'
            ? `https://pronto-staging.getstream.io/join/${call.id}`
            : `https://getstream.io/video/demos/join/${call.id}`;
      await Share.share({
        url,
        title: 'Stream Calls | Join Call',
        message: `Join me on the call using this link ${url}`,
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
      animationType="fade"
      transparent
      visible={isCallParticipantsInfoVisible}
      onRequestClose={onCloseCallParticipantsVisible}
      supportedOrientations={['portrait', 'landscape']}
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
                style={styles.closePressable}
                testID={ButtonTestIds.EXIT_PARTICIPANTS_INFO}
              >
                <Cross
                  color={theme.colors.iconPrimary}
                  style={styles.crossIcon}
                />
              </Pressable>
            </View>
            <FlatList data={participants} renderItem={renderItem} />
            <View style={styles.buttonGroup}>
              <Pressable style={styles.inviteButton} onPress={inviteHandler}>
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
          supportedOrientations={['portrait', 'landscape']}
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
  const {
    theme: { colors },
  } = useTheme();
  const styles = useStyles();
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
  const isAudioMuted = !hasAudio(participant);
  const isVideoMuted = !hasVideo(participant);
  const isScreenSharing = hasScreenShare(participant);

  return (
    <Pressable style={styles.participant} onPress={optionsOpenHandler}>
      <View style={styles.participantInfo}>
        <Avatar size={50} participant={participant} />

        <Text style={styles.name} numberOfLines={1}>
          {(participant.name || generateParticipantTitle(participant.userId)) +
            (participantIsLocalParticipant ? ' (You)' : '')}
        </Text>
      </View>

      <View style={styles.icons}>
        {isScreenSharing && (
          <View
            style={[styles.svgContainerStyle, styles.screenShareIconContainer]}
          >
            <ScreenShare color={colors.iconSuccess} />
          </View>
        )}
        {isAudioMuted && (
          <View style={[styles.svgContainerStyle, styles.genericIconContainer]}>
            <MicOff color={colors.iconWarning} />
          </View>
        )}
        {isVideoMuted && (
          <View style={[styles.svgContainerStyle, styles.genericIconContainer]}>
            <VideoSlash color={colors.iconWarning} />
          </View>
        )}
        {!participantIsLocalParticipant && (
          <View style={[styles.svgContainerStyle, styles.genericIconContainer]}>
            <ArrowRight color={colors.iconPrimary} />
          </View>
        )}
      </View>
    </Pressable>
  );
};

const useStyles = () => {
  const { theme } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        backDropBackground: {
          ...StyleSheet.absoluteFillObject,
          zIndex: Z_INDEX.IN_BACK,
        },
        content: {
          zIndex: Z_INDEX.IN_FRONT,
          backgroundColor: theme.colors.sheetPrimary,
          borderRadius: 15,
          marginHorizontal: 16,
          marginTop: 65,
        },
        header: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingVertical: 12,
        },
        leftHeaderElement: {
          marginLeft: 16,
        },
        headerText: {
          fontSize: 16,
          fontWeight: '600',
          color: theme.colors.textPrimary,
        },
        closePressable: {
          padding: 8,
          borderRadius: 15,
          marginRight: 16,
          backgroundColor: theme.colors.buttonSecondary,
        },
        buttonGroup: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingVertical: 12,
          paddingHorizontal: 4,
        },
        screenShareIconContainer: {
          height: 25,
          width: 25,
        },
        genericIconContainer: {
          height: 20,
          width: 20,
        },
        crossIcon: {
          height: 15,
          width: 15,
        },
        button: {
          flex: 1,
          borderRadius: 24,
          padding: 8,
          marginHorizontal: 8,
          borderColor: theme.colors.buttonSecondary,
          borderWidth: 2,
        },
        inviteButton: {
          flex: 1,
          backgroundColor: theme.colors.buttonPrimary,
          borderRadius: 24,
          padding: 8,
          marginHorizontal: 8,
        },
        buttonText: {
          textAlign: 'center',
          color: theme.colors.iconPrimary,
          fontSize: 16,
          fontWeight: '500',
        },
        participant: {
          paddingHorizontal: 8,
          paddingVertical: 4,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottomColor: theme.colors.sheetTertiary,
          borderBottomWidth: 1,
        },
        participantInfo: {
          flexDirection: 'row',
          alignItems: 'center',
          flexShrink: 1,
        },
        name: {
          marginLeft: 8,
          color: theme.colors.textPrimary,
          flexShrink: 1,
          fontSize: 16,
          fontWeight: '500',
        },
        icons: {
          flexDirection: 'row',
        },
        svgContainerStyle: {
          marginLeft: 8,
        },
        modal: {
          alignItems: 'center',
          justifyContent: 'center',
        },
      }),
    [theme],
  );
};
