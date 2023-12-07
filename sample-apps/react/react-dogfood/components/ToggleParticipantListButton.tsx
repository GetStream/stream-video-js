import {
  ButtonWithIconProps,
  CompositeButton,
  IconButton,
  useCallStateHooks,
} from '@stream-io/video-react-sdk';

export type ToggleParticipantListButtonProps = { caption?: string } & Omit<
  ButtonWithIconProps,
  'icon' | 'ref'
>;

export const ToggleParticipantListButton = (
  props: ToggleParticipantListButtonProps,
) => {
  const { enabled, caption } = props;

  const { useParticipants } = useCallStateHooks();
  const members = useParticipants();
  return (
    <CompositeButton active={enabled} caption={caption}>
      <IconButton icon="participants" {...props} title="Participants" />
      <span className="rd__particpant-count">
        {members.length > 1 && members.length}
      </span>
    </CompositeButton>
  );
};
