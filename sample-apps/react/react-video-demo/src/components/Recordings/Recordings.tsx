import { useEffect, useRef, useState } from 'react';
import {
  CallRecording,
  useActiveCall,
  useCallRecordings,
  useStreamVideoClient,
} from '@stream-io/video-react-sdk';

import { Panel } from '../Panel/Panel';
import { Download, LoadingSpinner } from '../Icons';

import { useModalContext } from '../../contexts/ModalContext';

import styles from './Recordings.module.css';

const MAX_NUMBER_POLL_REQUESTS = 6;
const POLL_INTERVAL_MS = 10 * 1000;

export const Recordings = () => {
  const callRecordings = useCallRecordings();
  const client = useStreamVideoClient();
  const activeCall = useActiveCall();

  const [loadingCallRecordings, setLoadingCallRecordings] = useState(false);
  const recordingPollRequestsCount = useRef(0);
  const recordingPollRequestsInterval = useRef<
    ReturnType<typeof setInterval> | undefined
  >();

  const { close } = useModalContext();

  useEffect(() => {
    console.log({ client, activeCall, callRecordings });
    if (!(client && activeCall && callRecordings)) return;
    const scheduleCallRecordingPolling = () => {
      setLoadingCallRecordings(true);

      if (recordingPollRequestsInterval.current) {
        clearInterval(recordingPollRequestsInterval.current);
      }

      recordingPollRequestsInterval.current = setInterval(async () => {
        let recordings: CallRecording[] = [];
        try {
          const response = await activeCall.queryRecordings();
          recordings = response.recordings;
        } catch (e) {
          console.error('Failed to query recordings', e);
        } finally {
          recordingPollRequestsCount.current++;
          const hasNewRecordings = callRecordings.length < recordings.length;

          if (
            recordingPollRequestsCount.current === MAX_NUMBER_POLL_REQUESTS ||
            hasNewRecordings
          ) {
            clearInterval(recordingPollRequestsInterval.current);
            setLoadingCallRecordings(false);
          }
        }
      }, POLL_INTERVAL_MS);
    };

    scheduleCallRecordingPolling();
  }, [client, activeCall, callRecordings]);

  return (
    <Panel className={styles.root} title="Recordings" close={close}>
      {loadingCallRecordings && !callRecordings.length ? (
        <div className={styles.loading}>
          <LoadingSpinner />
          <p>Loading recordings...</p>
        </div>
      ) : (
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

                <Download />
              </a>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
};
