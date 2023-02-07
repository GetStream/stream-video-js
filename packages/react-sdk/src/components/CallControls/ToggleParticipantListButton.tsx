import * as React from 'react';
import {
  CallControlsButton,
  CallControlsButtonProps,
} from './CallControlsButton';

export type ToggleParticipantListButtonProps = Omit<
  CallControlsButtonProps,
  'icon' | 'ref'
>;

export const ToggleParticipantListButton = (
  props: ToggleParticipantListButtonProps,
) => {
  return <CallControlsButton icon="participants" {...props} />;
};
