import { cx, css } from '@emotion/css';

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
      'participant_label.border_width': participantLabelBorderWidth = '0',
      'participant_label.border_radius': participantLabelBorderRadius,
      'participant_label.border_color':
        participantLabelBorderColor = 'rgba(0,0,0,0)',
      'participant_label.horizontal_position':
        participantLabelHorizontalPosition = 'left',
      'participant_label.vertical_position':
        participantLabelVerticalPosition = 'bottom',
      'participant_label.margin_inline': participantLabelMarginInline = '0',
      'participant_label.margin_block': participantLabelMarginBlock = '0',
    },
  } = useConfigurationContext();

  const styles = [
    !participantLabelDisplay &&
      css`
        @layer overrides-layer {
          & .str-video__participant-details {
            display: none;
          }
        }
      `,
    css`
      @layer overrides-layer {
        & .str-video__participant-details {
          color: ${participantLabelTextColor};
        }

        & .str-video__participant-details {
          background-color: ${participantLabelBackgroundColor};
        }

        & .str-video__participant-details {
          border-radius: ${participantLabelBorderRadius};
        }

        & .str-video__participant-details {
          border: ${participantLabelBorderWidth} solid
            ${participantLabelBorderColor};
        }

        & .str-video__participant-view {
          justify-content: ${positionMap.horizontal[
            participantLabelHorizontalPosition
          ]};

          .str-video__participant-details {
            align-self: ${positionMap.vertical[
              participantLabelVerticalPosition
            ]};
            margin-inline: ${participantLabelMarginInline};
            margin-block: ${participantLabelMarginBlock};

            transition: unset;
            opacity: unset;
          }
        }
      }
    `,
  ];

  return cx(styles);
};
