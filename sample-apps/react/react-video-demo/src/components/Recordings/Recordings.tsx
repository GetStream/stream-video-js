import { useCallback, useEffect, useState } from 'react';
import {
  CallRecording,
  useCall,
  useStreamVideoClient,
} from '@stream-io/video-react-sdk';

import { Panel } from '../Panel/Panel';
import { Download, LoadingSpinner } from '../Icons';

import { useModalContext } from '../../contexts/ModalContext';

import styles from './Recordings.module.css';

const MAX_NUMBER_POLL_REQUESTS = 6;
const POLL_INTERVAL_MS = 10 * 1000;

export const Recordings = () => {
  const [callRecordings, setCallRecordings] = useState<CallRecording[]>([]);
  const client = useStreamVideoClient();
  const activeCall = useCall();

  const [loadingCallRecordings, setLoadingCallRecordings] = useState(false);

  const { closeModal } = useModalContext();

  const startPolling = useCallback(() => {
    let recordingPollRequestsCount = 0;
    let recordingPollRequestsInterval: any = undefined;

    if (!client || !activeCall || callRecordings.length === 0) return;
    const scheduleCallRecordingPolling = () => {
      setLoadingCallRecordings(true);

      if (recordingPollRequestsInterval) {
        clearInterval(recordingPollRequestsInterval);
      }

      recordingPollRequestsInterval = setInterval(async () => {
        let recordings: CallRecording[] = [];
        try {
          const response = await activeCall.queryRecordings();
          recordings = response.recordings;
        } catch (e) {
          console.error('Failed to query recordings', e);
        } finally {
          recordingPollRequestsCount = recordingPollRequestsCount + 1;
          const hasNewRecordings = callRecordings.length < recordings.length;

          if (hasNewRecordings) {
            setLoadingCallRecordings(false);
            clearInterval(recordingPollRequestsInterval);
          }

          if (recordingPollRequestsCount === MAX_NUMBER_POLL_REQUESTS) {
            setLoadingCallRecordings(false);
            clearInterval(recordingPollRequestsInterval);
          }

          setCallRecordings(recordings);
        }
      }, POLL_INTERVAL_MS);
    };

    if (callRecordings.length === 0) {
      scheduleCallRecordingPolling();
    }
  }, [client, activeCall, callRecordings]);

  useEffect(() => {
    startPolling();
  }, []);

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
