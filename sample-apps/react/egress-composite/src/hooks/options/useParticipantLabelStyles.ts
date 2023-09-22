import { css } from '@emotion/css';
import clsx from 'clsx';

import {
  positionMap,
  useConfigurationContext,
} from '../../ConfigurationContext';

export const useParticipantLabelStyles = () => {
  const {
    options: {
      'participant_label.display': participantLabelDisplay = true,
      'participant_label.text_color': participantLabelTextColor,
      'participant_label.background_color': participantLabelBackgroundColor,
      'participant_label.border_width': participantLabelBorderWidth = '0px',
      'participant_label.border_radius': participantLabelBorderRadius = '0px',
      'participant_label.border_color':
        participantLabelBorderColor = 'rgba(0,0,0,0)',
      'participant_label.horizontal_position':
        participantLabelHorizontalPosition = 'right',
      'participant_label.vertical_position':
        participantLabelVerticalPosition = 'bottom',
      'participant_label.margin_inline':
        participantLabelMarginInline = '.875rem',
      'participant_label.margin_block': participantLabelMarginBlock = '.875rem',
    },
  } = useConfigurationContext();

  const styles = [
    !participantLabelDisplay &&
      css`
        & .str-video__participant-details {
          display: none;
        }
      `,
    participantLabelTextColor &&
      css`
        & .str-video__participant-details {
          color: ${participantLabelTextColor};
        }
      `,
    participantLabelBackgroundColor &&
      css`
        & .str-video__participant-details {
          background-color: ${participantLabelBackgroundColor};
        }
      `,
    css`
      & .str-video__participant-details {
        border: ${participantLabelBorderWidth} solid
          ${participantLabelBorderColor};
        border-radius: ${participantLabelBorderRadius};
      }
    `,
    css`
      & .str-video__participant-view {
        display: grid;

        .str-video__participant-details {
          justify-self: ${positionMap.horizontal[
            participantLabelHorizontalPosition
          ]};
          align-self: ${positionMap.vertical[participantLabelVerticalPosition]};
          margin-inline: ${participantLabelMarginInline};
          margin-block: ${participantLabelMarginBlock};

          transition: unset;
          opacity: unset;
          left: unset;
          bottom: unset;
          right: unset;
          top: unset;
        }
      }
    `,
  ];

  return clsx(styles);
};
