import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useCallStateHooks } from '@stream-io/video-react-bindings';
import { useDebouncedValue } from '../../../utils/hooks/useDebouncedValue';
import {
  CallParticipantsList as DefaultCallParticipantsList,
  CallParticipantsListComponentProps,
} from '../CallParticipantsList/CallParticipantsList';
import { ComponentTestIds } from '../../../constants/TestIds';
import { useTheme } from '../../../contexts/ThemeContext';
import { CallContentProps } from '../CallContent';
import { ParticipantViewComponentProps } from '../../Participant';

/**
 * Props for the CallParticipantsFullscreen component.
 */
export type CallParticipantsFullscreenProps = ParticipantViewComponentProps &
  Pick<
    CallContentProps,
    'supportedReactions' | 'CallParticipantsList' | 'disablePictureInPicture'
  > &
  Pick<CallParticipantsListComponentProps, 'ParticipantView'> & {
    /**
     * Boolean to decide if local participant will be visible in the grid when there is 1:1 call.
     */
    showLocalParticipant?: boolean;
  };

/**
 * Component used to display a participant in fullscreen mode.
 */
export const CallParticipantsFullscreen = ({
  CallParticipantsList = DefaultCallParticipantsList,
  ParticipantLabel,
  ParticipantNetworkQualityIndicator,
  ParticipantReaction,
  ParticipantVideoFallback,
  ParticipantView,
  VideoRenderer,
  supportedReactions,
  showLocalParticipant,
}: CallParticipantsFullscreenProps) => {
  const {
    theme: { colors, callParticipantsFullscreen },
  } = useTheme();
  const { useRemoteParticipants, useLocalParticipant } = useCallStateHooks();
  const remoteParticipants = useDebouncedValue(useRemoteParticipants(), 300);
  const localParticipant = useLocalParticipant();

  let participants =
    showLocalParticipant && localParticipant
      ? [localParticipant]
      : remoteParticipants;

  if (remoteParticipants.length === 0 && localParticipant) {
    participants = [localParticipant];
  }

  const participantViewProps: CallParticipantsListComponentProps = {
    ParticipantView,
    ParticipantLabel,
    ParticipantNetworkQualityIndicator,
    ParticipantReaction,
    ParticipantVideoFallback,
    VideoRenderer,
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.sheetPrimary },
        callParticipantsFullscreen?.container,
      ]}
      testID={ComponentTestIds.CALL_PARTICIPANTS_FULLSCREEN}
    >
      {CallParticipantsList && (
        <CallParticipantsList
          participants={participants}
          supportedReactions={supportedReactions}
          {...participantViewProps}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
});
