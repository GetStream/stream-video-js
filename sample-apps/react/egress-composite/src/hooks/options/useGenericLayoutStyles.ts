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
      'layout.background_repeat': layoutBackgroundRepeat,

      // TODO: move to custom hook
      'layout.single-participant.padding_block':
        singleParticipantPaddingBlock = '0px',
      'layout.single-participant.padding_inline':
        singleParticipantPaddingInline = '0px',
      // 'layout.size_percentage': layoutSizePercentage,
    },
  } = useConfigurationContext();

  const styles = [
    css`
      & .eca__dominant-speaker__container {
        padding-inline: ${singleParticipantPaddingInline};
        padding-block: ${singleParticipantPaddingBlock};
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
    layoutBackgroundRepeat &&
      css`
        background-repeat: ${layoutBackgroundRepeat};
      `,
  ];

  return clsx(styles);
};
