import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MicOff, PinVertical, ScreenShare, VideoSlash } from '../../../icons';
import { theme } from '../../../theme';
import { useCall, useI18n } from '@stream-io/video-react-bindings';
import { ComponentTestIds } from '../../../constants/TestIds';
import { ParticipantViewProps } from './ParticipantView';
import { Z_INDEX } from '../../../constants';
import { SfuModels } from '@stream-io/video-client';

export type ParticipantLabelProps = Pick<
  ParticipantViewProps,
  'videoMode' | 'participant'
>;

export const ParticipantLabel = ({
  participant,
  videoMode,
}: ParticipantLabelProps) => {
  const { name, userId, pin, sessionId, publishedTracks, isLocalParticipant } =
    participant;
  const call = useCall();
  const { t } = useI18n();
  const participantName = name ?? userId;
  const participantLabel = isLocalParticipant ? t('You') : participantName;
  const isPinningEnabled = pin?.isLocalPin;
  const isAudioMuted = !publishedTracks.includes(SfuModels.TrackType.AUDIO);
  const isVideoMuted = !publishedTracks.includes(SfuModels.TrackType.VIDEO);

  const unPinParticipantHandler = () => {
    call?.unpin(sessionId);
  };

  if (videoMode === 'screen') {
    return (
      <View
        style={styles.status}
        testID={ComponentTestIds.PARTICIPANT_SCREEN_SHARING}
      >
        <View style={[{ marginRight: theme.margin.sm }, theme.icon.md]}>
          <ScreenShare color={theme.light.static_white} />
        </View>
        <Text style={styles.userNameLabel} numberOfLines={1}>
          {t('{{ userName }} is sharing their screen', {
            userName: participantLabel,
          })}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.status}>
      <Text style={styles.userNameLabel} numberOfLines={1}>
        {participantLabel}
      </Text>
      {isAudioMuted && (
        <View style={[styles.svgContainerStyle, theme.icon.xs]}>
          <MicOff color={theme.light.error} />
        </View>
      )}
      {isVideoMuted && (
        <View style={[styles.svgContainerStyle, theme.icon.xs]}>
          <VideoSlash color={theme.light.error} />
        </View>
      )}
      {isPinningEnabled && (
        <Pressable
          style={[styles.svgContainerStyle, theme.icon.xs]}
          onPress={unPinParticipantHandler}
        >
          <PinVertical color={theme.light.static_white} />
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.padding.sm,
    borderRadius: theme.rounded.xs,
    backgroundColor: theme.light.static_overlay,
    flexShrink: 1,
    zIndex: Z_INDEX.IN_FRONT,
  },
  userNameLabel: {
    flexShrink: 1,
    color: theme.light.static_white,
    ...theme.fonts.caption,
  },
  svgContainerStyle: {
    marginLeft: theme.margin.xs,
  },
});
