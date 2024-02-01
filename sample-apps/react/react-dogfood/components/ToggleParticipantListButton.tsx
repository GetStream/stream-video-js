import {
  CompositeButton,
  Icon,
  IconButtonWithMenuProps,
  useCallStateHooks,
} from '@stream-io/video-react-sdk';

export type ToggleParticipantListButtonProps = { caption?: string } & Omit<
  IconButtonWithMenuProps,
  'icon' | 'ref'
>;

export const ToggleParticipantListButton = (
  props: ToggleParticipantListButtonProps,
) => {
  const { useParticipants } = useCallStateHooks();
  const participantCount = useParticipants().length;
  return (
    <CompositeButton title="Participants" {...props}>
      <Icon icon="participants" />
      {participantCount > 1 && (
        <span className="rd__particpant-count">{participantCount}</span>
      )}
    </CompositeButton>
  );
};
