import React, { useState } from 'react';
import {
  CallControlsButton,
  CallingState,
  useCallStateHooks,
} from '@stream-io/video-react-native-sdk';
import { ControlButtonIcon } from '@stream-io/video-react-native-sdk/src/icons';
import { BadgeCountIndicator } from './BadgeCountIndicator';
import { Users } from '../../../assets/Users';
import { ParticipantsInfoListModal } from '../../ParticipantsInfoListModal';

/**
 * The props for the Participants Button in the Call Controls.
 */
export type ParticipantsButtonProps = {
  /**
   * The count of the current participants present in the call.
   */
  participantCount?: number;
};

/**
 * Button to open the Participant window while in the call.
 *
 * This button also displays the participant count of the participants in the call,
 * and owns the participants list modal it opens.
 */
export const ParticipantsButton = ({
  participantCount,
}: ParticipantsButtonProps) => {
  const [isParticipantsInfoVisible, setIsParticipantsInfoVisible] =
    useState(false);
  const { useCallMembers, useCallCallingState, useParticipantCount } =
    useCallStateHooks();
  const members = useCallMembers();
  const callingState = useCallCallingState();
  const callParticipantCount = useParticipantCount();

  let count = 0;
  /**
   * We show member's length if Incoming and Outgoing Call Views are rendered.
   * Else we show the count of the participants that are in the call.
   * Since the members count also includes caller/callee, we reduce the count by 1.
   **/
  if (callingState === CallingState.RINGING) {
    count = members.length - 1;
  } else {
    count = participantCount ?? callParticipantCount;
  }

  return (
    <>
      <CallControlsButton onPress={() => setIsParticipantsInfoVisible(true)}>
        <BadgeCountIndicator count={count} />
        <ControlButtonIcon icon={Users} />
      </CallControlsButton>
      <ParticipantsInfoListModal
        isCallParticipantsInfoVisible={isParticipantsInfoVisible}
        setIsCallParticipantsInfoVisible={setIsParticipantsInfoVisible}
      />
    </>
  );
};
