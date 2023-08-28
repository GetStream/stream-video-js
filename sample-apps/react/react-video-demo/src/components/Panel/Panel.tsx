import { forwardRef, PropsWithChildren, ReactNode } from 'react';
import classnames from 'classnames';

import { ArrowDown, Close } from '../Icons';

import Button from '../Button';

import styles from './Panel.module.css';
import { PANEL_VISIBILITY } from '../../contexts/PanelContext';

export type PanelProps = {
  className?: string;
  title: string | ReactNode;
  isFocused?: boolean;
  isParticipantsPanel?: boolean;
  toggleCollapse?: () => void;
  toggleHide?: () => void;
  visibility?: PANEL_VISIBILITY;
};

export const AnimatedPanel = ({
  className,
  visibility,
  ...props
}: PropsWithChildren<PanelProps>) => {
  const animatedClassNames = classnames(
    styles.animated,
    {
      [styles.visible]: visibility !== PANEL_VISIBILITY.hidden,
      [styles.participantsPanel]: props.isParticipantsPanel,
    },
    className,
  );
  return (
    <Panel {...props} className={animatedClassNames} visibility={visibility} />
  );
};

export const Panel = forwardRef<any, PropsWithChildren<PanelProps>>(
  function MyInput(
    {
      className,
      children,
      isFocused,
      isParticipantsPanel,
      title,
      toggleCollapse,
      toggleHide,
      visibility,
    },
    ref,
  ) {
    const expanded = visibility === PANEL_VISIBILITY.expanded;
    const visible = visibility !== PANEL_VISIBILITY.hidden;
    const rootClassname = classnames(
      styles.root,
      {
        [styles.focused]: isFocused,
        [styles.expanded]: expanded,
      },
      className,
    );

    const headingClassName = classnames(styles.header, {
      [styles.canCollapse]: !!toggleCollapse,
      [styles.open]: expanded,
    });

    const arrowClassName = classnames(styles.arrow, {
      [styles.open]: !visible,
    });

    const contentClassName = classnames(styles.content, {
      [styles.open]: !visibility || expanded,
      [styles.participantsPanel]: isParticipantsPanel,
    });

    return (
      <div className={rootClassname} ref={ref}>
        <div className={headingClassName} onClick={toggleCollapse}>
          <h2 className={styles.heading}>{title}</h2>

          {toggleCollapse ? (
            <Button className={styles.toggle} color="secondary" shape="square">
              <ArrowDown className={arrowClassName} />
            </Button>
          ) : null}

          {toggleHide ? (
            <Button
              className={styles.close}
              color="secondary"
              onClick={toggleHide}
              shape="square"
            >
              <Close className={styles.cross} />
            </Button>
          ) : null}
        </div>
        <div className={contentClassName}>{children}</div>
      </div>
    );
  },
);
