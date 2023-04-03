import { FC, useCallback, useState, ReactNode, useRef, useEffect } from 'react';
import classnames from 'classnames';

import Button from '../Button';
import { ChevronUp } from '../Icons';

import { useOnClickOutside } from '../../utils/useClickOutsite';

import styles from './ControlButton.module.css';

export type Props = {
  className?: string;
  label?: string;
  prefix?: ReactNode;
  panel: ReactNode;
  showPanel?: boolean;
  onClick?(): void;
  children?: ReactNode | undefined;
  portalId?: string;
};

export const ControlButton: FC<Props> = ({
  className,
  label,
  prefix,
  panel,
  showPanel = false,
  onClick,
  children,
  portalId,
}) => {
  const [active, setActive] = useState<boolean>(false);

  const container: any = useRef();

  useEffect(() => {
    if (showPanel !== undefined) {
      setActive(showPanel);
    }
  }, [showPanel]);

  const togglePanel = useCallback(() => {
    setActive(!active);
  }, [active]);

  const closePanel = useCallback(() => {
    if (active) {
      setActive(false);
    }
  }, [active]);

  const rootClassName = classnames(
    styles.root,
    {
      [styles.active]: active || showPanel,
    },
    className,
  );

  const toggleClassName = classnames(styles.toggle, {
    [styles.active]: active || showPanel,
  });

  const toggleIndicatorClassName = classnames(styles.toggleIndicator, {
    [styles.active]: active || showPanel,
  });

  const toggleIconClassName = classnames(styles.toggleIcon, {
    [styles.active]: active || showPanel,
  });

  useOnClickOutside(container, closePanel);

  return (
    <>
      <div ref={container} className={styles.container}>
        {portalId ? (
          <div id={portalId} className={styles.portalContainer} />
        ) : null}
        {panel && (active || showPanel) !== false && panel}
        <div className={rootClassName}>
          <div className={toggleClassName}>
            <Button
              className={styles.button}
              color="transparent"
              shape="square"
              onClick={onClick}
            >
              {prefix}
              {children}
            </Button>
            <div
              className={toggleIndicatorClassName}
              onClick={() => togglePanel()}
            >
              <ChevronUp className={toggleIconClassName} />
            </div>
          </div>
          {label ? <span className={styles.label}>{label}</span> : null}
        </div>
      </div>
    </>
  );
};
