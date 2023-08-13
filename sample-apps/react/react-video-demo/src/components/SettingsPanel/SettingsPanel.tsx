import { FC, useCallback } from 'react';
import classnames from 'classnames';
import { isMobile, isTablet } from 'mobile-device-detect';
import screenfull from 'screenfull';

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

import { useModalContext } from '../../contexts/ModalContext';
import { usePanelContext } from '../../contexts/PanelContext';

import styles from './SettingsPanel.module.css';

export type Props = {
  className?: string;
  callId?: string;
  toggleRecording?(): void;
  toggleShareScreen?(): void;
};

export const SettingsPanel: FC<Props> = ({
  className,
  callId,
  toggleRecording,
  toggleShareScreen,
}) => {
  const { setModal } = useModalContext();
  const { toggleHide } = usePanelContext();

  const handleFeedback = useCallback(() => {
    setModal(<Feedback callId={callId} inMeeting />);
  }, [setModal]);

  const handleSettings = useCallback(() => {
    setModal(<DeviceSettings />);
  }, [setModal]);

  const handleRecordings = useCallback(() => {
    setModal(<Recordings />);
  }, [setModal]);

  const handleToggleCallState = useCallback(() => {
    setModal(<CallStats callId={callId} />);
  }, [callId, setModal]);

  const handleFullScreen = useCallback(() => {
    toggleHide('device-settings');
    if (screenfull.isEnabled && !screenfull.isFullscreen) {
      screenfull.request();
    } else {
      screenfull.exit();
    }
  }, [toggleHide]);

  const handleRecording = useCallback(() => {
    toggleHide('device-settings');
    toggleRecording?.();
  }, [toggleHide, toggleRecording]);

  const handleShareScreen = useCallback(() => {
    toggleHide('device-settings');
    toggleShareScreen?.();
  }, [toggleHide, toggleShareScreen]);

  const rootClassName = classnames(styles.root, className);

  return (
    <>
      <div className={rootClassName}>
        <ul className={styles.list}>
          {screenfull.isEnabled && (
            <li className={styles.item} onClick={handleFullScreen}>
              <FullScreen className={styles.settingsIcon} />
              {screenfull.isFullscreen ? 'Exit full screen' : 'Full screen'}
            </li>
          )}
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
          {!isMobile && !isTablet && (
            <li
              className={classnames(styles.item, styles.share)}
              onClick={handleShareScreen}
            >
              <ShareScreen className={styles.settingsIcon} />
              Share screen
            </li>
          )}
        </ul>
      </div>
    </>
  );
};
