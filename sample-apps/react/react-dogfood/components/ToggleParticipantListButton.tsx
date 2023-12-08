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
  const { useParticipantCount } = useCallStateHooks();
  const participantCount = useParticipantCount();
  return (
    <CompositeButton active={enabled} caption={caption}>
      <IconButton icon="participants" {...props} title="Participants" />
      {participantCount > 1 && (
        <span className="rd__particpant-count">{participantCount}</span>
      )}
    </CompositeButton>
  );
};
