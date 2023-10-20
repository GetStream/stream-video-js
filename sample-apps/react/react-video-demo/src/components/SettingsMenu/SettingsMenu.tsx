import { FC, PropsWithChildren, ReactNode } from 'react';
import classnames from 'classnames';

import styles from './SettingsMenu.module.css';

export type Props = {
  className?: string;
  title?: string;
  icon?: ReactNode;
  children?: ReactNode | undefined;
};

export const SettingsMenu: FC<Props> = ({
  className,
  title,
  icon,
  children,
}) => {
  const rootClassName = classnames(styles.root, className);
  return (
    <div className={rootClassName}>
      {title ? (
        <div className={styles.header}>
          {icon}

          <h3 className={styles.heading}>{title}</h3>
        </div>
      ) : null}
      <div className={styles.body}>{children}</div>
    </div>
  );
};

export const OptionsList = (
  props: PropsWithChildren<{
    className?: string;
  }>,
) => {
  return (
    <ul className={classnames(styles.list, props.className)}>
      {props.children}
    </ul>
  );
};

export const OptionsListItem = (props: {
  className?: string;
  id: string;
  value: string;
  onClick: () => void;
  label: string;
  defaultChecked: boolean;
  name: string;
  checked: boolean;
}) => {
  const {
    className,
    id,
    onClick,
    label,
    defaultChecked,
    name,
    value,
    checked,
  } = props;
  return (
    <li
      className={classnames(styles.item, className, {
        [styles.selectedItem]: checked,
      })}
    >
      <label className={styles.label} htmlFor={id} onClick={onClick}>
        <input
          id={id}
          className={styles.radioButton}
          name={name}
          type="radio"
          defaultChecked={defaultChecked}
          value={value}
        />
        {label}
      </label>
    </li>
  );
};
