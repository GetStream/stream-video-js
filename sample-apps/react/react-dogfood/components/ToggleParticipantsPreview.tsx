import { forwardRef } from 'react';

import {
  Icon,
  CallPreview,
  useCallStateHooks,
  CompositeButton,
  IconButton,
  MenuToggle,
  MenuVisualType,
  ToggleMenuButtonProps,
  useI18n,
} from '@stream-io/video-react-sdk';

export type Props = {
  onJoin: () => void;
};

export const ParticipantsPreview = ({ onJoin }: Props) => {
  const { useCallSession, useCallThumbnail } = useCallStateHooks();
  const session = useCallSession();
  const { t } = useI18n();

  const thumbnail = useCallThumbnail();

  if (!session?.participants || session?.participants.length === 0) return null;

  const [first] = session.participants;
  return (
    <div className="rd__participants-preview">
      <h2 className="rd__participants-preview__heading">Ready to join?</h2>

      {thumbnail && <CallPreview style={{ width: '100%', height: '150px' }} />}

      <p className="rd__participants-preview__description">
        {`${first.user.name} ${session.participants.length - 1} other${
          session.participants.length - 1 > 1 ? 's' : ''
        } are in this call.`}
      </p>

      <button
        className="rd__button rd__button--primary rd__button--large rd__lobby-join"
        data-testid="join-call-button"
        onClick={onJoin}
      >
        <Icon className="rd__button__icon" icon="login" />
        {t('Join the others')}
      </button>
    </div>
  );
};

export const ToggleMenuButton = forwardRef<
  HTMLDivElement,
  ToggleMenuButtonProps
>((props, ref) => {
  return (
    <CompositeButton ref={ref} active={props.menuShown} variant="primary">
      <IconButton icon="participants" />
    </CompositeButton>
  );
});

export const ToggleParticipansPreviewButton = ({ onJoin }: Props) => {
  const { useCallSession } = useCallStateHooks();
  const session = useCallSession();

  if (!session?.participants || session?.participants.length === 0) return null;

  return (
    <MenuToggle
      placement="top-start"
      ToggleButton={ToggleMenuButton}
      visualType={MenuVisualType.PORTAL}
    >
      <ParticipantsPreview onJoin={onJoin} />
    </MenuToggle>
  );
};
