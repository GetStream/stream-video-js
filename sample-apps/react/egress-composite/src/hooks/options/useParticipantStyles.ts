import { css } from '@emotion/css';
import clsx from 'clsx';

import { useConfigurationContext } from '../../ConfigurationContext';

export const useParticipantStyles = () => {
  const {
    options: {
      'participant.border_radius': participantBorderRadius,
      'participant.outline_color': participantOutlineColor = '#005fff',
      'participant.outline_width': participantOutlineWidth = '2px',
      'participant.placeholder_background_color':
        participantPlaceholderBackgroundColor,
    },
  } = useConfigurationContext();

  const styles = [
    participantBorderRadius &&
      css`
        & .str-video__participant-view {
          background-color: ${participantBorderRadius};
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
