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
  const { useParticipantCount } = useCallStateHooks();
  const participantCount = useParticipantCount();
  return (
    <CompositeButton title="Participants" {...props}>
      <Icon icon="participants" />
      {participantCount > 1 && (
        <span className="rd__particpant-count">{participantCount}</span>
      )}
    </CompositeButton>
  );
};
