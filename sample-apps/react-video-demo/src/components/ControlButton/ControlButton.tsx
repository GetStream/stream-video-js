import {
  FC,
  useCallback,
  useEffect,
  useState,
  createElement,
  ReactNode,
} from 'react';
import classnames from 'classnames';

import Button from '../Button';
import { ChevronUp } from '../Icons';

import styles from './ControlButton.module.css';

export type Props = {
  className?: string;
  label?: string;
  prefix?: ReactNode;
  panel: ReactNode;
  state?: 'disabled' | 'prominent' | 'accent';
  onClick?(): void;
  children?: ReactNode | undefined;
};

export const ControlButton: FC<Props> = ({
  className,
  label,
  state,
  prefix,
  panel,
  onClick,
  children,
}) => {
  const [active, setActive] = useState(false);

  const handleOnClick = useCallback(() => {
    onClick?.();
  }, [active]);

  const togglePanel = useCallback(() => {
    setActive(!active);
  }, [active]);

  const rootClassName = classnames(
    styles.root,
    {
      [styles.active]: active,
      [styles.disabled]: state === 'disabled',
      [styles.prominent]: state === 'prominent',
      [styles.accent]: state === 'accent',
    },
    className,
  );

  const toggleClassName = classnames(styles.toggle, {
    [styles.active]: active,
    [styles.disabled]: state === 'disabled',
    [styles.prominent]: state === 'prominent',
    [styles.accent]: state === 'accent',
  });

  const toggleIndicatorClassName = classnames(styles.toggleIndicator, {
    [styles.active]: active,
  });

  return (
    <>
      <div className={styles.container}>
        {panel && active && panel}
        <div className={rootClassName}>
          <div className={toggleClassName}>
            <Button
              className={styles.button}
              color="transparent"
              shape="square"
              onClick={() => handleOnClick()}
            >
              {prefix}
              {children}
            </Button>
            <div
              className={toggleIndicatorClassName}
              onClick={() => togglePanel()}
            >
              <ChevronUp className={styles.toggleIcon} />
            </div>
          </div>
          {label ? <span className={styles.label}>{label}</span> : null}
        </div>
      </div>
    </>
  );
};
