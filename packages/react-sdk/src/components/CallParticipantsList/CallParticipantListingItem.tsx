import clsx from 'clsx';
import { ComponentProps, ComponentType, forwardRef, memo } from 'react';
import { useConnectedUser } from '@stream-io/video-react-bindings';
import { useI18n } from '../../i18n';
import {
  hasAudio,
  hasVideo,
  isPinned,
  StreamVideoParticipant,
} from '@stream-io/video-client';
import { IconButton } from '../Button';
import { MenuToggle, ToggleMenuButtonProps } from '../Menu';
import { WithTooltip } from '../Tooltip';
import { Avatar } from '../Avatar';
import { ParticipantActionsContextMenu } from '../../core/components/ParticipantView/ParticipantActionsContextMenu';
import { ParticipantViewContext } from '../../core/components/ParticipantView/ParticipantViewContext';

type CallParticipantListingItemProps = {
  /** Participant object be rendered */
  participant: StreamVideoParticipant;
  /** Custom component used to display participant's name */
  DisplayName?: ComponentType<{ participant: StreamVideoParticipant }>;
};
export const CallParticipantListingItem = memo(
  function CallParticipantListingItemRender({
    participant,
    DisplayName = DefaultDisplayName,
  }: CallParticipantListingItemProps) {
    const isAudioOn = hasAudio(participant);
    const isVideoOn = hasVideo(participant);
    const isPinnedOn = isPinned(participant);

    const { t } = useI18n();

    return (
      <div className="str-video__participant-listing-item">
        <Avatar name={participant.name} imageSrc={participant.image} />
        <DisplayName participant={participant} />
        <div className="str-video__participant-listing-item__media-indicator-group">
          <MediaIndicator
            title={
              isAudioOn
                ? t('participantList.microphoneOn.title', 'Microphone on')
                : t('participantList.microphoneOff.title', 'Microphone off')
            }
            className={clsx(
              'str-video__participant-listing-item__icon',
              `str-video__participant-listing-item__icon-${
                isAudioOn ? 'mic' : 'mic-off'
              }`,
            )}
          />
          <MediaIndicator
            title={
              isVideoOn
                ? t('participantList.cameraOn.title', 'Camera on')
                : t('participantList.cameraOff.title', 'Camera off')
            }
            className={clsx(
              'str-video__participant-listing-item__icon',
              `str-video__participant-listing-item__icon-${
                isVideoOn ? 'camera' : 'camera-off'
              }`,
            )}
          />
          {isPinnedOn && (
            <MediaIndicator
              title={t('participantList.pinned.title', 'Pinned')}
              className={clsx(
                'str-video__participant-listing-item__icon',
                'str-video__participant-listing-item__icon-pinned',
              )}
            />
          )}

          <MenuToggle placement="bottom-end" ToggleButton={ToggleButton}>
            <ParticipantViewContext.Provider
              value={{ participant, trackType: 'none' }}
            >
              <ParticipantActionsContextMenu />
            </ParticipantViewContext.Provider>
          </MenuToggle>
        </div>
      </div>
    );
  },
);

CallParticipantListingItem.displayName = 'CallParticipantListingItem';

const MediaIndicator = (props: ComponentProps<'div'>) => (
  <WithTooltip {...props} />
);

type DisplayNameProps = {
  /** Participant object that provides the data from which display name can be generated */
  participant: StreamVideoParticipant;
};

const DefaultDisplayName = ({ participant }: DisplayNameProps) => {
  const connectedUser = useConnectedUser();
  const { t } = useI18n();

  const meFlag =
    participant.userId === connectedUser?.id
      ? t('participantList.me.text', 'Me')
      : '';
  const nameOrId =
    participant.name ||
    participant.userId ||
    t('participantList.unknown.text', 'Unknown');
  let displayName;
  if (!participant.name) {
    displayName =
      meFlag || nameOrId || t('participantList.unknown.text', 'Unknown');
  } else if (meFlag) {
    displayName = `${nameOrId} (${meFlag})`;
  } else {
    displayName = nameOrId;
  }

  return (
    <WithTooltip
      className="str-video__participant-listing-item__display-name"
      title={displayName}
    >
      {displayName}
    </WithTooltip>
  );
};

const ToggleButton = forwardRef<HTMLButtonElement, ToggleMenuButtonProps>(
  function ToggleButtonRender(props, ref) {
    return (
      <IconButton
        className="str-video__participant-listing-item__menu-button"
        active={props.menuShown}
        size="sm"
        variant="secondary"
        ref={ref}
        icon="ellipsis"
      />
    );
  },
);
