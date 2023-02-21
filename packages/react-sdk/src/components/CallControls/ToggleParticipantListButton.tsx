import { IconButton, ButtonWithIconProps, CompositeButton } from '../Button/';

export type ToggleParticipantListButtonProps = { caption?: string } & Omit<
  ButtonWithIconProps,
  'icon' | 'ref'
>;

export const ToggleParticipantListButton = (
  props: ToggleParticipantListButtonProps,
) => {
  const { enabled, caption = 'Participants' } = props;
  return (
    <CompositeButton enabled={enabled} caption={caption}>
      {' '}
      <IconButton icon="participants" {...props} />
    </CompositeButton>
  );
};
