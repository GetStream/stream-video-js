import { useCallback, useEffect, useState } from 'react';
import {
  CallRecording,
  CallRecordingList,
  useCall,
} from '@stream-io/video-react-sdk';

const TIMEOUT_INTERVAL = 1200000;

export const CallRecordings = () => {
  const call = useCall();
  const [callRecordings, setCallRecordings] = useState<CallRecording[]>([]);
  const [loadingCallRecordings, setLoadingCallRecordings] = useState(false);

  const fetchCallRecordings = useCallback(() => {
    if (!call) return;
    call
      .queryRecordings()
      .then(({ recordings }) => {
        setCallRecordings(recordings);
        setLoadingCallRecordings(false);
      })
      .catch((err) => console.error(`Failed to query recordings`, err));
  }, [call]);

  useEffect(() => {
    const timeout = setTimeout(fetchCallRecordings, TIMEOUT_INTERVAL);

    return () => {
      clearTimeout(timeout);
    };
  }, [fetchCallRecordings]);

  useEffect(() => {
    fetchCallRecordings();
  }, [fetchCallRecordings]);

  useEffect(() => {
    if (!call) return;
    const unsubscribeRecordingStopped = call.on('call.recording_stopped', () =>
      setLoadingCallRecordings(true),
    );

    const unsubscribeRecordingReady = call.on('call.recording_ready', (e) => {
      const { call_recording: recording } = e;
      setCallRecordings((prev) => [...prev, recording]);
      setLoadingCallRecordings(false);
    });

    return () => {
      unsubscribeRecordingReady();
      unsubscribeRecordingStopped();
    };
  }, [call]);

  return (
    <CallRecordingList
      CallRecordingListHeader={() => <div></div>}
      callRecordings={callRecordings}
      loading={loadingCallRecordings}
    />
  );
};
