import { FC, useCallback } from 'react';
import classnames from 'classnames';

import {
  Feedback as FeedbackIcon,
  FullScreen,
  Cog,
  Info,
  Record,
  Recordings as RecordingsIcon,
  ShareScreen,
} from '../Icons';

import CallStats from '../CallStats';
import Feedback from '../Feedback';
import DeviceSettings from '../DeviceSettings';
import Recordings from '../Recordings';

import { toggleFullScreen } from '../../utils/useToggleFullScreen';

import { useModalContext } from '../../contexts/ModalContext';

import styles from './SettingsPanel.module.css';

export type Props = {
  className?: string;
  callId?: string;
  toggleRecording?(): void;
  toggleShareScreen?(): void;
  closePanel?(): void;
};

export const SettingsPanel: FC<Props> = ({
  className,
  callId,
  toggleRecording,
  toggleShareScreen,
  closePanel,
}) => {
  const { setComponent } = useModalContext();

  const handleFeedback = useCallback(() => {
    setComponent(<Feedback />);
  }, [setComponent]);

  const handleSettings = useCallback(() => {
    setComponent(<DeviceSettings />);
  }, [setComponent]);

  const handleRecordings = useCallback(() => {
    setComponent(<Recordings />);
  }, [setComponent]);

  const handleToggleCallState = useCallback(() => {
    setComponent(<CallStats callId={callId} />);
  }, [callId, setComponent]);

  const handleFullScreen = useCallback(() => {
    toggleFullScreen();
  }, []);

  const handleRecording = useCallback(() => {
    toggleRecording?.();
  }, [toggleRecording]);

  const handleShareScreen = useCallback(() => {
    toggleShareScreen?.();
  }, [toggleShareScreen]);

  const rootClassName = classnames(styles.root, className);

  return (
    <>
      <div className={rootClassName}>
        <ul className={styles.list}>
          <li className={styles.item} onClick={handleFullScreen}>
            <FullScreen className={styles.settingsIcon} />
            Full screen
          </li>
          <li className={styles.item} onClick={() => handleToggleCallState()}>
            <Info className={styles.settingsIcon} />
            Statistics
          </li>
          <li className={styles.item} onClick={() => handleRecordings()}>
            <RecordingsIcon className={styles.settingsIcon} />
            Recordings
          </li>
          <li className={styles.item} onClick={() => handleFeedback()}>
            <FeedbackIcon className={styles.settingsIcon} />
            Send Feedback
          </li>
          <li
            className={classnames(styles.item, styles.settings)}
            onClick={() => handleSettings()}
          >
            <Cog className={styles.settingsIcon} />
            Settings
          </li>
          <li
            className={classnames(styles.item, styles.record)}
            onClick={handleRecording}
          >
            <Record className={styles.settingsIcon} />
            Record
          </li>
          <li
            className={classnames(styles.item, styles.share)}
            onClick={handleShareScreen}
          >
            <ShareScreen className={styles.settingsIcon} />
            Share screen
          </li>
        </ul>
      </div>
    </>
  );
};
