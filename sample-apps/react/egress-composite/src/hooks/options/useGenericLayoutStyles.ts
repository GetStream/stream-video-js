import { css, cx } from '@emotion/css';

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
      @layer overrides-layer {
        & .eca__dominant-speaker__container {
          padding-inline: ${singleParticipantPaddingInline};
          padding-block: ${singleParticipantPaddingBlock};
        }

        background-color: ${layoutBackgroundColor};
        background-image: ${layoutBackgroundImage};
        background-size: ${layoutBackgroundSize};
        background-position: ${layoutBackgroundPosition};
        background-repeat: ${layoutBackgroundRepeat};
      }
    `,
  ];

  return cx(styles);
};
