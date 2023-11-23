import {
  ButtonWithIconProps,
  CompositeButton,
  IconButton,
} from '@stream-io/video-react-sdk';

export type ToggleParticipantListButtonProps = { caption?: string } & Omit<
  ButtonWithIconProps,
  'icon' | 'ref'
>;

export const ToggleParticipantListButton = (
  props: ToggleParticipantListButtonProps,
) => {
  const { enabled, caption } = props;
  return (
    <CompositeButton active={enabled} caption={caption}>
      <IconButton icon="participants" {...props} title="Participants" />
    </CompositeButton>
  );
};
