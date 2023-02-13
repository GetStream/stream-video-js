import { FC } from 'react';
import classnames from 'classnames';

import Panel from '../Panel';

import styles from './ChatPanel.module.css';

export type Props = {
  className?: string;
  isFocused?: boolean;
};

export const ChatPanel: FC<Props> = ({ isFocused, className }) => {
  const rootClassname = classnames(styles.root, className);

  return (
    <Panel
      className={rootClassname}
      title="Chat"
      isFocused={isFocused}
      canCollapse
    >
      <></>
    </Panel>
  );
};
