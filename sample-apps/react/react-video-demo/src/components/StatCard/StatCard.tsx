import { FC, useMemo } from 'react';
import classnames from 'classnames';

import Tooltip from '../Tooltip';

import { Info } from '../Icons';
import StatIndicator from '../StatIndicator';

import styles from './StatCard.module.css';

import 'react-tooltip/dist/react-tooltip.css';

export type Props = {
  className?: string;
  label: string;
  value: string;
  description?: string;
  condition?: boolean;
};

export const StatCard: FC<Props> = ({
  className,
  label,
  value,
  description,
  condition,
}) => {
  const rootClassName = classnames(styles.root, className);
  const id = useMemo(() => {
    return String(label).split(' ').join('-'); //uuid();
  }, []);
  return (
    <div className={rootClassName}>
      <div className={styles.label}>
        {label}
        {description && (
          <div id={id}>
            <Info className={styles.info} />
          </div>
        )}
      </div>
      <div className={styles.value}>
        {value}{' '}
        {condition && (
          <StatIndicator
            className={styles.condition}
            type={condition ? 'good' : 'bad'}
          />
        )}
      </div>
      <Tooltip
        selector={`#${id}`}
        className={styles.tooltip}
        description={description}
      />
    </div>
  );
};
