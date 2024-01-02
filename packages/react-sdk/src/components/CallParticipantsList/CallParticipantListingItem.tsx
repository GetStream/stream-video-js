import clsx from 'clsx';
import { ComponentProps, ComponentType, forwardRef } from 'react';
import { useConnectedUser, useI18n } from '@stream-io/video-react-bindings';
import { SfuModels, StreamVideoParticipant } from '@stream-io/video-client';
import { IconButton } from '../Button';
import { MenuToggle, ToggleMenuButtonProps } from '../Menu';
import { WithTooltip } from '../Tooltip';
import { Avatar } from '../Avatar';
import {
  ParticipantActionsContextMenu,
  ParticipantViewContext,
} from '../../core/';

type CallParticipantListingItemProps = {
  /** Participant object be rendered */
  participant: StreamVideoParticipant;
  /** Custom component used to display participant's name */
  DisplayName?: ComponentType<{ participant: StreamVideoParticipant }>;
};
export const CallParticipantListingItem = ({
  participant,
  DisplayName = DefaultDisplayName,
}: CallParticipantListingItemProps) => {
  const isAudioOn = participant.publishedTracks.includes(
    SfuModels.TrackType.AUDIO,
  );
  const isVideoOn = participant.publishedTracks.includes(
    SfuModels.TrackType.VIDEO,
  );
  const isPinned = !!participant.pin;

  const { t } = useI18n();

  return (
    <div className="str-video__participant-listing-item">
      <div className="str-video__participant-avatar">
        <Avatar name={participant.name} imageSrc={participant.image} />
        <DisplayName participant={participant} />
      </div>
      <div className="str-video__participant-listing-item__media-indicator-group">
        <MediaIndicator
          title={isAudioOn ? t('Microphone on') : t('Microphone off')}
          className={clsx(
            'str-video__participant-listing-item__icon',
            `str-video__participant-listing-item__icon-${
              isAudioOn ? 'mic' : 'mic-off'
            }`,
          )}
        />
        <MediaIndicator
          title={isVideoOn ? t('Camera on') : t('Camera off')}
          className={clsx(
            'str-video__participant-listing-item__icon',
            `str-video__participant-listing-item__icon-${
              isVideoOn ? 'camera' : 'camera-off'
            }`,
          )}
        />
        {isPinned && (
          <MediaIndicator
            title={t('Pinned')}
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
};

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

  const meFlag = participant.userId === connectedUser?.id ? t('Me') : '';
  const nameOrId = participant.name || participant.userId || t('Unknown');
  let displayName;
  if (!participant.name) {
    displayName = meFlag || nameOrId || t('Unknown');
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
  function ToggleButton(props, ref) {
    return <IconButton enabled={props.menuShown} icon="ellipsis" ref={ref} />;
  },
);
