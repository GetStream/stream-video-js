import { FC } from 'react';
import classnames from 'classnames';

import Panel from '../Panel';

import styles from './ParticipantsPanel.module.css';

export type Props = {
  className?: string;
  participants: any[];
  isFocused?: boolean;
};

export const ParticipantsPanel: FC<Props> = ({
  participants,
  isFocused,
  className,
}) => {
  const rootClassname = classnames(styles.root, className);

  return (
    <Panel
      className={rootClassname}
      title="Participants"
      isFocused={isFocused}
      canCollapse={true}
    >
      <></>
    </Panel>
  );
};
