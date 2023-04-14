import { FC } from 'react';
import classnames from 'classnames';

import styles from './StatIndicator.module.css';

export type Props = {
  className?: string;
  type: 'good' | 'bad';
};

export const StatIndicator: FC<Props> = ({ className, type = 'good' }) => {
  const rootClassName = classnames(
    styles.root,
    {
      [styles?.[type]]: type,
    },
    className,
  );

  return (
    <div className={rootClassName}>
      <label>{type}</label>
    </div>
  );
};
