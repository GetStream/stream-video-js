import { css } from '@emotion/css';
import clsx from 'clsx';
import { useCallStateHooks } from '@stream-io/video-react-sdk';

import { useConfigurationContext } from '../../ConfigurationContext';

export const useParticipantStyles = () => {
  const {
    options: {
      'participant.aspect_ratio': participantAspectRatio,
      'participant.border_radius': participantBorderRadius,
      'participant.outline_color': participantOutlineColor = '#005fff',
      'participant.outline_width': participantOutlineWidth = '2px',
      'participant.placeholder_background_color':
        participantPlaceholderBackgroundColor,
    },
  } = useConfigurationContext();

  const { useHasOngoingScreenShare } = useCallStateHooks();
  const hasScreenShare = useHasOngoingScreenShare();
  const styles = [
    participantBorderRadius &&
      css`
        & .str-video__participant-view {
          border-radius: ${participantBorderRadius};
        }
      `,
    // we don't want to apply the aspect ratio when screen share is
    // enabled, as it breaks our layouts.
    // we should think about this later, and most likely introduce
    // parallel configuration for screen sharing mode
    participantAspectRatio &&
      !hasScreenShare &&
      css`
        & .str-video__participant-view {
          aspect-ratio: ${participantAspectRatio};
        }
      `,
    css`
      & .str-video__participant-view.str-video__participant-view--speaking {
        outline: ${participantOutlineWidth} solid ${participantOutlineColor};
      }
    `,
    participantPlaceholderBackgroundColor &&
      css`
        & .str-video__video-placeholder {
          background-color: ${participantPlaceholderBackgroundColor};
        }
      `,
  ];

  return clsx(styles);
};
