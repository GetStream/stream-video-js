import { css } from '@emotion/css';
import clsx from 'clsx';

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
    videoBackgroundColor &&
      css`
        & .str-video__video {
          background-color: ${videoBackgroundColor};
        }
      `,
    videoScaleMode &&
      css`
        & .str-video__video {
          object-fit: ${objectFitMap[videoScaleMode]};
        }
      `,
    videoScreenshareScaleMode &&
      css`
        & .str-video__video.str-video__video--screen-share {
          object-fit: ${objectFitMap[videoScreenshareScaleMode]};
        }
      `,
  ];

  return clsx(styles);
};
