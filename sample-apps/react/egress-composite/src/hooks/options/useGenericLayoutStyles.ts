import { css } from '@emotion/css';
import clsx from 'clsx';

import { useConfigurationContext } from '../../ConfigurationContext';

export const useGenericLayoutStyles = () => {
  const {
    options: {
      'layout.background_color': layoutBackgroundColor,
      'layout.background_image': layoutBackgroundImage,
      'layout.background_size': layoutBackgroundSize,
      'layout.background_position': layoutBackgroundPosition,

      // TODO: move to custom hook
      'layout.single-participant.padding_block':
        singleParticipantPaddingBlock = '70px',
      'layout.single-participant.padding_inline':
        singleParticipantPaddingInline = '70px',
      // 'layout.size_percentage': layoutSizePercentage,
    },
  } = useConfigurationContext();

  const styles = [
    css`
      & .eca__dominant-speaker__container {
        padding-inline: ${singleParticipantPaddingInline};
        padding-block: ${singleParticipantPaddingBlock};
      }
      // TODO: move broken styling
      & .eca__dominant-speaker__container .str-video__video,
      .str-video__video-placeholder {
        height: 100%;
      }
    `,
    layoutBackgroundColor &&
      css`
        background-color: ${layoutBackgroundColor};
      `,
    layoutBackgroundImage &&
      css`
        background-image: ${layoutBackgroundImage};
      `,
    layoutBackgroundSize &&
      css`
        background-size: ${layoutBackgroundSize};
      `,
    layoutBackgroundPosition &&
      css`
        background-position: ${layoutBackgroundPosition};
      `,
  ];

  return clsx(styles);
};
