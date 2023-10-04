import { css } from '@emotion/css';
import clsx from 'clsx';

import {
  positionMap,
  useConfigurationContext,
} from '../../ConfigurationContext';

export const useLogoAndTitleStyles = () => {
  const {
    options: {
      'logo.horizontal_position': logoHorizontalPosition = 'right',
      'logo.vertical_position': logoVerticalPosition = 'bottom',
      'logo.margin_block': logoMarginBlock = '.875rem',
      'logo.margin_inline': logoMarginInline = '.875rem',
      'logo.width': logoWidth = 'initial',
      'logo.height': logoHeight = '40px',
      'title.font_size': titleFontSize = '30px',
      'title.color': titleColor = 'white',
      'title.horizontal_position': titleHorizontalPosition = 'left',
      'title.vertical_position': titleVerticalPosition = 'top',
      'title.margin_block': titleMarginBlock = '.875rem',
      'title.margin_inline': titleMarginInline = '.875rem',
    },
  } = useConfigurationContext();

  const styles = [
    css`
      & .eca__logo-and-title-overlay__logo {
        justify-self: ${positionMap.horizontal[logoHorizontalPosition]};
        align-self: ${positionMap.vertical[logoVerticalPosition]};
        margin-block: ${logoMarginBlock};
        margin-inline: ${logoMarginInline};
        width: ${logoWidth};
        height: ${logoHeight};
      }
    `,
    css`
      & .eca__logo-and-title-overlay__title {
        color: ${titleColor};
        font-size: ${titleFontSize};
        justify-self: ${positionMap.horizontal[titleHorizontalPosition]};
        align-self: ${positionMap.vertical[titleVerticalPosition]};
        margin-block: ${titleMarginBlock};
        margin-inline: ${titleMarginInline};
      }
    `,
  ];

  return clsx(styles);
};
