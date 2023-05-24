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
  onClick,
  children,
  portalId,
}) => {
  const [active, setActive] = useState<boolean>(false);

  const container: any = useRef();

  const handleIndicatorClick = useCallback(() => {
    setActive(!active);
  }, [active]);

  const handleClick = useCallback(() => {
    onClick?.();
  }, [active, panel, onClick]);

  const closePanel = useCallback(() => {
    if (active) {
      setActive(false);
    }
  }, [active]);

  const rootClassName = classnames(
    styles.root,
    {
      [styles.active]: active,
    },
    className,
  );

  const toggleClassName = classnames(styles.toggle, {
    [styles.active]: active,
  });

  const toggleIndicatorClassName = classnames(styles.toggleIndicator, {
    [styles.active]: active,
  });

  const toggleIconClassName = classnames(styles.toggleIcon, {
    [styles.active]: active,
  });

  useOnClickOutside(container, closePanel);

  return (
    <>
      <div ref={container} className={styles.container}>
        {portalId ? (
          <div id={portalId} className={styles.portalContainer} />
        ) : null}
        {panel && active !== false && panel}
        <div className={rootClassName}>
          <div className={toggleClassName}>
            <Button
              className={styles.button}
              color="transparent"
              shape="square"
              onClick={() => handleClick()}
            >
              {prefix}
              {children}
            </Button>
            <div
              className={toggleIndicatorClassName}
              onClick={() => handleIndicatorClick()}
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

export const PanelButton: FC<Props> = ({
  className,
  label,
  prefix,
  panel,
  showPanel,
  onClick,
  children,
  portalId,
}) => {
  const container: any = useRef();

  const handleClick = useCallback(() => {
    onClick?.();
  }, [onClick]);

  const handleClose = useCallback(() => {
    if (showPanel) {
      onClick?.();
    }
  }, [onClick, showPanel]);

  const rootClassName = classnames(
    styles.root,
    {
      [styles.active]: showPanel,
    },
    className,
  );

  const toggleClassName = classnames(styles.toggle, {
    [styles.active]: showPanel,
  });

  const toggleIndicatorClassName = classnames(styles.toggleIndicator, {
    [styles.active]: showPanel,
  });

  const toggleIconClassName = classnames(styles.toggleIcon, {
    [styles.active]: showPanel,
  });

  useOnClickOutside(container, handleClose);

  return (
    <>
      <div ref={container} className={styles.container}>
        {portalId ? (
          <div id={portalId} className={styles.portalContainer} />
        ) : null}
        {panel && showPanel !== false && panel}
        <div className={rootClassName}>
          <div className={toggleClassName}>
            <Button
              className={styles.button}
              color="transparent"
              shape="square"
              onClick={() => handleClick()}
            >
              {prefix}
              {children}
            </Button>
            <div
              className={toggleIndicatorClassName}
              onClick={() => handleClick()}
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
