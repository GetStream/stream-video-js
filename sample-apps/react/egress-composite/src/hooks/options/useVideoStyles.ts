import { css, cx } from '@emotion/css';

import {
  objectFitMap,
  useConfigurationContext,
} from '../../ConfigurationContext';

export const useVideoStyles = () => {
  const {
    options: {
      'video.scale_mode': videoScaleMode,
      'video.background_color': videoBackgroundColor,
      'video.screenshare_scale_mode': videoScreenshareScaleMode = 'fit',
    },
  } = useConfigurationContext();

  const styles = [
    css`
      @layer overrides-layer {
        & .str-video__video {
          background-color: ${videoBackgroundColor};
        }

        & .str-video__video {
          object-fit: ${typeof videoScaleMode === 'undefined'
            ? undefined
            : objectFitMap[videoScaleMode]};
        }

        & .str-video__video.str-video__video--screen-share {
          object-fit: ${objectFitMap[videoScreenshareScaleMode]};
        }
      }
    `,
  ];

  return cx(styles);
};
