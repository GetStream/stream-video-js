import {
  FC,
  ReactNode,
  useCallback,
  useState,
  useRef,
  forwardRef,
} from 'react';
import classnames from 'classnames';
import { CSSTransition } from 'react-transition-group';

import { ArrowDown, Close } from '../Icons';

import Button from '../Button';

import styles from './Panel.module.css';

export type Props = {
  className?: string;
  title: string | ReactNode;
  isFocused?: boolean;
  isParticipantsPanel?: boolean;
  canCollapse?: boolean;
  fulllHeight?: boolean;
  close?: () => void;
  children: ReactNode | undefined;
};

export type AnimatedProps = {
  visible: boolean;
};

export const AnimatedPanel: FC<Props & AnimatedProps> = ({
  visible = false,
  fulllHeight,
  className,
  ...props
}) => {
  const animatedClassNames = classnames(
    styles.animated,
    {
      [styles.visible]: visible,
    },
    className,
  );
  return (
    <Panel
      {...props}
      className={animatedClassNames}
      fulllHeight={visible && fulllHeight}
    />
  );
};

export const Panel = forwardRef<any, Props>(function MyInput(
  {
    className,
    children,
    title,
    isFocused,
    fulllHeight,
    canCollapse,
    close,
    isParticipantsPanel,
  },
  ref,
) {
  const [isOpen, setOpen] = useState(true);

  const handleCollapse = useCallback(() => {
    setOpen(!isOpen);
  }, [isOpen]);

  const rootClassname = classnames(
    styles.root,
    {
      [styles.focused]: isFocused,
      [styles.open]: isOpen,
      [styles.fulllHeight]: fulllHeight,
    },
    className,
  );

  const headingClassName = classnames(styles.header, {
    [styles.canCollapse]: canCollapse,
    [styles.open]: isOpen,
  });

  const arrowClassName = classnames(styles.arrow, {
    [styles.open]: !isOpen,
  });

  const contentClassName = classnames(styles.content, {
    [styles.open]: isOpen,
    [styles.participantsPanel]: isParticipantsPanel,
  });

  return (
    <div className={rootClassname} ref={ref}>
      <div className={headingClassName}>
        <h2 className={styles.heading}>{title}</h2>

        {canCollapse && !close ? (
          <Button
            className={styles.toggle}
            color="secondary"
            onClick={handleCollapse}
            shape="square"
          >
            <ArrowDown className={arrowClassName} />
          </Button>
        ) : null}

        {close ? (
          <Button
            className={styles.close}
            color="secondary"
            onClick={close}
            shape="square"
          >
            <Close className={styles.cross} />
          </Button>
        ) : null}
      </div>
      <div className={contentClassName}>{children}</div>
    </div>
  );
});
