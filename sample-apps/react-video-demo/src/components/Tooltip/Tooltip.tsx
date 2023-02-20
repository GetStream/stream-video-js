import { FC } from 'react';
import classnames from 'classnames';
import { Tooltip as ReactTooltip } from 'react-tooltip';

import styles from './Tooltip.module.css';

import 'react-tooltip/dist/react-tooltip.css';

export type Props = {
  className?: string;
  selector: string;
  description?: string;
};

export const Tooltip: FC<Props> = ({ className, selector, description }) => {
  const rootClassName = classnames(styles.root, className);

  return (
    <ReactTooltip
      className={rootClassName}
      anchorSelect={selector}
      style={{
        width: '180px',
        maxWidth: '180px',
        backgroundColor: '#000000',
        color: '#ffffff',
        padding: '8px',
        borderRadius: '8px',
      }}
    >
      {description}
    </ReactTooltip>
  );
};
