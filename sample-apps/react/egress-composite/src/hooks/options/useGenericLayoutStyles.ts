import { css } from '@emotion/css';
import clsx from 'clsx';

import { useConfigurationContext } from '../../ConfigurationContext';

export const useGenericLayoutStyles = () => {
  const {
    options: {
      'layout.background_color': layoutBackgroundColor,
      // 'layout.size_percentage': layoutSizePercentage,
    },
  } = useConfigurationContext();

  const styles = [
    layoutBackgroundColor &&
      css`
        background-color: ${layoutBackgroundColor};
      `,
  ];

  return clsx(styles);
};
