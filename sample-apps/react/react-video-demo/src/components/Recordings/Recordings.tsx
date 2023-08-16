import { useCallback, useEffect, useState } from 'react';
import { CallRecording, useCall } from '@stream-io/video-react-sdk';

import { Panel } from '../Panel/Panel';
import { Download, LoadingSpinner } from '../Icons';

import { useModalContext } from '../../contexts/ModalContext';

import styles from './Recordings.module.css';

export const Recordings = () => {
  const call = useCall();
  const [callRecordings, setCallRecordings] = useState<CallRecording[]>([]);
  const [loadingCallRecordings, setLoadingCallRecordings] = useState(false);

  const { closeModal } = useModalContext();

  const fetchCallRecordings = useCallback(() => {
    if (!call) return;
    setLoadingCallRecordings(true);
    call.queryRecordings().then(({ recordings }) => {
      setCallRecordings(recordings);
      // FIXME OL: we need to find a better way of showing the loading state
      // currently, whenever we open this modal, we assume there is a recording
      // and we show the loading state until we get the actual recordings
      if (recordings.length > 0) {
        setLoadingCallRecordings(false);
      }
    });
  }, [call]);

  useEffect(() => {
    let attempts = 10;
    setLoadingCallRecordings(true);
    const interval = setInterval(() => {
      fetchCallRecordings();
      if (attempts-- <= 0 || callRecordings.length > 0) {
        clearInterval(interval);
        setLoadingCallRecordings(false);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [callRecordings.length, fetchCallRecordings]);

  useEffect(() => {
    if (!call) return;
    const unsubscribeRecordingStopped = call.on(
      'call.recording_stopped',
      () => {
        setLoadingCallRecordings(true);
      },
    );

    // @ts-expect-error
    const unsubscribeRecordingReady = call.on('call.recording_ready', (e) => {
      try {
        // FIXME OL this event isn't yet available in the OpenAPI schema
        const { call_recording: recording } = e;
        setCallRecordings((prev) => [...prev, recording]);
      } catch (error) {
        console.error(error);
      }
      setLoadingCallRecordings(false);
    });

    return () => {
      unsubscribeRecordingReady();
      unsubscribeRecordingStopped();
    };
  }, [call]);

  return (
    <Panel className={styles.root} title="Recordings" toggleHide={closeModal}>
      {loadingCallRecordings && !callRecordings.length && (
        <div className={styles.loading}>
          <LoadingSpinner className={styles.loadingSpinner} />
          <p>Loading recordings...</p>
        </div>
      )}

      {!loadingCallRecordings && !callRecordings.length && (
        <div className={styles.notFound}>
          <p>No recordings found...</p>
        </div>
      )}

      {!loadingCallRecordings && callRecordings.length > 0 && (
        <ul className={styles.list}>
          {callRecordings.map((recording, index) => (
            <li key={`recording-${index}`} className={styles.item}>
              <a
                className={styles.link}
                role="button"
                href={recording.url}
                download={recording.filename}
                title="Download the recording"
              >
                {new Date(recording.end_time).toLocaleString()}

                <Download className={styles.download} />
              </a>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
};
