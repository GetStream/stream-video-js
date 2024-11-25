import React from 'react';
import {
  CallControlsButton,
  useTheme,
} from '@stream-io/video-react-native-sdk';
import { IconWrapper } from '@stream-io/video-react-native-sdk/src/icons';
import { useCallStateHooks } from '@stream-io/video-react-bindings';
import { CallingState } from '@stream-io/video-client';
import { BadgeCountIndicator } from './BadgeCountIndicator';
import Participants from '../../assets/Participants';

/**
 * The props for the Participants Button in the Call Controls.
 */
export type ParticipantsButtonProps = {
  /**
   * Handler to be called when the participants button is pressed.
   * @returns void
   */
  onParticipantInfoPress?: () => void;
  /**
   * The count of the current participants present in the call.
   */
  participantCount?: number;
};

/**
 * Button to open the Participant window while in the call.
 *
 * This button also displays the participant count of the participants in the call.
 */
export const ParticipantsButton = ({
  onParticipantInfoPress,
  participantCount,
}: ParticipantsButtonProps) => {
  const {
    theme: { colors, chatButton, defaults },
  } = useTheme();

  const { useCallMembers, useCallCallingState } = useCallStateHooks();
  const members = useCallMembers();
  const callingState = useCallCallingState();

  let count = 0;
  /**
   * We show member's length if Incoming and Outgoing Call Views are rendered.
   * Else we show the count of the participants that are in the call.
   * Since the members count also includes caller/callee, we reduce the count by 1.
   **/
  if (callingState === CallingState.RINGING) {
    count = members.length - 1;
  } else {
    count = participantCount ?? 0;
  }

  // TODO: PBE-5873 [Demo App] On click implement showing the Participant List
  return (
    <CallControlsButton onPress={onParticipantInfoPress} style={chatButton}>
      <BadgeCountIndicator count={count} />
      <IconWrapper>
        <Participants color={colors.iconPrimary} size={defaults.iconSize} />
      </IconWrapper>
    </CallControlsButton>
  );
};
