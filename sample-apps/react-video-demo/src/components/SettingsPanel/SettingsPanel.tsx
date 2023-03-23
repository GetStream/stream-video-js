import { FC, useCallback } from 'react';
import classnames from 'classnames';

import { Feedback as FeedbackIcon, FullScreen, Cog, Info } from '../Icons';

import CallStats from '../CallStats';
import Feedback from '../Feedback';
import DeviceSettings from '../DeviceSettings';

import { toggleFullScreen } from '../../utils/useToggleFullScreen';

import { useModalContext } from '../../contexts/ModalContext';

import styles from './SettingsPanel.module.css';

export type Props = {
  className?: string;
  callId?: string;
};

export const SettingsPanel: FC<Props> = ({ className, callId }) => {
  const { setComponent } = useModalContext();

  const handleFeedback = useCallback(() => {
    setComponent(<Feedback />);
  }, []);

  const handleSettings = useCallback(() => {
    setComponent(<DeviceSettings />);
  }, []);

  const handleToggleCallState = useCallback(() => {
    setComponent(<CallStats callId={callId} />);
  }, [callId]);

  const rootClassName = classnames(styles.root, className);

  return (
    <>
      <div className={rootClassName}>
        <ul className={styles.list}>
          <li className={styles.item} onClick={() => toggleFullScreen()}>
            <FullScreen className={styles.settingsIcon} />
            Full screen
          </li>
          <li className={styles.item} onClick={() => handleToggleCallState()}>
            <Info className={styles.settingsIcon} />
            Statistics
          </li>
          <li className={styles.item} onClick={() => handleFeedback()}>
            <FeedbackIcon className={styles.settingsIcon} />
            Send Feedback
          </li>
          <li className={styles.item} onClick={() => handleSettings()}>
            <Cog className={styles.settingsIcon} />
            Settings
          </li>
        </ul>
      </div>
    </>
  );
};
